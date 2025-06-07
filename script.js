document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const darkToggle = document.getElementById("dark-toggle");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  function appendMessage(sender, message) {
    const container = document.createElement("div");
    container.className = `flex ${sender === "You" ? "justify-end" : "justify-start"} mb-4`;

    const bubble = document.createElement("div");
    bubble.className = `max-w-[80%] px-4 py-2 rounded-lg text-sm whitespace-pre-wrap ${
      sender === "You"
        ? "bg-blue-500 text-white"
        : "bg-green-100 dark:bg-green-800 dark:text-white"
    }`;
    bubble.textContent = message;

    if (sender !== "You") {
      const avatar = document.createElement("img");
      avatar.src = "logo512.png";
      avatar.className = "w-8 h-8 mr-2";
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

      if (!response.ok) {
        throw new Error("Server error");
      }

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
      document.documentElement.classList.toggle("dark");
    });
  }
});