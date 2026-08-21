const launcher = document.querySelector("#ai-launcher");
const panel = document.querySelector("#ai-panel");
const closeButton = document.querySelector("#ai-close");
const messagesElement = document.querySelector("#ai-messages");
const startersElement = document.querySelector("#ai-starters");
const offlineElement = document.querySelector("#ai-offline");
const form = document.querySelector("#ai-form");
const input = document.querySelector("#ai-question");
const submitButton = form.querySelector("button");

const messages = [];
let available = false;
let loading = false;

function setAssistantOpen(open) {
  panel.hidden = !open;
  launcher.setAttribute("aria-expanded", String(open));
  if (open) closeButton.focus();
}

function addMessage(role, content) {
  const message = document.createElement("p");
  message.className = `ai-message ${role}`;
  message.textContent = content;
  messagesElement.insertBefore(message, startersElement);
  messagesElement.scrollTop = messagesElement.scrollHeight;
  return message;
}

function setLoading(value) {
  loading = value;
  input.disabled = value;
  submitButton.disabled = value;
  submitButton.textContent = value ? "…" : "↑";
}

async function checkAvailability() {
  try {
    const response = await fetch("/api/chat", { headers: { Accept: "application/json" } });
    const data = await response.json();
    available = response.ok && data.available === true;
  } catch {
    available = false;
  }

  offlineElement.hidden = available;
  form.hidden = !available;
  startersElement.hidden = !available;
}

async function sendMessage(text) {
  const question = text.trim();
  if (!available || !question || loading) return;

  startersElement.hidden = true;
  addMessage("user", question);
  messages.push({ role: "user", content: question });
  input.value = "";
  setLoading(true);
  const answerElement = addMessage("assistant", "Thinking…");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messages.slice(-8) }),
    });

    if (!response.ok || !response.body) throw new Error("request_failed");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let answer = "";

    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        for (const line of event.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const data = JSON.parse(payload);
            const delta = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content || "";
            if (delta) {
              answer += delta;
              answerElement.textContent = answer;
              messagesElement.scrollTop = messagesElement.scrollHeight;
            }
          } catch {
            // Ignore non-JSON heartbeat events.
          }
        }
      }
      if (done) break;
    }

    if (!answer) throw new Error("empty_response");
    messages.push({ role: "assistant", content: answer });
  } catch {
    answerElement.textContent = "Bei AI could not answer just now. Please try again in a moment or email Bei at beijennyju@gmail.com.";
  } finally {
    setLoading(false);
    input.focus();
  }
}

launcher.addEventListener("click", () => setAssistantOpen(panel.hidden));
closeButton.addEventListener("click", () => {
  setAssistantOpen(false);
  launcher.focus();
});
form.addEventListener("submit", (event) => {
  event.preventDefault();
  void sendMessage(input.value);
});
startersElement.addEventListener("click", (event) => {
  if (event.target instanceof HTMLButtonElement) void sendMessage(event.target.textContent || "");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !panel.hidden) {
    setAssistantOpen(false);
    launcher.focus();
  }
});

setAssistantOpen(false);
void checkAvailability();
