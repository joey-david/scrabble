"""Scrabble rules. Moves validate before they change a room."""

import gzip
import hashlib
import json
import random
import re
import time
from pathlib import Path

DATA = Path(__file__).with_name("data")
SOURCES = json.loads((DATA / "sources.json").read_text())
WORDS = {}
for language, source in SOURCES.items():
    raw = gzip.decompress((DATA / f"{language}.txt.gz").read_bytes())
    if hashlib.sha256(raw).hexdigest() != source["sha256"]:
        raise RuntimeError(f"Dictionary checksum failed: {language}")
    WORDS[language] = frozenset(raw.decode().splitlines())
    if len(WORDS[language]) != source["words"]:
        raise RuntimeError(f"Dictionary count failed: {language}")

# Each pair is (count, points), in A–Z order, followed by the two blanks.
TILES = {
    "en": [(9,1),(2,3),(2,3),(4,2),(12,1),(2,4),(3,2),(2,4),(9,1),
           (1,8),(1,5),(4,1),(2,3),(6,1),(8,1),(2,3),(1,10),(6,1),
           (4,1),(6,1),(4,1),(2,4),(2,4),(1,8),(2,4),(1,10),(2,0)],
    "fr": [(9,1),(2,3),(2,3),(3,2),(15,1),(2,4),(2,2),(2,4),(8,1),
           (1,8),(1,10),(5,1),(3,2),(6,1),(6,1),(2,3),(1,8),(6,1),
           (6,1),(6,1),(6,1),(2,4),(1,10),(1,10),(1,10),(1,10),(2,0)],
}
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ?"
PREMIUMS = {}
for kind, cells in {
    "TW": [(0,0),(0,7),(0,14),(7,0),(7,14),(14,0),(14,7),(14,14)],
    "DW": [(i,i) for i in (1,2,3,4,7,10,11,12,13)] + [(i,14-i) for i in (1,2,3,4,10,11,12,13)],
    "TL": [(r,c) for r in (1,13) for c in (5,9)] + [(r,c) for r in (5,9) for c in (1,5,9,13)],
    "DL": [(r,c) for r in (0,14) for c in (3,11)] + [(r,c) for r in (2,12) for c in (6,8)]
          + [(r,c) for r in (3,11) for c in (0,7,14)] + [(r,c) for r in (6,8) for c in (2,6,8,12)]
          + [(7,3),(7,11)],
}.items():
    for row, col in cells:
        PREMIUMS[row * 15 + col] = kind

DEFAULT_SETTINGS = {"language": "fr", "minutes": 0, "turn_seconds": 0,
                    "random_first": True, "show_preview": True}


def tile_bag(language):
    bag = []
    for letter, (count, points) in zip(LETTERS, TILES[language]):
        for n in range(count):
            bag.append({"id": f"{letter}{n}", "letter": letter, "points": points})
    random.SystemRandom().shuffle(bag)
    return bag


def settings(value):
    if not isinstance(value, dict):
        raise ValueError("Invalid settings.")
    result = dict(DEFAULT_SETTINGS)
    if value.get("language") not in WORDS:
        raise ValueError("Choose French or English.")
    result["language"] = value["language"]
    for key, allowed in [("minutes", (0,5,10,15,20,30,45,60)),
                         ("turn_seconds", (0,30,60,90,120,180,300))]:
        number = value.get(key, 0)
        if type(number) is not int or number not in allowed:
            raise ValueError("Invalid clock setting.")
        result[key] = number
    for key in ("random_first", "show_preview"):
        result[key] = value.get(key, True) is True
    return result


def active(room):
    return [p for p in room["players"] if not p.get("resigned")]


def current(room):
    return next((p for p in room["players"] if p["id"] == room.get("turn")), None)


def refill(room, player):
    while len(player["rack"]) < 7 and room["bag"]:
        player["rack"].append(room["bag"].pop())


