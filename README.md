# Eunoia - Enchanced DIY Learning App

## Project Overview
This project is a DIY recommendation system that retrieves appropriate do-it-yourself (DIY) projects based on user-provided materials. The system leverages Retrieval-Augmented Generation (RAG) to enhance search accuracy.

## Tech Stack
- **Backend**: FastAPI (for creating API routes)
- **Machine Learning**: Web scraping with BeautifulSoup4, JSON storage, and vector embeddings for retrieval
- **Frontend**: React Native (for user interface)

## Features
- Web scrapes DIY projects from [Instructables](https://www.instructables.com/) using `beautifulsoup4`
- Stores DIY data in JSON format
- Generates vector embeddings for efficient retrieval
- Uses RAG to recommend DIY projects based on user-provided materials
- Provides an interactive frontend built with React Native

## Setup Instructions
### Backend
1. Clone the repository:
   ```sh
   git clone https://github.com/Try3D/Eunoia.git
   cd Eunoia
   ```
2. Set up a virtual environment:
   ```sh
   python -m venv env
   source env/bin/activate  # On Windows use `env\Scripts\activate`
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Run the FastAPI server:
   ```sh
   uvicorn main:app --reload
   ```

### Frontend
1. Navigate to the frontend directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the React Native app:
   ```sh
   npm start
   ```



## Future Enhancements
- Implement user authentication
- Improve the search algorithm
- Add a rating system for DIY projects



