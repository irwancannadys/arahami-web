"""
Test PaddleOCR dengan foto daftar isi buku.
Usage: python test_paddleocr.py <path_foto1> [path_foto2 ...]
"""

import sys
from paddleocr import PaddleOCR

def run(image_paths: list[str]):
    print("=== PaddleOCR — Inisialisasi lang='id', use_angle_cls=True ===")
    ocr = PaddleOCR(lang='id', use_textline_orientation=True)

    all_lines = []

    for i, path in enumerate(image_paths):
        print(f"\n====== FOTO {i + 1}: {path} ======")
        result = ocr.predict(path)

        print("\n--- RAW (text | confidence) ---")
        for res in result:
            for item in res['rec_texts']:
                if item.strip():
                    print(f"  {item}")
                    all_lines.append(item)

    print("\n====== GABUNGAN SEMUA TEKS (urutan deteksi) ======")
    for line in all_lines:
        print(f"  {line}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_paddleocr.py <foto1.jpg> [foto2.jpg ...]")
        sys.exit(1)
    run(sys.argv[1:])
