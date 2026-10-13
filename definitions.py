"""Short, attributed Wiktionary definitions. Independent of move validation."""

import json
import re
import unicodedata
from html.parser import HTMLParser
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen


def normalized(word):
    return "".join(c for c in unicodedata.normalize("NFKD", word.replace("œ", "oe"))
                   if not unicodedata.combining(c)).upper()


def fetch(url):
    request = Request(url, headers={"User-Agent": "JoeyScrabble/1.0 (https://joeydavid.fyi/scrabble)"})
    with urlopen(request, timeout=5) as response:
        return response.read(2_000_000).decode()


class Senses(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.items = []
        self.senses = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag == "ol":
            self.capture()
            self.depth += 1
        if tag == "li" and self.depth and not self.skip:
            self.items.append({"parts": [], "done": False})
        if tag in ("ul", "dl", "style", "script") and self.depth:
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ("ul", "dl", "style", "script") and self.skip:
            self.skip -= 1
        if tag == "li" and self.depth and not self.skip and self.items:
            self.capture()
            self.items.pop()
        if tag == "ol":
            self.depth -= 1

    def handle_data(self, data):
        if self.items and not self.skip and not self.items[-1]["done"]:
            self.items[-1]["parts"].append(data)

    def capture(self):
        if self.items and not self.items[-1]["done"] and not self.skip:
            value = " ".join("".join(self.items[-1]["parts"]).split())
            if len(value) > 8 and not value.startswith("Terms "):
                self.senses.append(value[:350])
            self.items[-1]["done"] = True


def lookup(language, word):
    base = f"https://{language}.wiktionary.org"
    keys = [word.lower()]
    try:
        result = json.loads(fetch(base + "/w/rest.php/v1/search/page?" + urlencode({"q": word.lower(), "limit": 5})))
        keys.extend(page["key"] for page in result["pages"] if normalized(page["key"]) == word)
    except (OSError, ValueError, KeyError):
        pass
    marker = "fr" if language == "fr" else "English"
    # Prefer lexical entries over an all-capitals acronym and preserve accents.
    keys = sorted(dict.fromkeys(keys), key=lambda key: (key[0].isupper(), key == word.lower()))
    for key in keys:
        try:
            html = fetch(base + "/w/rest.php/v1/page/" + quote(key, safe="") + "/html")
            match = re.search(r'id="' + marker + r'"', html)
            if not match:
                continue
            section = html[match.end():]
            section = section.split("<h2", 1)[0]
            parser = Senses()
            parser.feed(section)
            if parser.senses:
                return {"word": word, "text": parser.senses[0],
                        "url": base + "/wiki/" + quote(key, safe=""), "source": "Wiktionary"}
        except (OSError, ValueError):
            continue
    return {"word": word, "text": None, "url": base + "/wiki/" + quote(word.lower()), "source": "Wiktionary"}
