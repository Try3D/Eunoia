import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")

with open("combined_data_with_embeddings.json", "r", encoding="utf-8") as f:
    combined_data = json.load(f)

def find_similar_materials(user_materials, top_n=3):
    user_text = ", ".join(user_materials)
    user_embedding = model.encode(user_text).reshape(1, -1)

    similarities = [
        (item, cosine_similarity(user_embedding, np.array(item["embedding"]).reshape(1, -1))[0][0])
        for item in combined_data if "embedding" in item
    ]

    similarities.sort(key=lambda x: x[1], reverse=True)
    return similarities[:top_n]

user_input_materials = ["wood", "nails", "glue"]
top_matches = find_similar_materials(user_input_materials)

for i, (match, score) in enumerate(top_matches, 1):
    print(f"\nMatch {i}:")
    print(f"Materials Required: {match['materials_required']}")
    print(f"Steps: {match.get('steps', 'No steps provided')}")
    print(f"Similarity Score: {score:.4f}")
