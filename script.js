const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sessionList = document.getElementById("session-list");
const darkToggle = document.getElementById("darkModeToggle");
const stopBtn = document.getElementById("stopBtn");

let typing = false;
let sessionId = Date.now().toString();
let chatSessions = {};
let abortController = null;

function startNewSession() {
  sessionId = Date.now().toString();
  chatBox.innerHTML = "";
  input.value = "";
  chatSessions[sessionId] = [];
  updateSessionList();
}

function updateSessionList() {
  sessionList.innerHTML = "";
  Object.keys(chatSessions).forEach((id) => {
    const el = document.createElement("div");
    el.className = `session-title ${id === sessionId ? "active" : ""}`;
    el.innerHTML = `<span class="title-text">Chat ${new Date(parseInt(id)).toLocaleString()}</span>
      <div class="hover-actions">
        <span onclick="renameSession('${id}')">✏️</span>
        <span onclick="deleteSession('${id}')">🗑️</span>
      </div>`;
    el.onclick = () => loadSession(id);
    sessionList.appendChild(el);
  });
}

function renameSession(id) {
  const newTitle = prompt("Enter new title:");
  if (newTitle) {
    const el = sessionList.querySelector(`[onclick*='${id}'] .title-text`);
    if (el) el.textContent = newTitle;
  }
}

function deleteSession(id) {
  delete chatSessions[id];
  if (id === sessionId) startNewSession();
  updateSessionList();
}

function loadSession(id) {
  sessionId = id;
  chatBox.innerHTML = "";
  (chatSessions[id] || []).forEach((msg) => appendMessage(msg.role, msg.text));
  updateSessionList();
}

function toggleDarkMode() {
  document.body.classList.toggle("dark-mode");
  document.getElementById("sidebar").classList.toggle("dark-sidebar");
  document.getElementById("chat-area").classList.toggle("dark-chat");
  darkToggle.textContent = document.body.classList.contains("dark-mode") ? "☀" : "🌙";
}

function stopGeneration() {
  if (abortController) {
    abortController.abort();
    typing = false;
    stopBtn.style.display = "none";
  }
}

function appendMessage(sender, message) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `message-container ${sender}`;
  const bubble = document.createElement("div");
  bubble.className = `message ${sender}`;
  bubble.innerText = message;
  msgDiv.appendChild(bubble);
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function triggerTool(tool) {
  const messages = {
    resume: "To build your resume, click the Resume Builder above!",
    linkedin: "Optimize your LinkedIn via the LinkedIn Enhancer button!",
    skills: "Click the Skill Mapper to discover your hidden potential!",
    productivity: "Boost your productivity using the Productivity Booster!",
  };
  appendMessage("bot", messages[tool]);
  (chatSessions[sessionId] = chatSessions[sessionId] || []).push({ role: "bot", text: messages[tool] });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = input.value.trim();
  if (!userMessage || typing) return;
  appendMessage("user", userMessage);
  (chatSessions[sessionId] = chatSessions[sessionId] || []).push({ role: "user", text: userMessage });
  input.value = "";

  typing = true;
  stopBtn.style.display = "inline-block";

  try {
    abortController = new AbortController();
    const res = await fetch("https://careerbot-backend-i1qt.onrender.com/get_response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
      signal: abortController.signal,
    });

    const data = await res.json();
    appendMessage("bot", data.response);
    (chatSessions[sessionId] = chatSessions[sessionId] || []).push({ role: "bot", text: data.response });
  } catch (err) {
    appendMessage("bot", "⚠️ Sorry, something went wrong. Please try again.");
  }

  typing = false;
  stopBtn.style.display = "none";
});

function exportPDF() {
  html2canvas(document.querySelector(".chat-window")).then((canvas) => {
    const imgData = canvas.toDataURL("image/png");
    const pdf = new window.jspdf.jsPDF("p", "mm", "a4");
    const width = 210;
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("CareerBot_Chat.pdf");
  });
}

// Initialize with first chat
startNewSession();