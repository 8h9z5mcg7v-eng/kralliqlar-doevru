import fs from 'node:fs';

const file = process.argv[2] || 'buildings/barracks/Barracks.glb';
const b = fs.readFileSync(file);
const fail = (m) => { console.error('FAIL:', m); process.exitCode = 1; };
if (b.length < 20) fail('Fayl GLB üçün çox kiçikdir');
if (b.toString('ascii', 0, 4) !== 'glTF') fail('GLB magic başlığı yanlışdır');
const version = b.readUInt32LE(4);
const declared = b.readUInt32LE(8);
if (version !== 2) fail('GLB versiyası 2 deyil: ' + version);
if (declared !== b.length) fail('GLB header length fayl ölçüsünə uyğun deyil');

let offset = 12, json = null, binLength = 0, chunks = [];
while (offset + 8 <= b.length) {
  const len = b.readUInt32LE(offset);
  const type = b.readUInt32LE(offset + 4);
  offset += 8;
  if (offset + len > b.length) { fail('Chunk fayl sərhədini aşır'); break; }
  chunks.push({ type: type.toString(16), length: len });
  if (type === 0x4e4f534a) {
    try { json = JSON.parse(b.toString('utf8', offset, offset + len).replace(/\\0+$/g, '').trim()); }
    catch (e) { fail('JSON chunk oxunmur: ' + e.message); }
  }
  if (type === 0x004e4942) binLength = len;
  offset += len;
}
if (offset !== b.length) fail('Chunk sərhədindən sonra artıq bayt qalıb');
if (!json) fail('JSON chunk yoxdur');
if (json.asset?.version !== '2.0') fail('asset.version 2.0 deyil');
if (!binLength) fail('BIN chunk yoxdur');
if (json.buffers?.[0]?.byteLength > binLength) fail('Buffer tələb olunan ölçüdən böyükdür');

const meshes = json.meshes || [];
const primitives = meshes.flatMap(m => m.primitives || []);
const accessors = json.accessors || [];
const vertices = accessors.filter(a => a.type === 'VEC3' && a.min && a.max);
const triangles = primitives.reduce((sum, p) => {
  const a = p.indices === undefined ? accessors[p.attributes?.POSITION] : accessors[p.indices];
  if (!a) return sum;
  return sum + (p.mode === 5 || p.mode === 6 ? Math.max(0, a.count - 2) : Math.floor(a.count / 3));
}, 0);
const report = {
  file, bytes: b.length, glbVersion: version, assetVersion: json.asset.version,
  meshes: meshes.length, primitives: primitives.length, accessors: accessors.length,
  nodes: (json.nodes || []).length, scenes: (json.scenes || []).length,
  materials: (json.materials || []).length, images: (json.images || []).length,
  textures: (json.textures || []).length, binBytes: binLength,
  extensionsUsed: json.extensionsUsed || [], estimatedTriangles: triangles,
  hasNormals: primitives.every(p => p.attributes?.NORMAL !== undefined),
  hasUVs: primitives.every(p => p.attributes?.TEXCOORD_0 !== undefined),
  positionBounds: vertices.slice(0, 4).map(a => ({ min: a.min, max: a.max }))
};
console.log(JSON.stringify(report, null, 2));
if (!meshes.length || !primitives.length) fail('Mesh/primitive yoxdur');
if (!accessors.length) fail('Accessor yoxdur');
