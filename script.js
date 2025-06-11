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
  const chatHeader = document.getElementById("chat-header");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  let chats = JSON.parse(localStorage.getItem("careerbot_chats") || "[]");
  let currentChat = null;
  let isBotTyping = false;
  let hasUserMessaged = false;
  let activeTool = null;
  let linkedinEnhancerState = null;

  function saveChats() {
    localStorage.setItem("careerbot_chats", JSON.stringify(chats));
    renderChatList();
  }

  function createChat(title = "New Chat") { // Changed default title to "New Chat"
    const id = Date.now().toString();
    return { id, title, messages: [], timestamp: Date.now() };
  }

  function handleLinkedInEnhancer(choice = null) {
    if (choice) {
      switch (choice) {
        case 'headline':
          appendMessage("You", "Improve my headline. Here is my exact headline: <Please paste your headline here>", false, false);
          linkedinEnhancerState = 'awaiting_headline';
          break;
        case 'about':
          appendMessage("You", "Improve my about section. Here is my exact about section: <Please paste your about section here>", false, false);
          linkedinEnhancerState = 'awaiting_about';
          break;
        case 'experience':
          appendMessage("You", "Improve my experience section. Here is my exact experience section: <Please paste your experience section here>", false, false);
          linkedinEnhancerState = 'awaiting_experience';
          break;
        case 'skills':
          appendMessage("You", "Optimize my skills section. Here are my exact skills: <Please paste your skills here>", false, false);
          linkedinEnhancerState = 'awaiting_skills';
          break;
        case 'feedback':
          appendMessage("You", "Give me overall profile feedback. Here is my LinkedIn profile summary: <Please paste your profile summary here>", false, false);
          linkedinEnhancerState = 'awaiting_feedback';
          break;
        case 'restart':
          linkedinEnhancerState = 'initial';
          showLinkedInEnhancerOptions();
          break;
        case 'quit':
          activeTool = null;
          linkedinEnhancerState = null;
          enableAllTools();
          break;
      }
    } else {
      showLinkedInEnhancerOptions();
    }
  }

  function showLinkedInEnhancerOptions() {
    const options = [
      { id: 'headline', text: 'Headline Optimization' },
      { id: 'about', text: 'About Section Rewriting' },
      { id: 'experience', text: 'Experience Section Enhancement' },
      { id: 'skills', text: 'Skills Optimization' },
      { id: 'feedback', text: 'Overall Profile Feedback' }
    ];

    const container = document.createElement("div");
    container.className = "message-container";
    container.style.alignItems = "flex-start";
    container.style.marginBottom = "15px";
    container.style.marginLeft = "150px";

    const messageRow = document.createElement("div");
    messageRow.style.display = "flex";
    messageRow.style.alignItems = "flex-start";
    messageRow.style.justifyContent = "flex-start";
    messageRow.style.width = "100%";

    const bubble = document.createElement("div");
    bubble.className = "message bot";
    bubble.style.backgroundColor = "#f3f4f6";
    bubble.style.color = "#111827";
    bubble.style.padding = "10px";
    bubble.style.borderRadius = "8px";
    bubble.style.maxWidth = "70%";

    const text = document.createElement("p");
    text.textContent = "What would you like to enhance in your LinkedIn profile?";
    bubble.appendChild(text);

    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.flexDirection = "column";
    buttonsContainer.style.gap = "8px";
    buttonsContainer.style.marginTop = "12px";

    options.forEach(option => {
      const button = document.createElement("button");
      button.textContent = option.text;
      button.className = "enhancer-option";
      button.style.padding = "8px 12px";
      button.style.border = "1px solid #d1d5db";
      button.style.borderRadius = "4px";
      button.style.backgroundColor = "#ffffff";
      button.style.cursor = "pointer";
      button.style.textAlign = "left";
      button.onclick = () => handleLinkedInEnhancer(option.id);
      buttonsContainer.appendChild(button);
    });

    bubble.appendChild(buttonsContainer);
    messageRow.appendChild(bubble);
    container.appendChild(messageRow);
    chatBox.appendChild(container);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function disableAllTools() {
    document.querySelectorAll('.top-button').forEach(button => {
      button.disabled = true;
    });
  }

  function enableAllTools() {
    document.querySelectorAll('.top-button').forEach(button => {
      button.disabled = false;
    });
  }

  function getTitleFromMessage(msg) {
    const txt = msg.toLowerCase();
    if (["hi", "hello", "hey"].includes(txt)) return "Introduction and Greetings";
    if (txt.includes("resume")) return "Resume Assistance";
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
        `<span class="typing-indicator">Warming up the bot, please wait<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>` :
        `<span class="typing-indicator">CareerBot is typing<span class="dots"><span>.</span><span>.</span><span>.</span></span></span>`;
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
      let response;
    
      if (activeTool === 'linkedin') {
        if (linkedinEnhancerState && linkedinEnhancerState.startsWith('awaiting_')) {
          // Handle LinkedIn Enhancer specific responses
          if (userMessage.includes("<Please paste")) {
            response = { response: "Please edit the message with your actual information and send it again." };
          } else {
            let nextQuestion = "";
            let nextState = "";
          
            switch (linkedinEnhancerState) {
              case 'awaiting_headline':
                nextQuestion = "Great! Now, please mention your desired career or job title:";
                nextState = 'awaiting_career_for_headline';
                break;
              case 'awaiting_about':
                nextQuestion = "Great! What specific tone would you like for your about section? (e.g., professional, creative, technical)";
                nextState = 'awaiting_tone_for_about';
                break;
              case 'awaiting_experience':
                nextQuestion = "Great! What aspects of your experience would you like to highlight? (e.g., achievements, responsibilities, skills)";
                nextState = 'awaiting_highlight_for_experience';
                break;
              case 'awaiting_skills':
                nextQuestion = "Great! What specific job or industry are you targeting with these skills?";
                nextState = 'awaiting_target_for_skills';
                break;
              case 'awaiting_feedback':
                nextQuestion = "Great! What specific aspects would you like feedback on? (e.g., completeness, professionalism, keyword optimization)";
                nextState = 'awaiting_focus_for_feedback';
                break;
            }
          
            response = { response: nextQuestion };
            linkedinEnhancerState = nextState;
          }
        } else if (linkedinEnhancerState && linkedinEnhancerState.startsWith('awaiting_')) {
          // Generate the enhanced content based on user input
          let enhancedContent = `Here's your enhanced LinkedIn ${linkedinEnhancerState.split('_').pop().replace('for_', '')}:\n\n`;
          enhancedContent += `[Generated content based on: ${userMessage}]`;
        
          // Add action buttons
          enhancedContent += "\n\n<div class='enhancer-actions'>";
          enhancedContent += "<button class='enhancer-action' onclick='handleLinkedInEnhancer(\"restart\")'>Jump to another part</button>";
          enhancedContent += "<button class='enhancer-action' onclick='handleLinkedInEnhancer(\"quit\")'>Quit LinkedIn Enhancer</button>";
          enhancedContent += "</div>";
        
          response = { response: enhancedContent };
          linkedinEnhancerState = null;
        }
      } else {
        // Regular response handling
        response = await fetch(BACKEND_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessage,
            history: currentChat.messages.slice(-5)
          })
        }).then(res => res.json());
      }

      setTimeout(() => {
        typingBubble?.remove();
        appendMessage("CareerBot", response.response, false, true);
        currentChat.messages.push({ sender: "CareerBot", text: response.response });
        currentChat.timestamp = Date.now();

        if (currentChat.title === "New Chat") {
          currentChat.title = getTitleFromMessage(userMessage);
          chatHeader.textContent = currentChat.title;
        }

        saveChats();
        renderChatList();
      
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

  document.querySelectorAll('#linkedin-btn').forEach(button => {
    button.addEventListener('click', () => {
      if (activeTool === 'linkedin') return;
    
      activeTool = 'linkedin';
      linkedinEnhancerState = 'initial';
      disableAllTools();
    
      if (!currentChat) {
        currentChat = createChat("LinkedIn Profile Enhancement");
        chats.unshift(currentChat);
        chatHeader.textContent = currentChat.title;
      }
    
      if (!hasUserMessaged) {
        introScreen.style.display = "none";
        hasUserMessaged = true;
      }
    
      sendMessage("Help me enhance my LinkedIn profile.");
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
