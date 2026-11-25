// Cache bytes, not GPU resources: a new viewer gets its own disposable scene.
let assetRequest;
export function getAvatarAsset() {
  if (!assetRequest) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    assetRequest = fetch("/avatar/alisher.glb", { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Could not load avatar");
        return response.arrayBuffer();
      })
      .catch((error) => {
        assetRequest = undefined;
        throw error;
      })
      .finally(() => clearTimeout(timeout));
  }
  return assetRequest;
}

export function disposeAvatarModel(model) {
  if (!model) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const images = new Set();
  const skeletons = new Set();
  model.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.skeleton) skeletons.add(object.skeleton);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      for (const value of Object.values(material))
        if (value?.isTexture) textures.add(value);
    }
  });
  for (const texture of textures) {
    if (texture.image) images.add(texture.image);
    texture.dispose();
  }
  for (const image of images) image.close?.();
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
  for (const skeleton of skeletons) skeleton.dispose();
}
