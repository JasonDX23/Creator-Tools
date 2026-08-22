import os
from dotenv import load_dotenv

# Load environment variables FIRST before importing routes
load_dotenv()

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from .transcribe import router as transcribe_router
from .feedback import router as feedback_router
from .qr_gen import router as qr_router

app = FastAPI(
    title='Creator Tools',
    version='1.0.0'
)

# Handle Render's HEAD health check ping
@app.head("/")
def head_root():
    return Response(status_code=200)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Creator Suite is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Route prefixes
app.include_router(transcribe_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")
app.include_router(qr_router, prefix="/api")