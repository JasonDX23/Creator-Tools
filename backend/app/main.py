from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from .transcribe import router as transcribe_router
from .feedback import router as feedback_router
from .qr_gen import router as qr_router

app = FastAPI(
    title = 'Creator Tools',
    version='1.0.0'
)

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Creator Suite is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


app.include_router(transcribe_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")
app.include_router(qr_router, prefix="/api")