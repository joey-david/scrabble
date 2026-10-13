"use strict";

const $ = (id) => document.getElementById(id);
const messages = {
  en: {
    joinLobby: "Join",
    name: "Your name",
    choosePhoto: "Profile picture",
    removePhoto: "Remove",
    privateRoom: "Private room",
    invite: "Invite",
    leave: "Leave room",
    players: "Players",
    settings: "Settings",
    dictionary: "Language & dictionary",
    playerTime: "Time per player",
    turnTime: "Time per turn",
    unlimited: "Unlimited",
    randomFirst: "Random first player",
    previewOption: "Word previews",
    saveSettings: "Save",
    start: "Start",
    yourRack: "Letters",
    zoom: "Zoom",
    shuffle: "Shuffle",
    sort: "A–Z",
    recall: "Recall all",
    returnTile: "Return",
    play: "Play",
    exchange: "Exchange",
    pass: "Pass",
    scores: "Scores",
    gameOver: "Game over",
    rematch: "Back to lobby",
    resign: "Resign",
    lastMoves: "Moves",
    lobby: "Lobby",
    table: "Scrabble",
    host: "Host",
    you: "You",
    emptySeat: "Empty",
    waitingHost: "Waiting for the host.",
    hosting: "You host this room.",
    saved: "Settings saved.",
    copied: "Invite link copied.",
    copy: "Copy link",
    inviteHint:
      "Anyone with this link can join while the room is waiting. Up to eight players.",
    focus: "On this page",
    away: "Away from this page",
    offline: "Disconnected",
    yourTurn: "Your turn",
    turnOf: "{name}’s turn",
    bag: "{count} left",
    placeHint: "",
    waiting: "",
    checking: "Checking words…",
    valid: "{words} · {score} points",
    bonus: " + 50 for all seven",
    connectionLost:
      "Connection interrupted. Reconnecting… Your unplayed tiles stay here.",
    reconnected: "Connected again.",
    noDefinition: "A short definition is unavailable.",
    definitionLoading: "Looking up the definition…",
    source: "Wiktionary · CC BY-SA",
    score: "points",
    passed: "Passed",
    exchanged: "Exchanged {count} tiles",
    resigned: "Resigned",
    expired: "Player clock expired",
    timeout: "Turn clock expired · passed",
    noMoves: "The first word will appear here.",
    won: "{name} wins with {score} points.",
    tie: "A tie at {score} points: {names}.",
    watching: "Spectating",
    joinWatch: "Join another lobby",
    blankTitle: "Choose the blank’s letter",
    blankHint:
      "The blank is worth zero points and keeps this letter after you play.",
    exchangeTitle: "Exchange letters",
    exchangeHint:
      "Choose the tiles to return. This uses your turn; at least seven tiles must remain in the bag.",
    confirm: "Confirm",
    cancel: "Cancel",
    passTitle: "Pass your turn?",
    passHint: "Your letters stay in your rack.",
    resignTitle: "Resign from this game?",
    resignHint: "Your rack points will be deducted. You can keep watching.",
    leaveTitle: "Leave this room?",
    leaveHint:
      "Leaving during a game resigns your seat. In the lobby, the next player becomes host.",
    helpTitle: "How to play",
    helpItems: [
      "Cover the centre star with your first word. Later words must connect to the board.",
      "Place tiles in one row or column with no gaps. Every new word, including cross-words, must be in the selected dictionary.",
      "Tap or drag letters to place, move, and replace them before clicking Play. Played tiles stay on the board. Tap a placed blank to move it; return it to your rack to choose another letter.",
      "Tap a rack letter and use ← / → below the rack to reorder it, or drag it onto another rack tile. Shuffle and A–Z also work.",
      "Click a square and type. Arrow keys move the cursor; Enter changes direction; Backspace recalls a tile. A blank can represent any A–Z letter.",
      "Letter and word bonuses count only when a tile first covers them. Using all seven tiles adds 50 points.",
      "Exchange uses your turn. Consecutive turns without a score end the game after at least six turns (two per player with four or more players).",
      "At the end, remaining rack points are deducted. A player who uses their last tiles with an empty bag receives the other rack points.",
      "The standard French and English boards share the same bonus layout. French uses 102 tiles; English 100. Five to eight players is a house-rule extension.",
      "Your session reconnects in this browser. Do not clear its cookies during a game. Invite-only rooms are open to anyone with the link.",
    ],
    letter2: "Double letter",
    letter3: "Triple letter",
    word2: "Double word",
    word3: "Triple word",
    notYourTurn: "Wait for your turn.",
    fixedTile: "Played tiles cannot move.",
    changed: "The turn changed. Your unplayed tiles returned to the rack.",
    hostSettings: "Only the host can change these settings.",
    finishedReason: "Final rack points have been applied.",
    blank: "blank",
    remove: "Remove tile",
    editProfile: "Profile",
    profileSaved: "Profile saved.",
    photoError: "Choose a readable image smaller than 10 MB.",
    swap: "Swap",
    moveLeft: "Move to start",
    moveRight: "Move to end",
  },
  fr: {
    joinLobby: "Rejoindre",
    name: "Votre nom",
    choosePhoto: "Photo de profil",
    removePhoto: "Retirer",
    privateRoom: "Salle privée",
    invite: "Inviter",
    leave: "Quitter",
    players: "Joueurs",
    settings: "Réglages",
    dictionary: "Langue et dictionnaire",
    playerTime: "Temps par joueur",
    turnTime: "Temps par tour",
    unlimited: "Illimité",
    randomFirst: "Premier joueur au hasard",
    previewOption: "Aperçu des mots",
    saveSettings: "Enregistrer",
    start: "Lancer",
    yourRack: "Lettres",
    zoom: "Zoom",
    shuffle: "Mélanger",
    sort: "A–Z",
    recall: "Tout reprendre",
    returnTile: "Reprendre",
    play: "Jouer",
    exchange: "Échanger",
    pass: "Passer",
    scores: "Scores",
    gameOver: "Partie terminée",
    rematch: "Retour au salon",
    resign: "Abandonner",
    lastMoves: "Coups",
    lobby: "Salon",
    table: "Scrabble",
    host: "Hôte",
    you: "Vous",
    emptySeat: "Libre",
    waitingHost: "En attente de l’hôte.",
    hosting: "Vous êtes l’hôte.",
    saved: "Réglages enregistrés.",
    copied: "Lien d’invitation copié.",
    copy: "Copier le lien",
    inviteHint:
      "Toute personne ayant ce lien peut rejoindre le salon avant le début de la partie. Huit joueurs maximum.",
    focus: "Sur cette page",
    away: "A quitté cette page",
    offline: "Déconnecté",
    yourTurn: "À vous de jouer",
    turnOf: "Tour de {name}",
    bag: "{count} restantes",
    placeHint: "",
    waiting: "",
    checking: "Vérification des mots…",
    valid: "{words} · {score} points",
    bonus: " + 50 pour les sept lettres",
    connectionLost:
      "Connexion interrompue. Reconnexion… Vos lettres non jouées restent ici.",
    reconnected: "Connexion rétablie.",
    noDefinition: "Pas de définition courte disponible.",
    definitionLoading: "Recherche de la définition…",
    source: "Wiktionnaire · CC BY-SA",
    score: "points",
    passed: "Tour passé",
    exchanged: "{count} lettres échangées",
    resigned: "Abandon",
    expired: "Chrono joueur épuisé",
    timeout: "Chrono du tour épuisé · tour passé",
    noMoves: "Le premier mot apparaîtra ici.",
    won: "{name} gagne avec {score} points.",
    tie: "Égalité à {score} points : {names}.",
    watching: "Spectateur",
    joinWatch: "Rejoindre un autre salon",
    blankTitle: "Choisissez la lettre du joker",
    blankHint: "Le joker vaut zéro point et garde cette lettre après le coup.",
    exchangeTitle: "Échanger des lettres",
    exchangeHint:
      "Choisissez les lettres à rendre. Cela utilise votre tour ; il faut au moins sept lettres dans le sac.",
    confirm: "Confirmer",
    cancel: "Annuler",
    passTitle: "Passer votre tour ?",
    passHint: "Vos lettres restent sur votre chevalet.",
    resignTitle: "Abandonner la partie ?",
    resignHint:
      "Les points de vos lettres seront déduits. Vous pourrez continuer à regarder.",
    leaveTitle: "Quitter cette salle ?",
    leaveHint:
      "Pendant la partie, quitter abandonne votre place. Dans le salon, le joueur suivant devient hôte.",
    helpTitle: "Comment jouer",
    helpItems: [
      "Le premier mot doit couvrir l’étoile centrale. Ensuite, les mots doivent toucher les lettres du plateau.",
      "Posez les lettres dans une seule ligne ou colonne, sans trou. Tous les mots créés, y compris les croisements, doivent figurer dans le dictionnaire choisi.",
      "Touchez ou glissez les lettres pour les poser, déplacer ou remplacer avant de cliquer sur Jouer. Les lettres jouées restent fixes. Pour changer la lettre d’un joker, reprenez-le puis reposez-le.",
      "Sélectionnez une lettre du chevalet, puis utilisez ← / → pour la ranger, ou glissez-la sur une autre lettre. Mélanger et A–Z fonctionnent aussi.",
      "Cliquez sur une case et tapez. Les flèches déplacent le curseur ; Entrée change le sens ; Retour arrière reprend une lettre. Un joker peut représenter toute lettre A–Z.",
      "Les cases bonus comptent seulement lorsqu’une lettre les couvre pour la première fois. Poser sept lettres donne 50 points en plus.",
      "Échanger utilise votre tour. Les tours sans score terminent le jeu après au moins six tours consécutifs (deux par joueur à partir de quatre joueurs).",
      "En fin de partie, les lettres restantes sont déduites. Un joueur qui vide son chevalet lorsque le sac est vide reçoit aussi les points des autres chevalets.",
      "Les plateaux français et anglais ont les mêmes cases bonus. Le français compte 102 lettres ; l’anglais 100. De cinq à huit joueurs, on étend les règles habituelles.",
      "Votre partie reprend dans ce navigateur. Gardez ses cookies pendant la partie. Une salle sur invitation reste ouverte à toute personne ayant son lien.",
    ],
    letter2: "Lettre double",
    letter3: "Lettre triple",
    word2: "Mot double",
    word3: "Mot triple",
    notYourTurn: "Attendez votre tour.",
    fixedTile: "Les lettres jouées restent fixes.",
    changed:
      "Le tour a changé. Vos lettres non jouées sont revenues au chevalet.",
    hostSettings: "Seul l’hôte peut changer ces réglages.",
    finishedReason: "Les points des lettres restantes ont été appliqués.",
    blank: "joker",
    remove: "Reprendre la lettre",
    editProfile: "Profil",
    profileSaved: "Profil enregistré.",
    photoError: "Choisissez une image lisible de moins de 10 Mo.",
    swap: "Permuter",
    moveLeft: "Placer au début",
    moveRight: "Placer à la fin",
  },
};

