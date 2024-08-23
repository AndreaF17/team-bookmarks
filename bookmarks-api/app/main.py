from fastapi import FastAPI
import json
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

origins = [
    "*"     
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
)

@app.get("/cve-bookmarks")
async def get_bookmarks():
    # read file
    with open("/opt/bookmarks-links/CVE.json", "r") as file:
        return json.load(file)

