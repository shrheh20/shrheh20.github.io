/**
 * Ask Shreyas — Chatbot Widget
 * Drop this <script> tag at the bottom of any page to inject the chatbot.
 * Set window.ASK_SHREYAS_API before loading this script to point to your backend.
 *
 * Usage:
 *   <script>window.ASK_SHREYAS_API = "https://your-backend-url.com";</script>
 *   <script src="chatbot.js"></script>
 */

(function () {
  const API_BASE = window.ASK_SHREYAS_API || "http://localhost:8000";

  // ── Conversation history (kept in memory) ──────────────────────────────
  let history = [];
  let isOpen = false;
  let isTyping = false;

  // ── Suggested starter questions ─────────────────────────────────────────
  const STARTERS = [
    "What has Shreyas built at EnterpriseWorks?",
    "Is Shreyas open to relocation?",
    "What's Shreyas's visa status?",
    "Why should I hire Shreyas?",
    "What tools does Shreyas use?",
  ];

  // ── Inject styles ────────────────────────────────────────────────────────
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400&display=swap');

    #ask-shreyas-root * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', system-ui, sans-serif; }

    /* ── LAUNCHER BAR ── */
    #ask-shreyas-launcher {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9998;
      background: #0d0d0d;
      color: #f7f5f1;
      border-radius: 100px;
      padding: 0.65rem 1.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,0,0,0.22);
      transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
      white-space: nowrap;
      user-select: none;
    }
    #ask-shreyas-launcher:hover {
      background: #c8392b;
      transform: translateX(-50%) translateY(-2px);
      box-shadow: 0 8px 28px rgba(200,57,43,0.3);
    }
    #ask-shreyas-launcher.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) translateY(10px);
    }
    .launcher-dot {
      width: 8px; height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.85); }
    }
    .launcher-text {
      font-size: 0.82rem;
      font-weight: 500;
      letter-spacing: 0.04em;
    }
    .launcher-mono {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.65rem;
      color: rgba(247,245,241,0.5);
      letter-spacing: 0.1em;
    }

    /* ── CHAT PANEL ── */
    #ask-shreyas-panel {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(20px);
      z-index: 9999;
      width: min(480px, calc(100vw - 2rem));
      max-height: 580px;
      background: #f7f5f1;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    #ask-shreyas-panel.open {
      opacity: 1;
      pointer-events: all;
      transform: translateX(-50%) translateY(0);
    }

    /* header */
    .as-header {
      background: #0d0d0d;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }
    .as-header-left { display: flex; align-items: center; gap: 0.75rem; }
    .as-avatar {
      width: 34px; height: 34px;
      background: #c8392b;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.9rem; color: #fff; font-weight: 500;
    }
    .as-header-name { font-size: 0.88rem; font-weight: 500; color: #f7f5f1; }
    .as-header-sub { font-size: 0.7rem; color: rgba(247,245,241,0.5); margin-top: 1px; }
    .as-close {
      background: none; border: none; cursor: pointer;
      color: rgba(247,245,241,0.6); font-size: 1.2rem; line-height: 1;
      padding: 0.2rem; transition: color 0.15s;
    }
    .as-close:hover { color: #f7f5f1; }

    /* messages */
    .as-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      scroll-behavior: smooth;
    }
    .as-messages::-webkit-scrollbar { width: 4px; }
    .as-messages::-webkit-scrollbar-track { background: transparent; }
    .as-messages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 2px; }

    .as-msg { display: flex; gap: 0.6rem; align-items: flex-end; max-width: 85%; }
    .as-msg.user { align-self: flex-end; flex-direction: row-reverse; }
    .as-msg.bot  { align-self: flex-start; }

    .as-bubble {
      padding: 0.65rem 0.9rem;
      border-radius: 12px;
      font-size: 0.875rem;
      line-height: 1.55;
    }
    .as-msg.bot .as-bubble {
      background: #fff;
      color: #1a1a1a;
      border: 1px solid rgba(0,0,0,0.07);
      border-bottom-left-radius: 4px;
    }
    .as-msg.user .as-bubble {
      background: #0d0d0d;
      color: #f7f5f1;
      border-bottom-right-radius: 4px;
    }

    /* typing indicator */
    .as-typing { display: flex; gap: 4px; padding: 0.65rem 0.9rem; align-items: center; }
    .as-typing span {
      width: 6px; height: 6px; background: #aaa; border-radius: 50%;
      animation: bounce-dot 1.2s infinite;
    }
    .as-typing span:nth-child(2) { animation-delay: 0.2s; }
    .as-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce-dot {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
      40% { transform: translateY(-5px); opacity: 1; }
    }

    /* starters */
    .as-starters {
      padding: 0 1.25rem 0.75rem;
      display: flex; flex-wrap: wrap; gap: 0.4rem;
      flex-shrink: 0;
    }
    .as-starter-btn {
      background: #fff;
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 100px;
      padding: 0.35rem 0.8rem;
      font-size: 0.72rem;
      color: #3a3a3a;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
      white-space: nowrap;
    }
    .as-starter-btn:hover { background: #c8392b; color: #fff; border-color: #c8392b; }

    /* input row */
    .as-input-row {
      padding: 0.75rem 1.25rem 1rem;
      display: flex; gap: 0.5rem; align-items: center;
      border-top: 1px solid rgba(0,0,0,0.07);
      flex-shrink: 0;
    }
    .as-input {
      flex: 1;
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      font-size: 0.875rem;
      background: #fff;
      color: #0d0d0d;
      outline: none;
      transition: border-color 0.15s;
      resize: none;
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    .as-input:focus { border-color: #c8392b; }
    .as-send {
      width: 36px; height: 36px;
      background: #0d0d0d;
      border: none; border-radius: 8px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: background 0.15s;
    }
    .as-send:hover { background: #c8392b; }
    .as-send svg { width: 16px; height: 16px; fill: #f7f5f1; }
    .as-send:disabled { opacity: 0.4; cursor: not-allowed; }

    /* footer note */
    .as-footer-note {
      text-align: center;
      font-size: 0.63rem;
      color: rgba(0,0,0,0.3);
      padding-bottom: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
      letter-spacing: 0.05em;
    }

    @media (max-width: 520px) {
      #ask-shreyas-launcher { bottom: 16px; padding: 0.6rem 1.25rem; }
      #ask-shreyas-panel { bottom: 16px; max-height: calc(100vh - 80px); }
    }
  `;
  document.head.appendChild(style);

  // ── Build DOM ─────────────────────────────────────────────────────────────
  const root = document.createElement("div");
  root.id = "ask-shreyas-root";

  // Launcher bar
  root.innerHTML = `
    <div id="ask-shreyas-launcher">
      <span class="launcher-dot"></span>
      <span class="launcher-text">Ask Shreyas</span>
      <span class="launcher-mono">AI · PORTFOLIO</span>
    </div>

    <div id="ask-shreyas-panel">
      <div class="as-header">
        <div class="as-header-left">
          <div class="as-avatar">S</div>
          <div>
            <div class="as-header-name">Ask Shreyas</div>
            <div class="as-header-sub">AI assistant · Usually answers instantly</div>
          </div>
        </div>
        <button class="as-close" id="as-close-btn">✕</button>
      </div>

      <div class="as-messages" id="as-messages"></div>

      <div class="as-starters" id="as-starters"></div>

      <div class="as-input-row">
        <textarea class="as-input" id="as-input" rows="1"
          placeholder="Ask anything about Shreyas…"></textarea>
        <button class="as-send" id="as-send-btn" title="Send">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      <div class="as-footer-note">Powered by Groq · Llama 3</div>
    </div>
  `;
  document.body.appendChild(root);

  // ── Element refs ──────────────────────────────────────────────────────────
  const launcher   = document.getElementById("ask-shreyas-launcher");
  const panel      = document.getElementById("ask-shreyas-panel");
  const closeBtn   = document.getElementById("as-close-btn");
  const messages   = document.getElementById("as-messages");
  const input      = document.getElementById("as-input");
  const sendBtn    = document.getElementById("as-send-btn");
  const startersEl = document.getElementById("as-starters");

  // ── Render starter buttons ────────────────────────────────────────────────
  STARTERS.forEach((q) => {
    const btn = document.createElement("button");
    btn.className = "as-starter-btn";
    btn.textContent = q;
    btn.addEventListener("click", () => {
      sendMessage(q);
      startersEl.style.display = "none";
    });
    startersEl.appendChild(btn);
  });

  // ── Open / close ──────────────────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    launcher.classList.add("hidden");
    if (messages.children.length === 0) addWelcomeMessage();
    setTimeout(() => input.focus(), 250);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
    launcher.classList.remove("hidden");
  }

  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);

  // ── Welcome message ───────────────────────────────────────────────────────
  function addWelcomeMessage() {
    appendMessage(
      "bot",
      "Hey! 👋 I'm Ask Shreyas — I know everything about Shreyas's work, background, and what makes him tick. Ask me anything, whether you're a recruiter, a curious visitor, or just here to see what he's built."
    );
  }

  // ── Message rendering ─────────────────────────────────────────────────────
  function appendMessage(role, text) {
    const wrapper = document.createElement("div");
    wrapper.className = `as-msg ${role}`;
    const bubble = document.createElement("div");
    bubble.className = "as-bubble";
    bubble.textContent = text;
    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  }

  function showTyping() {
    const wrapper = document.createElement("div");
    wrapper.className = "as-msg bot";
    wrapper.id = "as-typing-indicator";
    wrapper.innerHTML = `
      <div class="as-bubble as-typing">
        <span></span><span></span><span></span>
      </div>`;
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById("as-typing-indicator");
    if (el) el.remove();
  }

  // ── Send message ──────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    startersEl.style.display = "none";
    appendMessage("user", trimmed);
    input.value = "";
    input.style.height = "auto";

    isTyping = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      hideTyping();
      appendMessage("bot", data.reply);

      // Update history
      history.push({ role: "user", content: trimmed });
      history.push({ role: "assistant", content: data.reply });
    } catch (err) {
      hideTyping();
      appendMessage(
        "bot",
        "Hmm, something went wrong on my end. Try refreshing, or reach out to Shreyas directly at shreyas.udupa20@gmail.com."
      );
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Input handlers ────────────────────────────────────────────────────────
  sendBtn.addEventListener("click", () => sendMessage(input.value));

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  // Auto-resize textarea
  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 100) + "px";
  });

})();
