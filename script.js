const launcher = document.querySelector("#ai-launcher");
const panel = document.querySelector("#ai-panel");
const closeButton = document.querySelector("#ai-close");

function setAssistantOpen(open) {
  panel.hidden = !open;
  launcher.setAttribute("aria-expanded", String(open));
  if (open) closeButton.focus();
}

launcher.addEventListener("click", () => {
  setAssistantOpen(panel.hidden);
});

closeButton.addEventListener("click", () => {
  setAssistantOpen(false);
  launcher.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !panel.hidden) {
    setAssistantOpen(false);
    launcher.focus();
  }
});
