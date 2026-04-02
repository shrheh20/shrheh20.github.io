/**
 * Ask Shreyas — Modern Chat Widget
 * Clean, premium, and professional design
 */

(function () {
  const API_BASE = window.ASK_SHREYAS_API || "http://localhost:8000";

  let history = [];
  let isOpen = false;
  let isTyping = false;

  const STARTERS = [
    "What has Shreyas built at EnterpriseWorks?",
    "Is Shreyas open to relocation?",
    "What's Shreyas's visa status?",
    "Why should I hire Shreyas?",
    "What tools does Shreyas use?"
  ];

  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600&display=swap');

    #ask-shreyas-root, #ask-shreyas-root * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg: #F9F9F8;
      --modal-bg: #FFFFFF;
      --text: #1A1A1A;
      --muted: #666666;
      --border: rgba(0,0,0,0.07);
      --accent: #2563EB;
      --accent-dark: #1E40AF;
      --shadow-sm: 0 10px 30px -10px rgba(0,0,0,0.1);
      --shadow-lg: 0 30px 70px -15px rgba(0,0,0,0.18);
    }

    #ask-shreyas-root {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    /* Launcher */
    #ask-shreyas-launcher {
      position: fixed;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%);
      z-index: 9998;
      display: inline-flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.75rem 1.05rem 0.75rem 0.85rem;
      border-radius: 9999px;
      background: #111111;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 20px 50px -10px rgba(0,0,0,0.25);
      transition: all 0.2s ease;
      user-select: none;
      backdrop-filter: blur(12px);
    }

    #ask-shreyas-launcher:hover {
      transform: translateX(-50%) translateY(-3px);
      background: #1A1A1A;
    }

    .as-launcher-mark {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.05rem;
      flex-shrink: 0;
    }

    .as-launcher-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .as-launcher-sub {
      font-size: 0.64rem;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-top: 0.1rem;
    }

    /* Overlay & Modal */
    #ask-shreyas-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.45);
      backdrop-filter: blur(12px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease;
      padding: 20px;
    }

    #ask-shreyas-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    #ask-shreyas-modal {
      width: min(680px, 94vw);
      height: min(760px, 88vh);
      background: var(--modal-bg);
      border-radius: 24px;
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: scale(0.96) translateY(20px);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    #ask-shreyas-overlay.open #ask-shreyas-modal {
      transform: scale(1) translateY(0);
    }

    /* Header */
    .as-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border);
      background: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    .as-avatar {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--accent), var(--accent-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.15rem;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }

    .as-header-name {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .as-header-sub {
      font-size: 0.82rem;
      color: var(--muted);
      margin-top: 0.1rem;
    }

    .as-close {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: #888;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .as-close:hover {
      background: #f5f5f5;
      color: #333;
    }

    /* Body */
    .as-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      padding: 1.4rem 1.4rem 1rem;
      gap: 1rem;
      min-height: 0;
    }

    .as-messages {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-right: 0.5rem;
      scroll-behavior: smooth;
    }

    .as-messages::-webkit-scrollbar {
      width: 6px;
    }

    .as-messages::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.15);
      border-radius: 999px;
    }

    /* Messages */
    .as-msg {
      display: flex;
      width: 100%;
    }

    .as-msg.bot { justify-content: flex-start; }
    .as-msg.user { justify-content: flex-end; }

    .as-bubble {
      max-width: 82%;
      padding: 1rem 1.2rem;
      border-radius: 20px;
      font-size: 0.97rem;
      line-height: 1.65;
      word-break: break-word;
    }

    .as-msg.bot .as-bubble {
      background: white;
      border: 1px solid var(--border);
      border-top-left-radius: 6px;
      box-shadow: var(--shadow-sm);
    }

    .as-msg.user .as-bubble {
      background: #111111;
      color: white;
      border-top-right-radius: 6px;
    }

    /* Starters */
    .as-starters-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.8rem;
      padding: 0.2rem 0;
    }

    .as-starter-btn {
      text-align: left;
      padding: 1rem 1.1rem;
      border: 1px solid var(--border);
      background: white;
      border-radius: 18px;
      font-size: 0.88rem;
      line-height: 1.45;
      cursor: pointer;
      transition: all 0.22s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
    }

    .as-starter-btn:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
      box-shadow: 0 10px 25px rgba(37,99,235,0.12);
    }

    /* Input Area */
    .as-dock {
      background: white;
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 0.7rem;
      display: flex;
      align-items: end;
      gap: 0.7rem;
      box-shadow: var(--shadow-sm);
    }

    .as-input {
      flex: 1;
      max-height: 130px;
      resize: none;
      border: none;
      outline: none;
      font-size: 0.97rem;
      line-height: 1.55;
      padding: 0.75rem 0.9rem;
      background: transparent;
    }

    .as-input::placeholder {
      color: #999;
    }

    .as-send {
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 14px;
      background: #111;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .as-send:hover {
      background: var(--accent);
      transform: translateY(-1px);
    }

    .as-footer-note {
      text-align: center;
      font-size: 0.68rem;
      color: #aaa;
      margin-top: 6px;
    }

    /* Responsive */
    @media (max-width: 720px) {
      #ask-shreyas-modal {
        width: 100%;
        height: 92vh;
        border-radius: 20px;
      }
      .as-starters-wrap {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);

  // Rest of your JavaScript remains exactly the same
  const root = document.createElement("div");
  root.id = "ask-shreyas-root";

  root.innerHTML = `
    <div id="ask-shreyas-launcher">
      <div class="as-launcher-mark">S</div>
      <div class="as-launcher-copy">
        <div class="as-launcher-title">Ask Shreyas</div>
        <div class="as-launcher-sub">AI portfolio assistant</div>
      </div>
    </div>

    <div id="ask-shreyas-overlay">
      <div id="ask-shreyas-modal" role="dialog" aria-modal="true" aria-label="Ask Shreyas chat">
        <div class="as-header">
          <div class="as-header-left">
            <div class="as-avatar">S</div>
            <div>
              <div class="as-header-name">Ask Shreyas</div>
              <div class="as-header-sub">Projects, impact, fit, and technical depth</div>
            </div>
          </div>
          <button class="as-close" id="as-close-btn" aria-label="Close chat">✕</button>
        </div>

        <div class="as-body">
          <div class="as-messages" id="as-messages"></div>

          <div class="as-starters-wrap" id="as-starters"></div>

          <div class="as-dock">
            <textarea class="as-input" id="as-input" rows="1"
              placeholder="Ask about projects, analyst roles, tools, or business impact..."></textarea>
            <button class="as-send" id="as-send-btn" title="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <div class="as-footer-note">Powered by Groq · RAG · Llama</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  // ==================== JS Logic (unchanged) ====================
  const launcher = document.getElementById("ask-shreyas-launcher");
  const overlay = document.getElementById("ask-shreyas-overlay");
  const closeBtn = document.getElementById("as-close-btn");
  const messages = document.getElementById("as-messages");
  const input = document.getElementById("as-input");
  const sendBtn = document.getElementById("as-send-btn");
  const startersEl = document.getElementById("as-starters");

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

  function openPanel() {
    isOpen = true;
    overlay.classList.add("open");
    launcher.classList.add("hidden");
    document.body.style.overflow = "hidden";
    if (messages.children.length === 0) addWelcomeMessage();
    setTimeout(() => input.focus(), 200);
  }

  function closePanel() {
    isOpen = false;
    overlay.classList.remove("open");
    launcher.classList.remove("hidden");
    document.body.style.overflow = "";
  }

  launcher.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePanel(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) closePanel(); });

  function addWelcomeMessage() {
    appendMessage("bot", "Hi — I’m Ask Shreyas. Ask about his projects, technical skills, business impact, or fit for analyst roles.");
  }

  function appendMessage(role, text) {
    const wrapper = document.createElement("div");
    wrapper.className = `as-msg ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "as-bubble";
    bubble.textContent = text;

    wrapper.appendChild(bubble);
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const wrapper = document.createElement("div");
    wrapper.className = "as-msg bot";
    wrapper.id = "as-typing-indicator";
    wrapper.innerHTML = `<div class="as-bubble"><div class="as-typing">●●●</div></div>`;
    messages.appendChild(wrapper);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById("as-typing-indicator");
    if (el) el.remove();
  }

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

      const data = await res.json();
      hideTyping();
      appendMessage("bot", data.reply);

      history.push({ role: "user", content: trimmed });
      history.push({ role: "assistant", content: data.reply });
    } catch (err) {
      hideTyping();
      appendMessage("bot", "Something went wrong. Please try again or email shreyas.udupa20@gmail.com.");
    } finally {
      isTyping = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  sendBtn.addEventListener("click", () => sendMessage(input.value));

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 130) + "px";
  });
})();