#!/usr/bin/env python3
"""Downscale embedded warehouse GLB textures and compact its binary buffer."""
import io, json, struct
from pathlib import Path
from PIL import Image

path = Path("buildings/warehouse/medieval_warehouse.glb")
data = path.read_bytes()
if data[:4] != b"glTF" or struct.unpack_from("<I", data, 4)[0] != 2:
    raise SystemExit("Not a GLB 2.0 file")
offset = 12
doc = None
original_binary = None
while offset + 8 <= len(data):
    length, kind = struct.unpack_from("<II", data, offset)
    offset += 8
    chunk = data[offset:offset + length]
    if kind == 0x4E4F534A:
        doc = json.loads(chunk.decode("utf-8").rstrip(" \t\r\n\0"))
    elif kind == 0x004E4942:
        original_binary = bytes(chunk)
    offset += length
if doc is None or original_binary is None:
    raise SystemExit("Missing GLB JSON/BIN chunk")

image_views = {}
for index, image in enumerate(doc.get("images", [])):
    if "bufferView" not in image:
        continue
    view_index = image["bufferView"]
    view = doc["bufferViews"][view_index]
    start = view.get("byteOffset", 0)
    raw = original_binary[start:start + view["byteLength"]]
    with Image.open(io.BytesIO(raw)) as im:
        im.load()
        original = im.size
        if max(im.size) > 1024:
            ratio = 1024 / max(im.size)
            im = im.resize((max(1, round(im.width * ratio)), max(1, round(im.height * ratio))), Image.Resampling.LANCZOS)
        has_alpha = "A" in im.getbands() or "transparency" in im.info
        out = io.BytesIO()
        if has_alpha:
            im.convert("RGBA").save(out, format="PNG", optimize=True)
            mime = "image/png"
        else:
            im.convert("RGB").save(out, format="JPEG", quality=84, optimize=True, progressive=False)
            mime = "image/jpeg"
        packed = out.getvalue()
    image_views[view_index] = packed
    image["mimeType"] = mime
    print(f"image {index}: {original[0]}x{original[1]} -> {im.width}x{im.height}, {len(raw)} -> {len(packed)} bytes, {mime}")

# Rebuild every bufferView into a compact BIN chunk, so old 4K/8K image bytes are discarded.
binary = bytearray()
for index, view in enumerate(doc.get("bufferViews", [])):
    while len(binary) % 4:
        binary.append(0)
    old_start = view.get("byteOffset", 0)
    if index in image_views:
        chunk = image_views[index]
    else:
        chunk = original_binary[old_start:old_start + view["byteLength"]]
    view["byteOffset"] = len(binary)
    view["byteLength"] = len(chunk)
    binary.extend(chunk)

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
print(f"Warehouse GLB compacted: {len(data)} -> {len(out)} bytes")
