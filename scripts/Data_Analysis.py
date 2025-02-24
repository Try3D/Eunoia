import json
import os
import pandas as pd
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from google import genai
from concurrent.futures import ThreadPoolExecutor, as_completed

os.makedirs("extracted_ideas", exist_ok=True)

def get_full_url(instructable_link, base_url="https://www.instructables.com/id/"):
    return urljoin(base_url, instructable_link.lstrip('/id/'))

def fetch_page(url):
    response = requests.get(url)
    return BeautifulSoup(response.text, "html.parser") if response.status_code == 200 else None

def extract_images(soup, base_url):
    return [
        urljoin(base_url, img.get("src"))
        for img in soup.find_all("img") if img.get("src")
        if urlparse(urljoin(base_url, img.get("src"))).netloc == "content.instructables.com"
    ]

def extract_text(soup):
    return "\n".join(element.get_text(strip=True) for element in soup.find_all(["p", "h1", "h2", "h3", "h4", "h5", "h6", "div"]))

def build_gemini_prompt(text_content):
    return f"""
Extract and structure the following text into a JSON object with:
- "materials_required": a list of key materials required.
- "description": a summary of the project.
- "steps": a list of detailed steps.

Return JSON format:
{{
    "materials_required": [string, ...],
    "description": string,
    "steps": [string, ...]
}}

Text:
{text_content}
"""

def call_gemini(prompt, client):
    r = client.models.generate_content(model="gemini-2.0-flash", contents=[prompt])
    response_text = r.text.strip().lstrip("```json").rstrip("```").strip()
    
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return {}

def process_instructable(row, client, base_url="https://www.instructables.com/id/"):
    project_title = row["Project-Title"]
    filename = f"extracted_ideas/{project_title}.json"
    full_url = get_full_url(row["Instructables-link"], base_url)
    
    soup = fetch_page(full_url)
    if soup is None:
        return None

    extracted_data = {
        "url": full_url,
        "creator": row["Creator"],
        "subcategory": row["Subcategory"],
        "title": project_title,
        "images": extract_images(soup, full_url),
    }
    
    text_content = extract_text(soup)
    prompt = build_gemini_prompt(text_content)
    extracted_data.update(call_gemini(prompt, client))

    existing_data = []
    if os.path.exists(filename):
        with open(filename, "r") as f:
            try:
                existing_data = json.load(f)
            except json.JSONDecodeError:
                pass

    existing_data.append(extracted_data)

    with open(filename, "w") as f:
        json.dump(existing_data, f, indent=4)

df = pd.read_csv("./projects_circuits.csv").sample(frac=1).reset_index(drop=True)
client = genai.Client(api_key="AIzaSyDhjOSqI3j4rB1AzbgwqS6U3EGSoNvWpPs")

with ThreadPoolExecutor(5) as executor:
    futures = {executor.submit(process_instructable, row, client): row for _, row in df.iterrows()}
    
    for future in as_completed(futures):
        try:
            future.result()
        except Exception as e:
            print(f"[ERROR] {e}")
