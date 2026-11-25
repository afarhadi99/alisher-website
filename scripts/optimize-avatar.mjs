import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { Quaternion, Texture, TextureLoader } from 'three';

// Rebuild the existing asset, preserving its mesh, skin and materials. Bake only
// the existing stationary idle/wave rotation tracks; no FBX parser ships to users.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Load the existing standalone ESM mapping without changing the app package's
// module type. The build tool also works on Node versions without .js detection.
const mappingSource = await readFile(
  path.join(root, 'src/components/Profile/bone-mapping.js'),
  'utf8',
);
const { COMPLETE_BONE_MAPPING } = await import(
  `data:text/javascript;base64,${Buffer.from(mappingSource).toString('base64')}`
);
const original = await readFile(path.join(root, 'public/model.glb'));
if (original.readUInt32LE(0) !== 0x46546c67)
  throw new Error('Expected a GLB file');
const jsonLength = original.readUInt32LE(12);
const gltf = JSON.parse(original.subarray(20, 20 + jsonLength).toString());
const sourceBin = original.subarray(28 + jsonLength);
const imagesByView = new Map(
  gltf.images.map((image, index) => [image.bufferView, index]),
);
const dataTextures = new Set();
for (const material of gltf.materials) {
  for (const info of [
    material.normalTexture,
    material.pbrMetallicRoughness?.metallicRoughnessTexture,
    material.occlusionTexture,
  ]) {
    if (info) dataTextures.add(gltf.textures[info.index].source);
  }
}
let offset = 0;
const chunks = [];
function append(bytes) {
  const byteOffset = offset;
  chunks.push(bytes);
  const padding = (4 - (bytes.length % 4)) % 4;
  if (padding) chunks.push(Buffer.alloc(padding));
  offset += bytes.length + padding;
  return { buffer: 0, byteOffset, byteLength: bytes.length };
}
for (let index = 0; index < gltf.bufferViews.length; index++) {
  const view = gltf.bufferViews[index];
  let bytes = sourceBin.subarray(
    view.byteOffset ?? 0,
    (view.byteOffset ?? 0) + view.byteLength,
  );
  if (imagesByView.has(index)) {
    const imageIndex = imagesByView.get(index);
    bytes = await sharp(bytes)
      .webp(
        dataTextures.has(imageIndex)
          ? { lossless: true, effort: 5 }
          : { quality: 88, effort: 5 },
      )
      .toBuffer();
    gltf.images[imageIndex].mimeType = 'image/webp';
  }
  gltf.bufferViews[index] = { ...view, ...append(bytes) };
}
for (const texture of gltf.textures) {
  texture.extensions = {
    ...texture.extensions,
    EXT_texture_webp: { source: texture.source },
  };
  delete texture.source;
}
gltf.extensionsUsed = [
  ...new Set([...(gltf.extensionsUsed ?? []), 'EXT_texture_webp']),
];
gltf.extensionsRequired = [
  ...new Set([...(gltf.extensionsRequired ?? []), 'EXT_texture_webp']),
];

