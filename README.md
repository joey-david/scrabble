# Scrabble

French and English Scrabble for 2–8 friends at [joeydavid.fyi/scrabble](https://joeydavid.fyi/scrabble).

Python 3.10+, no runtime dependencies:

```sh
python3 server.py --port 6087 --storage /tmp/scrabble.sqlite3
```

Open `http://127.0.0.1:6087/scrabble/`. The first player hosts the lobby. Share its link to invite friends. Standard games use 2–4 players; 5–8 is a house-rule extension with the same board and bag.

## Word lists

Validation uses the complete 2–15-letter community transcriptions of ODS9 (French) and CSW24 (international English), not a spell checker. Source URLs, counts by length, and SHA-256 checksums are in `data/sources.json`; the server checks integrity on startup. ODS9 contains 407,128 playable entries; the source's other 9,221 entries exceed the board's 15-letter limit. CSW24 contains 280,887 entries. These are independently hosted transcriptions, not a claim of publisher certification. Dictionary rights remain with their owners.

The standard premium-square positions are the same in both languages. French has 102 tiles; English has 100. Blanks score zero, retain their assigned letter, and cannot be replaced after a move. New words and every cross-word must pass validation. Seven tiles earn 50 extra points. Players can exchange only when at least seven tiles remain. Rack points are deducted at the end; a player who empties their rack also receives the other racks' remaining points.

Definitions come from Wiktionary, under its linked license, and never decide word validity. An unavailable definition does not block a valid move.

## Checks

```sh
python3 -m unittest discover -s tests
```

Deployment uses the existing user service and Netlify proxy on joeydavid.fyi. Rooms and sessions persist in SQLite outside the source directory.