let locale = localStorage.getItem("scrabble-locale") || "fr";
if (!messages[locale]) locale = "fr";
let room = null,
  selected = null,
  cursor = 112,
  direction = 1,
  drafts = [],
  order = [];
let avatar = "",
  sessionReady = false,
  busy = false,
  polling = false,
  lastPlayers = "",
  previewTimer,
  noticeTimer,
  renderedHistory = "",
  historyObserver = null;
let previewGeneration = 0,
  networkDown = false,
  drag = null,
  suppressClick = false;
const definitionCache = new Map();
const t = (key, values = {}) =>
  Object.entries(values).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    messages[locale][key] ?? key,
  );
const node = (tag, className = "", text = "") => {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
};
const myTurn = () => room?.status === "playing" && room.turn === room.me;
const isHost = () => room && room.host === room.me;
const focusState = () =>
  document.visibilityState === "visible" && document.hasFocus();
const requestId = () => crypto.randomUUID();

function notice(text, error = false) {
  clearTimeout(noticeTimer);
  $("notice").textContent = text;
  $("notice").classList.toggle("error", error);
  $("notice").hidden = false;
  noticeTimer = setTimeout(
    () => ($("notice").hidden = true),
    error ? 6500 : 4000,
  );
}

async function api(path, data) {
  const response = await fetch("/scrabble/" + path, {
    cache: "no-store",
    headers: data ? { "Content-Type": "application/json" } : {},
    method: data ? "POST" : "GET",
    body: data ? JSON.stringify(data) : undefined,
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || `HTTP ${response.status}`);
  return value;
}

function translate() {
  document.documentElement.lang = locale;
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document
    .querySelectorAll("[data-locale]")
    .forEach((el) =>
      el.setAttribute("aria-pressed", String(el.dataset.locale === locale)),
    );
  $("legend-dl").textContent = t("letter2");
  $("legend-tl").textContent = t("letter3");
  $("legend-dw").textContent = t("word2");
  $("legend-tw").textContent = t("word3");
  if (room) render(true);
}

function roomUrl() {
  return `${location.origin}/scrabble/?room=${encodeURIComponent(room.id)}`;
}

function avatarNode(person, large = false) {
  const el = node(
    "span",
    "avatar" + (large ? " large" : ""),
    person.name?.[0]?.toUpperCase() || "?",
  );
  if (person.avatar) {
    const img = node("img");
    img.src = person.avatar;
    img.alt = "";
    el.replaceChildren(img);
  }
  return el;
}

function showPhoto() {
  $("photo-preview").replaceChildren(
    ...avatarNode({ name: $("name").value, avatar }).childNodes,
  );
  $("remove-photo").hidden = !avatar;
}

async function readPhoto(file) {
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 10_000_000)
    throw new Error(t("photoError"));
  const image = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const side = Math.min(image.width, image.height);
  canvas
    .getContext("2d")
    .drawImage(
      image,
      (image.width - side) / 2,
      (image.height - side) / 2,
      side,
      side,
      0,
      0,
      128,
      128,
    );
  image.close();
  avatar = canvas.toDataURL("image/jpeg", 0.8);
  showPhoto();
}

