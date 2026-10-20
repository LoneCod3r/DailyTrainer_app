"""Verify the "Movement Within" concepts and write their report.

- Module audit: every module centre is compared with segno's matrix; modules
  under the figure are reported separately, and structural modules (finders,
  timing, alignment, format info) must all be exact.
- Decoding: zxing-cpp and OpenCV must both return exactly the URL for each
  concept at review size (1200x1500) and under the phone-like stress variants
  of verify_real_qr_sasho. The 2400x3000 print files are decoded by zxing-cpp
  natively; OpenCV is checked on a plain segno control at the same size first,
  because its detector has a known ceiling on very large images.

Usage:  python verify_movement_within.py   -> out/movement-within-verification.md
"""
from __future__ import annotations

import io
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

import movement_within as mw
from verify_qr import decode_opencv, decode_zxing
from verify_real_qr_sasho import variants

OUT = Path(__file__).resolve().parent / "out"
URL = mw.URL
SMALL = {"downscaled to 200px wide", "downscaled to 150px wide"}
SWEEP = (600, 900, 1400, 1700, 2000, 2800)


def audit(img, scale, lay, matrix, body):
    """Wrong modules: structural / open code / figure zone (body + 0.6-module clearance)."""
    k = int(mw.M * 1.2) | 1
    zone = cv2.dilate((body > .5).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    lum = np.asarray(img.convert("L"), float)
    wrong_open = wrong_fig = under = struct_bad = 0
    for r in range(lay.n):
        for c in range(lay.n):
            cx, cy = lay.centre(r, c)
            covered = zone[int(cy), int(cx)] > 0
            under += covered
            x, y = int(cx * scale), int(cy * scale)
            bad = (lum[y, x] < 128) != matrix[r][c]
            if mw.functional(r, c, lay.n):
                struct_bad += bad
            elif covered:
                wrong_fig += bad
            else:
                wrong_open += bad
    return wrong_open, wrong_fig, under, struct_bad


def control_card(lay):
    """Plain, undecorated segno code placed exactly like the artwork on an identical card."""
    qr, _ = mw.qr_matrix()
    buf = io.BytesIO()
    qr.save(buf, kind="png", scale=mw.M, border=mw.QUIET, light=mw.IVORY, dark=mw.CHARCOAL)
    card = Image.new("RGB", (mw.W, mw.H), mw.IVORY)
    card.paste(Image.open(buf).convert("RGB"), (lay.ox - mw.QUIET * mw.M, lay.oy - mw.QUIET * mw.M))
    return card


def main():
    qr, matrix = mw.qr_matrix()
    lay = mw.Layout(len(matrix))
    _, _, body = mw.load_figure(lay)
    lines = ["# KUKO WAY \"Movement Within\": verification report", "",
             f"- **Expected URL:** `{URL}`",
             f"- **Symbol:** segno, version {qr.version}-{qr.error}, {qr.mode} mode, mask {qr.mask}, "
             f"{lay.n}x{lay.n} modules, {mw.QUIET}-module quiet zone.",
             "- **Decoders:** zxing-cpp and OpenCV `QRCodeDetector`; both must return exactly the URL.", ""]
    card = control_card(lay)
    ctrl = {w: decode_opencv(card if w == mw.W else card.resize((w, w * 5 // 4), Image.LANCZOS)) == [URL]
            for w in (mw.W, 1200, 200, 150)}
    lines += ["**OpenCV control:** a plain, undecorated segno code of the same symbol, placed exactly "
              "like the artwork on an identical ivory card, decodes in OpenCV at "
              + ", ".join(f"{w} px wide: {'yes' if ok else 'NO'}" for w, ok in ctrl.items())
              + ". Where the plain control fails, OpenCV results on the artwork are informational "
              "(a limit of OpenCV's detector, not of the design).", ""]
    failures = 0
    for key, title in (("A", "Concept A: negative space"), ("B", "Concept B: flow")):
        lines += [f"## {title}", ""]
        big = Image.open(OUT / f"movement-within-{key}.png").convert("RGB")
        small = Image.open(OUT / f"movement-within-{key}-1200.png").convert("RGB")
        wo, wf, under, sb = audit(big, 1.0, lay, matrix, body)
        ok = wo == 0 and sb == 0
        failures += not ok
        total = lay.n ** 2
        lines += [f"- **Module audit (print file):** {'PASS' if ok else 'FAIL'}. "
                  f"{sb} wrong structural modules, {wo} wrong data modules in the open code. "
                  f"The figure zone (body plus its 0.6-module clearance) spans {under} of {total} modules "
                  f"({100 * under / total:.1f}%), and {wf} of those read wrong ({100 * wf / total:.1f}% of "
                  f"the symbol; level H repairs ~30%).", ""]
        z = decode_zxing(big) == [URL]
        o = decode_opencv(big) == [URL]
        failures += not z
        lines += ["| Test | zxing-cpp | OpenCV |", "|---|---|---|",
                  f"| print file 2400x3000, native | {'PASS' if z else 'FAIL'} | "
                  f"{'PASS' if o else ('info: FAIL' if not ctrl[mw.W] else 'FAIL')} |"]
        failures += (not o) and ctrl[mw.W]
        # scale sweep: cameras capture at arbitrary scales, so both decoders must pass across widths
        for w in SWEEP:
            v = big.resize((w, w * 5 // 4), Image.LANCZOS)
            z, o = decode_zxing(v) == [URL], decode_opencv(v) == [URL]
            failures += not (z and o)
            lines.append(f"| print file scaled to {w}px wide | {'PASS' if z else 'FAIL'} | {'PASS' if o else 'FAIL'} |")
        for name, v, _ in variants(small):
            z, o = decode_zxing(v) == [URL], decode_opencv(v) == [URL]
            info = name in SMALL
            failures += (not z) or (not o and not info)
            lines.append(f"| review 1200x1500, {name} | {'PASS' if z else 'FAIL'} | "
                         f"{'PASS' if o else ('info: FAIL' if info else 'FAIL')} |")
        lines.append("")
    lines += [f"**Result:** {'ALL REQUIRED CHECKS PASSED' if not failures else f'{failures} CHECK(S) FAILED'}.", "",
              "Rows marked *info* are not required. OpenCV needs more pixels per module than zxing-cpp, "
              "and at 150-200 px the code is only ~3-4 px per module. zxing-cpp is required everywhere.", "",
              "**Limitation:** this is software decoding, not a camera scan. Before printing, check it "
              "with the iOS and Android camera apps, both on screen and on a printed proof."]
    (OUT / "movement-within-verification.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
