# Scrabble

French, English and Spanish Scrabble for 2–8 friends at [joeydavid.fyi/scrabble](https://joeydavid.fyi/scrabble).

Python 3.10+, no runtime dependencies:

```sh
python3 server.py --port 6087 --storage /tmp/scrabble.sqlite3
```

Open `http://127.0.0.1:6087/scrabble/`. The first player hosts the lobby. Share its link to invite friends. Standard games use 2–4 players; 5–8 is a house-rule extension with the same board and bag.

## Word lists

Validation uses the complete 2–15-letter community transcriptions of ODS9 (French) and CSW24 (international English), not a spell checker. Source URLs, counts by length, and SHA-256 checksums are in `data/sources.json`; the server checks integrity on startup. ODS9 contains 407,128 playable entries; the source's other 9,221 entries exceed the board's 15-letter limit. Its counts by length match VOC-ODS9. CSW24 contains 280,887 entries and matches Woogles' playable word graph exactly, with zero missing or extra words. Spanish uses FILE 2017: 639,293 words decoded from the Woogles word graph, with lengths measured in tiles rather than characters. These are independently hosted word lists, not a claim of publisher certification. Dictionary rights remain with their owners.

The standard premium-square positions are the same in all three languages. French has 102 tiles; English and Spanish have 100. Spanish includes Ñ and single-square CH, LL and RR tiles; blanks can represent these tiles. K and W are excluded. On the keyboard, Shift+C/L/R places CH/LL/RR. Blanks score zero, retain their assigned letter, and cannot be replaced after a move. New words and every cross-word must pass validation. Seven tiles earn 50 extra points. Players can exchange only when at least seven tiles remain. Rack points are deducted at the end; a player who empties their rack also receives the other racks' remaining points.

Definitions come from Wiktionary, under its linked license, and never decide word validity. An unavailable definition does not block a valid move.

## Checks

```sh
python3 -m unittest discover -s tests
```

Install the browser test dependency, then run the browser pass against the local server above:

```sh
npm ci
npx playwright install chromium
npm run test:browser
```

The browser pass creates an invite-only test room and seeds a conserved tile bag in `/tmp/scrabble.sqlite3` (set `SCRABBLE_TEST_STORAGE` to match your server). Set `SCRABBLE_TEST_SPANISH_ONLY=1` for the focused Spanish pass, which checks CH/LL/RR, Ñ, blank choices, scoring, the Spanish interface, mobile layout, and reveal reset.

The full pass checks two sessions, profiles, host settings, French and English moves, blanks, drag previews, desktop and native touch swaps, rack edge moves, refresh recovery, definitions, presence, exchange, pass, endings, rematches, and host transfer. It also checks that desktop games fit one screen and phone widths from 320 to 430 pixels do not overflow. Screenshots stay in the ignored `test-results/` directory.

Set `SCRABBLE_TEST_URL=https://joeydavid.fyi/scrabble/` for a public-route pass. It uses ordinary racks and never seeds the live database. Both passes leave their test seats when they finish.

Deployment uses the existing user service and Netlify proxy on joeydavid.fyi. Rooms and sessions persist in SQLite outside the source directory.

Presence uses page visibility, window focus, and a heartbeat. Clicking the icon beside a name explains its state. Missing heartbeats mark a player disconnected after 35 seconds. The host can pass a disconnected player's turn after three minutes. If the host leaves or stays disconnected for three minutes, an active player becomes host. Reloading preserves an unplayed move in the same tab.