function playerNode(person, seat = false) {
  const el = node(
    "div",
    "player" +
      (seat ? " seat" : "") +
      (person.id === room.turn ? " current" : "") +
      (person.resigned ? " resigned" : ""),
  );
  el.append(avatarNode(person));
  const details = node("div", "player-details"),
    name = node("div", "player-name");
  name.append(node("strong", "", person.name));
  const state = !person.online ? "offline" : person.focused ? "focus" : "away";
  const indicator = node(
    "button",
    "presence " + (state === "focus" ? "focused" : state),
    state === "focus" ? "●" : state === "away" ? "◐" : "○",
  );
  indicator.type = "button";
  indicator.title = t(state);
  indicator.setAttribute("aria-label", `${person.name}: ${t(state)}`);
  indicator.addEventListener("click", () => {
    notice(`${person.name} · ${t(state)}`);
  });
  name.append(indicator);
  details.append(name);
  details.append(
    node(
      "p",
      "fine",
      [
        person.id === room.me ? t("you") : "",
        person.id === room.host ? t("host") : "",
        person.resigned ? t("resigned") : "",
      ]
        .filter(Boolean)
        .join(" · "),
    ),
  );
  el.append(details);
  if (!seat) {
    const score = node("div", "player-score", String(person.score));
    score.title = `${person.rack_count} ${t("yourRack").toLowerCase()}`;
    el.append(score);
  }
  return el;
}

function renderPlayers(force = false) {
  const turnPlayer = room.players.find((p) => p.id === room.turn);
  $("skip-absent").hidden =
    room.status !== "playing" || !isHost() || !turnPlayer || turnPlayer.online;
  const fingerprint = JSON.stringify([
    room.players,
    room.host,
    room.turn,
    locale,
  ]);
  if (!force && fingerprint === lastPlayers) return;
  lastPlayers = fingerprint;
  const target =
    room.status === "lobby" ? $("lobby-players") : $("score-players");
  const items = room.players.map((p) => playerNode(p, room.status === "lobby"));
  if (room.status === "lobby")
    for (let i = items.length; i < 8; i++)
      items.push(
        node(
          "div",
          "seat empty",
          `${String(i + 1).padStart(2, "0")} · ${t("emptySeat")}`,
        ),
      );
  target.replaceChildren(...items);
  $("player-count").textContent = `${room.players.length} / 8`;
}

function loadOrder() {
  try {
    order = JSON.parse(
      localStorage.getItem(`scrabble-order-${room.id}-${room.me}`) || "[]",
    );
  } catch {
    order = [];
  }
  if (!Array.isArray(order)) order = [];
  const ids = room.rack?.map((tile) => tile.id) || [];
  order = order.filter((id) => ids.includes(id));
  ids.forEach((id) => {
    if (!order.includes(id)) order.push(id);
  });
}

function persistDrafts() {
  sessionStorage.setItem(
    `scrabble-draft-${room.id}`,
    JSON.stringify({ turn: room.turn, history: room.history.length, drafts }),
  );
}

function loadDrafts() {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(`scrabble-draft-${room.id}`) || "null",
    );
    if (
      saved &&
      saved.turn === room.turn &&
      saved.history === room.history.length &&
      myTurn()
    )
      drafts = saved.drafts;
  } catch {
    drafts = [];
  }
  drafts = drafts.filter(
    (d) => room.rack?.some((tile) => tile.id === d.id) && !room.board[d.pos],
  );
}

function acceptRoom(value) {
  const previous = room;
  const reset =
    !previous ||
    previous.id !== value.id ||
    previous.turn !== value.turn ||
    previous.status !== value.status ||
    previous.history.length !== value.history.length;
  room = value;
  if (reset) {
    if (drafts.length && previous && previous.id === value.id)
      notice(t("changed"));
    drafts = [];
    selected = null;
    previewGeneration++;
    loadOrder();
    if (!previous) loadDrafts();
  }
  localStorage.setItem("scrabble-room", room.id);
  const url = new URL(location.href);
  url.searchParams.set("room", room.id);
  history.replaceState(null, "", url);
  if (!previous || previous.rev !== room.rev || reset) render(true);
  else {
    renderPlayers();
    updateClocks();
  }
}

