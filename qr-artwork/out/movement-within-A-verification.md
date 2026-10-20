# KUKO WAY "Movement Within": Concept A verification (approved)

- **File:** `qr-artwork/out/movement-within-A.png` (2400×3000 PNG)
- **Encoded URL:** `https://daily-trainer-app.vercel.app/`
- **Symbol:** generated with segno, version 6-H (highest error correction), mask 2, 4-module quiet zone.
- **Decoders:** zxing-cpp and OpenCV `QRCodeDetector`. Both must return exactly the URL.

| Size | zxing-cpp | OpenCV |
|---|---|---|
| native 2400x3000 | PASS | PASS |
| scaled to 2000x2500 | PASS | PASS |
| scaled to 1400x1750 | PASS | PASS |
| scaled to 1200x1500 | PASS | PASS |
| scaled to 900x1125 | PASS | PASS |
| scaled to 600x750 | PASS | PASS |
| scaled to 300x375 | PASS | PASS |

**Decoded text:** `https://daily-trainer-app.vercel.app/` (zxing-cpp) and `https://daily-trainer-app.vercel.app/` (OpenCV), an exact match.

**Module audit:** the finder, timing, alignment and format modules are all correct. No modules in the open code are wrong. Near the figure, 3.0% of the symbol reads wrong, well within level H's ~30% repair budget.

**Known limitation:** this is software decoding, not a camera scan. At very small reproductions (about 150 px wide) OpenCV can fail, though zxing-cpp still decodes. Before printing, check with the iOS and Android camera apps.
