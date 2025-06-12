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

  function createChat(title = "New Chat") {
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
          linkedinEnhancerState = 'feedback_flow';
          currentChat.linkedinFeedbackData = {};
          showFeedbackProgress(0);
          appendMessage("CareerBot", "Let's analyze your entire LinkedIn profile. First, please share your current headline:", false, true);
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
      
      if (activeTool === 'linkedin') {
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
