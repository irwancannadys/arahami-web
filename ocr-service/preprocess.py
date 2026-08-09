"""
OpenCV preprocessing pipeline untuk foto daftar isi buku.
Urutan: decode → grayscale → deskew → denoise → resize
"""

import base64
import cv2
import numpy as np


def decode_b64(image_base64: str) -> np.ndarray:
    img_bytes = base64.b64decode(image_base64)
    arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Gagal decode gambar — format tidak dikenali")
    return img


def to_grayscale(img: np.ndarray) -> np.ndarray:
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def deskew(gray: np.ndarray) -> np.ndarray:
    """
    Luruskan foto yang sedikit miring menggunakan Hough lines.
    Skip kalau sudut < 0.5 derajat (tidak perlu koreksi).
    """
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges   = cv2.Canny(blurred, 50, 150, apertureSize=3)
    lines   = cv2.HoughLinesP(edges, 1, np.pi / 180,
                               threshold=80, minLineLength=80, maxLineGap=10)

    if lines is None:
        return gray

    angles = []
    for line in lines:
        pts = line.reshape(-1)       # pastikan 1D: [x1, y1, x2, y2]
        if len(pts) < 4:
            continue
        x1, y1, x2, y2 = int(pts[0]), int(pts[1]), int(pts[2]), int(pts[3])
        dx = x2 - x1
        if dx == 0:
            continue
        angle = np.degrees(np.arctan2(y2 - y1, dx))
        if abs(angle) < 45:          # abaikan garis hampir vertikal
            angles.append(float(angle))

    if not angles:
        return gray

    median_angle = float(np.median(angles))
    if abs(median_angle) < 0.5:      # sudah cukup lurus
        return gray

    h, w   = gray.shape
    center = (w // 2, h // 2)
    M      = cv2.getRotationMatrix2D(center, median_angle, 1.0)
    return cv2.warpAffine(gray, M, (w, h),
                          flags=cv2.INTER_CUBIC,
                          borderMode=cv2.BORDER_REPLICATE)


def denoise(gray: np.ndarray) -> np.ndarray:
    """Fast Non-Local Means — hilangkan noise tanpa merusak tepi huruf."""
    return cv2.fastNlMeansDenoising(gray, h=10)


def resize(img: np.ndarray, max_width: int = 1800) -> np.ndarray:
    h, w = img.shape[:2]
    if w <= max_width:
        return img
    scale  = max_width / w
    new_wh = (max_width, int(h * scale))
    return cv2.resize(img, new_wh, interpolation=cv2.INTER_LANCZOS4)


def to_bgr(gray: np.ndarray) -> np.ndarray:
    """PaddleOCR bekerja optimal dengan 3-channel image."""
    return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)


def preprocess(image_base64: str) -> np.ndarray:
    """
    Full pipeline:
    base64 → grayscale → deskew → denoise → resize → BGR (3-ch untuk PaddleOCR)
    """
    img      = decode_b64(image_base64)
    gray     = to_grayscale(img)
    straight = deskew(gray)
    clean    = denoise(straight)
    small    = resize(clean)
    return to_bgr(small)
