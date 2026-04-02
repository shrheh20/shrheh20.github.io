/**
 * Ask Shreyas — Premium Editorial Modal
 * Centered ivory assistant panel with better hierarchy and composition.
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Fraunces:opsz,wght@9..144,600&display=swap');

    #ask-shreyas-root,
    #ask-shreyas-root * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --as-bg: #f4f1eb;
      --as-modal: #fbf8f2;
      --as-surface: rgba(255,255,255,0.82);
      --as-surface-strong: #ffffff;
      --as-text: #171717;
      --as-muted: #746f68;
      --as-border: rgba(23,23,23,0.07);
      --as-border-strong: rgba(23,23,23,0.10);
      --as-accent: #c63c2f;
      --as-accent-dark: #a92f23;
      --as-shadow-lg: 0 32px 100px rgba(0,0,0,0.18);
      --as-shadow-md: 0 16px 36px rgba(0,0,0,0.07);
      --as-shadow-sm: 0 8px 18px rgba(0,0,0,0.04);
    }

    #ask-shreyas-root {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: var(--as-text);
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
      gap: 0.8rem;
      padding: 0.8rem 1rem 0.8rem 0.82rem;
      border-radius: 999px;
      background: rgba(20,20,20,0.95);
      color: #fff;
      cursor: pointer;
      box-shadow: 0 18px 42px rgba(0,0,0,0.18);
      transition: transform 0.18s ease, opacity 0.18s ease, background 0.18s ease;
      user-select: none;
      backdrop-filter: blur(12px);
    }

    #ask-shreyas-launcher:hover {
      transform: translateX(-50%) translateY(-2px);
      background: rgba(20,20,20,1);
    }

    #ask-shreyas-launcher.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) translateY(10px);
    }

    .as-launcher-mark {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--as-accent) 0%, var(--as-accent-dark) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 700;
      font-size: 0.98rem;
      flex-shrink: 0;
    }

    .as-launcher-copy {
      display: flex;
      flex-direction: column;
      line-height: 1.05;
    }

    .as-launcher-title {
      font-size: 0.92rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .as-launcher-sub {
      margin-top: 0.15rem;
      font-size: 0.63rem;
      color: rgba(255,255,255,0.56);
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
      padding: 22px;
      background: rgba(0,0,0,0.38);
      backdrop-filter: blur(10px);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.22s ease;
    }

    #ask-shreyas-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }

    /* modal */
    #ask-shreyas-modal {
      width: min(720px, 94vw);
      height: min(700px, 86vh);
      background:
        radial-gradient(circle at top center, rgba(255,255,255,0.50), transparent 32%),
        linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02)),
        var(--as-modal);
      border-radius: 30px;
      border: 1px solid rgba(255,255,255,0.58);
      box-shadow: var(--as-shadow-lg);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transform: translateY(16px) scale(0.985);
      transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    #ask-shreyas-overlay.open #ask-shreyas-modal {
      transform: translateY(0) scale(1);
    }

    /* header */
    .as-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.2rem 1.35rem 1rem;
      border-bottom: 1px solid var(--as-border);
      background: rgba(255,255,255,0.40);
      backdrop-filter: blur(8px);
      flex-shrink: 0;
    }

    .as-header-left {
      display: flex;
      align-items: center;
      gap: 0.95rem;
      min-width: 0;
    }

    .as-avatar {
      width: 46px;
      height: 46px;
      border-radius: 15px;
      background: linear-gradient(135deg, var(--as-accent) 0%, var(--as-accent-dark) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.08rem;
      font-weight: 700;
      box-shadow: 0 6px 18px rgba(198,60,47,0.18);
      flex-shrink: 0;
    }

    .as-header-copy {
      min-width: 0;
    }

    .as-header-name {
      font-family: 'Fraunces', serif;
      font-size: 1.28rem;
      line-height: 1;
      font-weight: 600;
      letter-spacing: -0.03em;
      color: var(--as-text);
    }

    .as-header-sub {
      margin-top: 0.28rem;
      font-size: 0.8rem;
      color: var(--as-muted);
      letter-spacing: 0.01em;
    }

    .as-close {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: transparent;
      color: rgba(23,23,23,0.48);
      font-size: 1.5rem;
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease;
      flex-shrink: 0;
    }

    .as-close:hover {
      background: rgba(23,23,23,0.05);
      color: rgba(23,23,23,0.82);
    }

    /* body */
    .as-body {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-rows: auto auto 1fr auto;
      gap: 12px;
      padding: 14px;
      background: transparent;
    }

    /* hero intro bubble */
    .as-messages {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 0;
      overflow-y: auto;
      padding: 2px;
      scroll-behavior: smooth;
    }

    .as-messages::-webkit-scrollbar {
      width: 6px;
    }

    .as-messages::-webkit-scrollbar-thumb {
      background: rgba(23,23,23,0.12);
      border-radius: 999px;
    }

    .as-msg {
      display: flex;
      width: 100%;
      animation: as-fade-up 0.26s ease;
    }

    .as-msg.bot { justify-content: flex-start; }
    .as-msg.user { justify-content: flex-end; }

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
  max-width: min(70%, 420px);
  min-width: 0;
  padding: 1rem 1.15rem;
  border-radius: 20px;
  font-size: 0.97rem;
  line-height: 1.68;
  color: var(--text);
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

    .as-msg.bot .as-bubble {
      background: rgba(255,255,255,0.94);
      border: 1px solid rgba(23,23,23,0.06);
      box-shadow: var(--as-shadow-sm);
      border-top-left-radius: 8px;
      color: var(--as-text);
    }

    .as-msg.user .as-bubble {
      background: linear-gradient(180deg, #181818, #101010);
      color: #fff;
      box-shadow: 0 12px 24px rgba(0,0,0,0.10);
      border-top-right-radius: 8px;
    }
      .as-msg.user .as-bubble {
  margin-left: auto;
}

.as-msg.bot .as-bubble {
  margin-right: auto;
}

    /* empty stage between welcome and prompts */
    .as-stage {
      min-height: 130px;
      border-radius: 22px;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0.10));
      border: 1px solid rgba(23,23,23,0.04);
    }

    /* section label */
    .as-section-label {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.09em;
      color: var(--as-muted);
      padding: 0 4px;
      margin-top: 2px;
    }

    /* starters */
    .as-starters-wrap {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      align-content: start;
    }

    .as-starter-btn {
      text-align: left;
      padding: 14px 16px;
      border: 1px solid rgba(23,23,23,0.07);
      background: rgba(255,255,255,0.88);
      border-radius: 18px;
      min-height: 68px;
      font-size: 0.92rem;
      line-height: 1.4;
      font-weight: 500;
      color: var(--as-text);
      cursor: pointer;
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
      box-shadow: 0 6px 16px rgba(0,0,0,0.035);
      display: flex;
      align-items: center;
    }

    .as-starter-btn:hover {
      transform: translateY(-1px);
      background: rgba(255,255,255,0.98);
      border-color: rgba(198,60,47,0.18);
      box-shadow: 0 12px 24px rgba(0,0,0,0.06);
    }

    .as-starter-btn:active {
      transform: scale(0.985);
    }

    /* dock */
    .as-dock-shell {
      padding-top: 6px;
      background: linear-gradient(180deg, rgba(244,241,235,0), rgba(244,241,235,0.82) 28%, rgba(244,241,235,1));
    }

    .as-dock {
      display: flex;
      align-items: flex-end;
      gap: 0.7rem;
      padding: 8px;
      border-radius: 22px;
      background: rgba(255,255,255,0.88);
      border: 1px solid rgba(23,23,23,0.07);
      box-shadow: var(--as-shadow-md);
      backdrop-filter: blur(8px);
    }

    .as-input {
      flex: 1;
      min-height: 54px;
      max-height: 130px;
      border: none;
      resize: none;
      outline: none;
      background: transparent;
      color: var(--as-text);
      font-size: 0.97rem;
      line-height: 1.52;
      padding: 0.82rem 0.95rem;
    }

    .as-input::placeholder {
      color: rgba(23,23,23,0.40);
    }

    .as-send {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(135deg, #171717, #0f0f0f);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
    }

    .as-send:hover {
      transform: translateY(-1px);
      background: linear-gradient(135deg, var(--as-accent), var(--as-accent-dark));
      box-shadow: 0 10px 20px rgba(198,60,47,0.20);
    }

    .as-send:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .as-send svg {
      width: 18px;
      height: 18px;
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
      background: rgba(23,23,23,0.34);
      animation: as-bounce 1.1s infinite ease-in-out;
    }

    .as-typing span:nth-child(2) { animation-delay: 0.14s; }
    .as-typing span:nth-child(3) { animation-delay: 0.28s; }

    @keyframes as-bounce {
      0%, 80%, 100% {
        transform: translateY(0);
        opacity: 0.38;
      }
      40% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }

    .as-footer-note {
      text-align: center;
      font-size: 0.68rem;
      color: rgba(23,23,23,0.32);
      margin-top: 6px;
    }

    @media (max-width: 760px) {
      #ask-shreyas-modal {
        width: 100%;
        height: 84vh;
        border-radius: 24px;
      }

      .as-body {
        grid-template-rows: auto auto auto 1fr auto;
      }

      .as-stage {
        min-height: 70px;
      }

      .as-starters-wrap {
        grid-template-columns: 1fr;
      }

      .as-bubble {
        max-width: 88%;
      }
    }

    @media (max-width: 520px) {
      #ask-shreyas-overlay {
        padding: 10px;
      }

      #ask-shreyas-launcher {
        bottom: 18px;
      }

      .as-header {
        padding: 1rem 1rem 0.9rem;
      }

      .as-header-name {
        font-size: 1.16rem;
      }

      .as-body {
        padding: 10px;
      }

      .as-starter-btn {
        min-height: 60px;
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

          <div class="as-stage" id="as-stage"></div>

          <div class="as-section-label" id="as-section-label">Suggested questions</div>
          <div class="as-starters-wrap" id="as-starters"></div>

          <div class="as-dock-shell">
            <div class="as-dock">
              <textarea
                class="as-input"
                id="as-input"
                rows="1"
                placeholder="Ask about projects, analyst roles, tools, or business impact..."></textarea>
              <button class="as-send" id="as-send-btn" title="Send" aria-label="Send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
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
  const stage = document.getElementById("as-stage");
  const sectionLabel = document.getElementById("as-section-label");

  STARTERS.forEach((q) => {
    const btn = document.createElement("button");
    btn.className = "as-starter-btn";
    btn.textContent = q;
    btn.addEventListener("click", () => {
      sendMessage(q);
    });
    startersEl.appendChild(btn);
  });

  function openPanel() {
    isOpen = true;
    overlay.classList.add("open");
    launcher.classList.add("hidden");
    document.body.style.overflow = "hidden";
    if (messages.children.length === 0) addWelcomeMessage();
    setTimeout(() => input.focus(), 180);
  }

  function closePanel() {
    isOpen = false;
    overlay.classList.remove("open");
    launcher.classList.remove("hidden");
    document.body.style.overflow = "";
  }

  function hideIntroLayout() {
    stage.style.display = "none";
    sectionLabel.style.display = "none";
    startersEl.style.display = "none";
    messages.style.flex = "1";
    messages.style.maxHeight = "none";
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

    hideIntroLayout();
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