# KUKO WAY "Movement Within": verification report

- **Expected URL:** `https://daily-trainer-app.vercel.app/`
- **Symbol:** segno, version 6-H, byte mode, mask 2, 41x41 modules, 4-module quiet zone.
- **Decoders:** zxing-cpp and OpenCV `QRCodeDetector`; both must return exactly the URL.

**OpenCV control:** a plain, undecorated segno code of the same symbol, placed exactly like the artwork on an identical ivory card, decodes in OpenCV at 2400 px wide: yes, 1200 px wide: yes, 200 px wide: yes, 150 px wide: yes. Where the plain control fails, OpenCV results on the artwork are informational (a limit of OpenCV's detector, not of the design).

## Concept A: negative space

- **Module audit (print file):** PASS. 0 wrong structural modules, 0 wrong data modules in the open code. The figure zone (body plus its 0.6-module clearance) spans 170 of 1681 modules (10.1%), and 50 of those read wrong (3.0% of the symbol; level H repairs ~30%).

| Test | zxing-cpp | OpenCV |
|---|---|---|
| print file 2400x3000, native | PASS | PASS |
| print file scaled to 600px wide | PASS | PASS |
| print file scaled to 900px wide | PASS | PASS |
| print file scaled to 1400px wide | PASS | PASS |
| print file scaled to 1700px wide | PASS | PASS |
| print file scaled to 2000px wide | PASS | PASS |
| print file scaled to 2800px wide | PASS | PASS |
| review 1200x1500, as rendered (no extra margin) | PASS | PASS |
| review 1200x1500, on white page (4-module margin) | PASS | PASS |
| review 1200x1500, on dark surface | PASS | PASS |
| review 1200x1500, downscaled to 600px wide | PASS | PASS |
| review 1200x1500, downscaled to 300px wide | PASS | PASS |
| review 1200x1500, downscaled to 200px wide | PASS | PASS |
| review 1200x1500, downscaled to 150px wide | PASS | info: FAIL |
| review 1200x1500, gaussian blur r=1.5 | PASS | PASS |
| review 1200x1500, JPEG q=30 | PASS | PASS |
| review 1200x1500, rotated 17deg | PASS | PASS |
| review 1200x1500, contrast x0.55 | PASS | PASS |
| review 1200x1500, brightness x0.6 | PASS | PASS |
| review 1200x1500, gaussian noise sigma=22 | PASS | PASS |
| review 1200x1500, perspective tilt | PASS | PASS |

## Concept B: flow

- **Module audit (print file):** PASS. 0 wrong structural modules, 0 wrong data modules in the open code. The figure zone (body plus its 0.6-module clearance) spans 170 of 1681 modules (10.1%), and 65 of those read wrong (3.9% of the symbol; level H repairs ~30%).

| Test | zxing-cpp | OpenCV |
|---|---|---|
| print file 2400x3000, native | PASS | PASS |
| print file scaled to 600px wide | PASS | PASS |
| print file scaled to 900px wide | PASS | PASS |
| print file scaled to 1400px wide | PASS | PASS |
| print file scaled to 1700px wide | PASS | PASS |
| print file scaled to 2000px wide | PASS | PASS |
| print file scaled to 2800px wide | PASS | PASS |
| review 1200x1500, as rendered (no extra margin) | PASS | PASS |
| review 1200x1500, on white page (4-module margin) | PASS | PASS |
| review 1200x1500, on dark surface | PASS | PASS |
| review 1200x1500, downscaled to 600px wide | PASS | PASS |
| review 1200x1500, downscaled to 300px wide | PASS | PASS |
| review 1200x1500, downscaled to 200px wide | PASS | PASS |
| review 1200x1500, downscaled to 150px wide | PASS | info: FAIL |
| review 1200x1500, gaussian blur r=1.5 | PASS | PASS |
| review 1200x1500, JPEG q=30 | PASS | PASS |
| review 1200x1500, rotated 17deg | PASS | PASS |
| review 1200x1500, contrast x0.55 | PASS | PASS |
| review 1200x1500, brightness x0.6 | PASS | PASS |
| review 1200x1500, gaussian noise sigma=22 | PASS | PASS |
| review 1200x1500, perspective tilt | PASS | PASS |

**Result:** ALL REQUIRED CHECKS PASSED.

Rows marked *info* are not required. OpenCV needs more pixels per module than zxing-cpp, and at 150-200 px the code is only ~3-4 px per module. zxing-cpp is required everywhere.

**Limitation:** this is software decoding, not a camera scan. Before printing, check it with the iOS and Android camera apps, both on screen and on a printed proof.
