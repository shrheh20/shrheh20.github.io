"""
ingest.py — Build the ChromaDB vector store from PDFs + markdown knowledge base.

Run ONCE locally before deploying, or as a build step on Render.

Usage:
    pip install -r requirements-ingest.txt
    python ingest.py

What it does:
    1. Reads all .md files in ./knowledge/  (structured knowledge base)
    2. Reads all .pdf files in ./docs/      (resume, LinkedIn)
    3. Chunks text with overlap
    4. Attaches rich metadata per chunk (source, section, title)
    5. Embeds with BAAI/bge-small-en-v1.5
    6. Persists to ./chroma_db

Re-run any time you update a document.
"""

from pathlib import Path
import pdfplumber
from sentence_transformers import SentenceTransformer
import chromadb

# ── Config ─────────────────────────────────────────────────────────────────────
KNOWLEDGE_DIR = Path(__file__).parent / "knowledge"
DOCS_DIR      = Path(__file__).parent / "docs"
CHROMA_DIR    = Path(__file__).parent / "chroma_db"
COLLECTION    = "shreyas_knowledge"
EMBED_MODEL   = "BAAI/bge-small-en-v1.5"
CHUNK_SIZE    = 420
CHUNK_OVERLAP = 70

# ── Section detection from filename ───────────────────────────────────────────
SECTION_MAP = {
    "bio":        "bio",
    "faq":        "faq",
    "projects":   "projects",
    "experience": "experience",
    "skills":     "skills",
    "education":  "education",
    "resume":     "experience",
    "linkedin":   "bio",
}

def infer_section(filename: str) -> str:
    stem = Path(filename).stem.lower()
    for key, section in SECTION_MAP.items():
        if key in stem:
            return section
    return "general"

def infer_title(text: str, source: str) -> str:
    """Pull first meaningful line as a title hint for metadata."""
    for line in text.splitlines():
        line = line.strip().lstrip("#").strip()
        if len(line) > 8:
            return line[:80]
    return source

# ── Text extraction ────────────────────────────────────────────────────────────
def read_markdown(path: Path) -> str:
    return path.read_text(encoding="utf-8")

def read_pdf(path: Path) -> str:
    parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                parts.append(t.strip())
    return "\n\n".join(parts)

# ── Chunking with metadata ─────────────────────────────────────────────────────
def chunk_document(text: str, source_name: str, doc_type: str) -> list[dict]:
    section = infer_section(source_name)
    chunks = []
    start = 0
    idx = 0
    while start < len(text):
        snippet = text[start : start + CHUNK_SIZE].strip()
        if len(snippet) > 40:   # skip near-empty chunks
            chunks.append({
                "id":       f"{source_name}_{idx}",
                "text":     snippet,
                "source":   doc_type,           # "knowledge" | "resume" | "linkedin"
                "section":  section,
                "title":    infer_title(snippet, source_name),
                "document": source_name,
            })
            idx += 1
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks

# ── Collect all chunks ─────────────────────────────────────────────────────────
all_chunks: list[dict] = []

# 1. Markdown knowledge base
md_files = sorted(KNOWLEDGE_DIR.glob("*.md"))
if md_files:
    print(f"\nProcessing {len(md_files)} knowledge base files ...")
    for md in md_files:
        text = read_markdown(md)
        chunks = chunk_document(text, md.stem, "knowledge")
        all_chunks.extend(chunks)
        print(f"  {md.name:30s} → {len(chunks)} chunks  (section: {infer_section(md.stem)})")
else:
    print("No markdown files found in ./knowledge — skipping.")

# 2. PDFs
pdf_files = sorted(DOCS_DIR.glob("*.pdf"))
if pdf_files:
    print(f"\nProcessing {len(pdf_files)} PDF files ...")
    for pdf in pdf_files:
        text = read_pdf(pdf)
        doc_type = "resume" if "resume" in pdf.stem.lower() else "linkedin"
        chunks = chunk_document(text, pdf.stem, doc_type)
        all_chunks.extend(chunks)
        print(f"  {pdf.name:30s} → {len(chunks)} chunks  (source: {doc_type})")
else:
    print("No PDFs found in ./docs — skipping.")

if not all_chunks:
    print("\nNo documents found. Add files to ./knowledge or ./docs and re-run.")
    exit(1)

print(f"\nTotal chunks: {len(all_chunks)}")

# ── Embed ──────────────────────────────────────────────────────────────────────
print(f"\nLoading embedding model: {EMBED_MODEL} ...")
embedder = SentenceTransformer(EMBED_MODEL)
print("Model loaded. Embedding ...")

# BGE passage prefix for stored documents
texts = [f"passage: {c['text']}" for c in all_chunks]
embeddings = embedder.encode(
    texts,
    batch_size=32,
    show_progress_bar=True,
    normalize_embeddings=True,
)

# ── Persist to ChromaDB ────────────────────────────────────────────────────────
print("\nWriting to ChromaDB ...")
client = chromadb.PersistentClient(path=str(CHROMA_DIR))

try:
    client.delete_collection(COLLECTION)
    print("Cleared existing collection.")
except Exception:
    pass

collection = client.create_collection(
    name=COLLECTION,
    metadata={"hnsw:space": "cosine"},
)

collection.add(
    ids        = [c["id"]      for c in all_chunks],
    embeddings = embeddings.tolist(),
    documents  = [c["text"]    for c in all_chunks],
    metadatas  = [{
        "source":   c["source"],
        "section":  c["section"],
        "title":    c["title"],
        "document": c["document"],
    } for c in all_chunks],
)

print(f"\n✓ Done. {len(all_chunks)} chunks stored in {CHROMA_DIR}")
print("  Sections indexed:", sorted(set(c["section"] for c in all_chunks)))
print("\n  Run the API:  uvicorn main:app --reload --port 8000")
