import os
import json

folder_path = "final"
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

output_file = "merged.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(combined_data, f, indent=4)

print(f"✅ Merged {len(combined_data)} JSON entries into {output_file}")
