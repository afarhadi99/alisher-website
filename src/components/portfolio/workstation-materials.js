import { RepeatWrapping, SRGBColorSpace, TextureLoader } from "three";

export async function loadRoomMaterials(renderer, textures, wood, wall, floor) {
  const loader = new TextureLoader();
  const load = async (name, kind) => {
    try {
      const texture = await new Promise((resolve, reject) => {
        let expired = false;
        const timer = window.setTimeout(() => {
          expired = true;
          reject(new Error("Material timeout"));
        }, 3500);
        loader.load(
          `/room/${name}-${kind}.webp`,
          (texture) => {
            window.clearTimeout(timer);
            if (expired) texture.dispose();
            else resolve(texture);
          },
          undefined,
          (error) => {
            window.clearTimeout(timer);
            reject(error);
          },
        );
      });
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.anisotropy = Math.min(
        8,
        renderer.capabilities.getMaxAnisotropy(),
      );
      if (kind === "color") texture.colorSpace = SRGBColorSpace;
      textures.push(texture);
      return texture;
    } catch {
      // Basic materials still render if a texture is unavailable.
      return null;
    }
  };
  const [wc, wn, wr, pc, pn, pr] = await Promise.all([
    load("walnut", "color"),
    load("walnut", "normal"),
    load("walnut", "roughness"),
    load("plaster", "color"),
    load("plaster", "normal"),
    load("plaster", "roughness"),
  ]);
  Object.assign(wood, {
    map: wc,
    normalMap: wn,
    roughnessMap: wr,
    roughness: 0.74,
    bumpMap: null,
  });
  wood.normalScale.set(0.4, 0.4);
  Object.assign(wall, {
    map: pc,
    normalMap: pn,
    roughnessMap: pr,
    roughness: 0.95,
    bumpMap: null,
  });
  wall.normalScale.set(0.35, 0.35);
  Object.assign(floor, {
    map: wc,
    normalMap: wn,
    roughnessMap: wr,
    roughness: 0.9,
    bumpMap: null,
  });
  floor.normalScale.set(0.3, 0.3);
}

// World-unit planar UVs keep grain and plaster at a consistent physical scale
// across separate wall panels, desk edges, shelves and the floor.
export function applyMetricUVs(geometry, position, metresPerTile = 1) {
  const p = geometry.attributes.position,
    n = geometry.attributes.normal,
    uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + position[0],
      y = p.getY(i) + position[1],
      z = p.getZ(i) + position[2];
    const nx = Math.abs(n.getX(i)),
      ny = Math.abs(n.getY(i)),
      nz = Math.abs(n.getZ(i));
    uv.setXY(
      i,
      (nx > ny && nx > nz ? z : x) / metresPerTile,
      (ny > nx && ny > nz ? z : y) / metresPerTile,
    );
  }
  uv.needsUpdate = true;
}
