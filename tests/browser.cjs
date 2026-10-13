/* Run with NODE_PATH pointing to an existing Playwright installation. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.SCRABBLE_TEST_URL || "http://127.0.0.1:6087/scrabble/";
const storage = process.env.SCRABBLE_TEST_STORAGE || "/tmp/scrabble.sqlite3";
const out = path.join(
  __dirname,
  "../test-results",
  process.env.SCRABBLE_TEST_URL ? "live" : "local",
);
fs.mkdirSync(out, { recursive: true });

function seedRacks(code, letters) {
  execFileSync("python3", [
    "-c",
    `import json,sqlite3,sys
db=sqlite3.connect(sys.argv[1]); db.execute('BEGIN IMMEDIATE'); row=db.execute('SELECT state FROM rooms WHERE id=?',(sys.argv[2],)).fetchone(); r=json.loads(row[0]); pool=r['bag']+sum([p['rack'] for p in r['players']],[])
for p,letters in zip(r['players'],json.loads(sys.argv[3])):
 p['rack']=[]
 for c in letters:
  i=next(i for i,t in enumerate(pool) if t['letter']==c); p['rack'].append(pool.pop(i))
r['bag']=pool; r['rev']+=1; db.execute('UPDATE rooms SET state=? WHERE id=?',(json.dumps(r),sys.argv[2])); db.commit()`,
    storage,
    code,
    JSON.stringify(letters),
  ]);
}

async function dragTo(page, from, to) {
  await page
    .locator("#rack")
    .evaluate(async (el) =>
      Promise.all(
        el
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
  await from.scrollIntoViewIfNeeded();
  const source = await from.boundingBox(),
    target = await to.boundingBox();
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    target.x + target.width / 2,
    target.y + target.height / 2,
    { steps: 10 },
  );
  assert.equal(
    await page.locator("#drag-ghost").isVisible(),
    true,
    "drag should show the moving tile",
  );
  if (await to.evaluate((el) => el.classList.contains("rack-tile")))
    assert.equal(
      await to.evaluate((el) => el.classList.contains("swap-target")),
      true,
      "drag should preview the swap",
    );
  await page.mouse.up();
}

async function touchSwap(context, page) {
  const tiles = page.locator(".rack-tile"),
    id = await tiles.first().getAttribute("data-id");
  const from = await tiles.first().boundingBox(),
    to = await tiles.nth(1).boundingBox();
  const cdp = await context.newCDPSession(page);
  const point = (box) => ({
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(from)],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [point(to)],
  });
  assert.equal(
    await tiles.nth(1).evaluate((el) => el.classList.contains("swap-target")),
    true,
  );
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.equal(await tiles.nth(1).getAttribute("data-id"), id);
  await cdp.detach();
}

async function dragRackEdge(page, index, edge) {
  await page
    .locator("#rack")
    .evaluate(async (el) =>
      Promise.all(
        el
          .getAnimations({ subtree: true })
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
  const source = await page.locator(".rack-tile").nth(index).boundingBox(),
    rack = await page.locator("#rack").boundingBox();
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    edge === "left" ? rack.x + 1 : rack.x + rack.width - 1,
    rack.y + rack.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();
}

async function playOpening(page) {
  const room = await page.evaluate(async () =>
    (
      await fetch(
        "/scrabble/api/room/" + new URL(location.href).searchParams.get("room"),
      )
    ).json(),
  );
  const move = JSON.parse(
    execFileSync(
      "python3",
      [
        "-c",
        `import json,sys,game
r=json.loads(sys.argv[1]);p={'id':r['me'],'rack':r['rack']}
for word in sorted(game.WORDS[r['settings']['language']]):
 if len(word)!=2: continue
 rack=list(p['rack']); placements=[]
 for i,c in enumerate(word):
  tile=next((t for t in rack if t['letter']==c),None) or next((t for t in rack if t['letter']=='?'),None)
  if not tile: break
  rack.remove(tile);placements.append({'id':tile['id'],'pos':112+i,'letter':c,'blank':tile['letter']=='?'})
 if len(placements)==2:
  print(json.dumps(placements));break
else: raise SystemExit('No opening two-letter word in rack')`,
        JSON.stringify(room),
      ],
      { cwd: path.join(__dirname, ".."), encoding: "utf8" },
    ),
  );
  for (const tile of move) {
    await page.locator(`.rack-tile[data-id="${tile.id}"]`).click();
    await page.locator(`[data-pos="${tile.pos}"]`).click();
    if (tile.blank)
      await page
        .getByRole("button", { name: tile.letter, exact: true })
        .click();
  }
  await page.waitForFunction(() =>
    document.querySelector("#move-preview").classList.contains("valid"),
  );
  await page.locator("#play").click();
  await page.locator("#history .word").first().waitFor();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const contexts = await Promise.all([
    browser.newContext({ viewport: { width: 1280, height: 900 } }),
    browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    }),
  ]);
  const [a, b] = await Promise.all(contexts.map((c) => c.newPage()));
  const errors = [];
  for (const page of [a, b])
    page.on("pageerror", (e) => errors.push(e.message));
  try {
    await a.goto(base);
    await a.locator('[data-locale="en"]').click();
    await a.screenshot({
      path: path.join(out, "welcome-desktop.png"),
      fullPage: true,
    });
    await a.getByLabel("Your name").fill("Alice");
    await a.getByRole("button", { name: "Private room", exact: true }).click();
    await a.locator("#lobby").waitFor({ state: "visible" });
    const url = a.url();
    await b.goto(url);
    await b.locator('[data-locale="en"]').click();
    await b.getByLabel("Your name").fill("Bob");
    const photo = Buffer.from(
      await b.evaluate(() => {
        const c = document.createElement("canvas");
        c.width = c.height = 10;
        c.getContext("2d").fillRect(0, 0, 10, 10);
        return c.toDataURL().split(",")[1];
      }),
      "base64",
    );
    await b.locator("#photo").setInputFiles({
      name: "avatar.png",
      mimeType: "image/png",
      buffer: photo,
    });
    await b.locator("#photo-preview img").waitFor();
    await b.locator("#join-button").click();
    await b.locator("#lobby").waitFor({ state: "visible" });
    await a.waitForFunction(
      () => document.querySelector("#player-count").textContent === "2 / 8",
    );
    assert.equal(await b.locator("#game-language").isDisabled(), true);
    await a.locator("#game-language").selectOption("en");
    await a.locator("#random-first").uncheck();
    await a.locator("#save-settings").click();
    await b.waitForFunction(
      () => document.querySelector("#game-language").value === "en",
    );
    await a.screenshot({
      path: path.join(out, "lobby-desktop.png"),
      fullPage: true,
    });
    await b.screenshot({
      path: path.join(out, "lobby-mobile.png"),
      fullPage: true,
    });
    await a.locator("#start").click();
    await a.locator("#game").waitFor({ state: "visible" });
    await b.locator("#game").waitFor({ state: "visible" });
    assert.equal(await b.locator("#play").isDisabled(), true);

    if (process.env.SCRABBLE_TEST_URL) await playOpening(a);
    // Seed a legal, conserved bag so UI tests exercise repeatable human moves.
    if (!process.env.SCRABBLE_TEST_URL) {
      const code = new URL(a.url()).searchParams.get("room");
      seedRacks(code, ["CAT?REI", "SNTLODE"]);
      await a.reload();
      await a.locator("#game").waitFor({ state: "visible" });
      await b.reload();
      await b.locator("#game").waitFor({ state: "visible" });
      const ids = await a
        .locator(".rack-tile")
        .evaluateAll((els) => els.map((e) => e.dataset.id));
      await a.locator(".rack-tile").first().click();
      await a.locator("#reorder-right").click();
      assert.equal(
        await a.locator(".rack-tile").nth(1).getAttribute("data-id"),
        ids[0],
      );
      await dragTo(
        a,
        a.locator(".rack-tile").nth(1),
        a.locator(".rack-tile").nth(2),
      );
      assert.equal(
        await a.locator(".rack-tile").nth(2).getAttribute("data-id"),
        ids[0],
      );
      await dragRackEdge(a, 2, "right");
      assert.equal(
        await a.locator(".rack-tile").last().getAttribute("data-id"),
        ids[0],
      );
      await dragRackEdge(a, 6, "left");
      assert.equal(
        await a.locator(".rack-tile").first().getAttribute("data-id"),
        ids[0],
      );
      await a.locator(".rack-tile.selected").click();
      // Invalid word: CTR is denied and stays editable.
      await a.locator('[data-pos="111"]').click();
      await a.locator('[data-pos="111"]').press("c");
      await a.locator('[data-pos="112"]').press("t");
      await a.locator('[data-pos="113"]').press("r");
      await a.waitForFunction(() =>
        document.querySelector("#move-preview").classList.contains("invalid"),
      );
      await a.locator("#play").click();
      await a.waitForFunction(() =>
        document.querySelector("#notice").textContent.includes("Not in"),
      );
      assert.equal(await a.locator(".cell.draft").count(), 3);
      await a.locator("#recall").click();
      // Swap two draft tiles, then replace one with a tile from the rack.
      await a.locator('[data-pos="111"]').click();
      await a.keyboard.type("ca");
      await a.locator('[data-pos="111"]').click();
      await a.locator('[data-pos="112"]').click();
      assert.equal(
        await a
          .locator('[data-pos="112"]')
          .evaluate((el) => el.firstChild.textContent),
        "C",
      );
      await a.locator('.rack-tile[data-id^="T"]').click();
      await a.locator('[data-pos="112"]').click();
      assert.equal(
        await a
          .locator('.rack-tile[data-id^="C"]')
          .evaluate((el) => el.classList.contains("used")),
        false,
      );
      await a.locator("#recall").click();
      // Touch/click placement, move, replace, and return a blank.
      await a.locator('.rack-tile[data-id^="?"]').click();
      await a.locator('[data-pos="112"]').click();
      await a.getByRole("button", { name: "Z", exact: true }).click();
      assert.equal(await a.locator(".cell.blank.draft").count(), 1);
      await a.locator('[data-pos="112"]').click();
      await a.locator('[data-pos="127"]').click();
      assert.equal(
        await a
          .locator('[data-pos="127"]')
          .getAttribute("class")
          .then((s) => s.includes("draft")),
        true,
      );
      await a.locator('[data-pos="127"]').click();
      await a.locator("#return-tile").click();
      assert.equal(await a.locator(".cell.draft").count(), 0);
      // A keyboard word survives a full refresh before commit.
      await a.locator('[data-pos="111"]').click();
      await a.locator('[data-pos="111"]').press("c");
      await a.locator('[data-pos="112"]').press("a");
      await a.locator('[data-pos="113"]').press("t");
      await a.waitForFunction(() =>
        document
          .querySelector("#move-preview")
          .textContent.includes("10 points"),
      );
      await a.reload();
      await a.locator(".cell.draft").first().waitFor();
      assert.equal(await a.locator(".cell.draft").count(), 3);
      await a.locator("#play").click();
      await a.waitForFunction(
        () => document.querySelectorAll(".cell.draft").length === 0,
      );
      await b.waitForFunction(
        () => document.querySelector("#turn-label").textContent === "Your turn",
      );
      await touchSwap(contexts[1], b);
      if (
        (await b
          .locator('.rack-tile[data-id^="S"]')
          .getAttribute("aria-pressed")) !== "true"
      )
        await b.locator('.rack-tile[data-id^="S"]').tap();
      await b.locator('[data-pos="114"]').tap();
      await b.waitForFunction(() =>
        document.querySelector("#move-preview").textContent.includes("CATS"),
      );
      await b.locator("#play").tap();
      await a.waitForFunction(
        () => document.querySelector("#turn-label").textContent === "Your turn",
      );
      await a.locator("#history .definition").first().waitFor();
      await a.waitForFunction(
        () => document.querySelector("#history .definition a") !== null,
        {},
        { timeout: 30000 },
      );
      // Focus updates are separate from turn revisions.
      await a.evaluate(() => {
        Object.defineProperty(document, "hasFocus", {
          value: () => false,
          configurable: true,
        });
        window.dispatchEvent(new Event("blur"));
      });
      await b
        .getByRole("button", { name: "Alice: Away from this page" })
        .waitFor({ timeout: 10000 });
      await b.getByRole("button", { name: "Alice: Away from this page" }).tap();
      assert.equal(await b.locator("#modal").isVisible(), true);
      await b.locator("#modal-close").tap();
      await a.evaluate(() => {
        Object.defineProperty(document, "hasFocus", {
          value: () => true,
          configurable: true,
        });
        window.dispatchEvent(new Event("focus"));
      });
      await b
        .getByRole("button", { name: "Alice: On this page" })
        .waitFor({ timeout: 10000 });
      // Exchange and pass follow the same server turn handoff as played words.
      await a.locator("#exchange").click();
      await a.locator(".exchange-choice input").first().check();
      await a
        .locator("#modal")
        .getByRole("button", { name: "Exchange", exact: true })
        .click();
      await b.waitForFunction(
        () => document.querySelector("#turn-label").textContent === "Your turn",
      );
      await b.locator("#pass").tap();
      await b.locator("#modal").getByRole("button", { name: "Confirm" }).tap();
      await a.waitForFunction(
        () => document.querySelector("#turn-label").textContent === "Your turn",
      );
    }
    await a.screenshot({
      path: path.join(out, "game-desktop.png"),
      fullPage: true,
    });
    assert.equal(
      await a.evaluate(
        () => document.documentElement.scrollHeight > innerHeight,
      ),
      false,
      "desktop game must fit one screen",
    );
    await a.setViewportSize({ width: 1024, height: 600 });
    assert.equal(
      await a.evaluate(
        () => document.documentElement.scrollHeight > innerHeight,
      ),
      false,
      "small desktop must fit one screen",
    );
    await a.setViewportSize({ width: 1280, height: 900 });
    await b.screenshot({
      path: path.join(out, "game-mobile.png"),
      fullPage: true,
    });
    assert.equal(
      await b.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "mobile page overflows",
    );
    for (const width of [320, 360, 430]) {
      await b.setViewportSize({ width, height: 740 });
      assert.equal(
        await b.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `mobile width ${width} overflows`,
      );
    }
    await b.setViewportSize({ width: 390, height: 844 });
    await b.locator("#zoom").tap();
    await b.screenshot({
      path: path.join(out, "game-mobile-zoom.png"),
      fullPage: true,
    });
    await b.locator("#help").tap();
    await b.locator("#modal").waitFor({ state: "visible" });
    await b.keyboard.press("Escape");
    assert.equal(await b.locator("#modal").isVisible(), false);
    // End a game, return to the same room, and play the French rules.
    await b.locator("#resign").tap();
    await b.locator("#modal").getByRole("button", { name: "Confirm" }).tap();
    await a.locator("#finished").waitFor({ state: "visible" });
    assert.match(await a.locator("#winner").textContent(), /Alice wins/);
    await a.locator("#rematch").click();
    await a.locator("#lobby").waitFor({ state: "visible" });
    await a.locator("#game-language").selectOption("fr");
    await a.locator("#start").click();
    await a.locator("#game").waitFor({ state: "visible" });
    if (process.env.SCRABBLE_TEST_URL) await playOpening(a);
    if (!process.env.SCRABBLE_TEST_URL) {
      seedRacks(new URL(a.url()).searchParams.get("room"), [
        "CHAT?ES",
        "SNOLIER",
      ]);
      await a.reload();
      await a.locator("#game").waitFor({ state: "visible" });
      await b.reload();
      await b.locator("#game").waitFor({ state: "visible" });
      assert.equal(await a.locator('[data-pos="16"]').textContent(), "MD");
      await dragTo(
        a,
        a.locator('.rack-tile[data-id^="C"]'),
        a.locator('[data-pos="110"]'),
      );
      await a.locator('[data-pos="110"].draft').waitFor();
      await dragTo(
        a,
        a.locator('[data-pos="110"]'),
        a.locator('[data-pos="95"]'),
      );
      await a.locator('[data-pos="95"].draft').waitFor();
      await dragTo(
        a,
        a.locator('[data-pos="95"]'),
        a.locator('[data-pos="110"]'),
      );
      await a.locator('[data-pos="111"]').click();
      await a.keyboard.type("hat");
      await a.waitForFunction(() =>
        document
          .querySelector("#move-preview")
          .textContent.includes("CHAT · 18 points"),
      );
      await a.locator("#play").click();
      await b.waitForFunction(
        () => document.querySelector("#turn-label").textContent === "Your turn",
      );
      await b.locator('.rack-tile[data-id^="S"]').tap();
      await b.locator('[data-pos="114"]').tap();
      await b.waitForFunction(() =>
        document
          .querySelector("#move-preview")
          .textContent.includes("CHATS · 10 points"),
      );
      await b.locator("#play").tap();
      await a.waitForFunction(
        () => document.querySelector("#turn-label").textContent === "Your turn",
      );
      await a.locator("#history").getByText("CHAT", { exact: true }).waitFor();
      await a.waitForFunction(
        () =>
          [...document.querySelectorAll("#history .definition")].some((el) =>
            el.textContent.includes("Mammifère"),
          ),
        {},
        { timeout: 30000 },
      );
      await a.screenshot({
        path: path.join(out, "french-desktop.png"),
        fullPage: true,
      });
      for (let n = 0; n < 6; n++) {
        const page = n % 2 === 0 ? a : b;
        const result = await page.evaluate(async () => {
          const code = new URL(location.href).searchParams.get("room"),
            root = "/scrabble/api/room/" + code;
          const room = await (await fetch(root)).json();
          return (
            await fetch(root, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "pass",
                rev: room.rev,
                request_id: crypto.randomUUID(),
              }),
            })
          ).json();
        });
        assert.equal(result.error, undefined);
      }
      await a.locator("#finished").waitFor({ state: "visible" });
      await a.locator("#rematch").click();
      await a.locator("#lobby").waitFor({ state: "visible" });
      await a.locator("#edit-profile").click();
      await a.locator("#modal").getByLabel("Your name").fill("Alice II");
      await a
        .locator("#modal")
        .getByRole("button", { name: "Confirm" })
        .click();
      await a
        .locator("#lobby-players")
        .getByText("Alice II", { exact: true })
        .waitFor();
      await a.locator("#leave").click();
      await a
        .locator("#modal")
        .getByRole("button", { name: "Confirm" })
        .click();
      await b.waitForFunction(() =>
        document.querySelector("#host-note").textContent.includes("You host"),
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      process.env.SCRABBLE_TEST_URL
        ? "PASS: public route, two sessions, profiles, host settings, English/French accepted words, mobile layout, resignation, and rematch."
        : "PASS: two sessions, profiles, lobby, settings, English/French gameplay, drafts, definitions, focus, mobile layout, keyboard, drag, exchange, pass, resignation, end scores, rematch, host transfer.",
    );
  } finally {
    await a
      .screenshot({ path: path.join(out, "last-state.png"), fullPage: true })
      .catch(() => {});
    for (const page of [a, b])
      await page
        .evaluate(async () => {
          const code = new URL(location.href).searchParams.get("room");
          if (!code) return;
          const root = "/scrabble/api/room/" + code,
            room = await (await fetch(root)).json();
          if (room.me)
            await fetch(root, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "leave",
                rev: room.rev,
                request_id: crypto.randomUUID(),
              }),
            });
        })
        .catch(() => {});
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
