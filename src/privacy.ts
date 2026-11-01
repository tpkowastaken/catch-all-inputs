import "@fontsource-variable/anybody/standard.css";
import "./style.css";

type ConsentApi = { callbackQueue: (() => void)[]; showRevocationMessage(): void };

// Google only sets this up where it has a consent message to show, so the button stays hidden everywhere else.
window.addEventListener("load", () => {
  const consent = (window as Window & { googlefc?: ConsentApi }).googlefc;
  if (!consent) return;
  const button = document.getElementById("change-consent") as HTMLButtonElement;
  button.hidden = false;
  button.addEventListener("click", () => consent.callbackQueue.push(() => consent.showRevocationMessage()));
});
