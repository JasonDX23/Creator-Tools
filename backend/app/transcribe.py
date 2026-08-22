import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException
from groq import Groq

router = APIRouter(tags=["Captions"])

def format_timestamp(seconds: float) -> str:
    """Helper to convert float seconds into SRT timestamp format (HH:MM:SS,mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

@router.post("/captions")
async def get_captions(file: UploadFile = File(...)):
    # Retrieve API key dynamically at runtime
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY environment variable is not set")

    client = Groq(api_key=groq_api_key)

    allowed_exts = (".mp4", ".mov", ".m4a", ".mp3", ".wav", ".mkv", ".avi")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Unsupported media format")

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name

    try:
        # Request verbose json from Groq to get segment timing for SRT formatting
        with open(tmp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=(file.filename, audio_file.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
            )

        # Build SRT content string from Groq segments
        srt_lines = []
        segments = getattr(transcription, "segments", []) or []
        
        for idx, segment in enumerate(segments, start=1):
            # Groq segments are dicts or objects depending on SDK version
            start_val = segment["start"] if isinstance(segment, dict) else segment.start
            end_val = segment["end"] if isinstance(segment, dict) else segment.end
            text_val = segment["text"] if isinstance(segment, dict) else segment.text

            start_str = format_timestamp(start_val)
            end_str = format_timestamp(end_val)
            text = text_val.strip()
            
            srt_lines.append(f"{idx}\n{start_str} --> {end_str}\n{text}\n")

        srt_content = "\n".join(srt_lines)

        return {"filename": file.filename, "srt": srt_content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API Error: {str(e)}")

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)