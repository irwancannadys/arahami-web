"""
Test EasyOCR dengan foto daftar isi buku.
Usage: python test_easyocr.py <path_foto1> [path_foto2 ...]
"""

import sys
import easyocr
from PIL import Image

def run(image_paths: list[str]):
    print("=== EasyOCR — Inisialisasi reader ['id', 'en'] ===")
    reader = easyocr.Reader(['id', 'en'])

    all_lines = []

    for i, path in enumerate(image_paths):
        print(f"\n====== FOTO {i + 1}: {path} ======")
        results = reader.readtext(path)

        print("\n--- RAW (bbox | text | confidence) ---")
        for (bbox, text, conf) in results:
            print(f"  [{conf:.2f}] {text}")
            all_lines.append(text)

    print("\n====== GABUNGAN SEMUA TEKS (urutan deteksi) ======")
    for line in all_lines:
        print(f"  {line}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_easyocr.py <foto1.jpg> [foto2.jpg ...]")
        sys.exit(1)
    run(sys.argv[1:])
