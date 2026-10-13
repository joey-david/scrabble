/* Run with NODE_PATH pointing to an existing Playwright installation. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const base = process.env.SCRABBLE_TEST_URL || "http://127.0.0.1:6087/scrabble/";
const storage =
  process.env.SCRABBLE_TEST_STORAGE || "/tmp/scrabble-dev.sqlite3";
const out = path.join(__dirname, "../test-results");
fs.mkdirSync(out, { recursive: true });

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
    await a.getByRole("button", { name: "Create an invite-only room" }).click();
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
    await b
      .locator("#photo")
      .setInputFiles({
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

    // Seed a legal, conserved bag so UI tests exercise repeatable human moves.
    if (!process.env.SCRABBLE_TEST_URL) {
      const code = new URL(a.url()).searchParams.get("room");
      execFileSync("python3", [
        "-c",
        `import json,sqlite3,sys
db=sqlite3.connect(sys.argv[1]); row=db.execute('SELECT state FROM rooms WHERE id=?',(sys.argv[2],)).fetchone(); r=json.loads(row[0]); pool=r['bag']+sum([p['rack'] for p in r['players']],[])
for p,letters in zip(r['players'],['CAT?REI','SNTLODE']):
 p['rack']=[]
 for c in letters:
  i=next(i for i,t in enumerate(pool) if t['letter']==c); p['rack'].append(pool.pop(i))
r['bag']=pool; r['rev']+=1; db.execute('UPDATE rooms SET state=? WHERE id=?',(json.dumps(r),sys.argv[2])); db.commit()`,
        storage,
        code,
      ]);
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
    await b.screenshot({
      path: path.join(out, "game-mobile.png"),
      fullPage: true,
    });
    assert.equal(
      await b.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      "mobile page overflows",
    );
    await b.locator("#zoom").tap();
    await b.screenshot({
      path: path.join(out, "game-mobile-zoom.png"),
      fullPage: true,
    });
    await b.locator("#help").tap();
    await b.locator("#modal").waitFor({ state: "visible" });
    await b.keyboard.press("Escape");
    assert.equal(await b.locator("#modal").isVisible(), false);
    assert.deepEqual(errors, []);
    console.log(
      "PASS: two sessions, profiles, lobby, settings, gameplay, drafts, definitions, focus, mobile layout, keyboard, exchange, pass.",
    );
  } finally {
    await browser.close();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
