import json
import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

chroma_client = chromadb.PersistentClient(path="chroma_db")
collection = chroma_client.get_or_create_collection(name="materials_collection")

query_text = "wood, hammer, nails"
results = collection.query(
    query_texts=[query_text],
    n_results=2,
    include=["metadatas", "documents", "distances"],
)

for i, doc in enumerate(results["documents"][0]):
    print(f"\nResult {i + 1}:")
    print(f"- Document: {doc}")
    print(f"- Distance: {results['distances'][0][i]}")

    metadata = results["metadatas"][0][i]
    # Decode metadata (convert stored JSON strings back to lists)
    decoded_metadata = {
        k: json.loads(v) if isinstance(v, str) and v.startswith("[") else v
        for k, v in metadata.items()
    }

    print(f"- Metadata: {decoded_metadata}")
