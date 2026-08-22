import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
import whisper
from whisper.utils import get_writer

router = APIRouter(prefix="/transcript", tags=["Captions"])

model = whisper.load_model("tiny")

@router.post("/captions")
async def get_captions(file: UploadFile = File(...)):
    allowed_exts = (".mp4", ".mov", ".m4a", ".mp3", ".wav", ".mkv", ".avi")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Unsupported media format")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name

    try:
        # Transcribe (fp16=False suppresses CPU warning on Windows/CPU)
        result = model.transcribe(tmp_path, fp16=False)
        
        out_dir = tempfile.gettempdir()
        srt_writer = get_writer("srt", out_dir)
        srt_writer(result, tmp_path)
        
        # Whisper removes the file extension to build the SRT filename
        tmp_stem = os.path.splitext(os.path.basename(tmp_path))[0]
        srt_path = os.path.join(out_dir, f"{tmp_stem}.srt")
        
        with open(srt_path, "r", encoding="utf-8") as srt_file:
            srt_content = srt_file.read()
            
        return {"filename": file.filename, "srt": srt_content}

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if 'srt_path' in locals() and os.path.exists(srt_path):
            os.remove(srt_path)