// FBX source files include mesh/texture data. Texture loading is unnecessary for
// extracting animations, so stub it in this offline Node-only conversion step.
globalThis.window = { URL, innerWidth: 1024, innerHeight: 1024 };
TextureLoader.prototype.load = function () {
  return new Texture();
};
const nodeByName = new Map(gltf.nodes.map((node, index) => [node.name, index]));
const a = new Quaternion();
const b = new Quaternion();
const expected = new Quaternion();
const actual = new Quaternion();
const tolerance = (0.12 * Math.PI) / 180;
function sampleRotation(track, duration) {
  const frames = Math.ceil(duration * 30);
  const times = Float32Array.from(
    { length: frames + 1 },
    (_, frame) => (frame * duration) / frames,
  );
  const values = new Float32Array(times.length * 4);
  const interpolant = track.createInterpolant();
  times.forEach((time, index) =>
    values.set(interpolant.evaluate(time), index * 4),
  );
  const keep = new Set([0, frames]);
  function reduce(start, end) {
    a.fromArray(values, start * 4);
    b.fromArray(values, end * 4);
    let worst = tolerance;
    let selected = -1;
    for (let index = start + 1; index < end; index++) {
      expected.slerpQuaternions(
        a,
        b,
        (times[index] - times[start]) / (times[end] - times[start]),
      );
      actual.fromArray(values, index * 4);
      const error = expected.angleTo(actual);
      if (error > worst) {
        worst = error;
        selected = index;
      }
    }
    if (selected !== -1) {
      keep.add(selected);
      reduce(start, selected);
      reduce(selected, end);
    }
  }
  reduce(0, frames);
  const indices = [...keep].sort((x, y) => x - y);
  return {
    times: Float32Array.from(indices.map((index) => times[index])),
    values: Float32Array.from(
      indices.flatMap((index) =>
        Array.from(values.subarray(index * 4, index * 4 + 4)),
      ),
    ),
  };
}
function accessor(array, type, extrema) {
  const view =
    gltf.bufferViews.push(
      append(Buffer.from(array.buffer, array.byteOffset, array.byteLength)),
    ) - 1;
  return (
    gltf.accessors.push({
      bufferView: view,
      componentType: 5126,
      count: array.length / (type === 'VEC4' ? 4 : 1),
      type,
      ...extrema,
    }) - 1
  );
}
gltf.animations = [];
const animationSources = [];
for (const name of ['idle', 'wave']) {
  const bytes = await readFile(path.join(root, `public/${name}.fbx`));
  animationSources.push({ file: `${name}.fbx`, bytes: bytes.length });
  const source = new FBXLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  const clip = source.animations[0];
  if (!clip) throw new Error(`No animation in ${name}.fbx`);
  const animation = { name, channels: [], samplers: [] };
  for (const track of clip.tracks) {
    const [sourceName, property] = track.name.split('.');
    const target = nodeByName.get(COMPLETE_BONE_MAPPING[sourceName]);
    if (property !== 'quaternion' || target === undefined) continue;
    const samples = sampleRotation(track, clip.duration);
    const input = accessor(samples.times, 'SCALAR', {
      min: [samples.times[0]],
      max: [samples.times.at(-1)],
    });
    const output = accessor(samples.values, 'VEC4');
    animation.channels.push({
      sampler: animation.samplers.length,
      target: { node: target, path: 'rotation' },
    });
    animation.samplers.push({ input, output, interpolation: 'LINEAR' });
  }
  if (!animation.channels.length)
    throw new Error(`No retargeted tracks for ${name}`);
  gltf.animations.push(animation);
}
const binary = Buffer.concat(chunks);
gltf.buffers = [{ byteLength: binary.length }];
gltf.asset.generator =
  'Alisher portfolio: existing model and animation asset optimization';
const json = Buffer.from(JSON.stringify(gltf));
const paddedJson = Buffer.concat([
  json,
  Buffer.alloc((4 - (json.length % 4)) % 4, 0x20),
]);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + paddedJson.length + binary.length, 8);
header.writeUInt32LE(paddedJson.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binHeader = Buffer.alloc(8);
binHeader.writeUInt32LE(binary.length, 0);
binHeader.writeUInt32LE(0x004e4942, 4);
const optimized = Buffer.concat([header, paddedJson, binHeader, binary]);
const outputDirectory = path.join(root, 'public/avatar');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'alisher.glb'), optimized);
const manifest = {
  source: 'model.glb',
  originalModelBytes: original.length,
  originalInitialAnimationBytes: animationSources.reduce(
    (sum, source) => sum + source.bytes,
    0,
  ),
  optimizedBytes: optimized.length,
  textures:
    'WebP: colour quality 88, normal and material maps lossless, original 1024px resolution',
  geometry: 'Original mesh and skin preserved',
  animations: gltf.animations.map((animation) => ({
    name: animation.name,
    tracks: animation.channels.length,
  })),
  animationSampling: '30 fps with 0.12 degree keyframe reduction tolerance',
  animationSources,
};
await writeFile(
  path.join(outputDirectory, 'optimization.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(JSON.stringify(manifest, null, 2));
