"""Optimize the supplied GLB's embedded textures; geometry/UVs stay byte-identical.

Requires Pillow. Usage: python scripts/optimize-gate.py source.glb output.glb
EXT_texture_webp: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Vendor/EXT_texture_webp
"""
import io
import json
from pathlib import Path
import struct
import sys
from PIL import Image

source, target = map(Path, sys.argv[1:3])
raw = source.read_bytes()
length = struct.unpack_from('<I', raw, 12)[0]
doc = json.loads(raw[20:20 + length])
binary = raw[28 + length:]
image_views = {image['bufferView']: i for i, image in enumerate(doc['images'])}
normal_images = {
    doc['textures'][material['normalTexture']['index']]['source']
    for material in doc['materials'] if 'normalTexture' in material
}
output = bytearray()
for index, view in enumerate(doc['bufferViews']):
    offset = view.get('byteOffset', 0)
    payload = binary[offset:offset + view['byteLength']]
    if index in image_views:
        image_index = image_views[index]
        image = Image.open(io.BytesIO(payload))
        size = 1024 if image_index in normal_images else 2048
        image.thumbnail((size, size), Image.Resampling.LANCZOS)
        encoded = io.BytesIO()
        image.save(encoded, format='WEBP', quality=94 if image_index in normal_images else 90, method=6)
        payload = encoded.getvalue()
        doc['images'][image_index]['mimeType'] = 'image/webp'
    output.extend(b'\0' * (-len(output) % 4))
    view['byteOffset'] = len(output)
    view['byteLength'] = len(payload)
    output.extend(payload)

for texture in doc['textures']:
    texture.setdefault('extensions', {})['EXT_texture_webp'] = {'source': texture.pop('source')}
doc['extensionsUsed'] = [*doc.get('extensionsUsed', []), 'EXT_texture_webp']
doc['extensionsRequired'] = [*doc.get('extensionsRequired', []), 'EXT_texture_webp']
doc['asset'].setdefault('extras', {})['modifications'] = 'Base color textures resized to 2048px; normal maps to 1024px; WebP compression. Original geometry, UVs and creator attribution preserved.'
output.extend(b'\0' * (-len(output) % 4))
doc['buffers'][0]['byteLength'] = len(output)
metadata = json.dumps(doc, separators=(',', ':')).encode()
metadata += b' ' * (-len(metadata) % 4)
total = 12 + 8 + len(metadata) + 8 + len(output)
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(struct.pack('<III', 0x46546C67, 2, total) + struct.pack('<II', len(metadata), 0x4E4F534A) + metadata + struct.pack('<II', len(output), 0x004E4942) + output)
print(json.dumps({'source_bytes': len(raw), 'optimized_bytes': total, 'geometry': 'unchanged', 'meshes': len(doc['meshes'])}))
