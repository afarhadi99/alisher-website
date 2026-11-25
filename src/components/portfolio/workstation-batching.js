import { Mesh } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Bake immutable room transforms into shared material batches. The animated
// character, instanced keys and projected monitor remain independent.
export function batchStaticRoom(scene, excluded) {
  scene.updateMatrixWorld(true);
  const groups = new Map();
  for (const object of [...scene.children]) {
    if (!object.isMesh || object.isInstancedMesh || object === excluded || Array.isArray(object.material)) continue;
    const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}:${object.renderOrder}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(object);
  }
  let removed = 0;
  for (const objects of groups.values()) {
    if (objects.length < 2) continue;
    const geometries = objects.map(object => {
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      return geometry;
    });
    const merged = mergeGeometries(geometries, false);
    for (const geometry of geometries) geometry.dispose();
    if (!merged) continue;
    merged.computeBoundingSphere();
    const first = objects[0], batch = new Mesh(merged, first.material);
    batch.castShadow = first.castShadow;
    batch.receiveShadow = first.receiveShadow;
    batch.renderOrder = first.renderOrder;
    batch.matrixAutoUpdate = false;
    batch.name = "Static room material batch";
    for (const object of objects) {
      scene.remove(object);
      object.geometry.dispose();
    }
    scene.add(batch);
    removed += objects.length - 1;
  }
  return removed;
}
