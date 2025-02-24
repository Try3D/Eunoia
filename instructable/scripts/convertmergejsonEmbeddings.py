import os
import json
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

folder_path = "extracted_folder"
combined_data = []

for filename in os.listdir(folder_path):
    if filename.endswith(".json"):
        file_path = os.path.join(folder_path, filename)
        
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    combined_data.extend(data)
                elif isinstance(data, dict):
                    combined_data.append(data)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            print(f"Skipping {filename} due to error: {e}")

for item in combined_data:
    if "materials_required" in item and isinstance(item["materials_required"], list):
        materials_text = ", ".join(item["materials_required"])
        embedding = model.encode(materials_text).tolist()
        item["embedding"] = embedding

output_path = "combined_data_with_embeddings.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(combined_data, f, indent=4)

print(f"Processed {len(combined_data)} records. Output saved to {output_path}.")
