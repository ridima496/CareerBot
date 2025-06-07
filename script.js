document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const darkToggle = document.getElementById("dark-toggle");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  function appendMessage(sender, message) {
    const container = document.createElement("div");
    container.className = "message-container";

    const bubble = document.createElement("div");
    bubble.className = `message ${sender === "You" ? "user" : "bot"}`;
    bubble.textContent = message;

    if (sender !== "You") {
      const avatar = document.createElement("img");
      avatar.src = "logo512.png";
      avatar.className = "avatar";
      container.appendChild(avatar);
    }

    container.appendChild(bubble);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  async function sendMessage(userMessage) {
    appendMessage("You", userMessage);
    input.value = "";

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      appendMessage("CareerBot", data.response);
    } catch (error) {
      appendMessage("CareerBot", "⚠️ Sorry, I couldn't reach the server.");
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (userMessage) sendMessage(userMessage);
  });

  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }
});
