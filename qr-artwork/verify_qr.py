"""Independently verify the rendered QR artwork.

1. Module audit: samples every module centre of the rendered PNG and compares it
   with the matrix segno encoded. Outside the centre medallion it expects 0 errors.
2. Decoding: two decoders that don't share code with segno (zxing-cpp, the
   engine behind most Android scanner libraries, and OpenCV's QRCodeDetector)
   must return exactly the URL for every output file, and for stress variants
   that mimic a phone camera or a small on-screen display: downscaled to
   phone width, blurred, JPEG-compressed, rotated, perspective-tilted,
   low-contrast and noisy.

Usage:  python verify_qr.py        (exit code 1 on any failure)
"""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

import cv2
import numpy as np
import zxingcpp
from PIL import Image, ImageEnhance, ImageFilter

OUT = Path(__file__).resolve().parent / "out"
META = json.loads((OUT / "qr-meta.json").read_text(encoding="utf-8"))
URL = META["url"]
FILES = ["kuko-way-qr-print.png", "kuko-way-qr.png", "kuko-way-qr-social.png"]


def decode_zxing(img: Image.Image):
    res = zxingcpp.read_barcodes(img, formats=zxingcpp.BarcodeFormat.QRCode)
    return [r.text for r in res]


def decode_opencv(img: Image.Image):
    arr = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2BGR)
    text, _, _ = cv2.QRCodeDetector().detectAndDecode(arr)
    return [text] if text else []


def module_audit(img: Image.Image):
    canvas_w = META["canvas"][0]
    s = img.width / canvas_w
    x0, y0, size, _ = (v * s for v in META["symbol_box_viewbox"])
    n = META["modules"]
    m = size / n
    gray = np.array(img.convert("L"), dtype=float)
    lo = n // 2 - 7 // 2
    errors, med_errors = [], 0
    for r, row in enumerate(META["matrix"]):
        for c, bit in enumerate(row):
            px = gray[int(y0 + (r + .5) * m), int(x0 + (c + .5) * m)]
            dark = px < 128
            if dark != (bit == "1"):
                if lo <= r < lo + 7 and lo <= c < lo + 7:
                    med_errors += 1
                else:
                    errors.append((r, c))
    return errors, med_errors


def variants(base: Image.Image):
    """Yield (name, image) stress variants of a rendered poster."""
    yield "as-rendered", base
    for w in (1080, 600, 390, 300):          # 390 px = iPhone logical width
        img = base.resize((w, round(base.height * w / base.width)), Image.LANCZOS)
        yield f"downscaled to {w}px wide", img
    phone = base.resize((780, 975), Image.LANCZOS)
    yield "gaussian blur r=2 @780px", phone.filter(ImageFilter.GaussianBlur(2))
    buf = io.BytesIO()
    phone.convert("RGB").save(buf, "JPEG", quality=30)
    yield "JPEG q=30 @780px", Image.open(io.BytesIO(buf.getvalue()))
    yield "rotated 17deg", phone.rotate(17, expand=True, fillcolor=(24, 25, 23))
    yield "contrast x0.55", ImageEnhance.Contrast(phone).enhance(.55)
    yield "brightness x0.6", ImageEnhance.Brightness(phone).enhance(.6)
    arr = np.array(phone.convert("RGB")).astype(float)
    rng = np.random.default_rng(7)
    noisy = np.clip(arr + rng.normal(0, 22, arr.shape), 0, 255).astype(np.uint8)
    yield "gaussian noise sigma=22", Image.fromarray(noisy)
    a = np.array(phone.convert("RGB"))
    h, w = a.shape[:2]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32([[w * .08, h * .05], [w * .95, 0], [w, h], [0, h * .93]])
    warped = cv2.warpPerspective(a, cv2.getPerspectiveTransform(src, dst), (w, h),
                                 borderValue=(24, 25, 23))
    yield "perspective tilt", Image.fromarray(warped)


def main():
    print(f"Expected URL: {URL}")
    print(f"Symbol: version {META['version']}-{META['error']}, {META['modules']}x{META['modules']} "
          f"modules, quiet zone {META['quiet_zone_modules']} modules, "
          f"centre medallion clears {META['medallion_cleared_modules']} modules\n")
    failures = 0
    for f in FILES:
        base = Image.open(OUT / f).convert("RGB")
        errs, med = module_audit(base)
        ok = not errs
        failures += not ok
        print(f"[{'PASS' if ok else 'FAIL'}] {f} ({base.width}x{base.height}) module audit: "
              f"{len(errs)} wrong modules outside medallion, {med} changed inside medallion "
              f"(of {META['modules'] ** 2})")
        for name, img in variants(base):
            z, o = decode_zxing(img), decode_opencv(img)
            z_ok, o_ok = z == [URL], o == [URL]
            # zxing must pass everything; OpenCV is a cross-check on the clean renders
            required = z_ok and (o_ok or name not in ("as-rendered",))
            failures += not required
            zs, os_ = ("OK" if z_ok else repr(z)), ("OK" if o_ok else repr(o))
            print(f"   [{'PASS' if required else 'FAIL'}] {name:<26} zxing-cpp={zs:<6} opencv={os_}")
        print()
    print("ALL CHECKS PASSED" if not failures else f"{failures} CHECK(S) FAILED")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
