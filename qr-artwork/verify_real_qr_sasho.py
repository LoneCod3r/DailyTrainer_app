"""Verify out/qr-sasho-real-qr*.png decode to the exact URL.

- Module audit: samples every module centre and compares it with the encoded
  matrix, reporting wrong modules hidden by the figure separately.
- Decoding with zxing-cpp and OpenCV, as rendered and under phone-like stress
  variants (aspect-preserving), plus the image placed on a white page and on
  a dark surface (the layout itself has almost no quiet zone).

Usage:  python verify_real_qr_sasho.py      (exit code 1 on any required failure)
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

import generate_qr_art as base
import make_real_qr_sasho as mk
from verify_qr import decode_opencv, decode_zxing

OUT = Path(__file__).resolve().parent / "out"
URL = base.URL
FILES = [("qr-sasho-real-qr.png", 1), ("qr-sasho-real-qr@3x.png", 3)]


def audit(img, k):
    _, matrix = base.make_qr()
    _, _, cover = mk.figure_layer(k)     # full silhouette incl. its edge band
    g = np.asarray(img.convert("L"), float)
    hidden = visible = 0
    for r, row in enumerate(matrix):
        for c, bit in enumerate(row):
            x = int((mk.X0 + (c + .5) * mk.M) * k)
            y = int((mk.Y0 + (r + .5) * mk.M) * k)
            if (g[y, x] < 160) != bit:
                if cover[y, x] > .5:
                    hidden += 1
                else:
                    visible += 1
    return visible, hidden, len(matrix) ** 2


def scaled(img, w):
    return img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)


def variants(img):
    yield "as rendered (no extra margin)", img, True
    yield "on white page (4-module margin)", ImageOps.expand(img, img.width // 9, (255, 255, 255)), True
    yield "on dark surface", ImageOps.expand(img, img.width // 9, (30, 30, 30)), False
    for w in (600, 300, 200, 150):
        yield f"downscaled to {w}px wide", scaled(img, w), True
    p = scaled(img, 600)
    yield "gaussian blur r=1.5", p.filter(ImageFilter.GaussianBlur(1.5)), True
    buf = io.BytesIO()
    p.save(buf, "JPEG", quality=30)
    yield "JPEG q=30", Image.open(io.BytesIO(buf.getvalue())), True
    yield "rotated 17deg", p.rotate(17, expand=True, fillcolor=(255, 255, 255)), True
    yield "contrast x0.55", ImageEnhance.Contrast(p).enhance(.55), True
    yield "brightness x0.6", ImageEnhance.Brightness(p).enhance(.6), True
    a = np.asarray(p, float)
    noisy = np.clip(a + np.random.default_rng(7).normal(0, 22, a.shape), 0, 255).astype(np.uint8)
    yield "gaussian noise sigma=22", Image.fromarray(noisy), True
    a = np.asarray(ImageOps.expand(p, 40, (255, 255, 255)))
    h, w = a.shape[:2]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32([[w * .08, h * .05], [w * .95, 0], [w, h], [0, h * .93]])
    warped = cv2.warpPerspective(a, cv2.getPerspectiveTransform(src, dst), (w, h),
                                 borderValue=(255, 255, 255))
    yield "perspective tilt", Image.fromarray(warped), True


def main():
    print(f"Expected URL: {URL}\n")
    failures = 0
    for f, k in FILES:
        img = Image.open(OUT / f).convert("RGB")
        vis, hid, total = audit(img, k)
        ok = vis == 0
        failures += not ok
        print(f"[{'PASS' if ok else 'FAIL'}] {f} ({img.width}x{img.height}) module audit: "
              f"{vis} wrong visible modules; {hid} of {total} hidden behind the figure "
              f"({100 * hid / total:.1f}%, level H repairs ~30%)")
        for name, v, required in variants(img):
            z, o = decode_zxing(v), decode_opencv(v)
            z_ok, o_ok = z == [URL], o == [URL]
            passed = z_ok and o_ok
            tag = "PASS" if passed else ("FAIL" if required else "INFO")
            failures += required and not passed
            print(f"   [{tag}] {name:<32} zxing-cpp={'OK' if z_ok else repr(z):<6} "
                  f"opencv={'OK' if o_ok else repr(o)}")
        print()
    print("ALL REQUIRED CHECKS PASSED" if not failures else f"{failures} CHECK(S) FAILED")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
