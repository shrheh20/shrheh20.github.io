/**
 * Ask Shreyas — Premium Center Modal Chat Widget
 * Clean, minimal, and polished UI with 5px boundary padding.
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

    #ask-shreyas-root,
    #ask-shreyas-root * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg: #F7F5F0;
      --modal-bg: #FDFBF7;
      --surface: #FFFFFF;
      --text: #161616;
      --muted: #6F6B64;
      --border: rgba(0,0,0,0.07);
      --accent: #C8392B;
      --accent-dark: #A82E22;
      --black: #111111;
      --shadow-sm: 0 10px 24px rgba(0,0,0,0.05);
      --shadow-md: 0 16px 40px rgba(0,0,0,0.08);
      --shadow-lg: 0 32px 90px rgba(0,0,0,0.20);
    }

    #ask-shreyas-root {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* launcher */
    #ask-shreyas-launcher {
      position: fixed;
      left: 50%;
      bottom: 28px;
      transform: translateX(-50%);
      z-index: 9998;
      display: inline-flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.78rem 1.05rem 0.78rem 0.85rem;
      border-radius: 999px;
      background: rgba(17,17,17,0.96);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 18px 44px rgba(0,0,0,0.18);
      transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
      user-select: none;
      backdrop-filter: blur(10px);
    }

    #ask-shreyas-launcher:hover {
      transform: translateX(-50%) translateY(-2px);
      background: rgba(17,17,17,1);
    }

    #ask-shreyas-launcher.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) translateY(10px);
    }

    .as-launcher-mark {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent), var(--accent-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .as-launcher-copy {
      display: flex;
      flex-direction: column;
      line-height: 1.05;
    }

    .as-launcher-title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.94rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .as-launcher-sub {
      margin-top: 0.14rem;
      font-size: 0.64rem;
      color: rgba(255,255,255,0.58);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    /* overlay */
    #ask-shreyas-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.42);
      backdrop-filter: blur(10px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.24s ease;
      padding: 20px;
    }

    #ask-shreyas-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    /* modal */
    #ask-shreyas-modal {
      width: min(700px, 94vw);
      height: min(780px, 90vh);
      background: var(--modal-bg);
      border-radius: 28px;
      border: 1px solid rgba(255,255,255,0.55);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(16px) scale(0.98);
      transition: transform 0.24s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    #ask-shreyas-overlay.open #ask-shreyas-modal {
      transform: translateY(0) scale(1);
    }

    /* header */
    .as-header {
      padding: 1.2rem 1.35rem 1rem;
      border-bottom: 1px solid var(--border);
      background: rgba(255,255,255,0.76);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-shrink: 0;
    }

    .as-header-left {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      min-width: 0;
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
      font-size: 1.08rem;
      font-weight: 700;
      box-shadow: 0 6px 18px rgba(200,57,43,0.20);
      flex-shrink: 0;
    }

    .as-header-copy {
      min-width: 0;
    }

    .as-header-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 1.28rem;
      font-weight: 600;
      letter-spacing: -0.03em;
      color: var(--text);
    }

    .as-header-sub {
      font-size: 0.82rem;
      color: var(--muted);
      margin-top: 0.12rem;
    }

    .as-close {
      width: 40px;
      height: 40px;
      border: none;
      background: transparent;
      font-size: 1.5rem;
      color: #8A8A8A;
      cursor: pointer;
      border-radius: 12px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .as-close:hover {
      background: rgba(0,0,0,0.05);
      color: #333;
    }

    /* body */
    .as-body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
      padding: 5px;
      background:
        radial-gradient(circle at top center, rgba(255,255,255,0.55), transparent 34%),
        linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.05)),
        var(--bg);
    }

    /* messages */
    .as-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.95rem;
      padding: 5px;
      scroll-behavior: smooth;
    }

    .as-messages::-webkit-scrollbar {
      width: 6px;
    }

    .as-messages::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.14);
      border-radius: 999px;
    }

    .as-msg {
      display: flex;
      width: 100%;
      animation: as-fade-up 0.28s ease;
    }

    .as-msg.bot {
      justify-content: flex-start;
    }

    .as-msg.user {
      justify-content: flex-end;
    }

    @keyframes as-fade-up {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .as-bubble {
      max-width: min(82%, 470px);
      padding: 1rem 1.15rem;
      border-radius: 20px;
      font-size: 0.97rem;
      line-height: 1.68;
      color: var(--text);
      word-break: break-word;
      white-space: pre-wrap;
    }

    .as-msg.bot .as-bubble {
      background: var(--surface);
      border: 1px solid var(--border);
      border-top-left-radius: 8px;
      box-shadow: var(--shadow-sm);
    }

    .as-msg.user .as-bubble {
      background: linear-gradient(180deg, #161616, #0F0F0F);
      color: #fff;
      border-top-right-radius: 8px;
      box-shadow: 0 10px 22px rgba(0,0,0,0.10);
    }

    /* typing */
    .as-typing {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      min-height: 20px;
    }

    .as-typing span {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: rgba(0,0,0,0.36);
      animation: as-bounce 1.15s infinite ease-in-out;
    }

    .as-typing span:nth-child(2) { animation-delay: 0.14s; }
    .as-typing span:nth-child(3) { animation-delay: 0.28s; }

    @keyframes as-bounce {
      0%, 80%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      40% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }

    /* starters */
    .as-starters-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.65rem;
      padding: 5px;
      flex-shrink: 0;
    }

    .as-starter-btn {
      text-align: left;
      padding: 0.85rem 0.9rem;
      border: 1px solid var(--border);
      background: var(--surface);
      border-radius: 18px;
      font-size: 0.88rem;
      line-height: 1.45;
      color: var(--text);
      cursor: pointer;
      transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      min-height: 0;
    }

    .as-starter-btn:hover {
      transform: translateY(-2px);
      border-color: rgba(200,57,43,0.28);
      box-shadow: 0 12px 24px rgba(0,0,0,0.07);
    }

    /* dock */
    .as-dock-wrap {
      position: sticky;
      bottom: 0;
      padding: 5px;
      background: linear-gradient(180deg, rgba(247,245,240,0), rgba(247,245,240,0.82) 22%, rgba(247,245,240,1));
      flex-shrink: 0;
    }

    .as-dock {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 5px;
      margin: 5px;
      display: flex;
      align-items: flex-end;
      gap: 0.7rem;
      box-shadow: var(--shadow-md);
    }

    .as-input {
      flex: 1;
      max-height: 130px;
      resize: none;
      border: none;
      outline: none;
      font-size: 0.97rem;
      line-height: 1.55;
      padding: 0.78rem 0.92rem;
      background: transparent;
      color: var(--text);
    }

    .as-input::placeholder {
      color: #9A9A9A;
    }

    .as-send {
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #151515, #0F0F0F);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
      flex-shrink: 0;
    }

    .as-send:hover {
      background: linear-gradient(135deg, var(--accent), var(--accent-dark));
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(200,57,43,0.22);
    }

    .as-send:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .as-footer-note {
      text-align: center;
      font-size: 0.68rem;
      color: #A5A5A5;
      margin-top: 4px;
      padding-bottom: 2px;
    }

    /* responsive */
    @media (max-width: 720px) {
      #ask-shreyas-modal {
        width: 100%;
        height: 92vh;
        border-radius: 22px;
      }

      .as-starters-wrap {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 520px) {
      #ask-shreyas-overlay {
        padding: 10px;
      }

      #ask-shreyas-launcher {
        bottom: 18px;
        padding: 0.72rem 0.98rem 0.72rem 0.82rem;
      }

      .as-header {
        padding: 1rem 1rem 0.9rem;
      }

      .as-header-name {
        font-size: 1.18rem;
      }

      .as-body {
        padding: 5px;
      }
    }
  `;
  document.head.appendChild(style);

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
            <div class="as-header-copy">
              <div class="as-header-name">Ask Shreyas</div>
              <div class="as-header-sub">Projects, impact, fit, and technical depth</div>
            </div>
          </div>
          <button class="as-close" id="as-close-btn" aria-label="Close chat">✕</button>
        </div>

        <div class="as-body">
          <div class="as-messages" id="as-messages"></div>

          <div class="as-starters-wrap" id="as-starters"></div>

          <div class="as-dock-wrap">
            <div class="as-dock">
              <textarea
                class="as-input"
                id="as-input"
                rows="1"
                placeholder="Ask about projects, analyst roles, tools, or business impact..."></textarea>
              <button class="as-send" id="as-send-btn" title="Send" aria-label="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
            <div class="as-footer-note">Powered by Groq · RAG · Llama</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);

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
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closePanel();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) closePanel();
  });

  function addWelcomeMessage() {
    appendMessage(
      "bot",
      "Hi — I’m Ask Shreyas. Ask about his projects, technical skills, business impact, or fit for analyst roles."
    );
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
    wrapper.innerHTML = `
      <div class="as-bubble">
        <div class="as-typing"><span></span><span></span><span></span></div>
      </div>`;
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

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();

      hideTyping();
      appendMessage("bot", data.reply);

      history.push({ role: "user", content: trimmed });
      history.push({ role: "assistant", content: data.reply });
    } catch (err) {
      hideTyping();
      appendMessage(
        "bot",
        "Something went wrong. Please try again or email shreyas.udupa20@gmail.com."
      );
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