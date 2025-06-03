async function sendMessage() {
    const userInput = document.getElementById("user-input").value;
    if (!userInput.trim()) return;

    appendMessage("You", userInput);
    document.getElementById("user-input").value = "";

    appendMessage("CareerBot", "Typing...");

    try {
        const response = await fetch("http://127.0.0.1:8000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: userInput })
        });

        const data = await response.json();

        // Remove "Typing..." message
        removeLastMessage();

        appendMessage("CareerBot", data.response);
    } catch (error) {
        removeLastMessage();
        appendMessage("CareerBot", "Sorry, there was an error connecting to the bot.");
    }
}

function appendMessage(sender, text) {
    const chatBox = document.getElementById("chat-box");
    const message = document.createElement("div");
    message.className = "message";
    message.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(message);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLastMessage() {
    const chatBox = document.getElementById("chat-box");
    if (chatBox.lastChild) {
        chatBox.removeChild(chatBox.lastChild);
    }
}