function render(force = false) {
  if (!room.me && room.status === "lobby") {
    $("welcome").hidden = false;
    $("room").hidden = true;
    return;
  }
  $("welcome").hidden = true;
  $("room").hidden = false;
  $("lobby").hidden = room.status !== "lobby";
  $("game").hidden = room.status === "lobby";
  $("room-title").textContent = t(room.status === "lobby" ? "lobby" : "table");
  $("room-code").textContent =
    `${room.public ? (locale === "fr" ? "Salon public" : "Public room") : locale === "fr" ? "Sur invitation" : "Invite-only"} · ${room.id}`;
  $("host-note").textContent = t(isHost() ? "hosting" : "waitingHost");
  $("leave").hidden = !room.me;
  $("join-other").hidden = Boolean(room.me);
  $("edit-profile").hidden = !room.me;
  $("skip-absent").textContent =
    locale === "fr" ? "Passer le joueur absent" : "Pass absent player";
  renderPlayers(force);
  if (room.status === "lobby") {
    $("settings-fields").disabled = !isHost();
    $("save-settings").hidden = !isHost();
    $("start").hidden = !isHost();
    $("start").disabled = room.players.length < 2 || busy;
    $("host-badge").textContent = t("host");
    $("game-language").value = room.settings.language;
    $("minutes").value = room.settings.minutes;
    $("turn-seconds").value = room.settings.turn_seconds;
    $("random-first").checked = room.settings.random_first;
    $("show-preview").checked = room.settings.show_preview;
    $("dictionary-note").textContent =
      `${room.dictionary.edition} · ${room.dictionary.words.toLocaleString(locale)} ${locale === "fr" ? "mots" : "words"} · ${room.settings.language === "fr" ? 102 : 100} ${locale === "fr" ? "lettres" : "tiles"}`;
  } else {
    renderBoard();
    renderRack();
    renderHistory();
    updateClocks();
    updateControls();
    $("bag-count").textContent = t("bag", { count: room.bag_count });
    $("game-language-badge").textContent = room.dictionary.edition;
    $("finished").hidden = room.status !== "finished";
    $("rematch").hidden = !isHost();
    const me = room.players.find((p) => p.id === room.me);
    $("resign").hidden = room.status !== "playing" || !me || me.resigned;
    if (room.status === "finished") {
      const contenders = room.players.filter((p) => !p.resigned);
      const best = Math.max(...contenders.map((p) => p.score));
      const winners = contenders.filter((p) => p.score === best);
      $("winner").textContent =
        winners.length === 1
          ? t("won", { name: winners[0].name, score: best })
          : t("tie", {
              score: best,
              names: winners.map((p) => p.name).join(", "),
            });
      $("end-reason").textContent = t("finishedReason");
    }
    schedulePreview();
  }
}

function tileElement(tile, className, button = true) {
  const el = node(
    button ? "button" : "span",
    className,
    tile.letter === "?" ? "·" : tile.letter,
  );
  el.append(node("small", "", String(tile.points)));
  return el;
}

function renderBoard() {
  const hadFocus = $("board").contains(document.activeElement);
  const latest = room.history.filter((h) => h.kind === "play").at(-1);
  const recent = new Set(latest?.words.flatMap((w) => w.cells) || []);
  const cells = Array.from({ length: 225 }, (_, pos) => {
    const draft = drafts.find((d) => d.pos === pos);
    const original = room.rack?.find((tile) => tile.id === draft?.id);
    const tile =
      room.board[pos] ||
      (original && {
        ...original,
        letter: draft.letter || original.letter,
        blank: original.letter === "?",
      });
    const premium = room.premiums[pos];
    const label = `${String.fromCharCode(65 + (pos % 15))}${Math.floor(pos / 15) + 1}`;
    const premiumLabel =
      room.settings.language === "fr"
        ? { DL: "LD", TL: "LT", DW: "MD", TW: "MT" }[premium]
        : premium;
    const el = tile
      ? tileElement(tile, "cell tile")
      : node("button", "cell", pos === 112 ? "✦" : premiumLabel || "");
    el.dataset.pos = pos;
    el.dataset.premium = premium || "";
    el.tabIndex = pos === cursor ? 0 : -1;
    el.classList.toggle("draft", Boolean(draft));
    el.classList.toggle("blank", Boolean(tile?.blank));
    el.classList.toggle("last", recent.has(pos) && !draft);
    el.classList.toggle("selected", draft?.id === selected);
    el.classList.toggle("cursor", pos === cursor && !tile);
    const premiumText = premium
      ? t({ DL: "letter2", TL: "letter3", DW: "word2", TW: "word3" }[premium])
      : "";
    el.setAttribute(
      "aria-label",
      `${label}, ${tile ? `${tile.letter}${tile.blank ? " " + t("blank") : ""}, ${tile.points} ${t("score")}` : premiumText || t("emptySeat")}${draft ? ", " + t("remove") : ""}`,
    );
    el.addEventListener("click", () => {
      if (!suppressClick) boardClick(pos);
    });
    el.addEventListener("keydown", boardKey);
    el.addEventListener("pointerdown", (event) => {
      if (draft) beginDrag(event, draft.id);
    });
    return el;
  });
  $("board").replaceChildren(...cells);
  $("direction").textContent = direction === 1 ? "→" : "↓";
  if (hadFocus)
    $("board")
      .querySelector(`[data-pos="${cursor}"]`)
      ?.focus({ preventScroll: true });
}

