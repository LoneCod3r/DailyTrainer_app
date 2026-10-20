"""Generate the KUKO WAY "Face Fascia" QR artwork as SVG.

The QR symbol is encoded by segno (error correction level H, no boost) and drawn
module-for-module; all facial-contour / fascial-maneuver artwork lives *behind*
an opaque warm-white card that keeps a 5-module quiet zone around the code.
The only intervention inside the symbol is a small centre medallion that clears
a 7x7 module block, which level-H error correction (~30%) absorbs easily.
verify_qr.py checks the result.

Usage:  python generate_qr_art.py            -> out/kuko-way-qr.svg
"""
from __future__ import annotations

import base64
import json
from pathlib import Path

import segno

URL = "https://daily-trainer-app.vercel.app/"

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
FONTS = HERE.parent / "platform" / "app" / "fonts"

# Palette (from platform/tailwind.config.ts: night, sage-500, sage-300)
NIGHT = "#181917"
INK = "#181917"
WARM_WHITE = "#F5F0E6"
SAGE = "#7D8B72"
MOSS = "#AAB39C"

W, H = 1200, 1500          # 4:5 portrait canvas (viewBox units)
CX, CY = 600, 755          # centre of the QR card
M = 14                     # module size
QUIET = 5                  # quiet zone in modules (spec minimum is 4)
MEDALLION = 7              # cleared centre block, in modules (odd)


def make_qr():
    qr = segno.make(URL, error="h", boost_error=False, micro=False)
    matrix = [list(map(bool, row)) for row in qr.matrix]
    return qr, matrix


def medallion_cells(n):
    lo = n // 2 - MEDALLION // 2
    return {(r, c) for r in range(lo, lo + MEDALLION) for c in range(lo, lo + MEDALLION)}


def in_finder(r, c, n):
    return (r < 7 and c < 7) or (r < 7 and c >= n - 7) or (r >= n - 7 and c < 7)


def font_face(family, file, weight="400"):
    data = base64.b64encode((FONTS / file).read_bytes()).decode()
    return (f"@font-face{{font-family:'{family}';font-weight:{weight};"
            f"src:url(data:font/woff2;base64,{data}) format('woff2');}}")


def mirror(d_left: str) -> str:
    """Mirror a path written in centre-relative coords (x negated)."""
    out, nums = [], d_left.replace(",", " ").split()
    i = 0
    for tok in nums:
        if tok.isalpha():
            out.append(tok)
            i = 0
            continue
        v = float(tok)
        out.append(f"{-v:g}" if i % 2 == 0 else f"{v:g}")
        i += 1
    return " ".join(out)


def stroke(d, cls, grad=None):
    g = f' stroke="url(#{grad})"' if grad else ""
    return f'<path class="{cls}" d="{d}"{g}/>'


def artwork_paths():
    """Facial contour + fascial lifting strokes, centre-relative coords."""
    parts = []
    # --- face contour (one side; mirrored) ---
    side = "M -405 -470 C -470 -330 -485 -120 -465 40 C -448 200 -425 320 -365 420 C -290 530 -150 598 0 608"
    forehead = "M -300 -535 C -170 -605 170 -605 300 -535"
    for d in (side, mirror(side)):
        parts.append(stroke(d, "contour"))
    parts.append(stroke(forehead, "contour"))

    dots = []
    # --- cheek lift: three sweeps emerging from behind the card, up & out ---
    cheeks = [
        ("M -300 250 C -360 205 -398 125 -405 20", (-405, 20)),
        ("M -300 150 C -355 100 -386 20 -388 -85", (-388, -85)),
        ("M -300 50 C -348 0 -372 -80 -368 -190", (-368, -190)),
    ]
    for d, end in cheeks:
        parts.append(stroke(d, "lift", "fadeL"))
        parts.append(stroke(mirror(d), "lift", "fadeR"))
        dots += [end, (-end[0], end[1])]
    # --- forehead lift: a fan of vertical strokes rising from the card ---
    for x0, x1, y1 in ((0, 0, -515), (-105, -132, -497), (-210, -258, -462)):
        d = f"M {x0} -300 C {x0} -400 {x1} -440 {x1} {y1}"
        parts.append(stroke(d, "lift", "fadeUp"))
        dots.append((x1, y1))
        if x0:
            parts.append(stroke(mirror(d), "lift", "fadeUp"))
            dots.append((-x1, y1))
    # --- jaw sculpt: two strokes from chin toward the ear ---
    jaws = [
        ("M -20 560 C -130 552 -240 498 -320 395", (-320, 395)),
        ("M -10 500 C -110 494 -200 452 -262 372", (-262, 372)),
    ]
    for d, end in jaws:
        parts.append(stroke(d, "lift", "fadeJawL"))
        parts.append(stroke(mirror(d), "lift", "fadeJawR"))
        dots += [end, (-end[0], end[1])]

    # fingertip touch points: sage dot + soft ring
    for x, y in dots:
        parts.append(f'<circle class="tip" cx="{x}" cy="{y}" r="6"/>')
        parts.append(f'<circle class="ring" cx="{x}" cy="{y}" r="15"/>')
    for x, y in ((-405, -470), (405, -470), (0, 608)):
        parts.append(f'<circle class="anchor" cx="{x}" cy="{y}" r="4.5"/>')
    return "\n    ".join(parts)


