document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const darkToggle = document.getElementById("dark-toggle");
  const sidebar = document.getElementById("sidebar");
  const newChatBtn = document.getElementById("new-chat");
  const chatList = document.getElementById("chat-list");
  const introScreen = document.getElementById("intro-screen");
  const exportBtn = document.getElementById("export-pdf");
  const chatHeader = document.getElementById("chat-header"); // Added reference to header

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  let chats = JSON.parse(localStorage.getItem("careerbot_chats") || "[]");
  let currentChat = null;
  let isBotTyping = false;
  let hasUserMessaged = false;

  function saveChats() {
    localStorage.setItem("careerbot_chats", JSON.stringify(chats));
    renderChatList();
  }

  function createChat(title = "New Chat") { // Changed default title to "New Chat"
    const id = Date.now().toString();
    return { id, title, messages: [], timestamp: Date.now() };
  }

  function getTitleFromMessage(msg) {
    const txt = msg.toLowerCase();
    if (["hi", "hello", "hey"].includes(txt)) return "Introduction and Greetings";
    if (txt.includes("resume")) return "Resume Assistance";
    if (txt.includes("linkedin")) return "LinkedIn Profile Help";
    if (txt.includes("career") || txt.includes("future")) return "Career Guidance";
    if (txt.includes("skills") || txt.includes("map")) return "Skill Mapping";
    return "Conversation";
  }

  function renderChatList() {
    chatList.innerHTML = "";
    chats.sort((a, b) => b.timestamp - a.timestamp).forEach(chat => {
      const div = document.createElement("div");
      div.className = "chat-item";
      div.dataset.id = chat.id;

      if (currentChat?.id === chat.id) div.classList.add("active");

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
          // Update header if this is the active chat
          if (currentChat?.id === chat.id) {
            chatHeader.textContent = chat.title;
          }
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
        chat.messages.forEach(m => appendMessage(m.sender, m.text, false, m.sender === "CareerBot"));
        introScreen.style.display = "none";
        hasUserMessaged = true;
        document.querySelectorAll('.chat-item').forEach(i => i.classList.remove('active'));
        div.classList.add('active');
        // Update header with chat title
        chatHeader.textContent = chat.title;
      };

      chatList.appendChild(div);
    });
  }

  function appendMessage(sender, message, isTyping = false, showAvatar = false) {
    const container = document.createElement("div");
    container.className = "message-container";
    container.style.alignItems = sender === "You" ? "flex-end" : "flex-start";
    container.style.marginBottom = "15px";

    if (sender === "CareerBot") {
      container.style.marginLeft = "150px";
      container.style.marginRight = "auto";
      container.style.maxWidth = "calc(70% - 150px)";
    }

    const messageRow = document.createElement("div");
    messageRow.style.display = "flex";
    messageRow.style.alignItems = "flex-start";
    messageRow.style.justifyContent = sender === "You" ? "flex-end" : "flex-start";
    messageRow.style.width = "100%";

    const bubble = document.createElement("div");
    bubble.className = `message ${sender === "You" ? "user" : "bot"}`;

    if (isTyping) {
      const warmUpText = currentChat?.messages?.length === 0 ? 
        `<span class="typing-indicator" style="margin-left: 150px">Warming up the bot, please wait<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>` :
        `<span class="typing-indicator" style="margin-left: 150px">CareerBot is typing<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>`;
      bubble.innerHTML = warmUpText;
    } else {
      function convertMarkdownToHTMLTable(text) {
        const lines = text.trim().split("\n");
        const tableStart = lines.findIndex(line => /^\|.*\|$/.test(line) && lines[lines.indexOf(line)+1]?.includes("---"));
        if (tableStart === -1) return null;

        const headerLine = lines[tableStart];
        const dataLines = lines.slice(tableStart + 2);

        const headers = headerLine.split("|").map(h => h.trim()).filter(Boolean);
        const rows = dataLines.map(line =>
          line.split("|").map(cell => cell.trim()).filter(Boolean)
        );

        let tableHTML = `<div class="table-wrapper"><table class="bot-table"><thead><tr>`;
        headers.forEach(h => tableHTML += `<th>${h}</th>`);
        tableHTML += `</tr></thead><tbody>`;
        rows.forEach(row => {
          tableHTML += `<tr>` + row.map(cell => `<td>${cell}</td>`).join("") + `</tr>`;
        });
        tableHTML += `</tbody></table></div>`;

        return {
          before: lines.slice(0, tableStart).join("<br>"),
          table: tableHTML,
          after: lines.slice(tableStart + 2 + rows.length).join("<br>")
        };
      }

      const markdownTable = convertMarkdownToHTMLTable(message);
      if (markdownTable) {
        bubble.innerHTML = `${markdownTable.before}<br>${markdownTable.table}<br>${markdownTable.after}`;
      } else {
        const rendered = message
          .replace(/\n/g, "<br>")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>");
        bubble.innerHTML = rendered;
      }
    }

    if (sender === "CareerBot" && showAvatar && !isTyping) {
      const avatar = document.createElement("img");
      avatar.src = "logo512.png";
      avatar.className = "avatar";
      avatar.style.marginLeft = "120px";
      avatar.style.marginRight = "6px"; // Added spacing
      messageRow.appendChild(avatar);
    }

    messageRow.appendChild(bubble);
    container.appendChild(messageRow);

    if (sender === "CareerBot" && !isTyping) {
      const controls = document.createElement("div");
      controls.className = "bot-controls";
      controls.style.display = "flex";
      controls.style.alignItems = "center";
      controls.style.marginTop = "8px";
      controls.style.marginLeft = "150px";
      
      let isSpeaking = false;
      let utterance = null;

      const speakBtn = document.createElement("button");
      speakBtn.textContent = "🔊";
      speakBtn.title = "Speak";

      speakBtn.onclick = () => {
        if (isSpeaking) {
          speechSynthesis.cancel();
          speakBtn.textContent = "🔊";
          isSpeaking = false;
        } else {
          utterance = new SpeechSynthesisUtterance(message);
          utterance.lang = "en-US";

          utterance.onend = () => {
            speakBtn.textContent = "🔊";
            isSpeaking = false;
          };

          speechSynthesis.speak(utterance);
          speakBtn.textContent = "⏹";
          isSpeaking = true;
        }
      };
      
      const copyBtn = document.createElement("button");
      copyBtn.textContent = "📋";
      copyBtn.title = "Copy";
      copyBtn.onclick = () => {
        navigator.clipboard.writeText(message).then(() => alert("Copied to clipboard!"));
      };

      controls.appendChild(speakBtn);
      controls.appendChild(copyBtn);
      container.appendChild(controls);
    }

    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
    return bubble;
  }

  async function sendMessage(userMessage) {
    if (isBotTyping) return;

    if (!currentChat) {
      currentChat = createChat();
      chats.unshift(currentChat);
      // Update header for new chat
      chatHeader.textContent = currentChat.title;
    }

    if (!hasUserMessaged) {
      introScreen.style.display = "none";
      hasUserMessaged = true;
    }

    appendMessage("You", userMessage);
    currentChat.messages.push({ sender: "You", text: userMessage });

    const typingBubble = appendMessage("CareerBot", "", true, false);
    isBotTyping = true;
    input.disabled = true;

    try {
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          history: currentChat.messages.slice(-5)
        })
      });

      const data = await response.json();

      setTimeout(() => {
        typingBubble.remove();
        appendMessage("CareerBot", data.response, false, true);
        currentChat.messages.push({ sender: "CareerBot", text: data.response });
        currentChat.timestamp = Date.now();

        // Update chat title and header if needed
        if (currentChat.title === "New Chat") {
          currentChat.title = getTitleFromMessage(userMessage);
          chatHeader.textContent = currentChat.title;
          saveChats();
        }

        isBotTyping = false;
        input.disabled = false;
        input.focus();
      }, 1000);
    } catch (error) {
      typingBubble.remove();
      appendMessage("CareerBot", "⚠️ Sorry, I couldn't reach the server.");
      isBotTyping = false;
      input.disabled = false;
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

  newChatBtn?.addEventListener("click", () => {
    if (currentChat?.messages?.length) saveChats();
    startNewChat();
  });

  function startNewChat() {
    currentChat = null;
    chatBox.innerHTML = "";
    introScreen.style.display = "flex";
    hasUserMessaged = false;
    // Reset header to "New Chat"
    chatHeader.textContent = "New Chat";
  }

  renderChatList();

  exportBtn.addEventListener("click", () => {
    if (!currentChat || currentChat.messages.length === 0) {
      alert("No chat to export.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 10;

    doc.setFont("helvetica");
    doc.setFontSize(12);
    doc.text("CareerBot – Conversation Export", 10, y);
    y += 10;

    currentChat.messages.forEach(msg => {
      const sender = msg.sender === "You" ? "You" : "CareerBot";
      const lines = doc.splitTextToSize(`${sender}: ${msg.text}`, 180);
      lines.forEach(line => {
        if (y > 280) { doc.addPage(); y = 10; }
        doc.text(line, 10, y);
        y += 7;
      });
      y += 5;
    });

    const filename = (currentChat.title || "CareerBot_Chat").replace(/\s+/g, "_") + ".pdf";
    doc.save(filename);
  });
});
