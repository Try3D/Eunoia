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

ACHIEVEMENTS = [
    {
        "id": 1,
        "title": "First Timer",
        "description": "Complete your first DIY project",
        "icon": "🌟",
        "xp": 100,
        "unlocked": True,
        "date_unlocked": "2024-01-15",
        "progress": 100,
        "total_required": 1
    },
    {
        "id": 2,
        "title": "Weekend Warrior",
        "description": "Complete 3 projects in one weekend",
        "icon": "⚡",
        "xp": 250,
        "unlocked": False,
        "progress": 1,
        "total_required": 3
    },
    {
        "id": 3,
        "title": "Tool Master",
        "description": "Use 10 different tools",
        "icon": "🔧",
        "xp": 300,
        "unlocked": False,
        "progress": 6,
        "total_required": 10
    },
    {
        "id": 4,
        "title": "Eco Warrior",
        "description": "Complete 5 upcycling projects",
        "icon": "♻",
        "xp": 400,
        "unlocked": False,
        "progress": 2,
        "total_required": 5
    },
    {
        "id": 5,
        "title": "Safety First",
        "description": "Complete the safety tutorial",
        "icon": "🛡",
        "xp": 50,
        "unlocked": True,
        "date_unlocked": "2024-01-10",
        "progress": 1,
        "total_required": 1
    },
    {
        "id": 6,
        "title": "Community Helper",
        "description": "Help 3 other makers with their projects",
        "icon": "🤝",
        "xp": 200,
        "unlocked": False,
        "progress": 1,
        "total_required": 3
    },
    {
        "id": 7,
        "title": "Perfect Streak",
        "description": "Complete 5 projects without any mistakes",
        "icon": "🎯",
        "xp": 500,
        "unlocked": False,
        "progress": 3,
        "total_required": 5
    },
    {
        "id": 8,
        "title": "Material Explorer",
        "description": "Use 15 different materials",
        "icon": "🧪",
        "xp": 350,
        "unlocked": False,
        "progress": 8,
        "total_required": 15
    }
]

PROJECTS = [
    {
        "id": 1,
        "title": "Wooden Bookshelf",
        "progress": 75,
        "dueDate": "2024-03-15",
        "materials": ["wood", "screws", "wood stain", "measuring tape"],
        "status": "in_progress",
        "thumbnail": "bookshelf.jpg",
        "lastModified": "2024-02-01"
    },
    {
        "id": 2,
        "title": "Herb Garden Box",
        "progress": 30,
        "dueDate": "2024-03-20",
        "materials": ["cedar planks", "soil", "seeds", "drill"],
        "status": "planning",
        "thumbnail": "garden.jpg",
        "lastModified": "2024-02-03"
    },
    {
        "id": 3,
        "title": "Wall Mounted Desk",
        "progress": 90,
        "dueDate": "2024-02-28",
        "materials": ["plywood", "brackets", "screws", "wall anchors"],
        "status": "nearly_complete",
        "thumbnail": "desk.jpg",
        "lastModified": "2024-02-05"
    }
]

LEADERBOARD = [
    {
        "rank": 1,
        "username": "DIYMaster",
        "projects_completed": 47,
        "total_xp": 12500,
        "streak_days": 15,
        "avatar": "avatar1.jpg"
    },
    {
        "rank": 2,
        "username": "CraftGenius",
        "projects_completed": 42,
        "total_xp": 11200,
        "streak_days": 12,
        "avatar": "avatar2.jpg"
    },
    {
        "rank": 3,
        "username": "MakerPro",
        "projects_completed": 38,
        "total_xp": 10800,
        "streak_days": 8,
        "avatar": "avatar3.jpg"
    },
    {
        "rank": 4,
        "username": "CreativeCrafter",
        "projects_completed": 35,
        "total_xp": 9500,
        "streak_days": 6,
        "avatar": "avatar4.jpg"
    },
    {
        "rank": 5,
        "username": "BuildItBetter",
        "projects_completed": 31,
        "total_xp": 8900,
        "streak_days": 4,
        "avatar": "avatar5.jpg"
    }
]

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

        # Find similar projects based on materials
        items_array = [item.strip() for item in items_list.split(',')]
        similar_matches = find_similar_materials(items_array)
        
        # Format similar projects with similarity scores
        similar_projects = [
            {
                **match[0],
                "similarity": float(match[1]),  # Convert numpy float to Python float
                "title": match[0].get("title", "Untitled Project"),
                "materials": match[0].get("materials_required", []),
                "steps": match[0].get("steps", []),
                "tips": match[0].get("tips", []),
                "difficulty": match[0].get("difficulty", "Medium"),
                "timeRequired": match[0].get("time_required", "Unknown"),
                "warnings": {}
            }
            for match in similar_matches
        ]

        # Generate AI project
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
                '  "tips": ["tip1", "tip2"],\n'
                '  "warnings": {"1": "warning in step 1 (if any)", "2": "warning in step 2 (if any)", "3": "warning in step 3 (if any)"}\n'
                "}"
            ],
        )

        # Parse the AI response
        ai_project = json.loads(project_response.text.lstrip(".json").rstrip(""))

        return {
            "status": "success",
            "message": {
                "similar_projects": similar_projects,
                "ai_projects": [ai_project]
            }
        }

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate/{category}")
async def generate_project(category: str):
    try:
        # Generate project based on category
        project_response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[
                f"Generate a DIY project for the category: {category}\n\n"
                "The project should be suitable for beginners to intermediate level makers.\n"
                "Return it in this exact JSON format (no markdown):\n"
                "{\n"
                '  "title": "Project Name",\n'
                '  "materials": ["item1", "item2", "item3"],\n'
                '  "difficulty": "Easy/Medium/Hard",\n'
                '  "timeRequired": "estimated time",\n'
                '  "steps": ["step1", "step2", "step3"],\n'
                '  "tips": ["tip1", "tip2"],\n'
                '  "warnings": {"1": "warning for step 1 (if any)", "2": "warning for step 2 (if any)"}\n'
                "}"
            ],
        )
        import json
        project_data = json.loads(project_response.text.lstrip("```.json").rstrip("```"))
        return {
            "status": "success",
            "message": project_data
        }

    except Exception as e:
        print(f"Error generating project: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
        if '' in cleaned_response:
            cleaned_response = cleaned_response.split('')[1]
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

@app.get("/leaderboard")
def get_leaderboard():
    """Return the current leaderboard standings"""
    return LEADERBOARD

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
