from fastapi import FastAPI
import json
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

origins = [
    "*"     
]

FILE_PATH = ""

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
)

@app.get("/cve-bookmarks")
async def get_bookmarks():
    # read file
    with open(FILE_PATH, "r") as file:
        return json.load(file)

