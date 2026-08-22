from functools import lru_cache
from io import BytesIO
from fastapi import APIRouter, Response
import segno

router = APIRouter(tags=['image'])

@lru_cache(maxsize=1024)
def generate_qr_bytes(url: str) -> bytes:
    img = segno.make(url)
    buffer = BytesIO()
    # Use kind='png' instead of format='PNG', and add scale for visibility
    img.save(buffer, kind="png", scale=8)
    return buffer.getvalue()

@router.get('/qrcode')
def get_qrcode(url: str):
    image_bytes = generate_qr_bytes(url)
    return Response(content=image_bytes, media_type="image/png")