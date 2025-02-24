from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
import base64
import io

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


@app.get("/")
def hello():
    return {"Hello": "World"}


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
        import json
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
