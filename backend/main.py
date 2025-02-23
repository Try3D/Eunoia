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

        # Read file contents
        contents = await file.read()

        # Ask Gemini to analyze the image
        response = client.models.generate_content(
            model="gemini-2.0-flash-exp",
            contents=[
                "What do you see in this image? Describe it in detail.",
                types.Part.from_bytes(data=contents, mime_type=file.content_type),
            ],
        )

        print(response.text)
        return {"status": "success", "message": response.text}

    except Exception as e:
        print(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
