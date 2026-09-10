import os
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

router = APIRouter(tags=["Video converter"])

# These are container formats that FFmpeg can reliably create with the bundled binary.
OUTPUT_FORMATS = {"mp4", "mov", "mkv", "webm", "avi"}
INPUT_EXTENSIONS = {
    ".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".flv", ".wmv",
    ".mpeg", ".mpg", ".3gp", ".ts", ".mts",
}


def remove_files(*paths):
    for path in paths:
        if path and os.path.exists(path):
            os.remove(path)


@router.post("/convert")
async def convert_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form(...),
):
    """Convert an uploaded video and return it as a downloadable file."""
    source_name = file.filename or "video"
    source_ext = Path(source_name).suffix.lower()
    target_ext = output_format.lower().lstrip(".")

    if source_ext not in INPUT_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported input video format")
    if target_ext not in OUTPUT_FORMATS:
        raise HTTPException(status_code=400, detail="Unsupported output video format")

    input_handle = tempfile.NamedTemporaryFile(delete=False, suffix=source_ext)
    input_path = input_handle.name
    input_handle.close()
    output_path = f"{input_path}.{target_ext}"

    try:
        with open(input_path, "wb") as destination:
            destination.write(await file.read())

        # H.264/AAC offers broad compatibility for MP4, MOV, MKV and AVI.
        # WebM requires its native VP9/Opus codecs.
        if target_ext == "webm":
            codecs = ["-c:v", "libvpx-vp9", "-c:a", "libopus"]
        else:
            codecs = ["-c:v", "libx264", "-c:a", "aac"]

        command = [imageio_ffmpeg.get_ffmpeg_exe(), "-y", "-i", input_path, *codecs]
        # This atom placement option is specific to QuickTime/MP4 containers.
        if target_ext in {"mp4", "mov"}:
            command.extend(["-movflags", "+faststart"])
        command.append(output_path)
        result = subprocess.run(
            command, capture_output=True, text=True, timeout=900, check=False
        )
        if result.returncode != 0 or not os.path.exists(output_path):
            raise HTTPException(status_code=422, detail="FFmpeg could not convert this video")

        download_name = f"{Path(source_name).stem}.{target_ext}"
        background_tasks.add_task(remove_files, input_path, output_path)
        return FileResponse(
            output_path,
            media_type="application/octet-stream",
            filename=download_name,
            background=background_tasks,
        )
    except subprocess.TimeoutExpired:
        remove_files(input_path, output_path)
        raise HTTPException(status_code=408, detail="Conversion timed out")
    except HTTPException:
        remove_files(input_path, output_path)
        raise
    except Exception:
        remove_files(input_path, output_path)
        raise HTTPException(status_code=500, detail="Video conversion failed")