def qr_layer(matrix):
    n = len(matrix)
    cleared = medallion_cells(n)
    size = n * M
    x0, y0 = CX - size / 2, CY - size / 2
    rects = []
    for r, row in enumerate(matrix):
        for c, dark in enumerate(row):
            if not dark or in_finder(r, c, n) or (r, c) in cleared:
                continue
            # +0.6 overlap removes hairline seams between neighbouring modules
            rects.append(f'<rect x="{x0 + c * M - 0.3:.1f}" y="{y0 + r * M - 0.3:.1f}" '
                         f'width="{M + 0.6:.1f}" height="{M + 0.6:.1f}" rx="2.6"/>')
    # finder patterns: standard 7/5/3 geometry, gently rounded corners
    finders = []
    for fr, fc in ((0, 0), (0, n - 7), (n - 7, 0)):
        fx, fy = x0 + fc * M, y0 + fr * M
        finders.append(
            f'<path fill-rule="evenodd" d="{rounded_rect(fx, fy, 7 * M, 9)} '
            f'{rounded_rect(fx + M, fy + M, 5 * M, 5)}"/>'
            f'<rect x="{fx + 2 * M}" y="{fy + 2 * M}" width="{3 * M}" height="{3 * M}" rx="5"/>')
    # centre medallion
    rad = MEDALLION * M / 2 - 4
    med = f"""
    <g transform="translate({CX} {CY})">
      <circle r="{rad:.1f}" fill="{SAGE}"/>
      <circle r="{rad - 6:.1f}" fill="none" stroke="{WARM_WHITE}" stroke-width="1.4" opacity=".7"/>
      <path d="M -13 -22 C -24 -14 -26 6 -18 18 C -12 27 -4 31 0 31 C 4 31 12 27 18 18 C 26 6 24 -14 13 -22"
            fill="none" stroke="{WARM_WHITE}" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M -9 14 C -15 6 -16 -2 -14 -9 M 9 14 C 15 6 16 -2 14 -9"
            fill="none" stroke="{WARM_WHITE}" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="-14" cy="-12" r="2.4" fill="{WARM_WHITE}"/><circle cx="14" cy="-12" r="2.4" fill="{WARM_WHITE}"/>
    </g>"""
    return "\n    ".join(rects), "".join(finders), med


def rounded_rect(x, y, s, r):
    return (f"M {x + r} {y} H {x + s - r} Q {x + s} {y} {x + s} {y + r} V {y + s - r} "
            f"Q {x + s} {y + s} {x + s - r} {y + s} H {x + r} Q {x} {y + s} {x} {y + s - r} "
            f"V {y + r} Q {x} {y} {x + r} {y} Z")


