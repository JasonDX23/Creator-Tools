import asyncio
import logging
import os
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

router = APIRouter(tags=["Video converter"])
logger = logging.getLogger(__name__)

OUTPUT_FORMATS = {"mp4", "mov", "mkv", "webm", "avi"}
INPUT_EXTENSIONS = {
    ".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v", ".flv", ".wmv",
    ".mpeg", ".mpg", ".3gp", ".ts", ".mts",
}
MEDIA_TYPES = {"mp4": "video/mp4", "mov": "video/quicktime", "mkv": "video/x-matroska", "webm": "video/webm", "avi": "video/x-msvideo"}
UPLOAD_CHUNK_SIZE = 1024 * 1024
MAX_UPLOAD_BYTES = int(os.getenv("MAX_VIDEO_UPLOAD_BYTES", str(500 * 1024 * 1024)))
CONVERSION_TIMEOUT_SECONDS = int(os.getenv("VIDEO_CONVERSION_TIMEOUT_SECONDS", "900"))


def remove_files(*paths: str) -> None:
    """Best-effort cleanup for request-specific temporary files."""
    for path in paths:
        if path:
            try:
                Path(path).unlink(missing_ok=True)
            except OSError:
                logger.warning("Could not remove temporary conversion file: %s", path)


async def save_upload(upload: UploadFile, destination: str) -> int:
    """Stream a video to disk rather than holding an entire upload in RAM."""
    bytes_written = 0
    with open(destination, "wb") as output:
        while chunk := await upload.read(UPLOAD_CHUNK_SIZE):
            bytes_written += len(chunk)
            if bytes_written > MAX_UPLOAD_BYTES:
                raise HTTPException(413, f"Video is too large. The limit is {MAX_UPLOAD_BYTES // 1048576} MB.")
            output.write(chunk)
    return bytes_written


def codec_arguments(target_ext: str) -> list[str]:
    # Exclude data, subtitle, and attachment streams that can break remuxing.
    stream_map = ["-map", "0:v:0", "-map", "0:a?", "-pix_fmt", "yuv420p"]
    if target_ext == "webm":
        return [*stream_map, "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-c:a", "libopus"]
    return [*stream_map, "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-c:a", "aac"]


@router.post("/convert")
async def convert_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    output_format: str = Form(...),
):
    """Convert one uploaded video and return it as a downloadable file."""
    source_name = file.filename or "video"
    source_ext = Path(source_name).suffix.lower()
    target_ext = output_format.lower().lstrip(".")
    if source_ext not in INPUT_EXTENSIONS:
        raise HTTPException(400, "Unsupported input video format")
    if target_ext not in OUTPUT_FORMATS:
        raise HTTPException(400, "Unsupported output video format")

    input_path = output_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=source_ext) as input_file:
            input_path = input_file.name
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{target_ext}") as output_file:
            output_path = output_file.name
        remove_files(output_path)  # FFmpeg must create this file itself.

        if await save_upload(file, input_path) == 0:
            raise HTTPException(400, "The uploaded video is empty")

        command = [imageio_ffmpeg.get_ffmpeg_exe(), "-hide_banner", "-nostdin", "-y", "-i", input_path, *codec_arguments(target_ext)]
        if target_ext in {"mp4", "mov"}:
            command.extend(["-movflags", "+faststart"])
        command.append(output_path)

        # Do not block FastAPI's event loop while FFmpeg is using the CPU.
        result = await asyncio.to_thread(subprocess.run, command, capture_output=True, text=True, timeout=CONVERSION_TIMEOUT_SECONDS, check=False)
        if result.returncode != 0 or not os.path.isfile(output_path) or os.path.getsize(output_path) == 0:
            diagnostic = (result.stderr or result.stdout or "no FFmpeg output").strip()
            logger.error("FFmpeg conversion failed (exit %s): %s", result.returncode, diagnostic[-4000:])
            raise HTTPException(422, "FFmpeg could not convert this video")

        download_name = f"{Path(source_name).stem or 'video'}.{target_ext}"
        response_input_path, response_output_path = input_path, output_path
        background_tasks.add_task(remove_files, response_input_path, response_output_path)
        input_path = output_path = ""  # The response background task now owns cleanup.
        return FileResponse(response_output_path, media_type=MEDIA_TYPES[target_ext], filename=download_name, background=background_tasks)
    except subprocess.TimeoutExpired:
        logger.warning("Video conversion timed out after %s seconds", CONVERSION_TIMEOUT_SECONDS)
        raise HTTPException(408, "Conversion timed out")
    except HTTPException:
        raise
    except Exception:
        logger.exception("Video conversion failed before FFmpeg completed")
        raise HTTPException(500, "Video conversion failed")
    finally:
        await file.close()
        remove_files(input_path, output_path)
