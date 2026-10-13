#!/usr/bin/env python3
"""Persistent rooms, private racks, and a same-origin JSON API."""

import argparse
import base64
import copy
import gzip
import hashlib
import json
import re
import secrets
import sqlite3
import time
from contextlib import contextmanager
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import definitions
import game

ROOT = Path(__file__).parent
COOKIE = "scrabble_session"
ASSETS = {"": ("index.html", "text/html; charset=utf-8"),
          "app.js": ("app.js", "text/javascript; charset=utf-8"),
          "style.css": ("style.css", "text/css; charset=utf-8")}


def profile(data):
    name = data.get("name", "")
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 24:
        raise ValueError("Choose a name of 1–24 characters.")
    name = "".join(c for c in name.strip() if c.isprintable())
    avatar = data.get("avatar", "")
    if not isinstance(avatar, str) or len(avatar) > 80_000:
        raise ValueError("Profile picture is too large.")
    if avatar:
        match = re.fullmatch(r"data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)", avatar)
        if not match:
            raise ValueError("Choose a PNG, JPEG or WebP picture.")
        try:
            raw = base64.b64decode(match[2], validate=True)
        except ValueError:
            raise ValueError("Invalid picture.") from None
        valid = (match[1] == "png" and raw.startswith(b"\x89PNG\r\n\x1a\n")
                 or match[1] == "jpeg" and raw.startswith(b"\xff\xd8\xff")
                 or match[1] == "webp" and raw[:4] == b"RIFF" and raw[8:12] == b"WEBP")
        if not valid:
            raise ValueError("Invalid picture.")
    return {"name": name or "Player", "avatar": avatar}


