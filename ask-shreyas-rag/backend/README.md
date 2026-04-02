pyt# Ask Shreyas — AI Portfolio Chatbot (RAG Edition)

A conversational AI assistant embedded in a personal portfolio website. Answers recruiter and visitor questions about Shreyas Udupa by retrieving relevant passages from his **resume and LinkedIn profile** using a RAG (Retrieval-Augmented Generation) pipeline — powered by **Groq (Llama 3)** for responses and **WhatsApp notifications** via Twilio on every query.

Built as a demonstration of LLM integration, RAG pipeline design, vector search, and full-stack deployment.

---

## Architecture

```
Visitor asks a question
        │
        ▼
  chatbot.js (frontend widget)
  Fixed bottom bar → chat panel
        │  POST /chat  {message, history}
        ▼
  FastAPI backend
  ├── 1. BGE embed query  →  "query: <user question>"
  ├── 2. ChromaDB retrieval  →  Top-5 relevant chunks
  │         (from resume.pdf + linkedin.pdf)
  ├── 3. Inject chunks into system prompt
  ├── 4. Groq API  →  Llama 3 70B  →  generates answer
  └── 5. Twilio  →  WhatsApp notification to Shreyas
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| LLM | Groq API · Llama 3 70B | Fastest free inference |
| Embeddings | BAAI/bge-small-en-v1.5 | Best retrieval accuracy at small size |
| Vector Store | ChromaDB (local, persistent) | Zero infra, runs on disk |
| PDF Parsing | pdfplumber | Clean text extraction |
| Backend | Python · FastAPI · Uvicorn | Fast, typed, async |
| Notifications | Twilio WhatsApp Sandbox | Free tier |
| Frontend | Vanilla JS widget | Zero dependencies |

---

## Project Structure

```
ask-shreyas/
├── backend/
│   ├── main.py              # FastAPI app — RAG pipeline, LLM, notifications
│   ├── ingest.py            # ONE-TIME script: PDFs → chunks → ChromaDB
│   ├── requirements.txt
│   ├── .env.example
│   └── docs/
│       ├── resume.pdf       # Master resume (add your own)
│       └── linkedin.pdf     # LinkedIn export (add your own)
├── frontend/
│   └── chatbot.js           # Self-contained widget — drop into any HTML page
└── README.md
```

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/shrheh20/ask-shreyas.git
cd ask-shreyas/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

> First install takes a few minutes — torch and sentence-transformers are the heavy packages.

### 2. Add your documents

Drop your PDFs into `backend/docs/`:
```
backend/docs/resume.pdf
backend/docs/linkedin.pdf
```
Any PDF filename works — the ingestion script processes everything in the `docs/` folder.

### 3. Configure environment variables

```bash
cp .env.example .env
# Edit .env with your actual keys (see below)
```

**Groq API** (free) — [console.groq.com](https://console.groq.com)
→ Create API key → add as `GROQ_API_KEY`

**Twilio WhatsApp Sandbox** (free) — [twilio.com](https://www.twilio.com)
→ Messaging → Try it out → Send a WhatsApp message
→ Follow sandbox join instructions (send a WhatsApp to their number from your phone)
→ Copy Account SID, Auth Token, sandbox number into `.env`

### 4. Build the vector store (run once)

```bash
python ingest.py
```

Output:
```
Loading embedding model: BAAI/bge-small-en-v1.5 ...
Processing: resume.pdf ... → 42 chunks
Processing: linkedin.pdf ... → 28 chunks
Total chunks: 70
Embedding chunks ...
✓ Vector store built: 70 chunks stored in ./chroma_db
```

Re-run `ingest.py` any time you update a PDF.

### 5. Start the API

```bash
uvicorn main:app --reload --port 8000
```

Test it:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What did Shreyas build at EnterpriseWorks?"}'
```

### 6. Add the widget to your portfolio

Add before `</body>` in `index.html`:
```html
<!-- local dev -->
<script>window.ASK_SHREYAS_API = "http://localhost:8000";</script>
<script src="ask-shreyas/frontend/chatbot.js"></script>
```

---

## Deploying the Backend (free)

### Render (recommended)
1. Push repo to GitHub
2. [render.com](https://render.com) → New Web Service → connect repo
3. Root directory: `backend/`
4. Build command: `pip install -r requirements.txt && python ingest.py`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all env vars in Render dashboard
7. Update `index.html`: `window.ASK_SHREYAS_API = "https://your-app.onrender.com"`

> **Note:** ChromaDB persists to `./chroma_db` on Render's ephemeral disk.
> For production, switch to [Render Persistent Disk](https://render.com/docs/disks) ($1/month) or swap ChromaDB for [Chroma Cloud](https://www.trychroma.com) (free tier).

---

## How RAG Works Here

1. **Ingestion** (`ingest.py`): PDFs are parsed, split into 400-character overlapping chunks, and embedded with `BAAI/bge-small-en-v1.5` using a `"passage: ..."` prefix (BGE's recommended format). Stored in ChromaDB with cosine similarity.

2. **Retrieval** (`main.py`): Each incoming query is embedded with a `"query: ..."` prefix. ChromaDB returns the top-5 most similar chunks (filtered at cosine distance < 0.5 to drop irrelevant results).

3. **Generation**: Retrieved chunks are injected into the system prompt as grounded context. Llama 3 generates an answer constrained to that context + a base knowledge layer of always-available facts.

**Why BGE over MiniLM?** `bge-small-en-v1.5` consistently outperforms `all-MiniLM-L6-v2` on the MTEB retrieval benchmark while being only 130MB — purpose-built for asymmetric search (short query → long passage).

---

## Extending This Project

| Feature | How |
|---|---|
| Streaming responses | Use Groq's streaming API + SSE from FastAPI |
| Query logging | Log to SQLite with `aiosqlite` — add `/analytics` endpoint |
| Analytics dashboard | Build a Tableau/Plotly view of most-asked questions (very on-brand) |
| Re-ranking | Add `cross-encoder/ms-marco-MiniLM-L-6-v2` as a re-ranker after retrieval |
| Multi-language | BGE supports multilingual variants |

---

## License

MIT — fork it, adapt it, make it yours.
