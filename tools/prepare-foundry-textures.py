"""Rebuild delivery textures/signs without modifying the user's source images.

Run: python tools/prepare-foundry-textures.py (requires Pillow).
"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/images/textures'
OUTPUT = SOURCE / 'optimized'
OUTPUT.mkdir(exist_ok=True)
manifest = []
for source in sorted(SOURCE.glob('tex*.*')):
    with Image.open(source) as image:
        original_size = list(image.size)
        image = image.convert('RGB').resize((512, 512), Image.Resampling.LANCZOS)
        target = OUTPUT / f'{source.stem}.webp'
        image.save(target, 'WEBP', quality=84, method=6)
        manifest.append(dict(source=source.name, originalSize=original_size,
                             sourceBytes=source.stat().st_size, file=target.name,
                             size=[512, 512], bytes=target.stat().st_size))

# Flat wayfinding graphics are textures on editable box primitives.
font_path = Path('C:/Windows/Fonts/arialbd.ttf')
def font(size):
    return ImageFont.truetype(str(font_path) if font_path.exists() else 'DejaVuSans-Bold.ttf', size)

signs = [
    ('foundry', 'ION FOUNDRY', 'SECTOR 01  /  REACTOR DISTRICT', '#5de9ff'),
    ('jump', 'GAP AHEAD', 'KEEP SPEED  /  STRAIGHT LAUNCH', '#ffb342'),
    ('shortcut', '<<  NEEDLE', 'LEFT: SHORTCUT  /  RIGHT: MAIN', '#ffce55'),
    ('technical', 'SWITCHBACK', 'BRAKE  /  LINK THE S-BENDS', '#ff749c'),
    ('loop', 'CORE LOOP', 'MAGNETIC ROAD  /  STAY ON LINE', '#8ef5ff'),
]
for key, title, subtitle, accent in signs:
    image = Image.new('RGB', (1024, 256), '#091823')
    draw = ImageDraw.Draw(image)
    draw.rectangle((4, 4, 1019, 251), outline=accent, width=8)
    draw.rectangle((24, 30, 38, 222), fill=accent)
    draw.text((65, 35), title, font=font(78), fill=accent)
    draw.text((68, 156), subtitle, font=font(31), fill='#dcf4ff')
    image.save(OUTPUT / f'sign-{key}.webp', 'WEBP', quality=92, method=6)

(OUTPUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps(dict(originalBytes=sum(m['sourceBytes'] for m in manifest),
                      optimizedBytes=sum(m['bytes'] for m in manifest),
                      textures=len(manifest), signs=len(signs))))
