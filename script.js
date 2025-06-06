document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const toolbarButtons = document.querySelectorAll(".toolbar button");
  const darkToggle = document.getElementById("dark-toggle");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  function appendMessage(sender, message) {
    const msgDiv = document.createElement("div");
    msgDiv.classList.add("message", sender === "You" ? "user" : "bot");

    const container = document.createElement("div");
    container.classList.add("message-container");

    if (sender !== "You") {
      const avatar = document.createElement("img");
      avatar.src = "https://raw.githubusercontent.com/ridima496/CareerBot/main/logo512.png";
      avatar.classList.add("avatar");
      container.appendChild(avatar);
    }

    msgDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
    container.appendChild(msgDiv);
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

      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();
      appendMessage("CareerBot", data.response);
    } catch (error) {
      appendMessage("CareerBot", "⚠️ Sorry, I couldn't reach the server.");
    }
  }

  // Send on form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const userMessage = input.value.trim();
    if (userMessage) sendMessage(userMessage);
  });

  // Toolbar actions
  toolbarButtons.forEach(button => {
    button.addEventListener("click", () => {
      const message = button.textContent;
      sendMessage(message);
    });
  });

  // Dark mode toggle
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }
});
