"""
ingest.py — Run this ONCE to build the ChromaDB vector store from PDFs.

Usage:
    python ingest.py

What it does:
    1. Reads every PDF in the ./docs folder
    2. Splits text into overlapping chunks (better retrieval context)
    3. Embeds each chunk with BAAI/bge-small-en-v1.5 (free, local, fast)
    4. Persists the vector store to ./chroma_db (auto-created)

Re-run any time you update a PDF in ./docs.
"""

import os
import glob
from pathlib import Path

import pdfplumber
from sentence_transformers import SentenceTransformer
import chromadb
from chromadb.config import Settings

# ── Config ────────────────────────────────────────────────────────────────────
DOCS_DIR      = Path(__file__).parent / "docs"
CHROMA_DIR    = Path(__file__).parent / "chroma_db"
COLLECTION    = "shreyas_knowledge"
EMBED_MODEL   = "BAAI/bge-small-en-v1.5"
CHUNK_SIZE    = 400    # characters per chunk
CHUNK_OVERLAP = 80     # overlap between chunks for continuity

# ── Load embedding model ──────────────────────────────────────────────────────
print(f"Loading embedding model: {EMBED_MODEL} ...")
embedder = SentenceTransformer(EMBED_MODEL)
print("Model loaded.\n")

# ── ChromaDB client ───────────────────────────────────────────────────────────
client = chromadb.PersistentClient(path=str(CHROMA_DIR))

# Delete existing collection so re-runs stay clean
try:
    client.delete_collection(COLLECTION)
    print("Cleared existing collection.")
except Exception:
    pass

collection = client.create_collection(
    name=COLLECTION,
    metadata={"hnsw:space": "cosine"},   # cosine similarity for BGE
)

# ── PDF extraction ────────────────────────────────────────────────────────────
def extract_text_from_pdf(path: Path) -> str:
    """Extract full text from a PDF using pdfplumber."""
    text_parts = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text.strip())
    return "\n\n".join(text_parts)


# ── Chunking ──────────────────────────────────────────────────────────────────
def chunk_text(text: str, source: str) -> list[dict]:
    """
    Split text into overlapping chunks.
    Returns list of {"text": ..., "source": ..., "chunk_id": ...}
    """
    chunks = []
    start = 0
    chunk_index = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end].strip()
        if chunk:
            chunks.append({
                "text": chunk,
                "source": source,
                "chunk_id": f"{source}_{chunk_index}",
            })
            chunk_index += 1
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


# ── Process all PDFs ──────────────────────────────────────────────────────────
all_chunks = []
pdf_files = list(DOCS_DIR.glob("*.pdf"))

if not pdf_files:
    print(f"No PDFs found in {DOCS_DIR}. Add PDFs and re-run.")
    exit(1)

for pdf_path in pdf_files:
    source_name = pdf_path.stem   # e.g. "resume" or "linkedin"
    print(f"Processing: {pdf_path.name} ...")
    raw_text = extract_text_from_pdf(pdf_path)
    chunks = chunk_text(raw_text, source_name)
    all_chunks.extend(chunks)
    print(f"  → {len(chunks)} chunks extracted from {pdf_path.name}")

print(f"\nTotal chunks across all documents: {len(all_chunks)}")

# ── Embed and store ───────────────────────────────────────────────────────────
print("\nEmbedding chunks (BGE adds query prefix for retrieval) ...")

# BGE models perform best with a prefix for passage embedding
texts_to_embed = [f"passage: {c['text']}" for c in all_chunks]
embeddings = embedder.encode(
    texts_to_embed,
    batch_size=32,
    show_progress_bar=True,
    normalize_embeddings=True,   # required for cosine similarity
)

collection.add(
    ids        = [c["chunk_id"] for c in all_chunks],
    embeddings = embeddings.tolist(),
    documents  = [c["text"] for c in all_chunks],
    metadatas  = [{"source": c["source"]} for c in all_chunks],
)

print(f"\n✓ Vector store built: {len(all_chunks)} chunks stored in {CHROMA_DIR}")
print("  Run the API with: uvicorn main:app --reload --port 8000")
