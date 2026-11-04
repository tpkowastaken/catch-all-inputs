const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => `Key${letter}`);
const digits = "0123456789".split("").map((digit) => `Digit${digit}`);
const numpadDigits = "0123456789".split("").map((digit) => `Numpad${digit}`);
const functionKeys = Array.from({ length: 24 }, (_, index) => `F${index + 1}`);

// Every physical key the Keyboard Lock API can hold. Escape is included so a quick press is caught
// and the browser only leaves fullscreen when Esc is held down.
export const LOCKABLE_KEY_CODES = [
  ...letters,
  ...digits,
  ...numpadDigits,
  ...functionKeys,
  "Backquote", "Minus", "Equal", "BracketLeft", "BracketRight", "Backslash", "Semicolon", "Quote", "Comma", "Period", "Slash", "IntlBackslash", "IntlRo", "IntlYen",
  "Escape", "Backspace", "Tab", "CapsLock", "Enter", "Space", "ContextMenu",
  "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight", "Fn",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", "Insert", "Delete",
  "NumLock", "NumpadAdd", "NumpadSubtract", "NumpadMultiply", "NumpadDivide", "NumpadDecimal", "NumpadEnter", "NumpadEqual", "NumpadComma",
  "PrintScreen", "ScrollLock", "Pause",
  "AudioVolumeUp", "AudioVolumeDown", "AudioVolumeMute", "MediaPlayPause", "MediaStop", "MediaTrackNext", "MediaTrackPrevious",
  "BrowserBack", "BrowserForward", "BrowserRefresh", "BrowserSearch", "BrowserHome", "BrowserFavorites", "LaunchMail", "LaunchApp1", "LaunchApp2",
];

const isMac = /mac|iphone|ipad/i.test(navigator.platform);

const MODIFIER_CODES: Record<string, string> = {
  ShiftLeft: "Shift", ShiftRight: "Shift",
  ControlLeft: "Ctrl", ControlRight: "Ctrl",
  AltLeft: isMac ? "Option" : "Alt", AltRight: isMac ? "Option" : "Alt",
  MetaLeft: isMac ? "⌘" : "Win", MetaRight: isMac ? "⌘" : "Win",
};

const NAMED_KEYS: Record<string, string> = {
  " ": "Space",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

export function describeKey(event: KeyboardEvent) {
  const modifierOnly = MODIFIER_CODES[event.code];
  if (modifierOnly) return modifierOnly;

  const parts: string[] = [];
  if (event.ctrlKey) parts.push("Ctrl");
  if (event.altKey) parts.push(isMac ? "Option" : "Alt");
  if (event.shiftKey) parts.push("Shift");
  if (event.metaKey) parts.push(isMac ? "⌘" : "Win");

  // Physical letters and digits stay readable when Option or Shift turn the key into a symbol.
  const physical = /^Key([A-Z])$/.exec(event.code)?.[1] ?? /^Digit(\d)$/.exec(event.code)?.[1];
  const key = NAMED_KEYS[event.key] ?? (parts.length && physical ? physical : event.key.length === 1 ? event.key.toUpperCase() : event.key);
  parts.push(key === "Dead" || key === "Unidentified" ? event.code : key);
  return parts.join(" ");
}
