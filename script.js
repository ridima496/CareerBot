document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const darkToggle = document.getElementById("dark-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  function appendMessage(sender, message, isTyping = false) {
    const container = document.createElement("div");
    container.className = "message-container";

    const bubble = document.createElement("div");
    bubble.className = `message ${sender === "You" ? "user" : "bot"}`;
    bubble.textContent = isTyping ? "CareerBot is typing..." : message;

    if (sender === "CareerBot" && !isTyping) {
      const avatar = document.createElement("img");
      avatar.src = "logo512.png";
      avatar.className = "avatar";
      container.appendChild(avatar);
    }

    bubble.classList.toggle("typing-indicator", isTyping);
    container.appendChild(bubble);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;

    return bubble;
  }

  async function sendMessage(userMessage) {
    appendMessage("You", userMessage);
    input.value = "";

    const typingBubble = appendMessage("CareerBot", "", true);

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      setTimeout(() => {
        typingBubble.remove();
        appendMessage("CareerBot", data.response);
      }, 1200);
    } catch (error) {
      typingBubble.remove();
      appendMessage("CareerBot", "⚠️ Sorry, I couldn't reach the server.");
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (userMessage) sendMessage(userMessage);
  });

  darkToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  menuToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("hidden");
  });
});
