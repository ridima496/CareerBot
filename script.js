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

  // Debugging: Verify all critical elements exist
  if (!sidebar) console.error("Sidebar element not found");
  if (!newChatBtn) console.error("New chat button not found");
  if (!chatList) console.error("Chat list element not found");
  if (!chatBox) console.error("Chat box element not found");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  // State variables
  let chats = JSON.parse(localStorage.getItem("careerbot_chats") || "[]");
  let currentChat = null;
  let isBotTyping = false;
  let hasUserMessaged = false;

  // Initialize sidebar and layout
  function initSidebar() {
    // Ensure no horizontal scroll by setting proper widths
    document.body.style.overflowX = "hidden";
    sidebar.style.width = "300px";
    sidebar.style.flexShrink = "0";
    
    // Show sidebar by default on larger screens
    if (window.innerWidth > 768) {
      sidebar.classList.remove("hidden");
    }

    // Prevent horizontal overflow
    const layout = document.querySelector(".layout");
    if (layout) {
      layout.style.width = "100vw";
      layout.style.overflowX = "hidden";
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
    if (!chatList) return;
    
    chatList.innerHTML = "";
    const sortedChats = [...chats].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedChats.forEach(chat => {
      const div = document.createElement("div");
      div.className = "chat-item";
      div.dataset.id = chat.id;
      div.tabIndex = 0;
      div.setAttribute("role", "button");

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
          if (currentChat?.id === chat.id && chatHeader) {
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

      div.addEventListener("click", (e) => {
        // Fix: Check if click is in actions container
        if (e.target.closest('.chat-actions')) return;
        
        currentChat = chat;
        if (chatBox) chatBox.innerHTML = "";
        chat.messages.forEach(m => 
          appendMessage(m.sender, m.text, false, m.sender === "CareerBot")
        );
        if (introScreen) introScreen.style.display = "none";
        hasUserMessaged = true;
        
        document.querySelectorAll('.chat-item').forEach(i => 
          i.classList.remove('active')
        );
        div.classList.add('active');
        
        if (chatHeader) {
          chatHeader.textContent = chat.title;
        }
      });

      chatList.appendChild(div);
    });
  }

  function appendMessage(sender, message, isTyping = false, showAvatar = false) {
    if (!chatBox) return null;

    const container = document.createElement("div");
    container.className = "message-container";
    container.style.alignItems = sender === "You" ? "flex-end" : "flex-start";
    container.style.marginBottom = "20px";
    container.style.maxWidth = "100%";
    container.style.overflowX = "hidden";

    const messageRow = document.createElement("div");
    messageRow.className = "message-row";
    messageRow.style.display = "flex";
    messageRow.style.alignItems = "flex-start";
    messageRow.style.justifyContent = sender === "You" ? "flex-end" : "flex-start";
    messageRow.style.maxWidth = "100%";
    messageRow.style.gap = "10px"; // Consistent gap

    const bubble = document.createElement("div");
    bubble.className = `message ${sender === "You" ? "user" : "bot"}`;
    bubble.style.maxWidth = "calc(100% - 50px)";
    bubble.style.overflowWrap = "break-word";

    if (isTyping) {
      const warmUpText = currentChat?.messages?.length === 0 ? 
        `<span class="typing-indicator">Warming up the bot, please wait<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>` :
        `<span class="typing-indicator">CareerBot is typing<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>`;
      bubble.innerHTML = warmUpText;
      
      const avatarSpace = document.createElement("div");
      avatarSpace.className = "avatar-space";
      avatarSpace.style.width = "36px";
      avatarSpace.style.flexShrink = "0";
      messageRow.appendChild(avatarSpace);
    } else {
      let formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/==(.*?)==/g, '<mark>$1</mark>')
        .replace(/### (.*?)(<br>|$)/g, '<h3 class="bot-heading">$1</h3>')
        .replace(/#### (.*?)(<br>|$)/g, '<h4 class="bot-subheading">$1</h4>')
        .replace(/- (.*?)(<br>|$)/g, '<li>$1</li>')
        .replace(/(<br>\s*){2,}/g, '<br><br>');

      if (formattedMessage.includes('<li>')) {
        formattedMessage = formattedMessage.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
      }
      bubble.innerHTML = formattedMessage;

      if (sender === "CareerBot" && showAvatar) {
        const avatar = document.createElement("img");
        avatar.src = "logo512.png";
        avatar.className = "avatar";
        avatar.style.flexShrink = "0";
        messageRow.appendChild(avatar);
      } else if (sender === "CareerBot") {
        // Add empty space for alignment
        const avatarSpace = document.createElement("div");
        avatarSpace.className = "avatar-space";
        avatarSpace.style.width = "36px";
        avatarSpace.style.flexShrink = "0";
        messageRow.appendChild(avatarSpace);
      }
    }

    messageRow.appendChild(bubble);
    container.appendChild(messageRow);

    if (sender === "CareerBot" && !isTyping) {
      const controls = document.createElement("div");
      controls.className = "bot-controls";
      controls.style.display = "flex"; // Force show for now
      
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
          utterance = new SpeechSynthesisUtterance(bubble.textContent.replace(/<[^>]*>/g, ''));
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
        navigator.clipboard.writeText(bubble.textContent.replace(/<[^>]*>/g, '')).then(() => {
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
      if (isBotTyping || !input) return;
  
      if (!currentChat) {
          currentChat = createChat();
          chats.unshift(currentChat);
          if (chatHeader) chatHeader.textContent = currentChat.title;
      }
  
      if (introScreen) introScreen.style.display = "none";
      hasUserMessaged = true;
  
      appendMessage("You", userMessage);
      currentChat.messages.push({ sender: "You", text: userMessage });
  
      // Create loading indicator
      const loadingContainer = document.createElement("div");
      loadingContainer.className = "message-container bot-message-container";
      loadingContainer.innerHTML = `
          <div class="message bot">
              <div class="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
              </div>
          </div>
      `;
      if (chatBox) chatBox.appendChild(loadingContainer);
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
  
          // Remove loading indicator
          loadingContainer?.remove();
  
          // Create message container for streaming
          const messageContainer = document.createElement("div");
          messageContainer.className = "message-container bot-message-container";
  
          const messageRow = document.createElement("div");
          messageRow.className = "message-row";
          messageRow.style.display = "flex";
          messageRow.style.alignItems = "flex-start";
          messageRow.style.gap = "10px";
  
          const avatar = document.createElement("img");
          avatar.src = "logo512.png";
          avatar.className = "avatar";
          avatar.style.flexShrink = "0";
          messageRow.appendChild(avatar);
  
          const bubble = document.createElement("div");
          bubble.className = "message bot";
          bubble.style.maxWidth = "calc(100% - 50px)";
          messageRow.appendChild(bubble);
  
          messageContainer.appendChild(messageRow);
          if (chatBox) chatBox.appendChild(messageContainer);
  
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";
          let buffer = "";
  
          while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              buffer += decoder.decode(value, { stream: true });
              const events = buffer.split("\n\n");
              buffer = events.pop() || "";
              
              for (const event of events) {
                  if (!event.includes("data:") || event.includes("[DONE]")) continue;
                  
                  try {
                      const jsonStr = event.replace("data: ", "");
                      const data = JSON.parse(jsonStr);
                      const content = data.choices[0]?.delta?.content || "";
                      fullResponse += content;
                      
                      bubble.innerHTML = formatResponse(fullResponse);
                      if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
                  } catch (e) {
                      console.error("Error parsing stream data:", e);
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
              if (chatHeader) chatHeader.textContent = currentChat.title;
          }
  
          saveChats();
          renderChatList();
          
      } catch (error) {
          console.error("Error sending message:", error);
          appendMessage("CareerBot", "⚠️ Sorry, I couldn't reach the server.", false, true);
          currentChat?.messages.push({ sender: "CareerBot", text: "⚠️ Sorry, I couldn't reach the server." });
      } finally {
          isBotTyping = false;
          if (input) {
              input.disabled = false;
              input.focus();
          }
      }
  }

  function formatResponse(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/==(.*?)==/g, '<mark>$1</mark>')
      .replace(/\n/g, '<br>');
  }

  // Event listeners
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const msg = input?.value.trim();
      if (msg) {
        sendMessage(msg);
        if (input) input.value = "";
      }
    });
  }

  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
    });
  }

  if (newChatBtn) {
    newChatBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentChat?.messages?.length) saveChats();
      startNewChat();
    });
  }

  function startNewChat() {
    if (currentChat?.messages?.length) {
        currentChat.timestamp = Date.now();
        saveChats();
    }
    
    currentChat = createChat();
    chats.unshift(currentChat);
    
    if (chatBox) chatBox.innerHTML = "";
    if (introScreen) introScreen.style.display = "flex";
    hasUserMessaged = false;
    
    if (chatHeader) chatHeader.textContent = "New Chat";
    renderChatList();
    
    // Set new chat as active
    const firstChatItem = document.querySelector('.chat-item');
    if (firstChatItem) {
        firstChatItem.classList.add('active');
    }
  }

  if (exportBtn) {
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
  }

  // Initialize the app
  initSidebar();
  renderChatList();

  // Prevent horizontal scroll on window resize
  window.addEventListener("resize", () => {
    document.body.style.overflowX = "hidden";
    if (sidebar) sidebar.style.width = "300px";
  });
});
