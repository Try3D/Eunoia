from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
import json
import numpy as np
from sentence_transformers import SentenceTransformer
import chromadb
from sqlalchemy.orm import Session

# Import database modules
from database import get_db
from models import Achievement, User, Project, UserAchievement

model = SentenceTransformer("all-MiniLM-L6-v2")

app = FastAPI()

client = genai.Client(api_key="AIzaSyDhjOSqI3j4rB1AzbgwqS6U3EGSoNvWpPs")

# Initialize ChromaDB client
chroma_client = chromadb.PersistentClient(path="../scripts/chroma_db")
collection = chroma_client.get_or_create_collection(name="materials_collection")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:19006",
        "http://10.31.22.178",
        "http://10.31.23.247:8000",
        "http://10.31.23.247:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def find_similar_materials(user_materials, top_n=2):
    """Find similar materials using ChromaDB"""
    user_text = ", ".join(user_materials)

    # Query ChromaDB for similar materials
    results = collection.query(
        query_texts=[user_text],
        n_results=top_n,
        include=["metadatas", "documents", "distances"],
    )

    similar_projects = []

    # Process results from ChromaDB
    if results and "metadatas" in results and len(results["metadatas"]) > 0:
        for i, metadata in enumerate(results["metadatas"][0]):
            # ChromaDB returns distance, convert to similarity score (1 - distance)
            similarity = results["distances"][0][i]
            similarity_score = 1 - similarity if similarity <= 1 else 0

            # Decode metadata (convert stored JSON strings back to lists)
            decoded_metadata = {
                k: json.loads(v)
                if isinstance(v, str) and (v.startswith("[") or v.startswith("{"))
                else v
                for k, v in metadata.items()
            }

            # Extract relevant fields from metadata
            project_data = {
                "id": results["ids"][0][i],
                "title": decoded_metadata.get("title", "Untitled Project"),
                "materials_required": decoded_metadata.get("materials_required", []),
                "steps": decoded_metadata.get("steps", []),
                "tips": decoded_metadata.get("tips", []),
                "difficulty": decoded_metadata.get("difficulty", "Medium"),
                "time_required": decoded_metadata.get("time_required", "Unknown"),
            }

            similar_projects.append((project_data, similarity_score))

    # Sort by similarity score (higher is better)
    similar_projects.sort(key=lambda x: x[1], reverse=True)

    return similar_projects


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
        items_array = [item.strip() for item in items_list.split(",")]
        similar_matches = find_similar_materials(items_array)

        # Format similar projects with similarity scores
        similar_projects = [
            {
                **match[0],
                "similarity": float(match[1]),
                "title": match[0].get("title", "Untitled Project"),
                "materials": match[0].get("materials_required", []),
                "steps": match[0].get("steps", []),
                "tips": match[0].get("tips", []),
                "difficulty": match[0].get("difficulty", "Medium"),
                "timeRequired": match[0].get("time_required", "Unknown"),
                "warnings": {},
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
        try:
            response_text = project_response.text
            # Strip markdown code blocks if present
            if "```" in response_text:
                response_text = response_text.split("```")[1]
                if response_text.startswith("json\n"):
                    response_text = response_text[5:]

            ai_project = json.loads(response_text.strip())
        except json.JSONDecodeError:
            # Fallback in case of malformed JSON
            ai_project = {
                "title": "Custom Project",
                "materials": items_array,
                "difficulty": "Medium",
                "timeRequired": "30 minutes",
                "steps": ["Step 1: Gather materials", "Step 2: Create your project"],
                "tips": ["Be creative"],
                "warnings": {},
            }

        return {
            "status": "success",
            "message": {
                "similar_projects": similar_projects,
                "ai_projects": [ai_project],
            },
        }

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/step")
async def complete_step(request: dict, db: Session = Depends(get_db)):
    """Mark a step as complete and update progress"""
    try:
        project = (
            db.query(Project)
            .filter(
                Project.title == request["projectTitle"],
                Project.user_id == 1,  # Hardcoded for now
            )
            .first()
        )

        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Add step to completed steps if not already there
        completed_steps = project.completed_steps or []
        if request["stepNumber"] not in completed_steps:
            completed_steps.append(request["stepNumber"])
            project.completed_steps = completed_steps

        # Update progress
        total_steps = len(project.steps)
        project.progress = (len(completed_steps) / total_steps) * 100

        db.commit()
        return {"success": True, "progress": project.progress}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/projects")
def get_projects(db: Session = Depends(get_db)):
    return []


@app.get("/achievements")
def get_achievements(user_id: int = 1, db: Session = Depends(get_db)):
    """Retrieve achievements for a user, defaults to user_id 1"""
    # Join UserAchievement with Achievement to get all achievement data
    user_achievements = (
        db.query(Achievement, UserAchievement)
        .join(UserAchievement, Achievement.id == UserAchievement.achievement_id)
        .filter(UserAchievement.user_id == user_id)
        .all()
    )

    result = []
    for achievement, user_achievement in user_achievements:
        result.append(
            {
                "id": achievement.id,
                "title": achievement.title,
                "description": achievement.description,
                "icon": achievement.icon,
                "xp": achievement.xp,
                "unlocked": user_achievement.unlocked,
                "date_unlocked": user_achievement.date_unlocked.isoformat()
                if user_achievement.date_unlocked
                else None,
                "progress": user_achievement.progress,
                "total_required": achievement.total_required,
            }
        )

    return result


@app.post("/clarify-step")
async def clarify_step(request: dict):
    try:
        project_title = request.get("projectTitle")
        step_number = request.get("stepNumber")
        original_step = request.get("stepContent")

        if not all([project_title, step_number, original_step]):
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: projectTitle, stepNumber, or stepContent",
            )

        print(
            f"Processing clarification request for {project_title}, step {step_number}"
        )

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
            model="gemini-2.0-flash-exp", contents=[clarification_prompt]
        )

        # Clean and parse the response
        cleaned_response = response.text.strip()

        # Remove any markdown formatting
        if "```" in cleaned_response:
            cleaned_response = cleaned_response.split("```")[1]
            if cleaned_response.startswith("json\n"):
                cleaned_response = cleaned_response[5:]

        print(f"Cleaned response: {cleaned_response}")

        try:
            clarified_content = json.loads(cleaned_response)
        except json.JSONDecodeError as je:
            print(f"JSON Parse Error: {je}")
            print(f"Raw Response: {cleaned_response}")
            # Attempt to fix common JSON formatting issues
            cleaned_response = cleaned_response.replace("\n", "").replace("  ", " ")
            try:
                clarified_content = json.loads(cleaned_response)
            except:
                raise HTTPException(
                    status_code=500, detail="Failed to parse AI response"
                )

        # Ensure the response has the required structure
        if not all(
            key in clarified_content
            for key in ["detailed_steps", "tips", "common_mistakes"]
        ):
            raise HTTPException(
                status_code=500, detail="Invalid response structure from AI"
            )

        return {"status": "success", "clarification": clarified_content}

    except Exception as e:
        print(f"Error in clarify_step: {str(e)}")
        print(f"Request data: {request}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    """Return the current leaderboard standings from database"""
    users = db.query(User).order_by(User.total_xp.desc()).all()

    result = []
    for i, user in enumerate(users):
        result.append(
            {
                "rank": i + 1,
                "username": user.username,
                "projects_completed": user.projects_completed,
                "total_xp": user.total_xp,
                "streak_days": user.streak_days,
                "avatar": user.avatar,
            }
        )

    print(result)
    return result


@app.post("/generate/{category}")
async def generate_project(category: str):
    """Generate project ideas for a specific category"""
    try:
        # Create a category-specific prompt
        prompt = f"""Generate 3 DIY project ideas for the {category} category. 
        Return them in this exact JSON format (no markdown):
        {{
          "similar_projects": [],
          "ai_projects": [
            {{
              "title": "Project Name",
              "materials": ["item1", "item2", "item3"],
              "difficulty": "Easy/Medium/Hard",
              "timeRequired": "estimated time",
              "steps": ["step1", "step2", "step3"],
              "tips": ["tip1", "tip2"],
              "warnings": {{"1": "warning for step 1", "2": "warning for step 2"}}
            }}
          ]
        }}"""

        response = client.models.generate_content(
            model="gemini-2.0-flash-exp", contents=[prompt]
        )

        # Clean and parse the response
        cleaned_response = response.text.strip()
        if "```" in cleaned_response:
            cleaned_response = cleaned_response.split("```")[1]
            if cleaned_response.startswith("json\n"):
                cleaned_response = cleaned_response[5:]

        result = json.loads(cleaned_response)
        print(result)
        return {"status": "success", "message": result}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
