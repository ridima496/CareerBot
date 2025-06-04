const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const typing = document.getElementById("typing");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage) return;

  appendMessage("user", userMessage);
  input.value = "";
  typing.style.display = "block";

  try {
    const response = await fetch("https://careerbot-backend-i1qt.onrender.com/get_response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await response.json();
    typing.style.display = "none";
    appendMessage("bot", data.response);
  } catch (error) {
    typing.style.display = "none";
    appendMessage("bot", "Sorry, I couldn't reach the server.");
  }
});

function appendMessage(sender, message) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", sender);
  msgDiv.textContent = message;

  const container = document.createElement("div");
  container.classList.add("message-container");
  container.appendChild(msgDiv);
  chatBox.appendChild(container);
  chatBox.scrollTop = chatBox.scrollHeight;
}