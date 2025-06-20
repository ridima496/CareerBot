document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const darkToggle = document.getElementById("dark-toggle");
  const sidebar = document.getElementById("sidebar");
  const newChatBtn = document.getElementById("new-chat");
  const chatList = document.getElementById("chat-list");
  const introScreen = document.getElementById("intro-screen");
  const exportBtn = document.getElementById("export-pdf");
  const chatHeader = document.getElementById("chat-header");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  // State variables
  let chats = JSON.parse(localStorage.getItem("careerbot_chats") || "[]");
  let currentChat = null;
  let isBotTyping = false;
  let hasUserMessaged = false;

  // Initialize sidebar
  function initSidebar() {
    // Show sidebar by default on larger screens
    if (window.innerWidth > 768) {
      sidebar.classList.remove("hidden");
    }
  }

  function saveChats() {
    localStorage.setItem("careerbot_chats", JSON.stringify(chats));
    renderChatList();
  }

  function createChat(title = "New Chat") {
    const id = Date.now().toString();
    return { id, title, messages: [], timestamp: Date.now() };
  }

  function getTitleFromMessage(msg) {
    const txt = msg.toLowerCase();
    if (["hi", "hello", "hey"].includes(txt)) return "Introduction and Greetings";
    if (txt.includes("resume") || txt.includes("cv") || txt.includes("biodata") || txt.includes("curriculum vitae")) return "Resume Assistance";
    if (txt.includes("linkedin")) return "LinkedIn Profile Help";
    if (txt.includes("career") || txt.includes("future")) return "Career Guidance";
    if (txt.includes("skills") || txt.includes("map")) return "Skill Mapping";
    if (txt.includes("interview")) return "Interview Preparation";
    return "Conversation";
  }

  function renderChatList() {
    chatList.innerHTML = "";
    chats.sort((a, b) => b.timestamp - a.timestamp).forEach(chat => {
      const div = document.createElement("div");
      div.className = "chat-item";
      div.dataset.id = chat.id;

      if (currentChat?.id === chat.id) {
        div.classList.add("active");
      }

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
        chatHeader.textContent = chat.title;
      };

      chatList.appendChild(div);
    });
  }

  function appendMessage(sender, message, isTyping = false, showAvatar = false) {
      const container = document.createElement("div");
      container.className = "message-container";
      container.style.alignItems = sender === "You" ? "flex-end" : "flex-start";
      container.style.marginBottom = "20px";
  
      if (sender === "CareerBot") {
          container.style.marginLeft = "150px";
      }
  
      const messageRow = document.createElement("div");
      messageRow.style.display = "flex";
      messageRow.style.alignItems = "flex-start";
      messageRow.style.justifyContent = sender === "You" ? "flex-end" : "flex-start";
      messageRow.style.width = "100%";
      messageRow.style.maxWidth = "calc(100% - 40px)";
  
      const bubble = document.createElement("div");
      bubble.className = `message ${sender === "You" ? "user" : "bot"}`;
  
      if (isTyping) {
          const warmUpText = currentChat?.messages?.length === 0 ? 
              `<span class="typing-indicator">Warming up the bot, please wait<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>` :
              `<span class="typing-indicator">CareerBot is typing<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>`;
          bubble.innerHTML = warmUpText;
      } else {
          // Convert markdown-style formatting to HTML
          let formattedMessage = message
              // Bold
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              // Italics
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              // Highlight
              .replace(/==(.*?)==/g, '<mark>$1</mark>')
              // Headers (h3)
              .replace(/### (.*?)(<br>|$)/g, '<h3 class="bot-heading">$1</h3>')
              // Headers (h4)
              .replace(/#### (.*?)(<br>|$)/g, '<h4 class="bot-subheading">$1</h4>')
              // Lists
              .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>')
              // Replace multiple <br> with single ones
              .replace(/(<br>\s*){2,}/g, '<br><br>');
  
          // Wrap lists in <ul> tags if we find <li> elements
          if (formattedMessage.includes('<li>')) {
              formattedMessage = formattedMessage.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
          }
  
          bubble.innerHTML = formattedMessage;
      }
  
      if (sender === "CareerBot" && showAvatar && !isTyping) {
          const avatar = document.createElement("img");
          avatar.src = "logo512.png";
          avatar.className = "avatar";
          avatar.style.marginRight = "6px";
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
                  utterance = new SpeechSynthesisUtterance(bubble.textContent);
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
              navigator.clipboard.writeText(bubble.textContent).then(() => {
                  const originalText = copyBtn.textContent;
                  copyBtn.textContent = "✓ Copied!";
                  setTimeout(() => {
                      copyBtn.textContent = originalText;
                  }, 2000);
              });
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
          chatHeader.textContent = currentChat.title;
      }
  
      if (!hasUserMessaged) {
          introScreen.style.display = "none";
          hasUserMessaged = true;
      }
  
      appendMessage("You", userMessage);
      currentChat.messages.push({ sender: "You", text: userMessage });
  
      const loadingContainer = document.createElement("div");
      loadingContainer.className = "message-container";
      loadingContainer.style.marginLeft = "150px";
      loadingContainer.innerHTML = `
        <div class="message bot">
          <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `;
      chatBox.appendChild(loadingContainer);
      chatBox.scrollTop = chatBox.scrollHeight;
    
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

          loadingContainer.remove();
  
          // Remove the typing indicator
          typingBubble?.remove();
          
          // Create a new message container for streaming
          const messageContainer = document.createElement("div");
          messageContainer.className = "message-container";
          messageContainer.style.alignItems = "flex-start";
          messageContainer.style.marginBottom = "15px";
          messageContainer.style.marginLeft = "150px";
  
          const messageRow = document.createElement("div");
          messageRow.style.display = "flex";
          messageRow.style.alignItems = "flex-start";
          messageRow.style.justifyContent = "flex-start";
          messageRow.style.width = "100%";
  
          const avatar = document.createElement("img");
          avatar.src = "logo512.png";
          avatar.className = "avatar";
          avatar.style.marginRight = "6px";
          messageRow.appendChild(avatar);
  
          const bubble = document.createElement("div");
          bubble.className = "message bot";
          messageRow.appendChild(bubble);
  
          messageContainer.appendChild(messageRow);
          chatBox.appendChild(messageContainer);
          
          // Handle streaming response
          const reader = response.body.getReader();
          let decoder = new TextDecoder();
          let fullResponse = "";
          
          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                  if (line.startsWith('data:') && !line.includes('[DONE]')) {
                      try {
                          const data = JSON.parse(line.substring(5));
                          const content = data.choices[0]?.delta?.content || "";
                          fullResponse += content;
                          
                          // Update the bubble with formatted text
                          bubble.innerHTML = formatResponse(fullResponse);
                          chatBox.scrollTop = chatBox.scrollHeight;
                      } catch (e) {
                          console.error("Error parsing stream data:", e);
                      }
                  }
              }
          }
          
          // Save the complete message
          currentChat.messages.push({ 
              sender: "CareerBot", 
              text: fullResponse 
          });
          
          currentChat.timestamp = Date.now();
  
          if (currentChat.title === "New Chat") {
              currentChat.title = getTitleFromMessage(userMessage);
              chatHeader.textContent = currentChat.title;
          }
  
          saveChats();
          renderChatList();
          
      } catch (error) {
          typingBubble?.remove();
          const errorMessage = "⚠️ Sorry, I couldn't reach the server.";
          appendMessage("CareerBot", errorMessage, false, true);
          currentChat?.messages.push({ sender: "CareerBot", text: errorMessage });
      } finally {
          isBotTyping = false;
          input.disabled = false;
          input.focus();
      }
  }
  
  // Helper function to format streaming response
  function formatResponse(text) {
      return text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/==(.*?)==/g, '<mark>$1</mark>')
          .replace(/\n/g, '<br>');
  }
  
  // Add grievance button functionality
  document.querySelectorAll('.grievance-btn').forEach(button => {
    button.addEventListener('click', () => {
      const questions = {
        "Career Path Guidance": "Can you tell me how to become a [Career]?",
        "Skills Development": "What skills do I need for a career in [Field]?",
        "Job Search Tips": "How can I find jobs in [Industry]?",
        "Salary Negotiation": "How should I negotiate salary for [Position]?",
        "Career Change Advice": "How do I switch careers to [New Field]?"
      };
      
      input.value = questions[button.textContent];
      input.focus();
      input.selectionStart = input.selectionEnd = input.value.indexOf('[');
    });
  });

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
    chatHeader.textContent = "New Chat";
  }

  renderChatList();
  initSidebar();

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
