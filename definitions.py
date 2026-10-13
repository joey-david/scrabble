"""Short, attributed Wiktionary definitions. Independent of move validation."""

import json
import re
import unicodedata
from html.parser import HTMLParser
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


def normalized(word):
    word = word.replace("œ", "oe").replace("ñ", "\ue000").replace("Ñ", "\ue000")
    return "".join(c for c in unicodedata.normalize("NFKD", word)
                   if not unicodedata.combining(c)).replace("\ue000","Ñ").upper()


def fetch(url):
    request = Request(url, headers={"User-Agent": "JoeyScrabble/1.0 (https://joeydavid.fyi/scrabble)"})
    with urlopen(request, timeout=5) as response:
        return response.read(2_000_000).decode()


class Senses(HTMLParser):
    def __init__(self, definition_list=False):
        super().__init__()
        self.depth = 0
        self.items = []
        self.senses = []
        self.skip = 0
        self.definition_list = definition_list
        self.in_term = False
        self.term = ""
        self.next_definition = False

    def handle_starttag(self, tag, attrs):
        if self.definition_list and tag == "dt":
            self.in_term, self.term = True, ""
        if self.definition_list and tag == "dd" and self.next_definition and not self.depth:
            self.depth, self.next_definition = 1, False
            self.items.append({"parts": [], "done": False})
        if tag == "ol":
            self.capture()
            self.depth += 1
        if tag == "li" and self.depth and not self.skip:
            self.items.append({"parts": [], "done": False})
        if tag in ("ul", "dl", "style", "script") and self.depth:
            self.skip += 1

    def handle_endtag(self, tag):
        if self.definition_list and tag == "dt":
            self.in_term = False
            self.next_definition = bool(re.match(r"^\s*\d+\b", self.term))
        if self.definition_list and tag == "dd" and self.depth and not self.skip:
            self.capture()
            self.items.pop()
            self.depth = 0
        if tag in ("ul", "dl", "style", "script") and self.skip:
            self.skip -= 1
        if tag == "li" and self.depth and not self.skip and self.items:
            self.capture()
            self.items.pop()
        if tag == "ol":
            self.depth -= 1

    def handle_data(self, data):
        if self.in_term:
            self.term += data
        if self.items and not self.skip and not self.items[-1]["done"]:
            self.items[-1]["parts"].append(data)

    def capture(self):
        if self.items and not self.items[-1]["done"] and not self.skip:
            value = " ".join("".join(self.items[-1]["parts"]).split())
            if len(value) > 8 and not value.startswith("Terms "):
                sentence = re.split(r"(?<=[.!?])\s+",value)[0]
                self.senses.append(sentence if len(sentence) <= 240 else sentence[:237].rsplit(" ",1)[0]+"…")
            self.items[-1]["done"] = True


def lookup(language, word):
    base = f"https://{language}.wiktionary.org"
    keys = [word.lower()]
    try:
        result = json.loads(fetch(base + "/w/rest.php/v1/search/page?" + urlencode({"q": word.lower(), "limit": 5})))
        keys.extend(page["key"] for page in result["pages"] if normalized(page["key"]) == word)
    except (OSError, ValueError, KeyError):
        pass
    marker = {"fr":"fr", "en":"English", "es":"Español"}[language]
    # Prefer lexical entries over an all-capitals acronym and preserve accents.
    keys = sorted(dict.fromkeys(keys), key=lambda key: (key[0].isupper(),
                  key != word.lower() if language == "es" else key == word.lower()))
    for key in keys:
        try:
            html = fetch(base + "/w/rest.php/v1/page/" + quote(key, safe="") + "/html")
            match = re.search(r'id="' + marker + r'"', html)
            if not match:
                continue
            section = html[match.end():]
            section = section.split("<h2", 1)[0]
            parser = Senses(definition_list=language == "es")
            parser.feed(section)
            if parser.senses:
                return {"word": word, "text": parser.senses[0],
                        "url": base + "/wiki/" + quote(key, safe=""), "source": "Wiktionary"}
        except (OSError, ValueError):
            continue
    return {"word": word, "text": None, "url": base + "/wiki/" + quote(word.lower()), "source": "Wiktionary"}
