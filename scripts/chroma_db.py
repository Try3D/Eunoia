import os
import json
import chromadb
from sentence_transformers import SentenceTransformer

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize ChromaDB client with persistent storage
chroma_client = chromadb.PersistentClient(path="chroma_db")
collection = chroma_client.get_or_create_collection(name="materials_collection")

folder_path = "../../extracted_ideas"

for filename in os.listdir(folder_path):
    if filename.endswith(".json"):
        file_path = os.path.join(folder_path, filename)

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

                if isinstance(data, list):
                    items = data
                elif isinstance(data, dict):
                    items = [data]
                else:
                    continue  # Skip if not list or dict

                for item in items:
                    # Remove image-related fields
                    item.pop("image_urls", None)
                    item.pop("images", None)

                    if "materials_required" in item and isinstance(
                        item["materials_required"], list
                    ):
                        materials_text = ", ".join(item["materials_required"])
                        embedding = model.encode(materials_text).tolist()

                        collection.upsert(
                            documents=[materials_text],
                            embeddings=[embedding],
                            ids=[
                                item.get("id", filename)
                            ],  # Use filename as ID if no unique ID present
                            metadatas=[
                                {
                                    k: json.dumps(v) if isinstance(v, list) else v
                                    for k, v in item.items()
                                }
                            ],
                        )

        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            print(f"Skipping {filename} due to error: {e}")

print("Data successfully stored in ChromaDB.")

# Example query
query_text = "wood, hammer, nails"
results = collection.query(query_texts=[query_text], n_results=5)
print("Query Results:", results)