function renderRack() {
  const previous = new Map(
    [...$("rack").children].map((el) => [
      el.dataset.id,
      el.getBoundingClientRect(),
    ]),
  );
  const focused = document.activeElement?.closest(".rack-tile")?.dataset.id;
  const rack = new Map((room.rack || []).map((tile) => [tile.id, tile]));
  order = order.filter((id) => rack.has(id));
  rack.forEach((tile, id) => {
    if (!order.includes(id)) order.push(id);
  });
  localStorage.setItem(
    `scrabble-order-${room.id}-${room.me}`,
    JSON.stringify(order),
  );
  $("rack").replaceChildren(
    ...order.map((id) => {
      const tile = rack.get(id),
        el = tileElement(tile, "rack-tile");
      el.dataset.id = id;
      el.classList.toggle("selected", selected === id);
      el.classList.toggle(
        "used",
        drafts.some((d) => d.id === id),
      );
      el.setAttribute(
        "aria-label",
        `${tile.letter === "?" ? t("blank") : tile.letter}, ${tile.points} ${t("score")}`,
      );
      el.setAttribute("aria-pressed", String(selected === id));
      el.addEventListener("click", () => {
        if (suppressClick) return;
        selected = selected === id ? null : id;
        renderRack();
        renderBoard();
        updateControls();
      });
      el.addEventListener("pointerdown", (event) => beginDrag(event, id));
      return el;
    }),
  );
  if (focused)
    [...$("rack").children]
      .find((el) => el.dataset.id === focused)
      ?.focus({ preventScroll: true });
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
    for (const el of $("rack").children) {
      const before = previous.get(el.dataset.id),
        after = el.getBoundingClientRect();
      if (before && Math.abs(before.x - after.x) > 1)
        el.animate(
          [
            {
              transform: `translate(${before.x - after.x}px, ${before.y - after.y}px)`,
            },
            { transform: getComputedStyle(el).transform },
          ],
          { duration: 240, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
    }
}

function changedDrafts() {
  persistDrafts();
  renderBoard();
  renderRack();
  updateControls();
  schedulePreview();
}

function place(id, pos, letter) {
  if (!myTurn() || busy) {
    notice(t("notYourTurn"), true);
    return;
  }
  if (room.board[pos]) {
    notice(t("fixedTile"), true);
    return;
  }
  const tile = room.rack.find((tile) => tile.id === id);
  if (!tile) return;
  const previous = drafts.find((d) => d.id === id);
  if (tile.letter === "?" && !letter && !previous) {
    const grid = node("div", "blank-letters");
    for (const c of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      const button = node("button", "", c);
      button.addEventListener("click", () => {
        $("modal").close();
        place(id, pos, c);
      });
      grid.append(button);
    }
    dialog(t("blankTitle"), [node("p", "fine", t("blankHint")), grid]);
    return;
  }
  const occupied = drafts.find((d) => d.pos === pos && d.id !== id);
  drafts = drafts.filter((d) => d.id !== id && d.pos !== pos);
  if (previous && occupied) drafts.push({ ...occupied, pos: previous.pos });
  drafts.push({
    id,
    pos,
    ...(tile.letter === "?" ? { letter: letter || previous.letter } : {}),
  });
  selected = null;
  cursor = pos;
  changedDrafts();
}

function boardClick(pos) {
  cursor = pos;
  if (!myTurn()) {
    focusCursor();
    return;
  }
  if (room.board[pos]) {
    selected = null;
    focusCursor();
    renderRack();
    notice(t("fixedTile"));
    return;
  }
  if (selected) place(selected, pos);
  else {
    selected = drafts.find((d) => d.pos === pos)?.id || null;
    renderBoard();
    renderRack();
    updateControls();
  }
  if (!$("modal").open) focusCursor();
}

function moveCursor(step) {
  const next = cursor + step;
  if (
    next < 0 ||
    next >= 225 ||
    (Math.abs(step) === 1 && Math.floor(cursor / 15) !== Math.floor(next / 15))
  )
    return false;
  cursor = next;
  return true;
}

function focusCursor() {
  renderBoard();
  $("board")
    .querySelector(`[data-pos="${cursor}"]`)
    ?.focus({ preventScroll: true });
}

function boardKey(event) {
  cursor = Number(event.currentTarget.dataset.pos);
  const arrows = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -15, ArrowDown: 15 };
  if (event.key in arrows) {
    event.preventDefault();
    selected = null;
    moveCursor(arrows[event.key]);
    focusCursor();
    return;
  }
  if (event.key === "Enter") {
    event.preventDefault();
    direction = direction === 1 ? 15 : 1;
    focusCursor();
    return;
  }
  if (event.key === "Escape") {
    selected = null;
    renderRack();
    focusCursor();
    return;
  }
  if (!myTurn() || busy || event.ctrlKey || event.metaKey || event.altKey)
    return;
  if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    if (!drafts.some((d) => d.pos === cursor) && event.key === "Backspace")
      moveCursor(-direction);
    drafts = drafts.filter((d) => d.pos !== cursor);
    selected = null;
    changedDrafts();
    focusCursor();
    return;
  }
  const letter = event.key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
  if (!/^[A-Z]$/.test(letter)) return;
  event.preventDefault();
  while (room.board[cursor]) if (!moveCursor(direction)) return;
  const available = room.rack.filter(
    (tile) => !drafts.some((d) => d.id === tile.id),
  );
  const tile =
    available.find((tile) => tile.letter === letter) ||
    available.find((tile) => tile.letter === "?");
  if (tile) {
    place(tile.id, cursor, tile.letter === "?" ? letter : undefined);
    moveCursor(direction);
    focusCursor();
  }
}

function beginDrag(event, id) {
  if (event.button !== 0 || busy) return;
  drag = {
    id,
    x: event.clientX,
    y: event.clientY,
    active: false,
    source: event.currentTarget,
  };
}

function dropTarget(x, y) {
  const target = document
    .elementFromPoint(x, y)
    ?.closest("[data-pos],.rack-tile");
  if (target?.dataset.pos !== undefined)
    return { element: target, pos: Number(target.dataset.pos) };
  const rack = $("rack").getBoundingClientRect(),
    tiles = [...$("rack").children];
  if (
    !tiles.length ||
    y < rack.top - 24 ||
    y > rack.bottom + 24 ||
    x < rack.left - 30 ||
    x > rack.right + 30
  )
    return null;
  if (x < tiles[0].getBoundingClientRect().left - 3) return { edge: "left" };
  if (x > tiles.at(-1).getBoundingClientRect().right + 3)
    return { edge: "right" };
  return { element: target, id: target?.dataset.id };
}

function clearDrag() {
  document
    .querySelectorAll(".drag-target,.swap-target,.dragging")
    .forEach((el) =>
      el.classList.remove("drag-target", "swap-target", "dragging"),
    );
  delete $("rack").dataset.edge;
  $("drag-ghost").hidden = $("drag-hint").hidden = true;
}

