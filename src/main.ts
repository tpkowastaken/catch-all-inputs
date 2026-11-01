import "@fontsource-variable/anybody/standard.css";
import "./style.css";
import { LOCKABLE_KEY_CODES, describeKey } from "./keys";

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const intro = byId("intro");
const summary = byId("summary");
const notice = byId("notice");
const startButton = byId<HTMLButtonElement>("start");
const trap = byId("trap");
const last = byId("last");
const measure = byId("measure");
const trail = byId<HTMLOListElement>("trail");
const count = byId("count");
const cursor = byId("cursor");

const TRAIL_LENGTH = 40;
const MOUSE_BUTTONS = ["Left click", "Middle click", "Right click", "Back button", "Forward button"];

let capturing = false;
let caught = 0;
let cursorX = innerWidth / 2;
let cursorY = innerHeight / 2;
const heldGamepadButtons = new Set<string>();

const keyboardApi = () =>
  (navigator as Navigator & { keyboard?: { lock(codes?: string[]): Promise<void>; unlock(): void } }).keyboard;

function fitLast(label: string) {
  measure.textContent = label;
  const available = trap.clientWidth * 0.92;
  const fitted = (available / measure.offsetWidth) * 100;
  last.style.fontSize = `${Math.min(fitted, trap.clientHeight * 0.6)}px`;
}

function record(label: string, held = false) {
  if (!capturing) return;
  caught += 1;
  count.textContent = `${caught.toLocaleString()} caught`;
  last.textContent = label;
  last.classList.toggle("held", held);
  fitLast(label);

  const entry = document.createElement("li");
  entry.textContent = label;
  trail.prepend(entry);
  trail.children[TRAIL_LENGTH]?.remove();
}

function moveCursor(event: PointerEvent) {
  if (document.pointerLockElement) {
    cursorX = Math.min(Math.max(cursorX + event.movementX, 0), innerWidth);
    cursorY = Math.min(Math.max(cursorY + event.movementY, 0), innerHeight);
  } else {
    cursorX = event.clientX;
    cursorY = event.clientY;
  }
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
}

// Registered once on window in the capture phase, so nothing reaches the page or the browser's defaults.
function block(type: string, onEvent?: (event: any) => void) {
  window.addEventListener(
    type,
    (event) => {
      if (!capturing) return;
      event.preventDefault();
      event.stopPropagation();
      onEvent?.(event);
    },
    { capture: true, passive: false },
  );
}

window.addEventListener(
  "keydown",
  (event) => {
    if (!capturing) return;
    if (event.code === "Escape") {
      // Browsers without a keyboard lock list hand Esc to the page, so leave from here as well.
      stop();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) record(describeKey(event), true);
  },
  { capture: true },
);

block("keyup", () => last.classList.remove("held"));
block("keypress");
block("beforeinput");

block("pointerdown", (event: PointerEvent) => {
  if (!document.pointerLockElement && event.pointerType === "mouse") lockPointer();
  const label = event.pointerType === "mouse" ? (MOUSE_BUTTONS[event.button] ?? `Button ${event.button}`) : event.pointerType === "pen" ? "Pen" : "Touch";
  record(label, true);
});
block("pointerup", () => last.classList.remove("held"));
block("pointermove", moveCursor);
for (const type of ["mousedown", "mouseup", "click", "dblclick", "auxclick", "contextmenu", "selectstart", "dragstart", "dragenter", "dragover"]) {
  block(type);
}
for (const type of ["touchstart", "touchmove", "touchend", "touchcancel", "gesturestart", "gesturechange", "gestureend"]) {
  block(type);
}

let lastWheel = 0;
block("wheel", (event: WheelEvent) => {
  const now = performance.now();
  if (now - lastWheel < 120) return;
  lastWheel = now;
  const vertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
  const direction = vertical ? (event.deltaY < 0 ? "up" : "down") : event.deltaX < 0 ? "left" : "right";
  record(event.ctrlKey ? "Pinch" : `Scroll ${direction}`);
});

block("copy", () => record("Copy"));
block("cut", () => record("Cut"));
block("paste", () => record("Paste"));
block("drop", () => record("Drop"));

window.addEventListener("beforeunload", (event) => {
  if (capturing) event.preventDefault();
});

window.addEventListener("popstate", () => {
  if (!capturing) return;
  history.pushState(null, "");
  record("History back");
});

function pollGamepads() {
  if (!capturing) return;
  for (const pad of navigator.getGamepads()) {
    if (!pad) continue;
    pad.buttons.forEach((button, index) => {
      const id = `${pad.index}:${index}`;
      if (button.pressed && !heldGamepadButtons.has(id)) {
        heldGamepadButtons.add(id);
        record(`Gamepad ${index}`, true);
      } else if (!button.pressed && heldGamepadButtons.delete(id)) {
        last.classList.remove("held");
      }
    });
  }
  requestAnimationFrame(pollGamepads);
}

function lockPointer() {
  // Chrome refuses a re-lock shortly after Esc; the next mouse press tries again.
  Promise.resolve(document.documentElement.requestPointerLock?.()).catch(() => {});
}

async function lockKeyboard() {
  const keyboard = keyboardApi();
  if (!keyboard) return false;
  try {
    // Listing every key except Esc keeps the browser's instant Esc-to-exit working.
    await keyboard.lock(LOCKABLE_KEY_CODES);
  } catch {
    try {
      await keyboard.lock();
    } catch {
      return false;
    }
  }
  return true;
}

async function start() {
  try {
    await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch (error) {
    notice.hidden = false;
    notice.textContent = `The browser refused fullscreen, so nothing is being caught. ${(error as Error).message}`;
    return;
  }

  capturing = true;
  caught = 0;
  count.textContent = "0 caught";
  trail.replaceChildren();
  last.textContent = "Try anything";
  last.classList.remove("held");
  intro.hidden = true;
  trap.hidden = false;
  fitLast(last.textContent);
  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px)`;

  history.pushState(null, "");
  lockPointer();
  pollGamepads();

  const keyboardLocked = await lockKeyboard();
  notice.hidden = keyboardLocked;
  notice.textContent = keyboardLocked
    ? ""
    : "This browser can't lock system shortcuts such as ⌘W or Ctrl+T, so those still reach it. Use Chrome or Edge to catch them.";
}

function stop() {
  if (!capturing) return;
  capturing = false;
  heldGamepadButtons.clear();
  keyboardApi()?.unlock();
  if (document.pointerLockElement) document.exitPointerLock();
  if (document.fullscreenElement) void document.exitFullscreen();
  trap.hidden = true;
  intro.hidden = false;
  summary.textContent = `Caught ${caught.toLocaleString()} ${caught === 1 ? "input" : "inputs"}. Test again whenever you like.`;
  startButton.textContent = "Test again";
  startButton.focus();
}

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement) stop();
});

// Esc can release the pointer before it reaches fullscreen; treat that as leaving too.
let pointerWasLocked = false;
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement) pointerWasLocked = true;
  else if (pointerWasLocked) {
    pointerWasLocked = false;
    stop();
  }
});

window.addEventListener("resize", () => {
  if (capturing) fitLast(last.textContent ?? "");
});
void document.fonts.ready.then(() => {
  if (capturing) fitLast(last.textContent ?? "");
});

startButton.addEventListener("click", () => void start());
if (!keyboardApi()) {
  notice.hidden = false;
  notice.textContent =
    "This browser can't lock system shortcuts such as ⌘W or Ctrl+T, so those still reach it. Use Chrome or Edge to catch them.";
}