def start(room, now=None):
    if len(room["players"]) < 2:
        raise ValueError("At least two players must join before starting.")
    now = time.time() if now is None else now
    room.update(status="playing", board=[None]*225, bag=tile_bag(room["settings"]["language"]),
                history=[], passes=0, turn_started=now, last_tick=now, end_reason=None)
    for player in room["players"]:
        player.update(score=0, rack=[], resigned=False, seconds=room["settings"]["minutes"]*60)
        refill(room, player)
    room["turn"] = (random.SystemRandom().choice(room["players"]) if room["settings"]["random_first"]
                    else room["players"][0])["id"]


def validate(room, player, placements):
    if not isinstance(placements, list) or not 1 <= len(placements) <= 7:
        raise ValueError("Place one to seven tiles.")
    rack = {tile["id"]: tile for tile in player["rack"]}
    placed, used = {}, set()
    for entry in placements:
        if not isinstance(entry, dict):
            raise ValueError("Invalid placement.")
        pos, tile_id = entry.get("pos"), entry.get("id")
        if type(pos) is not int or not 0 <= pos < 225:
            raise ValueError("Place tiles inside the board.")
        if not isinstance(tile_id, str) or tile_id not in rack or tile_id in used:
            raise ValueError("That tile is not available in your rack.")
        if room["board"][pos] or pos in placed:
            raise ValueError("That square is already occupied.")
        tile = dict(rack[tile_id])
        if tile["letter"] == "?":
            letter = entry.get("letter")
            if not isinstance(letter, str) or not re.fullmatch("[A-Z]", letter):
                raise ValueError("Choose a letter for the blank.")
            tile.update(letter=letter, blank=True)
        tile["player"] = player["id"]
        placed[pos] = tile
        used.add(tile_id)
    rows, cols = {p//15 for p in placed}, {p%15 for p in placed}
    if len(rows) > 1 and len(cols) > 1:
        raise ValueError("Place all new tiles in one row or column.")
    board = [placed.get(i) or tile for i, tile in enumerate(room["board"])]
    step = 1 if len(rows) == 1 else 15
    first, last = min(placed), max(placed)
    if any(not board[p] for p in range(first, last+1, step)):
        raise ValueError("Leave no gaps between the tiles.")
    occupied = any(room["board"])
    if not occupied and 112 not in placed:
        raise ValueError("The first word must cover the centre star.")
    if occupied and not any(room["board"][n] for p in placed for n in neighbours(p)):
        raise ValueError("Connect your word to a tile already on the board.")

    found = {}
    for p in placed:
        for direction in (1,15):
            cells = word_cells(board, p, direction)
            if len(cells) < 2 or tuple(cells) in found:
                continue
            word = "".join(board[c]["letter"] for c in cells)
            multiplier, points = 1, 0
            for c in cells:
                premium = PREMIUMS.get(c) if c in placed else None
                points += board[c]["points"] * (2 if premium == "DL" else 3 if premium == "TL" else 1)
                multiplier *= 2 if premium == "DW" else 3 if premium == "TW" else 1
            found[tuple(cells)] = {"word": word, "score": points*multiplier, "cells": cells}
    if not found:
        raise ValueError("Form a word of at least two letters.")
    invalid = [w["word"] for w in found.values() if w["word"] not in WORDS[room["settings"]["language"]]]
    if invalid:
        raise ValueError("Not in " + SOURCES[room["settings"]["language"]]["edition"] + ": " + ", ".join(invalid))
    bonus = 50 if len(placed) == 7 else 0
    return {"score": sum(w["score"] for w in found.values())+bonus, "bonus": bonus,
            "words": list(found.values()), "placed": placed}


def neighbours(pos):
    row, col = divmod(pos, 15)
    return [r*15+c for r,c in ((row-1,col),(row+1,col),(row,col-1),(row,col+1))
            if 0 <= r < 15 and 0 <= c < 15]


def word_cells(board, pos, step):
    def adjacent(a, b):
        return 0 <= b < 225 and (step == 15 or a//15 == b//15) and board[b]
    first = pos
    while adjacent(first, first-step):
        first -= step
    cells = [first]
    while adjacent(cells[-1], cells[-1]+step):
        cells.append(cells[-1]+step)
    return cells


def log(room, player, kind, **extra):
    room["history"].append({"player": player["id"], "name": player["name"],
                            "kind": kind, "at": time.time(), **extra})


def finish(room, reason, winner=None):
    if room["status"] != "playing":
        return
    penalty = 0
    for p in room["players"]:
        if not p.get("resigned"):
            remainder = sum(t["points"] for t in p["rack"])
            p["score"] -= remainder
            penalty += remainder
            p["adjustment"] = -remainder
    if winner:
        winner["score"] += penalty
        winner["adjustment"] += penalty
    room.update(status="finished", turn=None, end_reason=reason)


def advance(room, now=None):
    now = time.time() if now is None else now
    players = active(room)
    if len(players) <= 1:
        finish(room, "Only one player remains.")
        return
    if room["passes"] >= max(6, len(players)*2):
        finish(room, "Consecutive turns without a score.")
        return
    index = next(i for i,p in enumerate(room["players"]) if p["id"] == room["turn"])
    for offset in range(1, len(room["players"])+1):
        p = room["players"][(index+offset)%len(room["players"])]
        if not p.get("resigned"):
            room.update(turn=p["id"], turn_started=now, last_tick=now)
            return


def play(room, player, placements, now=None):
    move = validate(room, player, placements)
    for pos, tile in move["placed"].items():
        room["board"][pos] = tile
    used = {tile["id"] for tile in move["placed"].values()}
    player["rack"] = [t for t in player["rack"] if t["id"] not in used]
    player["score"] += move["score"]
    refill(room, player)
    room["passes"] = 0 if move["score"] else room["passes"]+1
    log(room, player, "play", score=move["score"], bonus=move["bonus"], words=move["words"])
    if not room["bag"] and not player["rack"]:
        finish(room, "The bag is empty and a player used all their tiles.", player)
    else:
        advance(room, now)
    return {key: move[key] for key in ("score", "bonus", "words")}


def exchange(room, player, ids, now=None):
    if not isinstance(ids, list) or not ids or len(ids) > 7 or any(not isinstance(i,str) for i in ids):
        raise ValueError("Choose tiles to exchange.")
    if len(set(ids)) != len(ids) or not set(ids) <= {t["id"] for t in player["rack"]}:
        raise ValueError("That tile is not in your rack.")
    if len(room["bag"]) < 7:
        raise ValueError("You can exchange only while at least seven tiles remain in the bag.")
    returned = [t for t in player["rack"] if t["id"] in ids]
    player["rack"] = [t for t in player["rack"] if t["id"] not in ids]
    refill(room, player)
    room["bag"].extend(returned)
    random.SystemRandom().shuffle(room["bag"])
    room["passes"] += 1
    log(room, player, "exchange", count=len(ids))
    advance(room, now)


def pass_turn(room, player, now=None, timed=False):
    room["passes"] += 1
    log(room, player, "timeout" if timed else "pass")
    advance(room, now)


def resign(room, player, now=None, timed=False):
    player["score"] -= sum(t["points"] for t in player["rack"])
    player["resigned"] = True
    room["bag"].extend(player["rack"])
    player["rack"] = []
    random.SystemRandom().shuffle(room["bag"])
    log(room, player, "expired" if timed else "resign")
    if len(active(room)) <= 1:
        finish(room, "Only one player remains.")
    elif room["turn"] == player["id"]:
        advance(room, now)


def tick(room, now=None):
    """Advance clocks from stored timestamps, including time spent offline."""
    now = time.time() if now is None else now
    changed = False
    while room["status"] == "playing":
        player = current(room)
        limit = room["settings"]["turn_seconds"]
        deadlines = []
        if room["settings"]["minutes"]:
            deadlines.append((room["last_tick"]+player["seconds"], "total"))
        if limit:
            deadlines.append((room["turn_started"]+limit, "turn"))
        deadline, kind = min(deadlines, default=(float("inf"), "none"))
        elapsed = max(0, min(now, deadline)-room["last_tick"])
        if room["settings"]["minutes"]:
            player["seconds"] = max(0, player["seconds"]-elapsed)
        room["last_tick"] = min(now, deadline)
        if deadline > now:
            break
        changed = True
        if kind == "total":
            resign(room, player, deadline, timed=True)
        else:
            pass_turn(room, player, deadline, timed=True)
    return changed