class Store:
    def __init__(self, path):
        self.path = str(path)
        with self.connection() as db:
            db.executescript("""
                PRAGMA journal_mode=WAL;
                CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, profile TEXT NOT NULL, seen REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS rooms (id TEXT PRIMARY KEY, state TEXT NOT NULL, updated REAL NOT NULL);
                CREATE TABLE IF NOT EXISTS definitions (id TEXT PRIMARY KEY, value TEXT NOT NULL, updated REAL NOT NULL);
            """)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            db.execute("BEGIN IMMEDIATE")
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def session(self, token):
        sid = hashlib.sha256(token.encode()).hexdigest() if token else ""
        with self.connection() as db:
            row = db.execute("SELECT profile FROM sessions WHERE id=?", (sid,)).fetchone()
            if row:
                db.execute("UPDATE sessions SET seen=? WHERE id=?", (time.time(), sid))
                return sid, json.loads(row["profile"]), None
            token = secrets.token_urlsafe(32)
            sid = hashlib.sha256(token.encode()).hexdigest()
            value = {"name": "", "avatar": ""}
            db.execute("INSERT INTO sessions VALUES (?,?,?)", (sid, json.dumps(value), time.time()))
            return sid, value, token

    def save(self, db, room):
        db.execute("INSERT OR REPLACE INTO rooms VALUES (?,?,?)",
                   (room["id"], json.dumps(room, separators=(",", ":")), time.time()))

    def load(self, db, code):
        row = db.execute("SELECT state FROM rooms WHERE id=?", (code,)).fetchone()
        if not row:
            raise ValueError("Room not found. Create a new room or use a fresh invite.")
        room = json.loads(row["state"])
        changed = game.tick(room) if room["status"] == "playing" else False
        if room["status"] == "lobby":
            players = [p for p in room["players"] if time.time()-p["seen"] < 180]
            if len(players) != len(room["players"]):
                room["players"] = players
                room["host"] = players[0]["id"] if players else None
                changed = True
        host = next((p for p in room["players"] if p["id"] == room["host"]),None)
        if host and (host.get("resigned") or time.time()-host["seen"] >= 180):
            replacement = next((p for p in room["players"] if not p.get("resigned")
                                and not p.get("left") and time.time()-p["seen"] < 35),None)
            if replacement and replacement["id"] != room["host"]:
                room["host"] = replacement["id"]
                changed = True
        if changed:
            room["rev"] += 1
        return room

    def join(self, sid, data):
        person = profile(data)
        code = data.get("room")
        if code is not None and (not isinstance(code,str) or not re.fullmatch("[A-Za-z0-9_-]{8,20}",code)):
            raise ValueError("Invalid room code.")
        with self.connection() as db:
            db.execute("DELETE FROM rooms WHERE updated<?", (time.time()-30*86400,))
            db.execute("DELETE FROM sessions WHERE seen<?", (time.time()-90*86400,))
            if not code and data.get("create") is not True:
                for row in db.execute("SELECT id FROM rooms ORDER BY updated DESC").fetchall():
                    candidate = self.load(db, row["id"])
                    if candidate["public"] and candidate["status"] == "lobby" and len(candidate["players"]) < 8:
                        code = candidate["id"]
                        break
            if code:
                room = self.load(db, code)
            else:
                if db.execute("SELECT COUNT(*) FROM rooms").fetchone()[0] >= 200:
                    raise ValueError("Too many rooms are open. Try an existing room.")
                code = secrets.token_urlsafe(8)
                room = {"id": code, "public": data.get("create") is not True, "host": None,
                        "status": "lobby", "rev": 0, "players": [], "settings": dict(game.DEFAULT_SETTINGS),
                        "board": [None]*225, "bag": [], "history": [], "requests": []}
            member = next((p for p in room["players"] if p["sid"] == sid), None)
            if not member:
                if room["status"] != "lobby":
                    raise ValueError("This game has started. You can watch, or join another lobby.")
                if len(room["players"]) >= 8:
                    raise ValueError("This room is full (eight players).")
                member = {"id": secrets.token_urlsafe(8), "sid": sid, "rack": [], "score": 0, "seconds": 0, "focused": True}
                room["players"].append(member)
                if not room["host"]:
                    room["host"] = member["id"]
            member.update(person, seen=time.time())
            db.execute("UPDATE sessions SET profile=? WHERE id=?", (json.dumps(person),sid))
            room["rev"] += 1
            self.save(db,room)
            return self.view(room,sid)

    def view(self, room, sid):
        value = copy.deepcopy(room)
        value.pop("requests", None)
        value["bag_count"] = len(value.pop("bag"))
        value["me"] = None
        for p in value["players"]:
            if p.pop("sid") == sid:
                value["me"] = p["id"]
                value["rack"] = p["rack"]
            p["rack_count"] = len(p.pop("rack"))
            p["online"] = time.time()-p.pop("seen") < 35
        value["server_time"] = time.time()
        language = room["settings"]["language"]
        value["dictionary"] = {k: game.SOURCES[language][k] for k in ("edition", "words")}
        value["premiums"] = game.PREMIUMS
        value["tiles"] = {letter: {"count": count, "points": points}
                          for letter,(count,points) in zip(game.LETTERS,game.TILES[language])}
        return value

    def room(self, sid, code, focused=None):
        with self.connection() as db:
            room = self.load(db,code)
            for p in room["players"]:
                if p["sid"] == sid:
                    p["seen"] = time.time()
                    if focused is not None:
                        p["focused"] = focused
            self.save(db,room)
            return self.view(room,sid)

    def action(self, sid, code, data):
        with self.connection() as db:
            room = self.load(db,code)
            player = next((p for p in room["players"] if p["sid"] == sid),None)
            if not player:
                raise ValueError("Join this room first.")
            player["seen"] = time.time()
            action = data.get("action")
            request_id = data.get("request_id")
            if not isinstance(request_id,str) or not re.fullmatch("[A-Za-z0-9_-]{8,80}",request_id):
                raise ValueError("Invalid request ID.")
            if [player["id"], request_id] in room["requests"]:
                self.save(db,room)
                return self.view(room,sid)
            # Personal actions do not depend on the board revision.
            if data.get("rev") != room["rev"] and action not in ("leave", "resign", "profile"):
                raise ValueError("The room changed. Refresh your move and try again.")
            if action == "preview":
                self.check_turn(room,player)
                if not room["settings"]["show_preview"]:
                    raise ValueError("The host disabled score previews.")
                result = game.validate(room,player,data.get("placements"))
                self.save(db,room)
                return {key: result[key] for key in ("score","bonus","words")}
            if action in ("settings", "start", "rematch"):
                if room["host"] != player["id"]:
                    raise ValueError("Only the host can do that.")
                if action == "rematch":
                    if room["status"] != "finished":
                        raise ValueError("Finish the game before a rematch.")
                    room["players"] = [p for p in room["players"] if not p.get("left")]
                    for p in room["players"]:
                        p.update(rack=[],score=0,resigned=False,seconds=0)
                        p.pop("adjustment",None)
                    room.update(status="lobby",board=[None]*225,bag=[],history=[],turn=None)
                elif room["status"] != "lobby":
                    raise ValueError("Settings are locked during a game.")
                elif action == "settings":
                    room["settings"] = game.settings(data.get("settings"))
                else:
                    if any(time.time()-p["seen"] > 35 for p in room["players"]):
                        raise ValueError("Wait for each player to reconnect before starting.")
                    game.start(room)
            elif action == "profile":
                value = profile(data)
                player.update(value)
                db.execute("UPDATE sessions SET profile=? WHERE id=?",(json.dumps(value),sid))
            elif action == "leave":
                if room["status"] == "playing" and not player.get("resigned"):
                    game.resign(room,player)
                if room["status"] == "lobby":
                    room["players"].remove(player)
                else:
                    player["left"] = True
                if room["host"] == player["id"]:
                    room["host"] = next((p["id"] for p in room["players"] if not p.get("left")),None)
            elif action == "skip_absent":
                absent = game.current(room)
                if room["status"] != "playing" or room["host"] != player["id"]:
                    raise ValueError("Only the host can pass an absent player's turn.")
                if not absent or time.time()-absent["seen"] < 180:
                    raise ValueError("Wait three minutes after the player disconnects.")
                game.pass_turn(room,absent)
            elif action == "resign":
                if room["status"] != "playing" or player.get("resigned"):
                    raise ValueError("You are not playing.")
                game.resign(room,player)
                if room["host"] == player["id"]:
                    room["host"] = next((p["id"] for p in game.active(room)),player["id"])
            else:
                self.check_turn(room,player)
                if action == "play":
                    game.play(room,player,data.get("placements"))
                elif action == "pass":
                    game.pass_turn(room,player)
                elif action == "exchange":
                    game.exchange(room,player,data.get("ids"))
                else:
                    raise ValueError("Unknown action.")
            room["requests"] = (room["requests"] + [[player["id"],request_id]])[-100:]
            room["rev"] += 1
            self.save(db,room)
            return self.view(room,sid)

    @staticmethod
    def check_turn(room,player):
        if room["status"] != "playing" or room["turn"] != player["id"]:
            raise ValueError("Wait for your turn.")

    def definition(self, language, word):
        if language not in game.WORDS or word not in game.WORDS[language]:
            raise ValueError("Word not in this dictionary.")
        key = language + ":" + word
        with self.connection() as db:
            row = db.execute("SELECT value FROM definitions WHERE id=? AND updated>?",(key,time.time()-86400*30)).fetchone()
            if row:
                return json.loads(row["value"])
        result = definitions.lookup(language,word)
        if result["text"]:
            with self.connection() as db:
                db.execute("INSERT OR REPLACE INTO definitions VALUES (?,?,?)",(key,json.dumps(result),time.time()))
        return result


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Paths may contain invite codes; keep them out of access logs.
        pass

    def reply(self, value, status=200, content_type="application/json; charset=utf-8"):
        raw = value if isinstance(value,bytes) else json.dumps(value,separators=(",",":")).encode()
        self.send_response(status)
        self.send_header("Content-Type",content_type)
        self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("Referrer-Policy","same-origin")
        self.send_header("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; "
                         "style-src 'self'; script-src 'self'; connect-src 'self'; "
                         "base-uri 'none'; frame-ancestors 'none'; form-action 'self'")
        if getattr(self,"new_token",None):
            secure = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
            self.send_header("Set-Cookie", f"{COOKIE}={self.new_token}; Path=/scrabble; HttpOnly; SameSite=Lax; Max-Age=7776000{secure}")
        if "gzip" in self.headers.get("Accept-Encoding", "") and len(raw)>1000:
            raw = gzip.compress(raw)
            self.send_header("Content-Encoding","gzip")
            self.send_header("Vary","Accept-Encoding")
        self.send_header("Content-Length",str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def handle_request(self):
        parsed = urlparse(self.path)
        # Tailscale strips the mounted prefix; local and Netlify routes retain it.
        path = parsed.path.removeprefix("/scrabble").strip("/")
        self.new_token = None
        if self.command == "GET" and path in ASSETS:
            filename,mime = ASSETS[path]
            return self.reply((ROOT/filename).read_bytes(),content_type=mime)
        if self.command == "GET" and path == "health":
            return self.reply({"ok":True,"dictionaries":{lang:{"edition":s["edition"],"words":s["words"]} for lang,s in game.SOURCES.items()}})
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie",""))
        except Exception:
            pass
        token = cookie[COOKIE].value if COOKIE in cookie else None
        sid, person, self.new_token = self.server.store.session(token)
        if self.command == "GET":
            if path == "api/session":
                return self.reply({"profile":person})
            if path.startswith("api/room/"):
                focused = parse_qs(parsed.query).get("focused", [None])[0]
                return self.reply(self.server.store.room(sid,path.removeprefix("api/room/"),
                                                        None if focused is None else focused == "1"))
            if path == "api/definition":
                query = parse_qs(parsed.query)
                return self.reply(self.server.store.definition(query.get("language",[""])[0],query.get("word",[""])[0]))
        if self.command == "POST":
            origin = self.headers.get("Origin")
            if origin and origin not in ("https://joeydavid.fyi","https://serv205.tailad3f71.ts.net",
                                        f"http://{self.headers.get('Host')}",f"https://{self.headers.get('Host')}"):
                return self.reply({"error":"Invalid origin."},403)
            if self.headers.get("Content-Type", "").split(";")[0] != "application/json":
                raise ValueError("Send JSON.")
            size = int(self.headers.get("Content-Length","0"))
            if not 0 < size <= 100_000:
                raise ValueError("Request is too large or empty.")
            data = json.loads(self.rfile.read(size))
            if not isinstance(data,dict):
                raise ValueError("Send a JSON object.")
            if path == "api/join":
                return self.reply(self.server.store.join(sid,data))
            if path.startswith("api/room/"):
                return self.reply(self.server.store.action(sid,path.removeprefix("api/room/"),data))
        self.reply({"error":"Not found."},404)

    def dispatch(self):
        try:
            self.handle_request()
        except (ValueError, KeyError, TypeError) as error:
            self.reply({"error":str(error)},400)
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            import traceback
            traceback.print_exc()
            self.reply({"error":"Server error. Please try again."},500)

    do_GET = dispatch
    do_POST = dispatch


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bind",default="127.0.0.1")
    parser.add_argument("--port",type=int,default=6087)
    parser.add_argument("--storage",type=Path,default=Path.home()/"joeydavid.fyi/scrabble/rooms.sqlite3")
    args = parser.parse_args()
    args.storage.parent.mkdir(parents=True,exist_ok=True)
    server = ThreadingHTTPServer((args.bind,args.port),Handler,bind_and_activate=False)
    server.request_queue_size = 64
    server.server_bind()
    server.server_activate()
    server.store = Store(args.storage)
    print(f"Scrabble listening on {args.bind}:{args.port}",flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
