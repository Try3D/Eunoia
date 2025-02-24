from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
import json  # Add this import
import base64
import io
import pandas as pd
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")

with open("../instructable/combined_data_with_embeddings.json", "r", encoding="utf-8") as f:
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


app = FastAPI()

client = genai.Client(api_key="AIzaSyDhjOSqI3j4rB1AzbgwqS6U3EGSoNvWpPs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
        "http://10.31.22.178",
        "http://10.31.23.247:8000",
        "http://10.31.23.247:8001"
    ],  # Add Expo web port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        print("Received file upload request")
        contents = await file.read()

        # Session 1: List items in the image
        items_response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[
                "List only the important objects in the scene that could be useful for a project. Return only a comma-separated list of items, no other text.",
                types.Part.from_bytes(data=contents, mime_type=file.content_type),
            ],
        )
        
        items_list = items_response.text.strip()
        print(f"Items found: {items_list}")

        # Session 2: Generate DIY project based on items
        project_response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[
                f"Using these items: {items_list}\n\n"
                "Generate a DIY project and return it in this exact JSON format (no markdown) The warnings should only be hazardous ones:\n"
                "{\n"
                '  "title": "Project Name",\n'
                '  "materials": ["item1", "item2", "item3"],\n'
                '  "difficulty": "Easy/Medium/Hard",\n'
                '  "timeRequired": "estimated time",\n'
                '  "steps": ["step1", "step2", "step3"],\n'
                '  "tips": ["tip1", "tip2"],\n'  # Added comma here
                '  "warnings": {"1": "warning in step 1 (if any)", "2": "warning in step 2 (if any)", "3": "warning in step 3 (if any)"}\n'  # Fixed warnings format
                "}"
            ],
        )

        # Parse the response text as JSON
        project_data = json.loads(project_response.text.lstrip("```.json").rstrip("```"))
        print(project_data["steps"])
        return {
            "status": "success",
            "message": project_data
        }

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/leaderboard")
def leaderboard():
    return [
        {"rank": 1, "name": "Emma", "diy_completed": 95, "days_active": 100},
        {"rank": 2, "name": "Liam", "diy_completed": 85, "days_active": 90},
        {"rank": 3, "name": "Ava", "diy_completed": 75, "days_active": 80},
        {"rank": 4, "name": "Noah", "diy_completed": 65, "days_active": 75},
        {"rank": 5, "name": "Olivia", "diy_completed": 60, "days_active": 70},
        {"rank": 6, "name": "Lucas", "diy_completed": 50, "days_active": 65},
        {"rank": 7, "name": "Mia", "diy_completed": 40, "days_active": 60},
        {"rank": 8, "name": "Ethan", "diy_completed": 30, "days_active": 50},
        {"rank": 9, "name": "Sophia", "diy_completed": 20, "days_active": 45},
        {"rank": 10, "name": "Mason", "diy_completed": 15, "days_active": 30},
    ]

# Mock data for projects
PROJECTS = [
    {"id": 1, "title": "Mountain Landscape", "progress": 75, "dueDate": "2025-03-01"},
    {"id": 2, "title": "City Streets", "progress": 30, "dueDate": "2025-03-15"},
    {"id": 3, "title": "Portrait Series", "progress": 90, "dueDate": "2025-02-28"},
]

# Mock data for achievements
ACHIEVEMENTS = [
    {
        "id": 1,
        "title": "First Upload",
        "icon": "🎯",
        "description": "Posted your first project"
    },
    {
        "id": 2,
        "title": "Rising Star",
        "icon": "⭐",
        "description": "100 likes received"
    },
    {
        "id": 3,
        "title": "Community Leader",
        "icon": "👑",
        "description": "Top contributor this week"
    }
]

# Add these new endpoints
@app.get("/projects")
def get_projects():
    return PROJECTS

@app.get("/achievements")
def get_achievements():
    return ACHIEVEMENTS

@app.post("/clarify-step")
async def clarify_step(request: dict):
    try:
        project_title = request.get("projectTitle")
        step_number = request.get("stepNumber")
        original_step = request.get("stepContent")

        if not all([project_title, step_number, original_step]):
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: projectTitle, stepNumber, or stepContent"
            )

        print(f"Processing clarification request for {project_title}, step {step_number}")
        
        clarification_prompt = f"""
        Given this step from the DIY project "{project_title}":
        STEP {step_number}: {original_step}

        Provide a detailed breakdown in this exact JSON format:
        {{
            "detailed_steps": ["First, ...", "Then, ...", "Finally, ..."],
            "tips": ["Specific tip about technique", "Helpful measurement tip", "Safety tip"],
            "common_mistakes": ["Common error to avoid", "Frequent mistake", "What not to do"]
        }}

        Return ONLY the JSON object, nothing else.
        """
        
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[clarification_prompt]
        )
        
        # Clean and parse the response
        cleaned_response = response.text.strip()
        
        # Remove any markdown formatting
        if '```' in cleaned_response:
            cleaned_response = cleaned_response.split('```')[1]
            if cleaned_response.startswith('json\n'):
                cleaned_response = cleaned_response[5:]
        
        print(f"Cleaned response: {cleaned_response}")
        
        try:
            clarified_content = json.loads(cleaned_response)
        except json.JSONDecodeError as je:
            print(f"JSON Parse Error: {je}")
            print(f"Raw Response: {cleaned_response}")
            # Attempt to fix common JSON formatting issues
            cleaned_response = cleaned_response.replace('\n', '').replace('  ', ' ')
            try:
                clarified_content = json.loads(cleaned_response)
            except:
                raise HTTPException(status_code=500, detail="Failed to parse AI response")
        
        # Ensure the response has the required structure
        if not all(key in clarified_content for key in ["detailed_steps", "tips", "common_mistakes"]):
            raise HTTPException(status_code=500, detail="Invalid response structure from AI")
        
        return {
            "status": "success",
            "clarification": clarified_content
        }
        
    except Exception as e:
        print(f"Error in clarify_step: {str(e)}")
        print(f"Request data: {request}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
