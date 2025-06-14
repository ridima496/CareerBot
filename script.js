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
  const sidebarToggle = document.getElementById("sidebar-toggle");

  const BACKEND_URL = "https://careerbot-backend-i1qt.onrender.com/get_response";

  // State variables
  let chats = JSON.parse(localStorage.getItem("careerbot_chats") || "[]");
  let currentChat = null;
  let isBotTyping = false;
  let hasUserMessaged = false;
  let activeTool = null;
  let linkedinEnhancerState = null;

  // Initialize sidebar
  function initSidebar() {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("hidden");
    });
    
    // Show sidebar by default on larger screens
    if (window.innerWidth > 768) {
      sidebar.classList.remove("hidden");
    }
  }

  // Update button states
  function updateButtonStates() {
    const buttons = document.querySelectorAll('.top-button');
    buttons.forEach(button => {
      if (button.disabled) {
        button.style.color = '#9ca3af';
        button.style.cursor = 'not-allowed';
      } else {
        button.style.color = '';
        button.style.cursor = 'pointer';
      }
    });
  }

  function highlightLinkedInChat(active = true) {
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
      if (item.dataset.id === currentChat?.id) {
        if (active) {
          item.style.borderLeft = '4px solid #2563eb';
          item.style.paddingLeft = '8px';
        } else {
          item.style.borderLeft = '';
          item.style.paddingLeft = '';
        }
      }
    });
  }
  
  function saveChats() {
    localStorage.setItem("careerbot_chats", JSON.stringify(chats));
    renderChatList();
  }

  function createChat(title = "New Chat") {
    const id = Date.now().toString();
    return { id, title, messages: [], timestamp: Date.now() };
  }

  function handleLinkedInEnhancer(choice = null) {
    if (choice === 'quit') {
      activeTool = null;
      linkedinEnhancerState = null;
      enableAllTools();
      updateButtonStates();
      highlightLinkedInChat(false);
      input.disabled = false;
      return;
    }

    if (choice) {
      let optionText = "";
      switch (choice) {
        case 'headline':
          optionText = "Improve my headline. Here is my exact headline: ";
          break;
        case 'about':
          optionText = "Improve my about section. Here is my exact about section: ";
          break;
        case 'experience':
          optionText = "Improve my experience section. Here is my exact experience section: ";
          break;
        case 'skills':
          optionText = "Optimize my skills section. Here are my exact skills: ";
          break;
        case 'feedback':
          optionText = "Give me overall profile feedback";
          break;
        case 'restart':
          linkedinEnhancerState = 'initial';
          showLinkedInEnhancerOptions();
          return;
      }
      
      // Pre-fill input instead of sending directly
      input.value = optionText;
      input.disabled = false;
      input.focus();
      input.selectionStart = input.selectionEnd = optionText.length;
    }
  }
  
  function showFeedbackProgress(step) {
    const steps = ["Headline", "About Section", "Experience", "Skills", "Desired Job"];
    
    const progressHTML = `
      <div class="feedback-progress">
        <div class="progress-title">Profile Analysis Progress</div>
        <div class="progress-steps">
          ${steps.map((s, i) => `
            <div class="progress-step ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''}">
              <div class="step-number">${i + 1}</div>
              <div class="step-label">${s}</div>
            </div>
          `).join('')}
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${(step / steps.length) * 100}%"></div>
        </div>
      </div>
    `;
    
    document.querySelectorAll('.feedback-progress').forEach(el => el.remove());
    const lastBotMessage = document.querySelectorAll('.message.bot').pop();
    if (lastBotMessage) {
      const progressContainer = document.createElement('div');
      progressContainer.innerHTML = progressHTML;
      lastBotMessage.appendChild(progressContainer);
    }
  }

  function addProfileVisualization(scores) {
    return `
      <div class="profile-visualization">
        <div class="viz-title">Profile Analysis</div>
        <div class="viz-meters">
          ${Object.entries(scores).map(([section, score]) => `
            <div class="viz-meter">
              <div class="viz-label">${section}</div>
              <div class="meter-container">
                <div class="meter-fill" style="width: ${score}%"></div>
                <div class="meter-text">${score}/100</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
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
    updateButtonStates();
  }
  
  function enableAllTools() {
    document.querySelectorAll('.top-button').forEach(button => {
      button.disabled = false;
    });
    updateButtonStates();
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

      if (currentChat?.id === chat.id) {
        div.classList.add("active");
        if (activeTool === 'linkedin') {
          div.style.borderLeft = '4px solid #2563eb';
          div.style.paddingLeft = '8px';
        }
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
      if (sender === "CareerBot" && (message.includes('<') || message.includes('\n'))) {
        bubble.innerHTML = message.includes('<') ? message : message.replace(/\n/g, '<br>');
      } else {
        bubble.textContent = message;
      }
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

    if (sender === "CareerBot" && message.includes("What would you like to enhance")) {
      bubble.classList.add('enhancer-menu');
    }

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
          utterance = new SpeechSynthesisUtterance(message.replace(/<[^>]*>/g, ''));
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
        navigator.clipboard.writeText(message.replace(/<[^>]*>/g, '')).then(() => alert("Copied to clipboard!"));
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

      // Handle LinkedIn enhancer flow
      if (activeTool === 'linkedin') {
        if (userMessage === "Help me enhance my LinkedIn profile") {
          showLinkedInEnhancerOptions();
          isBotTyping = false;
          input.disabled = true;
          return;
        }

        if (linkedinEnhancerState === 'feedback_flow') {
          if (!currentChat.linkedinFeedbackData) {
            currentChat.linkedinFeedbackData = {};
          }
          
          const lastBotMessage = currentChat.messages
            .filter(m => m.sender === "CareerBot")
            .pop()?.text || "";

          let currentStep = 0;
          if (lastBotMessage.includes("share your current headline")) {
            currentChat.linkedinFeedbackData.headline = userMessage;
            response = { response: "Great! Now please share your About section:" };
            currentStep = 1;
          } 
          else if (lastBotMessage.includes("share your About section")) {
            currentChat.linkedinFeedbackData.about = userMessage;
            response = { response: "Thank you. Next, please share your Experience section:" };
            currentStep = 2;
          }
          else if (lastBotMessage.includes("share your Experience section")) {
            currentChat.linkedinFeedbackData.experience = userMessage;
            response = { response: "Got it. Now please share your Skills:" };
            currentStep = 3;
          }
          else if (lastBotMessage.includes("share your Skills")) {
            currentChat.linkedinFeedbackData.skills = userMessage;
            response = { response: "Finally, what is your desired career/job title?" };
            currentStep = 4;
          }
          else if (lastBotMessage.includes("desired career/job title")) {
            currentChat.linkedinFeedbackData.desiredJob = userMessage;
            
            const feedbackData = {
              type: "comprehensive_feedback",
              data: currentChat.linkedinFeedbackData
            };
            
            response = await fetch(BACKEND_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: JSON.stringify(feedbackData),
                history: currentChat.messages.slice(-5)
              })
            }).then(res => res.json());
            
            if (response.visualization) {
              const visualization = addProfileVisualization(response.visualization);
              response.response = visualization + (response.response || "");
            }
            
            response.response += `
              <div class="enhancer-actions" style="margin-top: 20px;">
                <button class="enhancer-action" onclick="handleLinkedInEnhancer('restart')">Analyze Another Section</button>
                <button class="enhancer-action" onclick="handleLinkedInEnhancer('quit')">Finish LinkedIn Enhancement</button>
              </div>
            `;
            
            currentChat.linkedinFeedbackData = null;
            linkedinEnhancerState = null;
          }
          
          if (currentStep > 0) {
            showFeedbackProgress(currentStep);
          }
        } 
      }

      if (!response) {
        if (activeTool !== 'linkedin' || linkedinEnhancerState !== 'initial') {
          response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userMessage,
              history: currentChat.messages.slice(-5)
            })
          }).then(res => res.json());
        } else {
          showLinkedInEnhancerOptions();
          isBotTyping = false;
          input.disabled = false;
          return;
        }
      }

      setTimeout(() => {
        typingBubble?.remove();
        
        let responseContent = response.response || response;
        if (typeof responseContent !== 'string') {
          responseContent = JSON.stringify(responseContent);
        }

        const botMessage = appendMessage("CareerBot", responseContent, false, true);
        botMessage.innerHTML = responseContent.includes('<') ? 
          responseContent : 
          responseContent.replace(/\n/g, '<br>');

        currentChat.messages.push({ 
          sender: "CareerBot", 
          text: responseContent 
        });
        
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
      const errorMessage = "⚠️ Sorry, I couldn't reach the server.";
      appendMessage("CareerBot", errorMessage, false, true);
      currentChat.messages.push({ sender: "CareerBot", text: errorMessage });
      isBotTyping = false;
      input.disabled = false;
    }
  }

  // Add CSS styles
  const style = document.createElement('style');
  style.textContent = `
    .dark-mode .enhancer-menu {
      background-color: #1f2937 !important;
      color: #f9fafb !important;
    }
    .dark-mode .enhancer-option {
      background-color: #374151 !important;
      color: #f3f4f6 !important;
      border-color: #4b5563 !important;
    }    
    .dark-mode .enhancer-option:hover {
      background-color: #4b5563 !important;
    }
    .enhancer-action {
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background-color: #ffffff;
      cursor: pointer;
      margin-right: 8px;
    }
    .dark-mode .enhancer-action {
      background-color: #374151;
      color: #f3f4f6;
      border-color: #4b5563;
    }
    .feedback-progress {
      background: #f8fafc;
      border-radius: 8px;
      padding: 12px;
      margin-top: 16px;
      border: 1px solid #e2e8f0;
    }
    .dark-mode .feedback-progress {
      background: #1e293b;
      border-color: #334155;
    }
    .progress-title {
      font-weight: 500;
      margin-bottom: 12px;
      color: #334155;
    }
    .dark-mode .progress-title {
      color: #f1f5f9;
    }
    .progress-steps {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      flex: 1;
    }
    .progress-step:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 16px;
      left: 60%;
      right: -40%;
      height: 2px;
      background: #e2e8f0;
      z-index: 1;
    }
    .dark-mode .progress-step:not(:last-child)::after {
      background: #334155;
    }
    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e2e8f0;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 4px;
      position: relative;
      z-index: 2;
    }
    .dark-mode .step-number {
      background: #334155;
      color: #94a3b8;
    }
    .progress-step.completed .step-number {
      background: #2563eb;
      color: white;
    }
    .progress-step.active .step-number {
      background: #3b82f6;
      color: white;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
    }
    .step-label {
      font-size: 12px;
      color: #64748b;
      text-align: center;
    }
    .dark-mode .step-label {
      color: #94a3b8;
    }
    .progress-step.completed .step-label,
    .progress-step.active .step-label {
      color: #2563eb;
      font-weight: 500;
    }
    .dark-mode .progress-step.completed .step-label,
    .dark-mode .progress-step.active .step-label {
      color: #3b82f6;
    }
    .progress-bar {
      height: 6px;
      background: #e2e8f0;
      border-radius: 3px;
      overflow: hidden;
    }
    .dark-mode .progress-bar {
      background: #334155;
    }
    .progress-fill {
      height: 100%;
      background: #2563eb;
      transition: width 0.3s ease;
    }
    .profile-visualization {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      border: 1px solid #e2e8f0;
    }
    .dark-mode .profile-visualization {
      background: #1e293b;
      border-color: #334155;
    }
    .viz-title {
      font-weight: 500;
      margin-bottom: 16px;
      color: #334155;
      font-size: 16px;
    }
    .dark-mode .viz-title {
      color: #f1f5f9;
    }
    .viz-meters {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .viz-meter {
      display: flex;
      align-items: center;
    }
    .viz-label {
      width: 120px;
      font-size: 14px;
      color: #475569;
    }
    .dark-mode .viz-label {
      color: #94a3b8;
    }
    .meter-container {
      flex: 1;
      height: 24px;
      background: #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    .dark-mode .meter-container {
      background: #334155;
    }
    .meter-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #6366f1);
      border-radius: 12px;
      transition: width 0.5s ease;
    }
    .meter-text {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      font-weight: 500;
      color: white;
      text-shadow: 0 1px 2px rgba(0,0,0,0.2);
    }
    .message.bot {
      background-color: #f3f4f6;
      color: #111827;
    }
    .dark-mode .message.bot {
      background-color: #1f2937;
      color: #f9fafb;
    }
    .message.user {
      background-color: #2563eb;
      color: white;
    }
    .message {
      padding: 10px;
      border-radius: 8px;
      max-width: 70%;
      margin: 10px 0;
    }
  `;
  document.head.appendChild(style);
  
  document.querySelectorAll('#linkedin-btn').forEach(button => {
    button.addEventListener('click', () => {
      if (activeTool === 'linkedin') return;
    
      activeTool = 'linkedin';
      linkedinEnhancerState = 'initial';
      disableAllTools();
      highlightLinkedInChat(true);
    
      if (!currentChat) {
        currentChat = createChat("LinkedIn Profile Enhancement");
        chats.unshift(currentChat);
        chatHeader.textContent = currentChat.title;
      }
    
      if (!hasUserMessaged) {
        introScreen.style.display = "none";
        hasUserMessaged = true;
      }
    
      // Send the initial user message
      appendMessage("You", "Help me enhance my LinkedIn profile");
      currentChat.messages.push({ 
        sender: "You", 
        text: "Help me enhance my LinkedIn profile" 
      });
      
      // Disable input until user selects an option
      input.disabled = true;
      
      // Show menu options
      showLinkedInEnhancerOptions();
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
    activeTool = null;
    linkedinEnhancerState = null;
    currentChat = null;
    chatBox.innerHTML = "";
    introScreen.style.display = "flex";
    hasUserMessaged = false;
    chatHeader.textContent = "New Chat";
    enableAllTools();
    highlightLinkedInChat(false);
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
