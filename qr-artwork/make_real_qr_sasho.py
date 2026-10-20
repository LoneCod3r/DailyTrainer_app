"""Rebuild qr-sasho-2.png around a real, scannable QR code.

qr-sasho-2.png is a 338x347 crop of the earlier mockup: an imitation code with
the exercising figure on a pale navy panel. This keeps the layout, colours, figure,
pose and mat, and makes two changes:

1. The code is a genuine QR symbol (version 5-H, the same one
   generate_qr_art.make_qr() encodes for https://daily-trainer-app.vercel.app/),
   drawn at the same size and position as the imitation.
2. Inside the centre panel, the code's dark modules are drawn as the panel's
   fading navy squares. The barcode pattern therefore continues all the way
   behind the person, and it is real data instead of decoration. Only the
   figure and mat cover modules (~9% of the symbol; level H repairs ~30%).

The figure is the same drawing as in qr-sasho-2.png. It is taken from
../qr-sasho.jpg, which holds it at about 2x the resolution, and mapped with the
exact transform measured between the two files (uniform scale 0.5243).

Usage:  python make_real_qr_sasho.py
        -> out/qr-sasho-real-qr.png       (338x347, same size as the source)
           out/qr-sasho-real-qr@3x.png    (1014x1041, for print / social)
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

import add_background_qr_sasho as bg
import generate_qr_art as base

HERE = Path(__file__).resolve().parent
SRC = HERE / "qr-sasho-2.png"
FIG_SRC = HERE.parent / "qr-sasho.jpg"
OUT = HERE / "out"

W, H = 338, 347                       # source canvas
M, X0, Y0 = 9, 2, 7                   # module size / symbol origin (37 * 9 = 333 px)
PANEL = (10, 31, 11, 26)              # panel rows r0..r1, cols c0..c1 (inclusive)
JPG_TO_SRC = (0.5243, -65.4, -115.3)  # scale, dx, dy: qr-sasho.jpg -> qr-sasho-2.png

PAPER = (248, 247, 244)
NAVY = (15, 44, 54)                   # sampled from the source modules
PANEL_TINT = (227, 232, 233)          # sampled from the source panel
FADED = (92, 112, 121)                # lightest square colour, deep inside the panel
SS = 4                                # supersampling


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def figure_layer(k):
    """Figure + mat (RGB), a hard alpha for its body and a soft one for its edge."""
    img = np.array(Image.open(FIG_SRC).convert("RGB"))
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    # shrink the cut-out first so the old imitation code's module edges stay out
    hole = cv2.erode(bg.cutout_mask(gray), np.ones((9, 9), np.uint8))
    sil = bg.figure_mask(gray, hole)
    _, lab, stats, _ = cv2.connectedComponentsWithStats(sil)
    sil = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.float32)
    s, dx, dy = JPG_TO_SRC
    A = np.float32([[s * k, 0, dx * k], [0, s * k, dy * k]])
    size = (W * k, H * k)
    interp = cv2.INTER_AREA if s * k < 1 else cv2.INTER_CUBIC
    rgb = cv2.warpAffine(img, A, size, flags=interp, borderValue=PAPER)
    hard = cv2.warpAffine(cv2.erode(sil, np.ones((7, 7), np.uint8)), A, size, flags=cv2.INTER_LINEAR)
    soft = cv2.warpAffine(cv2.dilate(sil, np.ones((3, 3), np.uint8)), A, size, flags=cv2.INTER_LINEAR)
    return rgb, np.clip(hard, 0, 1), np.clip(soft, 0, 1)


def render(k):
    _, matrix = base.make_qr()
    n = len(matrix)
    r0, r1, c0, c1 = PANEL
    u = k * SS                                        # px per source px at supersampling
    im = Image.new("RGB", (W * u, H * u), PAPER)
    d = ImageDraw.Draw(im)
    cell = lambda r, c: (((X0 + c * M) * u), ((Y0 + r * M) * u))
    # panel tint
    x, y = cell(r0, c0)
    d.rectangle([x, y, (X0 + (c1 + 1) * M) * u - 1, (Y0 + (r1 + 1) * M) * u - 1], fill=PANEL_TINT)
    for r in range(n):
        for c in range(n):
            if not matrix[r][c]:
                continue
            x, y = cell(r, c)
            if r0 <= r <= r1 and c0 <= c <= c1:
                # depth into the panel in modules: 0 at its edge
                depth = min(r - r0, r1 - r, c - c0, c1 - c)
                t = max(0.0, 1 - depth / 4)               # 1 at the edge, 0 from 4 deep
                f = 0.56 + 0.34 * t
                inset = M * u * (1 - f) / 2
                d.rectangle([x + inset, y + inset, x + M * u - inset - 1, y + M * u - inset - 1],
                            fill=lerp(FADED, NAVY, t))
            else:
                # plain abutting squares, so neighbouring modules merge into solid shapes
                d.rectangle([x, y, x + M * u - 1, y + M * u - 1], fill=NAVY)
    out = np.asarray(im.resize((W * k, H * k), Image.LANCZOS), float)
    fig, hard, soft = figure_layer(k)
    hard, soft = hard[..., None], soft[..., None]
    # edge band is multiplied (its white paper fringe takes the background colour,
    # the dark outline stays); the body is placed as is
    edge = out * (1 - soft + soft * fig / 255)
    out = edge * (1 - hard) + fig * hard
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def main():
    OUT.mkdir(exist_ok=True)
    for k, name in ((1, "qr-sasho-real-qr.png"), (3, "qr-sasho-real-qr@3x.png")):
        render(k).save(OUT / name)
        print("wrote", OUT / name)


if __name__ == "__main__":
    main()
