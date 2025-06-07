document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const darkToggle = document.getElementById("dark-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.getElementById("sidebar");
  const newChatBtn = document.getElementById("new-chat");
  const chatList = document.getElementById("chat-list");
  const chatTitle = document.getElementById("chat-title");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  let chats = JSON.parse(localStorage.getItem("careerbot_chats") || "[]");
  let currentChat = null;

  // Utils
  function saveChats() {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    chats = chats.filter(c => c.timestamp > cutoff);
    localStorage.setItem("careerbot_chats", JSON.stringify(chats));
    renderChatList();
  }

  function createChat(title) {
    const id = Date.now().toString();
    return { id, title, messages: [], timestamp: Date.now() };
  }

  function summarize(text) {
    return text.split(" ").slice(0, 5).join(" ") + (text.split(" ").length > 5 ? "..." : "");
  }

  function renderChatList() {
    chatList.innerHTML = "";
    chats
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach(chat => {
        const div = document.createElement("div");
        div.className = "chat-item";
        div.dataset.id = chat.id;

        const title = document.createElement("div");
        title.className = "chat-title-text";
        title.textContent = chat.title;

        const actions = document.createElement("div");
        actions.className = "chat-actions";

        const renameBtn = document.createElement("button");
        renameBtn.textContent = "📝";
        renameBtn.title = "Rename";
        renameBtn.onclick = (e) => {
          e.stopPropagation();
          const newTitle = prompt("Rename chat:", chat.title);
          if (newTitle) {
            chat.title = newTitle;
            saveChats();
          }
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "🗑️";
        deleteBtn.title = "Delete";
        deleteBtn.onclick = (e) => {
          e.stopPropagation();
          if (confirm("Delete this chat?")) {
            chats = chats.filter(c => c.id !== chat.id);
            saveChats();
            if (currentChat?.id === chat.id) startNewChat();
          }
        };

        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);

        div.appendChild(title);
        div.appendChild(actions);

        div.onclick = () => {
          currentChat = chat;
          chatBox.innerHTML = "";
          chat.messages.forEach(m => appendMessage(m.sender, m.text));
          chatTitle.textContent = chat.title;
        };

        chatList.appendChild(div);
      });
  }

  function appendMessage(sender, message, isTyping = false) {
    const container = document.createElement("div");
    container.className = "message-container";

    const bubble = document.createElement("div");
    bubble.className = `message ${sender === "You" ? "user" : "bot"}`;
    bubble.textContent = isTyping ? "CareerBot is typing..." : message;

    container.appendChild(bubble);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
    return bubble;
  }

  async function sendMessage(userMessage) {
    if (!currentChat) {
      currentChat = createChat("Untitled Chat");
      chats.unshift(currentChat);
    }

    appendMessage("You", userMessage);
    currentChat.messages.push({ sender: "You", text: userMessage });

    if (currentChat.title === "Untitled Chat") {
      currentChat.title = summarize(userMessage);
      chatTitle.textContent = currentChat.title;
    }

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
        currentChat.messages.push({ sender: "CareerBot", text: data.response });
        currentChat.timestamp = Date.now();
        saveChats();
      }, 1200);
    } catch (error) {
      typingBubble.remove();
      appendMessage("CareerBot", "⚠️ Couldn’t reach the server.");
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (msg) {
      sendMessage(msg);
      input.value = "";
    }
  });

  darkToggle?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });

  menuToggle?.addEventListener("click", () => {
    sidebar.classList.toggle("active");
  });

  newChatBtn?.addEventListener("click", () => {
    if (currentChat?.messages?.length) {
      saveChats();
      startNewChat();
    } else {
      startNewChat();
    }
  });

  function startNewChat() {
    currentChat = null;
    chatBox.innerHTML = "";
    chatTitle.textContent = "New Chat";
  }

  // INIT
  renderChatList();
});
