"""KUKO WAY forest QR: a real QR code woven into sasho-qr-code-new-2.jpg.

The reference illustration (forest + exercising person) carries an imitation
code that does not scan. This builds a genuine one with segno (level H, the
same version-5 symbol as generate_qr_art.make_qr()) and integrates it as a
halftone QR:

- Every data module is a crisp dot at the module centre, which is where
  scanners sample: module-black (night) for dark modules, warm ivory for light.
  Around each dot the illustration shows through, nudged toward that module's
  value so the code holds up at small sizes and in blur.
- Finder patterns, their separators, the alignment pattern and the format
  information are drawn as solid modules: the structural parts phones lock on to.
- The illustration is graded toward the KUKO WAY palette (night, sage, moss,
  warm ivory). The person's white sticker outline, the pasted-on look, is
  re-inked as a dark sage contour, and the person is kept free of dots. They
  cover ~6% of the modules, which level H (~30%) absorbs.
- A 4-module warm-ivory quiet zone surrounds the symbol.

Usage:  python generate_forest_qr.py
        -> out/kuko-forest-qr-print.png  (2880x2880, 64 px/module)
           out/kuko-forest-qr.png        (1440x1440, 32 px/module)
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw

import generate_qr_art as base

HERE = Path(__file__).resolve().parent
SRC = HERE / "sasho-qr-code-new-2.jpg"
OUT = HERE / "out"

QUIET = 4
DOT = 0.66                       # dot side, fraction of a module
NUDGE = 0.12                     # minimum lean of the art under every module
DARK_GOAL, LIGHT_GOAL = 35.0, 215.0   # cell-average luminance each module must reach
GRADE, GRADE_PERSON = 0.35, 0.15  # blend toward the brand duotone
CROP_Y = 14                      # trims the source's blank top/bottom rows -> 1024x1024

NIGHT = np.array([24, 25, 23], float)          # #181917
IVORY = np.array([245, 240, 230], float)       # #F5F0E6
INK = np.array([47, 54, 43], float)            # sage-900 #2F362B, re-inked outline
RAMP = [(0.0, (24, 25, 23)), (0.35, (76, 88, 68)), (0.6, (125, 139, 114)),
        (0.8, (170, 179, 156)), (1.0, (245, 240, 230))]   # night -> sage -> moss -> ivory


def person_mask(img):
    """Person + white sticker outline (GrabCut seeded with the outline)."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    white = ((img.min(2) > 215) & (hsv[..., 1] < 40)).astype(np.uint8)
    _, lab, st, _ = cv2.connectedComponentsWithStats(white)
    # outline pieces: white components whose box sits around the figure (not the page)
    ring = np.zeros_like(white)
    for i in range(1, len(st)):
        x, y, w, h, area = st[i]
        if area > 1000 and 340 < x and x + w < 760 and 260 < y and y + h < 840:
            ring[lab == i] = 1
    m = np.full(img.shape[:2], cv2.GC_BGD, np.uint8)
    m[290 - CROP_Y:815 - CROP_Y, 360:735] = cv2.GC_PR_BGD
    cv2.ellipse(m, (520, 540 - CROP_Y), (90, 220), 0, 0, 360, cv2.GC_PR_FGD, -1)
    m[ring > 0] = cv2.GC_FGD
    cv2.grabCut(cv2.cvtColor(img, cv2.COLOR_RGB2BGR), m, None, np.zeros((1, 65)),
                np.zeros((1, 65)), 8, cv2.GC_INIT_WITH_MASK)
    p = ((m == cv2.GC_FGD) | (m == cv2.GC_PR_FGD)).astype(np.uint8)
    p = cv2.morphologyEx(p, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    _, lab, st, _ = cv2.connectedComponentsWithStats(p)
    return (lab == 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)


def remove_fake_code(img, person):
    """Inpaint the imitation code's white blocks so only the real code forms a grid."""
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV)
    white = ((img.min(2) > 205) & (hsv[..., 1] < 45)).astype(np.uint8)
    white[cv2.dilate(person, np.ones((15, 15), np.uint8)) > 0] = 0   # keep the figure
    _, lab, st, _ = cv2.connectedComponentsWithStats(white)
    big = np.isin(lab, [i for i in range(1, len(st)) if st[i][4] >= 40]).astype(np.uint8)
    big = cv2.dilate(big, np.ones((5, 5), np.uint8))
    return cv2.inpaint(img, big, 9, cv2.INPAINT_TELEA)


def brand_grade(img, person):
    lum = img.astype(float) @ np.array([0.299, 0.587, 0.114]) / 255
    xs = [p for p, _ in RAMP]
    duo = np.stack([np.interp(lum, xs, [c[i] for _, c in RAMP]) for i in range(3)], -1)
    w = np.where(person[..., None] > 0, GRADE_PERSON, GRADE)
    out = img * (1 - w) + duo * w
    # re-ink the white sticker outline as a dark sage contour
    band = person - cv2.erode(person, np.ones((9, 9), np.uint8))
    whiteness = np.clip((img.min(2).astype(float) - 170) / 70, 0, 1) * band
    whiteness = cv2.GaussianBlur(whiteness, (3, 3), 0)[..., None]
    return out * (1 - whiteness) + INK * whiteness


def in_finder(r, c, n):
    """Finder pattern or its separator (drawn as shapes, not modules)."""
    return any(fr <= r < fr + 8 and fc <= c < fc + 8 for fr, fc in ((0, 0), (0, n - 8), (n - 8, 0)))