def build_svg():
    qr, matrix = make_qr()
    n = len(matrix)
    modules, finders, med = qr_layer(matrix)
    card = (n + 2 * QUIET) * M
    cx0, cy0 = CX - card / 2, CY - card / 2

    fonts = font_face("KUKO Display", "dm-serif-display-latin.woff2") + \
        font_face("KUKO Sans", "manrope-latin.woff2", "200 800")

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <title>KUKO WAY · scan to open daily-trainer-app.vercel.app</title>
  <defs>
    <style>{fonts}
      .contour{{fill:none;stroke:{WARM_WHITE};stroke-width:2.2;stroke-linecap:round;opacity:.55}}
      .faint{{opacity:.3}}
      .lift{{fill:none;stroke-width:4.5;stroke-linecap:round}}
      .tip{{fill:{MOSS}}}
      .ring{{fill:none;stroke:{MOSS};stroke-width:1.2;opacity:.45}}
      .anchor{{fill:{WARM_WHITE};opacity:.7}}
      .brand{{font-family:'KUKO Display',Georgia,serif;fill:{WARM_WHITE}}}
      .sans{{font-family:'KUKO Sans','Segoe UI',Arial,sans-serif}}
    </style>
    <linearGradient id="fadeL" x1="1" y1="1" x2="0" y2="0"><stop offset=".15" stop-color="{SAGE}" stop-opacity="0"/><stop offset="1" stop-color="{MOSS}"/></linearGradient>
    <linearGradient id="fadeR" x1="0" y1="1" x2="1" y2="0"><stop offset=".15" stop-color="{SAGE}" stop-opacity="0"/><stop offset="1" stop-color="{MOSS}"/></linearGradient>
    <linearGradient id="fadeUp" gradientUnits="userSpaceOnUse" x1="0" y1="-300" x2="0" y2="-515"><stop offset=".1" stop-color="{SAGE}" stop-opacity="0"/><stop offset="1" stop-color="{MOSS}"/></linearGradient>
    <linearGradient id="fadeJawL" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{SAGE}" stop-opacity=".05"/><stop offset="1" stop-color="{MOSS}"/></linearGradient>
    <linearGradient id="fadeJawR" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="{SAGE}" stop-opacity=".05"/><stop offset="1" stop-color="{MOSS}"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{SAGE}" stop-opacity=".22"/><stop offset="1" stop-color="{SAGE}" stop-opacity="0"/></radialGradient>
  </defs>

  <rect width="{W}" height="{H}" fill="{NIGHT}"/>
  <ellipse cx="{CX}" cy="{CY}" rx="560" ry="680" fill="url(#glow)"/>

  <text class="brand" x="{CX}" y="104" text-anchor="middle" font-size="62" letter-spacing="14">KUKO WAY</text>
  <text class="sans" x="{CX}" y="142" text-anchor="middle" font-size="15" font-weight="600" letter-spacing="6" fill="{MOSS}">FACIAL FASCIA · DAILY PRACTICE</text>

  <!-- artwork: facial contour + fascial lifting pathways (all behind the card) -->
  <g transform="translate({CX} {CY})">
    {artwork_paths()}
  </g>

  <!-- QR card: opaque, keeps a {QUIET}-module quiet zone around the symbol -->
  <rect x="{cx0}" y="{cy0}" width="{card}" height="{card}" rx="30" fill="{WARM_WHITE}"/>
  <g fill="{INK}">
    {modules}
    {finders}
  </g>{med}

  <text class="sans" x="{CX}" y="{H - 82}" text-anchor="middle" font-size="25" font-weight="500" letter-spacing="1.5" fill="{WARM_WHITE}">Scan to begin your daily ritual</text>
  <text class="sans" x="{CX}" y="{H - 46}" text-anchor="middle" font-size="16" font-weight="500" letter-spacing="2" fill="{MOSS}">daily-trainer-app.vercel.app</text>
</svg>
"""
    meta = {
        "url": URL,
        "version": qr.version,
        "error": qr.error,
        "mode": qr.mode,
        "modules": n,
        "module_px_viewbox": M,
        "quiet_zone_modules": QUIET,
        "medallion_cleared_modules": MEDALLION * MEDALLION,
        "medallion_dark_modules_lost": sum(matrix[r][c] for r, c in medallion_cells(n)),
        "symbol_box_viewbox": [CX - n * M / 2, CY - n * M / 2, n * M, n * M],
        "canvas": [W, H],
        "matrix": ["".join("1" if v else "0" for v in row) for row in matrix],
    }
    return svg, meta


def main():
    OUT.mkdir(exist_ok=True)
    svg, meta = build_svg()
    (OUT / "kuko-way-qr.svg").write_text(svg, encoding="utf-8")
    (OUT / "qr-meta.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
    print(f"QR version {meta['version']}-{meta['error']} ({meta['modules']}x{meta['modules']}), "
          f"mode={meta['mode']}, medallion clears {meta['medallion_cleared_modules']} modules "
          f"({meta['medallion_dark_modules_lost']} dark)")
    print("wrote", OUT / "kuko-way-qr.svg")


if __name__ == "__main__":
    main()
