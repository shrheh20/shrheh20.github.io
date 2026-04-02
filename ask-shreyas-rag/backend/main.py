"""
Ask Shreyas — FastAPI Backend (Fixed RAG)

Key fixes vs previous version:
- Query embedding now uses the same model as ingestion (BAAI/bge-small-en-v1.5)
  Mixing nomic-embed-text (768-dim) with BGE (384-dim) caused total retrieval failure.
- Hard guardrail: if no relevant chunks are retrieved, LLM is told explicitly
  to say so rather than hallucinate.
- Cosine distance threshold tightened to 0.45 (was 0.55 — too permissive).
- Model bumped to llama-3.3-70b-versatile for better instruction following.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import chromadb
import os
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="Ask Shreyas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ─────────────────────────────────────────────────────────────────────
CHROMA_DIR   = Path(__file__).parent / "chroma_db"
COLLECTION   = "shreyas_knowledge"
EMBED_MODEL  = "BAAI/bge-small-en-v1.5"   # MUST match ingest.py
TOP_K        = int(os.getenv("TOP_K", "4"))
MAX_DIST     = float(os.getenv("MAX_DIST", "0.45"))  # cosine distance cutoff
MODEL_NAME   = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_TOKENS   = int(os.getenv("MAX_TOKENS", "350"))

# ── Load at startup ────────────────────────────────────────────────────────────
print(f"Loading embedding model: {EMBED_MODEL} ...")
embedder = SentenceTransformer(EMBED_MODEL)
print("Embedding model ready.")

print("Connecting to ChromaDB ...")
chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
collection    = chroma_client.get_collection(COLLECTION)
print(f"ChromaDB ready — {collection.count()} chunks indexed.")

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
print(f"Groq ready. Model: {MODEL_NAME}")

# ── Query router (keyword → section filter) ────────────────────────────────────
ROUTE_RULES: list[tuple[list[str], str]] = [
    (["visa", "opt", "h1b", "h-1b", "work auth", "sponsor", "relocat",
      "location", "city", "remote", "why hire", "available", "contact",
      "email", "phone", "linkedin", "hire"],                              "faq"),
    (["fast center", "sbir", "sttr", "enterpriseworks", "founder",
      "funding", "eir", "dashboard", "project", "demand forecast",
      "inventory", "registration", "event", "cvent", "chatbot",
      "rag", "ai agent", "built", "created", "made"],                    "projects"),
    (["python", "sql", "tableau", "power bi", "aws", "gcp", "cloud",
      "skill", "tool", "stack", "technology", "excel", "snowflake",
      "certif", "speciali"],                                              "skills"),
    (["education", "degree", "uiuc", "university", "gpa", "master",
      "bachelor", "msim", "graduate", "study", "phi kappa"],             "education"),
    (["quantiphi", "google", "experience", "work", "job", "career",
      "internship", "analyst", "current", "currently", "company",
      "employer", "where does"],                                          "experience"),
]

def route_query(query: str) -> str | None:
    q = query.lower()
    for keywords, section in ROUTE_RULES:
        if any(kw in q for kw in keywords):
            return section
    return None

# ── Retrieval ──────────────────────────────────────────────────────────────────
def retrieve(query: str) -> tuple[str, list[str]]:
    """Embed with BGE (same model as ingestion) and retrieve top chunks."""
    vector = embedder.encode(
        f"query: {query}",
        normalize_embeddings=True,
    ).tolist()

    section = route_query(query)
    query_kwargs: dict = {
        "query_embeddings": [vector],
        "n_results": TOP_K,
        "include": ["documents", "metadatas", "distances"],
    }
    if section:
        query_kwargs["where"] = {"section": section}

    try:
        results = collection.query(**query_kwargs)
    except Exception:
        # Section filter may return 0 results — retry without filter
        query_kwargs.pop("where", None)
        results = collection.query(**query_kwargs)

    docs      = results["documents"][0]
    metas     = results["metadatas"][0]
    distances = results["distances"][0]

    parts: list[str] = []
    sources: list[str] = []

    for doc, meta, dist in zip(docs, metas, distances):
        if dist > MAX_DIST:
            continue
        src     = meta.get("source", "document")
        section = meta.get("section", "")
        parts.append(f"[{src.upper()} — {section}]\n{doc}")
        if src not in sources:
            sources.append(src)

    return "\n\n---\n\n".join(parts), sources

# ── System prompt ──────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """\
You are "Ask Shreyas", a precise AI assistant on Shreyas Udupa's portfolio website.
Answer ONLY using the RETRIEVED CONTEXT provided below. Do not use your training data or prior knowledge.
If the context does not contain the answer, say exactly: "I don't have that detail in my knowledge base — reach out to Shreyas at shreyas.udupa20@gmail.com"
Be warm, concise, and recruiter-friendly. For work stories use STAR format. Keep answers to 3-5 sentences or a short bullet list.
Never invent companies, tools, projects, or facts not present in the context.
If asked who built you: you were built by Shreyas using Groq, ChromaDB, BGE embeddings, and FastAPI.\
"""

NO_CONTEXT_MSG = (
    "I don't have that detail in my knowledge base right now. "
    "Reach out to Shreyas directly at shreyas.udupa20@gmail.com — he'll be happy to answer."
)

# ── Models ─────────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []

class ChatResponse(BaseModel):
    reply: str
    sources: list[str] = []

# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "Ask Shreyas API running",
        "model": MODEL_NAME,
        "embed_model": EMBED_MODEL,
        "chunks_indexed": collection.count(),
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    context, sources = retrieve(req.message)

    # Hard guardrail — if nothing relevant retrieved, skip the LLM entirely
    if not context:
        return ChatResponse(reply=NO_CONTEXT_MSG, sources=[])

    system = (
        SYSTEM_PROMPT
        + f"\n\nRETRIEVED CONTEXT (answer ONLY from this):\n\n{context}"
    )

    messages = [{"role": "system", "content": system}]
    for turn in req.history[-4:]:
        if turn.get("role") in ("user", "assistant") and turn.get("content"):
            messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": req.message})

    try:
        completion = groq_client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            max_tokens=MAX_TOKENS,
            temperature=0.3,   # lower = more faithful to context
        )
        reply = completion.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq error: {e}")

    return ChatResponse(reply=reply, sources=sources)
