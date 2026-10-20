"""Add a background behind the person in qr-sasho.jpg; nothing else changes.

The reference is a raster mockup. Only the white cut-out in the middle of the
code, behind the exercising figure, is filled. It gets a pale navy panel plus
navy squares on the code's own module grid: near-full modules at the cut-out
edge, shrinking toward the figure, so the code seems to dissolve into the
space behind the person. The fill is applied with a multiply blend, so the
figure's lines, the mat and the surrounding modules keep their pixels.

Usage:  python add_background_qr_sasho.py
        -> out/qr-sasho-with-background.png (+ .jpg)
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

HERE = Path(__file__).resolve().parent
SRC = HERE.parent / "qr-sasho.jpg"
OUT = HERE / "out"

NAVY = np.array([15, 45, 56], float)       # sampled from the code's modules
TINT = np.array([234, 239, 242], float)    # pale navy panel (multiplied onto paper)
PITCH, X0, Y0 = 17.6, 140.0, 406.0         # module grid, measured from finders / cut-out
SEED = (380, 460)                          # a point inside the cut-out (x, y)
HALO = 24                                  # clear space kept around the figure, px
FADE = 95                                  # px over which squares shrink to nothing
SS = 4                                     # supersampling for anti-aliased squares


def cutout_mask(gray):
    """White region in the middle of the code, bounded by the navy modules."""
    dark = (gray < 110).astype(np.uint8)
    modules = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((11, 11), np.uint8))
    free = 1 - modules
    core = (cv2.distanceTransform(free, cv2.DIST_C, 3) >= 16).astype(np.uint8)
    _, lab = cv2.connectedComponents(core)
    hole = (lab == lab[SEED[1], SEED[0]]).astype(np.uint8)
    hole = cv2.dilate(hole, np.ones((33, 33), np.uint8)) & free
    hole = cv2.morphologyEx(hole, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    return hole


def figure_mask(gray, hole):
    """Figure + mat silhouette; large bright enclosed gaps (between the legs) excluded."""
    strokes = ((gray < 215) & (hole > 0)).astype(np.uint8)
    closed = cv2.morphologyEx(strokes, cv2.MORPH_CLOSE,
                              cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    cnts, hier = cv2.findContours(closed, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    sil = np.zeros_like(closed)
    for i, c in enumerate(cnts):
        if hier[0][i][3] == -1 and cv2.contourArea(c) > 300:
            cv2.drawContours(sil, cnts, i, 1, -1)
    for i, c in enumerate(cnts):
        if hier[0][i][3] != -1 and cv2.contourArea(c) > 800:
            gap = np.zeros_like(closed)
            cv2.drawContours(gap, cnts, i, 1, -1)
            if gray[gap > 0].mean() > 240:
                sil[gap > 0] = 0
    return sil


def squares_alpha(shape, hole, sil):
    """Per-pixel navy coverage of the module-grid squares (anti-aliased)."""
    h, w = shape
    to_edge = cv2.distanceTransform(hole, cv2.DIST_L2, 5)
    to_fig = cv2.distanceTransform(1 - sil, cv2.DIST_L2, 5)
    # squares only in the main open area; enclosed gaps (between the legs) get tint only
    _, lab, stats, _ = cv2.connectedComponentsWithStats(((hole > 0) & (sil == 0)).astype(np.uint8))
    main_area = lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    canvas = Image.new("L", (w * SS, h * SS), 0)
    d = ImageDraw.Draw(canvas)
    ys, xs = np.nonzero(hole)
    for gy in np.arange(Y0 + PITCH / 2 - PITCH * round((Y0 - ys.min()) / PITCH + 1), ys.max(), PITCH):
        for gx in np.arange(X0 + PITCH / 2, xs.max(), PITCH):
            cx, cy = int(round(gx)), int(round(gy))
            if not (0 <= cx < w and 0 <= cy < h) or not main_area[cy, cx]:
                continue
            t = 1 - min(to_edge[cy, cx] / FADE, 1)          # 1 at the edge, 0 deep inside
            if t <= 0 or to_fig[cy, cx] < HALO:
                continue
            s = PITCH * 0.86 * t ** 0.9
            if s < 1.2:
                continue
            op = int(255 * (0.3 + 0.7 * t))
            d.rectangle([(gx - s / 2) * SS, (gy - s / 2) * SS, (gx + s / 2) * SS, (gy + s / 2) * SS],
                        fill=op)
    return np.asarray(canvas.resize((w, h), Image.LANCZOS), float) / 255


def main():
    img = np.array(Image.open(SRC).convert("RGB"))
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    hole = cutout_mask(gray)
    sil = figure_mask(gray, hole)

    region = ((hole > 0) & (sil == 0)).astype(np.float32)
    region = cv2.GaussianBlur(cv2.dilate(region, np.ones((3, 3), np.uint8)), (3, 3), 0)
    sq = squares_alpha(gray.shape, hole, sil)

    # multiply blend: paper takes the colour, dark strokes and modules stay dark
    color = TINT * (1 - sq[..., None]) + NAVY * sq[..., None]
    layer = 1 - region[..., None] * (1 - color / 255)
    out = np.clip(img * layer, 0, 255).astype(np.uint8)

    OUT.mkdir(exist_ok=True)
    Image.fromarray(out).save(OUT / "qr-sasho-with-background.png")
    Image.fromarray(out).save(OUT / "qr-sasho-with-background.jpg", quality=95)
    changed = np.abs(out.astype(int) - img).max(2) > 0
    outside = changed & (cv2.dilate(hole, np.ones((5, 5), np.uint8)) == 0)
    print(f"changed pixels: {changed.sum()}, outside the cut-out: {outside.sum()}")
    print("wrote", OUT / "qr-sasho-with-background.png")


if __name__ == "__main__":
    main()
