#!/usr/bin/env python3
"""Downscale embedded warehouse GLB textures for mobile and rebuild valid GLB."""
import io, json, struct
from pathlib import Path
from PIL import Image

path = Path("buildings/warehouse/medieval_warehouse.glb")
data = path.read_bytes()
if data[:4] != b"glTF" or struct.unpack_from("<I", data, 4)[0] != 2:
    raise SystemExit("Not a GLB 2.0 file")
offset = 12
doc = None
binary = None
while offset + 8 <= len(data):
    length, kind = struct.unpack_from("<II", data, offset)
    offset += 8
    chunk = data[offset:offset + length]
    if kind == 0x4E4F534A:
        doc = json.loads(chunk.decode("utf-8").rstrip(" \t\r\n\0"))
    elif kind == 0x004E4942:
        binary = bytearray(chunk)
    offset += length
if doc is None or binary is None:
    raise SystemExit("Missing GLB JSON/BIN chunk")

new_images = []
total_before = total_after = 0
for index, image in enumerate(doc.get("images", [])):
    if "bufferView" not in image:
        continue
    view = doc["bufferViews"][image["bufferView"]]
    start = view.get("byteOffset", 0)
    raw = bytes(binary[start:start + view["byteLength"]])
    total_before += len(raw)
    with Image.open(io.BytesIO(raw)) as im:
        im.load()
        original = im.size
        if max(im.size) > 2048:
            ratio = 2048 / max(im.size)
            im = im.resize((max(1, round(im.width * ratio)), max(1, round(im.height * ratio))), Image.Resampling.LANCZOS)
        has_alpha = "A" in im.getbands() or "transparency" in im.info
        out = io.BytesIO()
        if has_alpha:
            im.convert("RGBA").save(out, format="PNG", optimize=True)
            mime = "image/png"
        else:
            im.convert("RGB").save(out, format="JPEG", quality=88, optimize=True, progressive=False)
            mime = "image/jpeg"
        packed = out.getvalue()
    while len(binary) % 4:
        binary.append(0)
    view["byteOffset"] = len(binary)
    view["byteLength"] = len(packed)
    binary.extend(packed)
    image["mimeType"] = mime
    total_after += len(packed)
    print(f"image {index}: {original[0]}x{original[1]} -> {im.width}x{im.height}, {len(raw)} -> {len(packed)} bytes, {mime}")

doc.setdefault("buffers", [{}])[0]["byteLength"] = len(binary)
json_chunk = json.dumps(doc, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
while len(json_chunk) % 4:
    json_chunk += b" "
while len(binary) % 4:
    binary.append(0)
total_length = 12 + 8 + len(json_chunk) + 8 + len(binary)
out = bytearray(struct.pack("<4sII", b"glTF", 2, total_length))
out.extend(struct.pack("<II", len(json_chunk), 0x4E4F534A))
out.extend(json_chunk)
out.extend(struct.pack("<II", len(binary), 0x004E4942))
out.extend(binary)
path.write_bytes(out)
print(f"Warehouse GLB optimized: {len(data)} -> {len(out)} bytes; embedded images {total_before} -> {total_after} bytes")
