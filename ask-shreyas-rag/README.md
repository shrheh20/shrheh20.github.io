# Ask Shreyas — AI Portfolio Chatbot

A lean RAG-powered conversational AI embedded in a personal portfolio. Answers recruiter and visitor questions about Shreyas Udupa by retrieving relevant passages from a structured knowledge base, his resume, and LinkedIn profile.

Demonstrates: LLM integration, RAG pipeline design, vector search, metadata-aware retrieval routing, and FastAPI deployment.

---

## Architecture

```
Visitor asks a question
        │
        ▼
  chatbot.js  (frontend widget — fixed bottom bar)
        │  POST /chat
        ▼
  FastAPI backend (runtime — lightweight)
  ├── 1. Route query by keywords → section filter
  ├── 2. Embed query via Groq Embeddings API (no local model at runtime)
  ├── 3. ChromaDB vector search → top 3 chunks
  ├── 4. Inject chunks into system prompt
  └── 5. Groq Llama 3.1 8b instant → response
```

Ingestion is a **separate offline step** — heavy ML packages (torch, sentence-transformers) are only needed to build the vector store, not to run the API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | Groq · llama-3.1-8b-instant (fastest free model) |
| Query embeddings | Groq Embeddings API · nomic-embed-text (no local model at runtime) |
| Document embeddings | BAAI/bge-small-en-v1.5 (ingest only) |
| Vector store | ChromaDB (persistent, local) |
| PDF parsing | pdfplumber (ingest only) |
| Backend | Python · FastAPI · Uvicorn |
| Frontend | Vanilla JS widget (zero dependencies) |
| Hosting | Render free tier |

---

## Project Structure

```
ask-shreyas/
├── backend/
│   ├── main.py                  # Lean API — routing, retrieval, generation
│   ├── ingest.py                # Offline — parse docs, embed, write to Chroma
│   ├── requirements.txt         # Runtime only (no torch/transformers)
│   ├── requirements-ingest.txt  # Ingest only (heavy ML packages)
│   ├── .env.example
│   ├── knowledge/               # Structured markdown knowledge base
│   │   ├── bio.md
│   │   ├── faq.md               # Visa, relocation, why hire, contact
│   │   ├── projects.md          # FAST Center, EIR, Founder/Funding, etc.
│   │   ├── experience.md        # EnterpriseWorks, Quantiphi, BI Group
│   │   ├── skills.md            # Full tech stack
│   │   └── education.md        # UIUC, Mumbai
│   └── docs/                   # PDFs (resume, LinkedIn export)
│       ├── resume.pdf
│       └── linkedin.pdf
└── frontend/
    └── chatbot.js               # Self-contained widget
```

---

## Setup

### 1. Clone and create two environments

```bash
git clone https://github.com/shrheh20/ask-shreyas.git
cd ask-shreyas/backend
python3 -m venv venv && source venv/bin/activate
```

### 2. Configure environment variables

```bash
cp .env.example .env
# Add your GROQ_API_KEY from https://console.groq.com
```

### 3. Build the vector store (local, one-time)

```bash
# Install ingest dependencies (heavier — torch, sentence-transformers)
pip install -r requirements-ingest.txt

# Run ingestion — processes knowledge/*.md + docs/*.pdf
python ingest.py
```

Expected output:
```
Processing 6 knowledge base files ...
  bio.md          → 8 chunks   (section: bio)
  education.md    → 6 chunks   (section: education)
  experience.md   → 18 chunks  (section: experience)
  faq.md          → 12 chunks  (section: faq)
  projects.md     → 24 chunks  (section: projects)
  skills.md       → 10 chunks  (section: skills)

Processing 2 PDF files ...
  resume.pdf      → 14 chunks  (source: resume)
  linkedin.pdf    → 11 chunks  (source: linkedin)

Total chunks: 103
✓ Done. Sections indexed: ['bio', 'education', 'experience', 'faq', 'projects', 'skills']
```

Re-run `ingest.py` whenever you update a document.

### 4. Run the API

```bash
# Switch to runtime dependencies (lighter)
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Test:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What did Shreyas build at EnterpriseWorks?"}'
```

### 5. Add widget to your portfolio

Add before `</body>` in `index.html`:
```html
<script>window.ASK_SHREYAS_API = "http://localhost:8000";</script>
<script src="ask-shreyas/frontend/chatbot.js"></script>
```

---

## Deploying to Render (free)

1. Push repo to GitHub
2. [render.com](https://render.com) → New Web Service → connect repo
3. **Root directory:** `backend/`
4. **Build command:** `pip install -r requirements.txt`
   - The `chroma_db/` folder must be committed to the repo after running `ingest.py` locally, OR use a Render Persistent Disk
5. **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add `GROQ_API_KEY` in Render environment variables
7. Update `index.html`: `window.ASK_SHREYAS_API = "https://your-app.onrender.com"`

### Committing chroma_db (simplest free approach)
```bash
# After running ingest.py locally:
git add backend/chroma_db
git commit -m "add vector store"
git push
```
Render serves the pre-built store — no ingest step needed at deploy time.

---

## How the Query Router Works

Before vector search, the API checks the query against keyword rules to apply a section filter:

| Keywords in query | Section filter |
|---|---|
| visa, OPT, relocat, hire, contact | `faq` |
| FAST Center, SBIR, dashboard, project | `projects` |
| Python, SQL, AWS, skills, certif | `skills` |
| education, UIUC, degree, GPA | `education` |
| Quantiphi, experience, career | `experience` |
| (no match) | no filter — full search |

This reduces retrieval to the most relevant section before vector similarity runs, improving both speed and accuracy.

---

## What Changed vs. Previous Version

| | Before | After |
|---|---|---|
| Twilio | ✓ included | ✗ removed |
| Runtime model load | SentenceTransformer at startup (~500MB) | None — Groq API for query embeddings |
| Runtime memory | ~800MB+ | ~150MB |
| LLM model | llama-3.3-70b-versatile | llama-3.1-8b-instant (3× faster) |
| TOP_K | 5 | 3 |
| Max tokens | 512 | 280 |
| Knowledge base | PDFs only | Structured markdown + PDFs |
| Chunk metadata | source only | source + section + title + document |
| Query routing | none | keyword-based section filter |
| requirements.txt | torch, transformers, twilio at runtime | none of these at runtime |

---

## Extending This Project

- **Re-ranking:** add `cross-encoder/ms-marco-MiniLM-L-6-v2` after retrieval for higher precision
- **Streaming:** use Groq streaming + FastAPI `StreamingResponse` for token-by-token output
- **Query logging:** log to SQLite with `aiosqlite` — add `/analytics` endpoint
- **Analytics dashboard:** visualise most-asked questions (very on-brand for a BI portfolio)

---

## License

MIT
