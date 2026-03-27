"""
Ask Shreyas — FastAPI Backend (RAG Edition)
Pipeline: Query → BGE embed → ChromaDB retrieval → Groq (Llama 3) → WhatsApp notification
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq
from twilio.rest import Client as TwilioClient
from sentence_transformers import SentenceTransformer
import chromadb
import os
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Ask Shreyas API — RAG Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ─────────────────────────────────────────────────────────────────────
CHROMA_DIR  = Path(__file__).parent / "chroma_db"
COLLECTION  = "shreyas_knowledge"
EMBED_MODEL = "BAAI/bge-small-en-v1.5"
TOP_K       = 5   # chunks retrieved per query

# ── Load at startup (once) ─────────────────────────────────────────────────────
print("Loading BGE embedding model ...")
embedder = SentenceTransformer(EMBED_MODEL)
print("Embedding model ready.")

print("Connecting to ChromaDB ...")
chroma_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
collection    = chroma_client.get_collection(COLLECTION)
print(f"ChromaDB ready — {collection.count()} chunks indexed.")

groq_client   = Groq(api_key=os.environ["GROQ_API_KEY"])
twilio_client = TwilioClient(os.environ["TWILIO_ACCOUNT_SID"], os.environ["TWILIO_AUTH_TOKEN"])

# ── Base system prompt ─────────────────────────────────────────────────────────
BASE_SYSTEM = """
You are "Ask Shreyas" — a smart, conversational AI assistant that knows everything about Shreyas Udupa.
You answer questions from recruiters, hiring managers, and curious visitors on his portfolio website.

PERSONALITY:
- Warm, conversational, witty, polite, and concise
- Frame answers about Shreyas's work in STAR format (Situation, Task, Action, Result) and always highlight the impact
- Keep answers focused — no walls of text. Bullet points are fine for lists of skills or facts.

RULES:
- Only answer questions about Shreyas using the retrieved context and the facts below
- Never answer complex science, math, physics, or high-compute queries unrelated to Shreyas
- Never discuss salary expectations or specific numbers
- If asked something not in your knowledge, say: "That's outside what I know — reach out to Shreyas directly at shreyas.udupa20@gmail.com"
- If asked who built you: "I'm Ask Shreyas — built by Shreyas himself using Groq Llama 3, a RAG pipeline with ChromaDB and BGE embeddings, and FastAPI. It's one of his portfolio projects!"

ALWAYS-AVAILABLE FACTS (use even if not in retrieved chunks):
- Visa: F-1 OPT, ~2 years STEM OPT remaining. Needs H-1B after OPT. Open to working full 2-year OPT without sponsorship.
- Location: Champaign, IL. Open to relocating anywhere in the US. Preferred: Chicago, San Francisco, San Jose, Fremont, Menlo Park, Mountain View, Seattle, New York, Boston.
- Target roles: Data Analyst, Business Analyst, Strategy & Operations Analyst, Business Operations Analyst
- Education: MS Information Management, UIUC, GPA 4.0. BE Computer Engineering, University of Mumbai, GPA 3.63.
- Certifications: AWS Solutions Architect Associate (2025), Google Cloud Associate Engineer (2023)
- Contact: shreyas.udupa20@gmail.com | +1 (447) 902-4746 | linkedin.com/in/shreyasudupa | github.com/shrheh20
- Origin story: Got into data watching Formula 1 in high school — thousands of sensors, split-second decisions, predictive overtake models showed him data was the difference between winning and losing.
- Personal: Reads thriller/mythology fiction (Ashwin Sanghi, James Patterson). Currently building AI agents. Does not stop until a problem is solved.

WHY HIRE SHREYAS (use when asked):
1. Goes to the last mile — when SBA data had no field for FAST Center companies, he built the linkage himself, delivered dashboards that secured a state program extension.
2. His work gets used — dashboards became widely circulated materials that drove real business decisions at EnterpriseWorks.
3. Learns fast — F1 telemetry to Python/SQL to AWS certifications to building AI agents. Curiosity is how he operates.
4. Works at every level — as the youngest at Quantiphi, he closed a Financial Services deal worth 40 percent of regional Q1 revenue alongside Google FSRs and C-suite clients.
"""

# ── RAG retrieval ──────────────────────────────────────────────────────────────
def retrieve_context(query: str) -> str:
    """Embed the query with BGE query prefix and retrieve top-K chunks."""
    query_embedding = embedder.encode(
        f"query: {query}",        # BGE query prefix for retrieval
        normalize_embeddings=True,
    ).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=TOP_K,
        include=["documents", "metadatas", "distances"],
    )

    chunks     = results["documents"][0]
    metadatas  = results["metadatas"][0]
    distances  = results["distances"][0]

    # Filter low-relevance chunks (cosine distance > 0.5 = poor match)
    relevant = [
        (doc, meta["source"], dist)
        for doc, meta, dist in zip(chunks, metadatas, distances)
        if dist < 0.5
    ]

    if not relevant:
        return ""

    # Format for prompt injection
    context_parts = []
    for doc, source, dist in relevant:
        label = "Resume" if source == "resume" else "LinkedIn Profile"
        context_parts.append(f"[{label}]\n{doc}")

    return "\n\n---\n\n".join(context_parts)


# ── WhatsApp notification ──────────────────────────────────────────────────────
def send_whatsapp(question: str, answer: str):
    timestamp = datetime.now().strftime("%b %d, %H:%M")
    body = (
        f"Ask Shreyas — New Query [{timestamp}]\n\n"
        f"Question: {question[:300]}\n\n"
        f"Answer preview: {answer[:300]}{'...' if len(answer) > 300 else ''}"
    )
    twilio_client.messages.create(
        from_=f"whatsapp:{os.environ['TWILIO_WHATSAPP_FROM']}",
        to=f"whatsapp:{os.environ['YOUR_WHATSAPP_NUMBER']}",
        body=body,
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
    return {"status": "Ask Shreyas RAG API is running", "chunks_indexed": collection.count()}


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    # 1. Retrieve relevant chunks from ChromaDB
    context = retrieve_context(req.message)

    # 2. Build system prompt — inject retrieved context if found
    if context:
        system_content = (
            BASE_SYSTEM
            + "\n\nRELEVANT CONTEXT FROM SHREYAS'S DOCUMENTS (use this to answer):\n\n"
            + context
        )
    else:
        system_content = BASE_SYSTEM

    # 3. Build message list with conversation history (last 6 turns)
    messages = [{"role": "system", "content": system_content}]
    for turn in req.history[-6:]:
        messages.append({"role": turn["role"], "content": turn["content"]})
    messages.append({"role": "user", "content": req.message})

    # 4. Call Groq
    try:
        completion = groq_client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            max_tokens=512,
            temperature=0.65,
        )
        reply = completion.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Groq error: {str(e)}")

    # 5. WhatsApp notification (non-blocking)
    try:
        send_whatsapp(req.message, reply)
    except Exception:
        pass

    # 6. Return reply + which sources were used
    sources = []
    if context:
        if "Resume" in context:
            sources.append("resume")
        if "LinkedIn" in context:
            sources.append("linkedin")

    return ChatResponse(reply=reply, sources=sources)
