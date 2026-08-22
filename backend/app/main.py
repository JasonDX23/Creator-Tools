from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
from .qr_gen import router as qr_code_router
from .transcribe import router as caption_router
from .feedback import router as feedback_router

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


app.include_router(qr_code_router, prefix='/api')
app.include_router(caption_router, prefix='/api')
app.include_router(feedback_router, prefix='/api')