def structural(r, c, n):
    """Finder + separator, alignment pattern, format information: drawn solid."""
    for fr, fc in ((0, 0), (0, n - 8), (n - 8, 0)):
        if fr <= r < fr + 8 and fc <= c < fc + 8:
            return True
    if n - 9 <= r <= n - 5 and n - 9 <= c <= n - 5:          # alignment (v5: centre 30,30)
        return True
    if (r == 8 and (c <= 8 or c >= n - 8)) or (c == 8 and (r <= 8 or r >= n - 8)):
        return True                                          # format info + dark module
    if r == 6 or c == 6:
        return True                                          # timing patterns (version estimate)
    return False


def render(m_px):
    _, matrix = base.make_qr()
    n = len(matrix)
    src = np.array(Image.open(SRC).convert("RGB"))
    src = src[CROP_Y:CROP_Y + src.shape[1]]
    person = person_mask(src)
    art = brand_grade(remove_fake_code(src, person).astype(float), person)

    size = n * m_px
    total = (n + 2 * QUIET) * m_px
    art = cv2.resize(art.astype(np.float32), (size, size), interpolation=cv2.INTER_CUBIC)
    pers = cv2.resize(person.astype(np.float32), (size, size), interpolation=cv2.INTER_LINEAR)
    keep_clear = cv2.dilate((pers > .5).astype(np.uint8), np.ones((m_px // 4 * 2 + 1,) * 2, np.uint8))

    # Lean the art under each module toward its value, per cell and only as far as
    # needed: a scanner that averages the cell (dot + surrounding art) must land on
    # the module's side with margin. Cells that already agree keep their art.
    lum_w = np.array([0.299, 0.587, 0.114], np.float32)
    area = DOT ** 2
    w = np.zeros((size, size), np.float32)
    target = np.zeros((size, size, 3), np.float32)
    for r in range(n):
        for c in range(n):
            ys, xs = slice(r * m_px, (r + 1) * m_px), slice(c * m_px, (c + 1) * m_px)
            dark = matrix[r][c]
            tgt = NIGHT if dark else IVORY
            target[ys, xs] = tgt
            if pers[ys, xs].mean() > .3:
                continue                                     # under the person: leave the art
            mean = float((art[ys, xs] @ lum_w).mean())
            t_l, goal = float(tgt @ lum_w), (DARK_GOAL if dark else LIGHT_GOAL)
            # art mean needed so that (1-area)*art + area*dot reaches the goal
            need = (goal - area * t_l) / (1 - area)
            if (dark and mean > need) or (not dark and mean < need):
                w[ys, xs] = max(NUDGE, min(1.0, (mean - need) / (mean - t_l)))
            else:
                w[ys, xs] = NUDGE
    w = (w * (1 - pers))[..., None]
    # Shift lightness only, keeping each cell's colour: scanners read luminance, so
    # dark cells become deep forest greens and light cells pale ones, not black/white.
    y = (art @ lum_w)[..., None]
    y_new = y * (1 - w) + (target @ lum_w)[..., None] * w
    dark_cell = (target @ lum_w)[..., None] < 128
    art = np.where(dark_cell, art * (y_new / np.maximum(y, 1)), art + (y_new - y))

    canvas = Image.new("RGB", (total, total), tuple(int(v) for v in IVORY))
    canvas.paste(Image.fromarray(np.clip(art, 0, 255).astype(np.uint8)), (QUIET * m_px,) * 2)
    ss = 4
    over = Image.new("RGBA", (total * ss, total * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    o = QUIET * m_px
    for r in range(n):
        for c in range(n):
            col = tuple(int(v) for v in (NIGHT if matrix[r][c] else IVORY)) + (255,)
            x, y = o + c * m_px, o + r * m_px
            if structural(r, c, n):
                if not in_finder(r, c, n):
                    d.rectangle([x * ss, y * ss, (x + m_px) * ss - 1, (y + m_px) * ss - 1], fill=col)
                continue
            cy, cx = r * m_px + m_px // 2, c * m_px + m_px // 2
            if keep_clear[cy, cx]:
                continue                                     # person stays free of dots
            half = DOT * m_px / 2
            d.rounded_rectangle([(x + m_px / 2 - half) * ss, (y + m_px / 2 - half) * ss,
                                 (x + m_px / 2 + half) * ss, (y + m_px / 2 + half) * ss],
                                radius=half * ss * 0.35, fill=col)
    # finder patterns: standard 7/5/3 geometry on a light separator, gently rounded
    ivory, night = tuple(int(v) for v in IVORY) + (255,), tuple(int(v) for v in NIGHT) + (255,)
    for fr, fc in ((0, 0), (0, n - 7), (n - 7, 0)):
        x, y = (o + fc * m_px) * ss, (o + fr * m_px) * ss
        u = m_px * ss
        sep = [x - (u if fc else 0), y - (u if fr else 0), x + 7 * u + (0 if fc else u) - 1,
               y + 7 * u + (0 if fr else u) - 1]
        d.rectangle(sep, fill=ivory)
        d.rounded_rectangle([x, y, x + 7 * u - 1, y + 7 * u - 1], radius=u * 0.9, fill=night)
        d.rounded_rectangle([x + u, y + u, x + 6 * u - 1, y + 6 * u - 1], radius=u * 0.5, fill=ivory)
        d.rounded_rectangle([x + 2 * u, y + 2 * u, x + 5 * u - 1, y + 5 * u - 1], radius=u * 0.4, fill=night)
    over = over.resize((total, total), Image.LANCZOS)
    canvas.paste(over, (0, 0), over)
    return canvas, person


def main():
    OUT.mkdir(exist_ok=True)
    for m_px, name in ((64, "kuko-forest-qr-print.png"), (32, "kuko-forest-qr.png")):
        img, _ = render(m_px)
        img.save(OUT / name)
        print("wrote", OUT / name, img.size)


if __name__ == "__main__":
    main()
