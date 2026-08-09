"""
Python OCR Service — FastAPI + PaddleOCR + OpenCV
Endpoint: POST /ocr  →  { text: string }
Run local: uvicorn main:app --reload --port 8000
"""

import os
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from preprocess import preprocess

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

OCR_SECRET = os.getenv("OCR_SECRET", "arahami-ocr-secret-2026")


# ---------------------------------------------------------------------------
# PaddleOCR singleton — load sekali saat startup, reuse per request
# ---------------------------------------------------------------------------

_ocr = None

def get_ocr():
    global _ocr
    if _ocr is None:
        from paddleocr import PaddleOCR
        _ocr = PaddleOCR(lang="id", use_textline_orientation=True)
    return _ocr


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up model saat server start (download model jika belum ada)
    print("[OCR Service] Loading PaddleOCR model...")
    get_ocr()
    print("[OCR Service] Model ready.")
    yield


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Arahami OCR Service", lifespan=lifespan)


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

class ImageInput(BaseModel):
    imageBase64: str
    mimeType:    str

class OCRRequest(BaseModel):
    images: list[ImageInput]

class OCRResponse(BaseModel):
    text: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ocr", response_model=OCRResponse)
def ocr_endpoint(
    body: OCRRequest,
    x_ocr_secret: Optional[str] = Header(None),
):
    if x_ocr_secret != OCR_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not body.images:
        raise HTTPException(status_code=400, detail="images wajib diisi")

    ocr       = get_ocr()
    all_lines: list[str] = []

    for i, img_input in enumerate(body.images):
        try:
            processed = preprocess(img_input.imageBase64)
        except Exception as e:
            print(f"[OCR] Preprocess foto {i+1} gagal: {e}")
            continue

        try:
            results = ocr.predict(processed)
        except Exception as e:
            print(f"[OCR] PaddleOCR foto {i+1} gagal: {e}")
            continue

        for res in results:
            texts = res.get("rec_texts", [])
            for t in texts:
                t = t.strip()
                if t:
                    all_lines.append(t)

    combined = "\n".join(all_lines)
    return OCRResponse(text=combined)
