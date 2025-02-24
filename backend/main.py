from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
import google.generativeai as gai
from google.genai import types
import os
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

gai.configure(api_key="AIzaSyDhjOSqI3j4rB1AzbgwqS6U3EGSoNvWpPs")

@app.get("/")
def hello():
    return {"Hello": "World"}


@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...)):
    try:
        print("Received file upload request")

        # Read file contents
        contents = await file.read()

        # Ask Gemini to analyze the image
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[
                "List only the important objects in the scene that could be useful for a project or recipe. Try to find the exact model of whatever object is present. Exclude any unnecessary environment objects. No need of a detailed explanation.",
                types.Part.from_bytes(data=contents, mime_type=file.content_type),
            ],
        )

        items = response.text

        # Create the model
        generation_config = {
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 65536,
        "response_mime_type": "text/plain",
        }

        model = gai.GenerativeModel(
        model_name="tunedModels/diy-project-lzf1cxkht10p",
        generation_config=generation_config,
        )

        chat_session = model.start_chat(
        history=[
            {
            "role": "system",
            "parts": [
                "Generate a creative DIY project idea the items given by the user\n\nThe output must be in the following JSON format:\n\njson\n{\n    \\\"description\\\": \\\"A clear explanation of what the project is and what it will look like when completed.\\\",\n    \\\"steps\\\": [\n        \\\"Step 1 in detail.\\\",\n        \\\"Step 2 in detail.\\\",\n        \\\"Step 3 in detail.\\\",\n        \\\"Step 4 in detail.\\\",\n        \\\"Step 5 in detail.\\\",\n        \\\"Step 6 in detail.\\\"\n    ]\n}\nThe project idea should be visually appealing, engaging, and detailed enough for someone to visualize the final outcome. Each step must be specific, ensuring that anyone can follow along and complete the project successfully.\n\nExample Output Format:\njson\n{\n    \\\"description\\\": \\\"This project guides you through the process of creating your own headphones using basic materials. The headphones work by converting electrical energy into vibrations, which are then amplified to produce sound.\\\",\n    \\\"steps\\\": [\n        \\\"Assemble the voice coil by wrapping copper wire around a cylindrical object (like a glue stick) approximately 40 times, then carefully removing it and securing the coil's shape.\\\",\n        \\\"Sand the ends of the copper wire to remove any coating, ensuring a good electrical connection.\\\",\n        \\\"Place one magnet on top of the plastic cup and another inside. Position the voice coil on top of the cup, over the magnet, and secure it with electrical tape, leaving the wire ends exposed.\\\",\n        \\\"Attach the copper wire ends to the aux plug holes, twisting to ensure a secure connection.\\\",\n        \\\"Plug the aux cord into a phone or device and play music at full volume to test the headphones.\\\"\n    ]\n}\n",
            ],
            },
        ]
        )

        response = chat_session.send_message(items)

        print(response.text)
        return {"status": "success", "message": response.text}

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