document.addEventListener(
  "pointermove",
  (event) => {
    if (!drag) return;
    if (
      !drag.active &&
      Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8
    )
      return;
    drag.active = true;
    clearDrag();
    drag.source.classList.add("dragging");
    const target = dropTarget(event.clientX, event.clientY);
    const tile = room.rack.find((tile) => tile.id === drag.id);
    const assigned = drafts.find((d) => d.id === drag.id)?.letter;
    $("drag-ghost").replaceChildren(
      ...tileElement({ ...tile, letter: assigned || tile.letter }, "", false)
        .childNodes,
    );
    $("drag-ghost").hidden = false;
    $("drag-ghost").style.transform =
      `translate(${event.clientX - 20}px,${event.clientY - 23}px)`;
    if (target?.edge) $("rack").dataset.edge = target.edge;
    else
      target?.element?.classList.add(
        target.id && target.id !== drag.id ? "swap-target" : "drag-target",
      );
    const hint = target?.edge
      ? t(target.edge === "left" ? "moveLeft" : "moveRight")
      : target?.id && target.id !== drag.id
        ? t("swap")
        : "";
    $("drag-hint").textContent = hint;
    $("drag-hint").hidden = !hint;
    $("drag-hint").style.transform =
      `translate(${Math.min(event.clientX + 12, innerWidth - 125)}px,${Math.max(0, event.clientY - 38)}px)`;
  },
  { passive: true },
);

document.addEventListener("pointerup", (event) => {
  if (!drag) return;
  const moving = drag;
  drag = null;
  clearDrag();
  if (!moving.active) return;
  suppressClick = true;
  setTimeout(() => (suppressClick = false), 0);
  const target = dropTarget(event.clientX, event.clientY);
  if (target?.pos !== undefined) place(moving.id, target.pos);
  else if (target) {
    drafts = drafts.filter((d) => d.id !== moving.id);
    if (target.edge) {
      order = order.filter((id) => id !== moving.id);
      if (target.edge === "left") order.unshift(moving.id);
      else order.push(moving.id);
    } else if (target.id && target.id !== moving.id) {
      const from = order.indexOf(moving.id),
        to = order.indexOf(target.id);
      [order[from], order[to]] = [order[to], order[from]];
    }
    selected = moving.id;
    changedDrafts();
  }
});
document.addEventListener("pointercancel", () => {
  clearDrag();
  drag = null;
});

function reorder(offset) {
  const i = order.indexOf(selected),
    j = i + offset;
  if (i < 0 || j < 0 || j >= order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  renderRack();
}

function updateControls() {
  $("play").disabled = !myTurn() || !drafts.length || busy;
  $("exchange").disabled = !myTurn() || busy || room.bag_count < 7;
  $("pass").disabled = !myTurn() || busy;
  $("recall").disabled = !drafts.length || busy;
  $("return-tile").disabled = !drafts.some((d) => d.id === selected) || busy;
  $("reorder-left").disabled = order.indexOf(selected) <= 0 || busy;
  $("reorder-right").disabled =
    !selected || order.indexOf(selected) === order.length - 1 || busy;
  $("shuffle").disabled = !room.rack?.length || busy;
  $("sort").disabled = !room.rack?.length || busy;
}

function schedulePreview() {
  clearTimeout(previewTimer);
  const generation = ++previewGeneration;
  const el = $("move-preview");
  el.className = "move-preview";
  if (!myTurn() || !drafts.length || !room.settings.show_preview) {
    el.textContent = t(
      myTurn() ? "placeHint" : room.me ? "waiting" : "watching",
    );
    return;
  }
  el.textContent = t("checking");
  previewTimer = setTimeout(async () => {
    try {
      const result = await api(`api/room/${room.id}`, {
        action: "preview",
        rev: room.rev,
        request_id: requestId(),
        placements: drafts,
      });
      if (generation !== previewGeneration) return;
      el.textContent =
        t("valid", {
          words: result.words.map((w) => w.word).join(" + "),
          score: result.score,
        }) + (result.bonus ? t("bonus") : "");
      el.className = "move-preview valid";
    } catch (error) {
      if (generation === previewGeneration) {
        el.textContent = error.message;
        el.className = "move-preview invalid";
      }
    }
  }, 280);
}

function clock(seconds) {
  const n = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
}

function updateClocks() {
  if (!room || room.status === "lobby") return;
  const person = room.players.find((p) => p.id === room.turn);
  $("turn-label").textContent =
    room.status === "finished"
      ? t("gameOver")
      : myTurn()
        ? t("yourTurn")
        : t("turnOf", { name: person?.name || "" });
  const elapsed = Math.max(0, (Date.now() - room.receivedAt) / 1000);
  const clocks = [];
  if (person && room.settings.minutes)
    clocks.push(Math.max(0, person.seconds - elapsed));
  if (person && room.settings.turn_seconds)
    clocks.push(
      Math.max(
        0,
        room.settings.turn_seconds -
          (room.server_time - room.turn_started) -
          elapsed,
      ),
    );
  $("turn-clock").textContent = clocks.length
    ? clocks.map(clock).join(" · ")
    : "";
  $("turn-clock").classList.toggle(
    "low",
    clocks.some((n) => n < 30),
  );
  $("score-players")
    .querySelectorAll(".player")
    .forEach((el, i) => {
      const player = room.players[i],
        info = el.querySelector(".fine");
      const labels = [
        player.id === room.me ? t("you") : "",
        player.id === room.host ? t("host") : "",
        player.resigned ? t("resigned") : "",
      ];
      if (
        room.settings.minutes &&
        !player.resigned &&
        room.status === "playing"
      )
        labels.push(
          clock(player.seconds - (player.id === room.turn ? elapsed : 0)),
        );
      info.textContent = labels.filter(Boolean).join(" · ");
    });
}

async function definition(word, element, language) {
  const key = `${language}:${word}`;
  element.textContent = t("definitionLoading");
  if (!definitionCache.has(key))
    definitionCache.set(
      key,
      api(
        `api/definition?language=${language}&word=${encodeURIComponent(word)}`,
      ).catch(() => ({
        text: null,
        url: `https://${language}.wiktionary.org/wiki/${word.toLowerCase()}`,
      })),
    );
  const value = await definitionCache.get(key);
  if (!element.isConnected) return;
  element.replaceChildren(node("span", "", value.text || t("noDefinition")));
  const link = node("a", "", t("source"));
  link.href = value.url;
  link.target = "_blank";
  link.rel = "noopener";
  element.append(link);
}

function renderHistory() {
  const fingerprint = `${room.id}:${room.settings.language}:${locale}:${JSON.stringify(room.history)}`;
  if (fingerprint === renderedHistory) return;
  renderedHistory = fingerprint;
  const items = room.history
    .slice()
    .reverse()
    .map((entry) => {
      const el = node("div", "history-item");
      el.append(node("p", "fine", entry.name));
      if (entry.kind === "play") {
        for (const word of entry.words) {
          const heading = node("p");
          heading.append(
            node("strong", "word", word.word),
            node("span", "fine", ` · ${word.score} ${t("score")}`),
          );
          el.append(heading);
          const info = node("div", "definition");
          info.dataset.word = word.word;
          el.append(info);
        }
        if (entry.bonus) el.append(node("p", "fine", t("bonus")));
      } else
        el.append(
          node(
            "p",
            "",
            t(
              {
                pass: "passed",
                exchange: "exchanged",
                resign: "resigned",
                expired: "expired",
                timeout: "timeout",
              }[entry.kind],
              { count: entry.count },
            ),
          ),
        );
      return el;
    });
  $("history").replaceChildren(
    ...(items.length ? items : [node("p", "fine", t("noMoves"))]),
  );
  // Load the recent moves first; older entries load when the user scrolls to them.
  historyObserver?.disconnect();
  historyObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          definition(
            entry.target.dataset.word,
            entry.target,
            room.settings.language,
          );
          historyObserver.unobserve(entry.target);
        }
      }),
    { root: $("history"), rootMargin: "100px" },
  );
  $("history")
    .querySelectorAll("[data-word]")
    .forEach((el) => historyObserver.observe(el));
}

