/**
 * Ask Shreyas — Premium Chat Widget v4
 * Features: markdown rendering, premium rounded design, uniform spacing,
 * DM Serif + DM Sans fonts matching portfolio, smooth animations.
 */
(function () {
  const API_BASE = window.ASK_SHREYAS_API || "http://localhost:8000";
  let history = [], isOpen = false, isTyping = false, introVisible = true;

  const STARTERS = [
    "What is Shreyas currently working on?",
    "Walk me through his most impactful project.",
    "What's his visa status and availability?",
    "Why should I hire Shreyas?",
    "What's his experience with SQL and Python?",
  ];

  /* ── Fonts ── */
  const fl = document.createElement("link");
  fl.rel = "stylesheet";
  fl.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=JetBrains+Mono:wght@400;500&display=swap";
  document.head.appendChild(fl);

  /* ── Simple markdown renderer ── */
  function renderMarkdown(text) {
    let html = text
      // Escape HTML first
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      // Bold **text**
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
      // Italic *text*
      .replace(/\*([^*\n]+?)\*/g,"<em>$1</em>")
      // Headers ### ## #
      .replace(/^### (.+)$/gm,"<h4>$1</h4>")
      .replace(/^## (.+)$/gm,"<h3>$1</h3>")
      .replace(/^# (.+)$/gm,"<h2>$1</h2>")
      // Numbered lists
      .replace(/^\d+\. (.+)$/gm,"<li class='ol-item'>$1</li>")
      // Bullet lists - + *
      .replace(/^[-•] (.+)$/gm,"<li>$1</li>")
      // Wrap consecutive <li> in <ul>
      .replace(/(<li(?:\s[^>]*)?>[\s\S]*?<\/li>)\n?(?=<li)/g,"$1")
      // Paragraphs — blank line separation
      .split(/\n\n+/)
      .map(block => {
        block = block.trim();
        if (!block) return "";
        if (block.startsWith("<h") || block.startsWith("<li") || block.startsWith("<ul") || block.startsWith("<ol")) return block;
        if (block.includes("<li")) {
          if (block.includes("ol-item")) return `<ol>${block.replace(/class='ol-item'/g,"")}</ol>`;
          return `<ul>${block}</ul>`;
        }
        return `<p>${block.replace(/\n/g,"<br>")}</p>`;
      })
      .join("");
    return html;
  }

  /* ── Styles ── */
  const S = document.createElement("style");
  S.textContent = `
  #asr,#asr * { box-sizing:border-box; margin:0; padding:0; }
  #asr {
    --paper:  #f7f5f1;
    --paper2: #eeeae3;
    --white:  #ffffff;
    --ink:    #0d0d0d;
    --mid:    #3a3a3a;
    --soft:   #717171;
    --red:    #c8392b;
    --red2:   #a82f23;
    --rule:   rgba(13,13,13,0.08);
    --rule2:  rgba(13,13,13,0.14);
    --serif:  'DM Serif Display',Georgia,serif;
    --sans:   'DM Sans',system-ui,sans-serif;
    --mono:   'JetBrains Mono',monospace;
    --r-sm:   10px;
    --r-md:   16px;
    --r-lg:   20px;
    --r-xl:   24px;
    --sp:     20px;
    font-family: var(--sans);
  }

  /* ── LAUNCHER ── */
  #asr-launcher {
    position:fixed; bottom:28px; left:50%;
    transform:translateX(-50%);
    z-index:9990;
    display:inline-flex; align-items:center; gap:10px;
    padding:12px 22px 12px 16px;
    background:var(--ink);
    color:var(--paper);
    border-radius:100px;
    cursor:pointer;
    box-shadow:0 8px 32px rgba(0,0,0,0.2);
    transition:background .2s, transform .2s, box-shadow .2s;
    user-select:none; white-space:nowrap;
  }
  #asr-launcher:hover {
    background:var(--red);
    transform:translateX(-50%) translateY(-3px);
    box-shadow:0 12px 36px rgba(200,57,43,0.3);
  }
  #asr-launcher.hidden { opacity:0; pointer-events:none; transform:translateX(-50%) translateY(10px); }

  .asr-l-dot {
    width:8px; height:8px; border-radius:50%; background:#4ade80;
    animation:asr-pulse 2s infinite; flex-shrink:0;
  }
  @keyframes asr-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.75)} }
  .asr-l-label { font-size:.82rem; font-weight:500; letter-spacing:.04em; }
  .asr-l-tag {
    font-family:var(--mono); font-size:.6rem;
    color:rgba(247,245,241,.38); letter-spacing:.12em;
  }

  /* ── OVERLAY ── */
  #asr-overlay {
    position:fixed; inset:0; z-index:9991;
    display:flex; align-items:center; justify-content:center;
    padding:20px;
    background:rgba(0,0,0,0);
    backdrop-filter:blur(0px);
    pointer-events:none;
    transition:background .25s ease, backdrop-filter .25s ease;
  }
  #asr-overlay.open {
    background:rgba(0,0,0,0.28);
    backdrop-filter:blur(8px);
    pointer-events:auto;
  }

  /* ── MODAL ── */
  #asr-modal {
    width:min(580px, calc(100vw - 40px));
    height:min(660px, calc(100vh - 80px));
    background:var(--paper);
    border:1px solid var(--rule2);
    border-radius:var(--r-xl);
    box-shadow:
      0 2px 4px rgba(0,0,0,0.04),
      0 8px 24px rgba(0,0,0,0.08),
      0 32px 64px rgba(0,0,0,0.12);
    display:flex; flex-direction:column; overflow:hidden;
    opacity:0; transform:translateY(20px) scale(.97);
    transition:opacity .25s ease, transform .25s cubic-bezier(.2,.8,.2,1);
  }
  #asr-overlay.open #asr-modal { opacity:1; transform:translateY(0) scale(1); }

  /* ── HEADER ── */
  .asr-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:18px var(--sp) 16px;
    border-bottom:1px solid var(--rule);
    background:var(--white);
    flex-shrink:0;
    border-radius:var(--r-xl) var(--r-xl) 0 0;
  }
  .asr-header-left { display:flex; align-items:center; gap:12px; }
  .asr-avatar {
    width:38px; height:38px; border-radius:12px;
    background:linear-gradient(135deg, var(--red), var(--red2));
    display:flex; align-items:center; justify-content:center;
    font-family:var(--serif); font-size:1.15rem; color:#fff;
    flex-shrink:0;
    box-shadow:0 4px 12px rgba(200,57,43,0.25);
  }
  .asr-hname { font-family:var(--serif); font-size:1.1rem; line-height:1.1; color:var(--ink); }
  .asr-hsub {
    font-family:var(--mono); font-size:.58rem;
    letter-spacing:.14em; text-transform:uppercase;
    color:var(--soft); margin-top:3px;
  }
  .asr-close {
    width:32px; height:32px; border-radius:10px;
    border:1px solid var(--rule2); background:transparent;
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    font-size:.85rem; color:var(--soft);
    transition:all .15s;
  }
  .asr-close:hover { background:var(--ink); color:var(--paper); border-color:var(--ink); }

  /* ── BODY ── */
  .asr-body { flex:1; min-height:0; display:flex; flex-direction:column; overflow:hidden; }

  /* ── INTRO ── */
  .asr-intro {
    flex:1; display:flex; flex-direction:column;
    padding:var(--sp); gap:16px; overflow:hidden;
    background:var(--paper);
  }
  .asr-intro-card {
    background:var(--white);
    border:1px solid var(--rule);
    border-radius:var(--r-md);
    padding:14px 16px;
    font-size:.875rem; line-height:1.7; color:var(--mid);
    flex-shrink:0;
  }
  .asr-intro-card strong { color:var(--ink); font-weight:500; }
  .asr-starters-label {
    font-family:var(--mono); font-size:.6rem;
    letter-spacing:.16em; text-transform:uppercase;
    color:var(--soft); flex-shrink:0; padding:0 2px;
  }
  .asr-starters { display:flex; flex-direction:column; gap:6px; flex:1; overflow-y:auto; padding:2px; }
  .asr-starters::-webkit-scrollbar { width:3px; }
  .asr-starters::-webkit-scrollbar-thumb { background:var(--rule2); border-radius:4px; }

  .asr-starter {
    display:flex; align-items:center; gap:10px;
    padding:11px 14px;
    background:var(--white);
    border:1px solid var(--rule);
    border-radius:var(--r-sm);
    cursor:pointer; text-align:left;
    font-family:var(--sans); font-size:.84rem; color:var(--mid);
    transition:all .15s; line-height:1.4;
  }
  .asr-starter:hover {
    background:var(--ink); color:var(--paper);
    border-color:var(--ink);
    transform:translateX(2px);
  }
  .asr-starter-icon {
    width:22px; height:22px; border-radius:6px;
    background:var(--paper2); display:flex; align-items:center; justify-content:center;
    font-size:.7rem; flex-shrink:0; transition:background .15s;
    color:var(--red); font-weight:500;
  }
  .asr-starter:hover .asr-starter-icon { background:rgba(255,255,255,.12); color:#fff; }

  /* ── MESSAGES ── */
  .asr-messages {
    flex:1; min-height:0; overflow-y:auto;
    padding:var(--sp); display:flex; flex-direction:column; gap:14px;
    scroll-behavior:smooth; background:var(--paper);
  }
  .asr-messages::-webkit-scrollbar { width:4px; }
  .asr-messages::-webkit-scrollbar-thumb { background:var(--rule2); border-radius:4px; }

  .asr-msg { display:flex; animation:asr-up .2s ease; }
  .asr-msg.bot  { justify-content:flex-start; }
  .asr-msg.user { justify-content:flex-end; }
  @keyframes asr-up {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .asr-bubble {
    max-width:82%; padding:12px 16px;
    font-size:.865rem; line-height:1.7;
    border-radius:var(--r-md);
  }
  .asr-msg.bot .asr-bubble {
    background:var(--white);
    border:1px solid var(--rule);
    color:var(--mid);
    border-bottom-left-radius:4px;
  }
  .asr-msg.user .asr-bubble {
    background:var(--ink);
    color:var(--paper);
    border-bottom-right-radius:4px;
  }

  /* Markdown styles inside bot bubbles */
  .asr-bubble p { margin:0 0 8px; }
  .asr-bubble p:last-child { margin-bottom:0; }
  .asr-bubble strong { color:var(--ink); font-weight:500; }
  .asr-bubble h2,.asr-bubble h3,.asr-bubble h4 {
    font-family:var(--serif); font-weight:400;
    color:var(--ink); margin:10px 0 4px;
    line-height:1.2;
  }
  .asr-bubble h2 { font-size:1rem; }
  .asr-bubble h3 { font-size:.95rem; }
  .asr-bubble h4 { font-size:.9rem; }
  .asr-bubble ul,.asr-bubble ol { padding-left:18px; margin:6px 0; }
  .asr-bubble li { margin-bottom:4px; }
  .asr-bubble br { line-height:1.9; }
  /* user bubble — no markdown colours */
  .asr-msg.user .asr-bubble strong { color:inherit; }
  .asr-msg.user .asr-bubble h2,
  .asr-msg.user .asr-bubble h3,
  .asr-msg.user .asr-bubble h4 { color:inherit; font-family:var(--sans); }

  /* typing dots */
  .asr-typing { display:inline-flex; gap:5px; align-items:center; padding:2px 0; }
  .asr-typing span {
    width:5px; height:5px; border-radius:50%; background:var(--soft);
    animation:asr-bounce 1.1s infinite;
  }
  .asr-typing span:nth-child(2){ animation-delay:.14s; }
  .asr-typing span:nth-child(3){ animation-delay:.28s; }
  @keyframes asr-bounce {
    0%,80%,100%{ transform:translateY(0); opacity:.35; }
    40%{ transform:translateY(-4px); opacity:1; }
  }

  /* ── INPUT AREA ── */
  .asr-input-area {
    padding:12px var(--sp) var(--sp);
    border-top:1px solid var(--rule);
    background:var(--white);
    flex-shrink:0;
    border-radius:0 0 var(--r-xl) var(--r-xl);
  }
  .asr-input-row {
    display:flex; gap:8px; align-items:flex-end;
    background:var(--paper);
    border:1px solid var(--rule2);
    border-radius:var(--r-md);
    padding:8px 8px 8px 14px;
    transition:border-color .15s;
  }
  .asr-input-row:focus-within { border-color:rgba(13,13,13,.25); }
  .asr-input {
    flex:1; border:none; background:transparent; outline:none; resize:none;
    font-family:var(--sans); font-size:.875rem; color:var(--ink);
    line-height:1.55; max-height:100px; padding:2px 0;
  }
  .asr-input::placeholder { color:var(--soft); }
  .asr-send {
    width:34px; height:34px; flex-shrink:0; border-radius:10px;
    background:var(--ink); border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:background .15s, transform .15s;
  }
  .asr-send:hover { background:var(--red); transform:scale(1.05); }
  .asr-send:disabled { opacity:.3; cursor:not-allowed; transform:none; }
  .asr-send svg { width:14px; height:14px; stroke:var(--paper); fill:none; }

  .asr-footer {
    text-align:center; margin-top:8px;
    font-family:var(--mono); font-size:.58rem;
    letter-spacing:.08em; color:rgba(13,13,13,.22);
  }

  @media(max-width:520px){
    #asr-modal { height:calc(100vh - 48px); border-radius:var(--r-lg); }
    .asr-header { border-radius:var(--r-lg) var(--r-lg) 0 0; }
    .asr-input-area { border-radius:0 0 var(--r-lg) var(--r-lg); }
    #asr-launcher { bottom:16px; }
    .asr-bubble { max-width:90%; }
  }
  `;
  document.head.appendChild(S);

  /* ── DOM ── */
  const root = document.createElement("div");
  root.id = "asr";
  root.innerHTML = `
    <div id="asr-launcher">
      <span class="asr-l-dot"></span>
      <span class="asr-l-label">Ask Shreyas</span>
      <span class="asr-l-tag">AI</span>
    </div>

    <div id="asr-overlay">
      <div id="asr-modal" role="dialog" aria-modal="true">

        <div class="asr-header">
          <div class="asr-header-left">
            <div class="asr-avatar">S</div>
            <div>
              <div class="asr-hname">Ask Shreyas</div>
              <div class="asr-hsub">AI · Portfolio Assistant</div>
            </div>
          </div>
          <button class="asr-close" id="asr-close">✕</button>
        </div>

        <div class="asr-body">
          <div class="asr-intro" id="asr-intro">
            <div class="asr-intro-card">
              Hi — I know everything about Shreyas's work, background, and skills.
              Ask me anything, or pick a question below to get started.
            </div>
            <div class="asr-starters-label">Suggested questions</div>
            <div class="asr-starters" id="asr-starters"></div>
          </div>
          <div class="asr-messages" id="asr-messages" style="display:none"></div>
        </div>

        <div class="asr-input-area">
          <div class="asr-input-row">
            <textarea class="asr-input" id="asr-input" rows="1"
              placeholder="Ask about projects, skills, experience, or fit…"></textarea>
            <button class="asr-send" id="asr-send" title="Send">
              <svg viewBox="0 0 24 24" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <div class="asr-footer">Powered by Groq · RAG · Llama 3</div>
        </div>

      </div>
    </div>
  `;
  document.body.appendChild(root);

  /* ── Refs ── */
  const launcher   = document.getElementById("asr-launcher");
  const overlay    = document.getElementById("asr-overlay");
  const closeBtn   = document.getElementById("asr-close");
  const intro      = document.getElementById("asr-intro");
  const startersEl = document.getElementById("asr-starters");
  const messagesEl = document.getElementById("asr-messages");
  const inputEl    = document.getElementById("asr-input");
  const sendBtn    = document.getElementById("asr-send");

  /* ── Starters ── */
  const icons = ["→","→","→","→","→"];
  STARTERS.forEach((q, i) => {
    const btn = document.createElement("button");
    btn.className = "asr-starter";
    btn.innerHTML = `<span class="asr-starter-icon">${icons[i]}</span>${q}`;
    btn.addEventListener("click", () => sendMessage(q));
    startersEl.appendChild(btn);
  });

  /* ── Open/close ── */
  function open() {
    isOpen = true;
    overlay.classList.add("open");
    launcher.classList.add("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => inputEl.focus(), 220);
  }
  function close() {
    isOpen = false;
    overlay.classList.remove("open");
    launcher.classList.remove("hidden");
    document.body.style.overflow = "";
  }
  launcher.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen) close(); });

  function showChat() {
    if (!introVisible) return;
    introVisible = false;
    intro.style.display = "none";
    messagesEl.style.display = "flex";
  }

  /* ── Messages ── */
  function appendMsg(role, text) {
    const w = document.createElement("div");
    w.className = `asr-msg ${role}`;
    const b = document.createElement("div");
    b.className = "asr-bubble";
    if (role === "bot") {
      b.innerHTML = renderMarkdown(text);
    } else {
      b.textContent = text;
    }
    w.appendChild(b);
    messagesEl.appendChild(w);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const w = document.createElement("div");
    w.className = "asr-msg bot"; w.id = "asr-typing";
    w.innerHTML = `<div class="asr-bubble"><div class="asr-typing"><span></span><span></span><span></span></div></div>`;
    messagesEl.appendChild(w);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    const el = document.getElementById("asr-typing");
    if (el) el.remove();
  }

  /* ── Send ── */
  async function sendMessage(text) {
    const q = text.trim();
    if (!q || isTyping) return;
    showChat();
    appendMsg("user", q);
    inputEl.value = ""; inputEl.style.height = "auto";
    isTyping = true; sendBtn.disabled = true;
    showTyping();
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ message: q, history }),
      });
      if (!res.ok) throw new Error(res.status);
      const data = await res.json();
      hideTyping();
      appendMsg("bot", data.reply);
      history.push({ role:"user", content:q });
      history.push({ role:"assistant", content:data.reply });
    } catch {
      hideTyping();
      appendMsg("bot", "Something went wrong. Email **shreyas.udupa20@gmail.com** directly.");
    } finally {
      isTyping = false; sendBtn.disabled = false; inputEl.focus();
    }
  }

  sendBtn.addEventListener("click", () => sendMessage(inputEl.value));
  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(inputEl.value); }
  });
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + "px";
  });
})();
