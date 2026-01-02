from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# API

app = FastAPI()

# Autoriser React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/ping")
def ping():
    return {"message": "Backend OK"}

@app.post("/test")
def test_endpoint(payload: dict):
    return {
        "status": "received",
        "payload": payload
    }