function dialog(title, contents, actions = []) {
  const container = $("modal-content");
  container.replaceChildren(node("h2", "", title), ...contents);
  if (actions.length) {
    const row = node("div", "dialog-actions");
    for (const action of actions) {
      const button = node(
        "button",
        action.primary ? "primary" : "secondary",
        action.text,
      );
      button.addEventListener("click", action.run);
      row.append(button);
    }
    container.append(row);
  }
  if (!$("modal").open) $("modal").showModal();
}

function confirmAction(title, hint, action) {
  dialog(
    t(title),
    [node("p", "", t(hint))],
    [
      {
        text: t("confirm"),
        primary: true,
        run: () => {
          $("modal").close();
          action();
        },
      },
      { text: t("cancel"), run: () => $("modal").close() },
    ],
  );
}

async function act(action, extra = {}) {
  if (busy) return;
  busy = true;
  if (room.status !== "lobby") updateControls();
  $("start").disabled = true;
  const payload = { action, rev: room.rev, request_id: requestId(), ...extra };
  try {
    const value = await api(`api/room/${room.id}`, payload);
    value.receivedAt = Date.now();
    if (action === "leave") {
      localStorage.removeItem("scrabble-room");
      location.href = "/scrabble/";
      return;
    }
    if (action === "play" || action === "exchange" || action === "pass") {
      drafts = [];
      persistDrafts();
    }
    acceptRoom(value);
    if (action === "settings") notice(t("saved"));
    return true;
  } catch (error) {
    notice(error.message, true);
    await poll();
    return false;
  } finally {
    busy = false;
    if (room) {
      if (room.status !== "lobby") updateControls();
      else $("start").disabled = room.players.length < 2;
    }
  }
}

async function poll() {
  if (!room || polling) return;
  polling = true;
  try {
    const value = await api(
      `api/room/${room.id}?focused=${focusState() ? 1 : 0}`,
    );
    value.receivedAt = Date.now();
    if (networkDown) notice(t("reconnected"));
    networkDown = false;
    $("connection").hidden = true;
    acceptRoom(value);
  } catch {
    networkDown = true;
    $("connection").textContent = t("connectionLost");
    $("connection").hidden = false;
  } finally {
    polling = false;
  }
}

async function join(create = false) {
  if (!sessionReady || !$("join-form").reportValidity() || busy) return;
  busy = true;
  $("join-button").disabled = true;
  $("create-room").disabled = true;
  try {
    const code = create
      ? null
      : new URL(location.href).searchParams.get("room");
    const value = await api("api/join", {
      name: $("name").value.trim(),
      avatar,
      create,
      ...(code ? { room: code } : {}),
    });
    value.receivedAt = Date.now();
    acceptRoom(value);
    await poll();
  } catch (error) {
    notice(error.message, true);
  } finally {
    busy = false;
    $("join-button").disabled = false;
    $("create-room").disabled = false;
    if (room?.status === "lobby") $("start").disabled = room.players.length < 2;
  }
}

$("join-form").addEventListener("submit", (event) => {
  event.preventDefault();
  join();
});
$("create-room").addEventListener("click", () => join(true));
$("name").addEventListener("input", showPhoto);
$("photo").addEventListener("change", () =>
  readPhoto($("photo").files[0]).catch((error) => notice(error.message, true)),
);
$("remove-photo").addEventListener("click", () => {
  avatar = "";
  $("photo").value = "";
  showPhoto();
});
document.querySelectorAll("[data-locale]").forEach((button) =>
  button.addEventListener("click", () => {
    locale = button.dataset.locale;
    localStorage.setItem("scrabble-locale", locale);
    translate();
  }),
);
$("settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  act("settings", {
    settings: {
      language: $("game-language").value,
      minutes: Number($("minutes").value),
      turn_seconds: Number($("turn-seconds").value),
      random_first: $("random-first").checked,
      show_preview: $("show-preview").checked,
    },
  });
});
$("start").addEventListener("click", async () => {
  // Save the displayed settings so Start never silently uses an older choice.
  const saved = await act("settings", {
    settings: {
      language: $("game-language").value,
      minutes: Number($("minutes").value),
      turn_seconds: Number($("turn-seconds").value),
      random_first: $("random-first").checked,
      show_preview: $("show-preview").checked,
    },
  });
  if (saved && room.status === "lobby") await act("start");
});
$("invite").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(roomUrl());
    notice(t("copied"));
  } catch {
    const input = node("input", "invite-input");
    input.value = roomUrl();
    input.readOnly = true;
    dialog(t("invite"), [node("p", "", t("inviteHint")), input]);
    input.select();
  }
});
$("leave").addEventListener("click", () =>
  confirmAction("leaveTitle", "leaveHint", () => act("leave")),
);
$("join-other").addEventListener("click", () => {
  localStorage.removeItem("scrabble-room");
  location.href = "/scrabble/";
});
$("skip-absent").addEventListener("click", () => act("skip_absent"));
$("edit-profile").addEventListener("click", () => {
  const person = room.players.find((p) => p.id === room.me);
  avatar = person.avatar;
  const label = node("label", "", t("name")),
    input = node("input");
  input.value = person.name;
  input.maxLength = 24;
  input.required = true;
  label.append(input);
  const photoLabel = node("label", "", t("choosePhoto")),
    photo = node("input");
  photo.type = "file";
  photo.accept = "image/png,image/jpeg,image/webp";
  photoLabel.append(photo);
  const preview = avatarNode(person, true);
  photo.addEventListener("change", async () => {
    try {
      await readPhoto(photo.files[0]);
      preview.replaceChildren(
        ...avatarNode({ name: input.value, avatar }).childNodes,
      );
    } catch (error) {
      notice(error.message, true);
    }
  });
  const remove = node("button", "quiet", t("removePhoto"));
  remove.addEventListener("click", () => {
    avatar = "";
    preview.replaceChildren(input.value[0]?.toUpperCase() || "?");
  });
  dialog(
    t("editProfile"),
    [label, preview, photoLabel, remove],
    [
      {
        text: t("confirm"),
        primary: true,
        run: async () => {
          if (!input.reportValidity()) return;
          if (await act("profile", { name: input.value, avatar })) {
            $("modal").close();
            notice(t("profileSaved"));
          }
        },
      },
      { text: t("cancel"), run: () => $("modal").close() },
    ],
  );
});
$("resign").addEventListener("click", () =>
  confirmAction("resignTitle", "resignHint", () => act("resign")),
);
$("pass").addEventListener("click", () =>
  confirmAction("passTitle", "passHint", () => act("pass")),
);
$("rematch").addEventListener("click", () => act("rematch"));
$("play").addEventListener("click", () =>
  act("play", { placements: drafts.slice() }),
);
$("recall").addEventListener("click", () => {
  drafts = [];
  selected = null;
  changedDrafts();
});
$("return-tile").addEventListener("click", () => {
  drafts = drafts.filter((d) => d.id !== selected);
  selected = null;
  changedDrafts();
});
$("reorder-left").addEventListener("click", () => reorder(-1));
$("reorder-right").addEventListener("click", () => reorder(1));
$("shuffle").addEventListener("click", () => {
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  renderRack();
});
$("sort").addEventListener("click", () => {
  const letters = new Map(room.rack.map((tile) => [tile.id, tile.letter]));
  order.sort((a, b) => letters.get(a).localeCompare(letters.get(b)));
  renderRack();
});
$("direction").addEventListener("click", () => {
  direction = direction === 1 ? 15 : 1;
  renderBoard();
});
$("zoom").addEventListener("click", () => {
  const zoomed = $("board-scroll").classList.toggle("zoomed");
  $("zoom").setAttribute("aria-pressed", String(zoomed));
  $("board-scroll")
    .querySelector(`[data-pos="${cursor}"]`)
    ?.scrollIntoView({ block: "nearest", inline: "center" });
});
$("board-home").addEventListener("click", () =>
  $("board")
    .querySelector('[data-pos="112"]')
    ?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    }),
);
$("exchange").addEventListener("click", () => {
  const choices = node("div", "exchange-tiles");
  for (const tile of room.rack) {
    const label = node("label", "exchange-choice");
    const box = node("input");
    box.type = "checkbox";
    box.value = tile.id;
    label.append(
      box,
      node("span", "", tile.letter === "?" ? t("blank") : tile.letter),
    );
    choices.append(label);
  }
  dialog(
    t("exchangeTitle"),
    [node("p", "", t("exchangeHint")), choices],
    [
      {
        text: t("exchange"),
        primary: true,
        run: () => {
          const ids = [...choices.querySelectorAll("input:checked")].map(
            (el) => el.value,
          );
          if (!ids.length) return;
          $("modal").close();
          act("exchange", { ids });
        },
      },
      { text: t("cancel"), run: () => $("modal").close() },
    ],
  );
});
$("help").addEventListener("click", () => {
  const list = node("ol");
  messages[locale].helpItems.forEach((text) =>
    list.append(node("li", "", text)),
  );
  dialog(t("helpTitle"), [list]);
});
$("modal-close").addEventListener("click", () => $("modal").close());
document.addEventListener("visibilitychange", poll);
window.addEventListener("focus", poll);
window.addEventListener("blur", poll);
window.addEventListener("online", poll);
window.addEventListener("pagehide", () => {
  if (room)
    fetch(`/scrabble/api/room/${room.id}?focused=0`, { keepalive: true }).catch(
      () => {},
    );
});
setInterval(poll, 3000);
setInterval(updateClocks, 500);

async function boot() {
  translate();
  try {
    const session = await api("api/session");
    sessionReady = true;
    if (!$("name").value.trim()) $("name").value = session.profile.name;
    if (!$("photo").files.length) avatar = session.profile.avatar;
    showPhoto();
    const code =
      new URL(location.href).searchParams.get("room") ||
      localStorage.getItem("scrabble-room");
    if (code) {
      const value = await api(
        `api/room/${code}?focused=${focusState() ? 1 : 0}`,
      );
      value.receivedAt = Date.now();
      if (value.me) acceptRoom(value);
      else if (value.status !== "lobby") {
        acceptRoom(value);
        $("leave").hidden = true;
      }
    }
  } catch (error) {
    notice(error.message, true);
  } finally {
    $("join-button").disabled = $("create-room").disabled = !sessionReady;
  }
}
boot();
