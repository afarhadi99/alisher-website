import {
  ACESFilmicToneMapping,
  AnimationMixer,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  HemisphereLight,
  LoopOnce,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Spherical,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { getAvatarAsset, disposeAvatarModel } from "./avatar-asset";

export function createAvatarScene(container, callbacks) {
  let disposed = false;
  let model;
  let mixer;
  let idle;
  let waveAction;
  let ready = false;
  let inView = false;
  let covered = !!document.querySelector(".terminal-intro");
  let motion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let oneShot = false;
  let raf = 0;
  let previous = 0;
  let dirty = true;
  let frameCount = 0;
  let framing = "portrait";
  let modelSize;
  let cloud;
  let cloudHome;
  let cloudScatter;
  let entranceStart = 0;
  let entrance = false;
  let pendingEntrance = false;
  const modelMaterials = [];
  const entranceCamera = new Vector3();
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const coarse = matchMedia("(pointer: coarse)").matches;
  const lowPower = coarse || (navigator.hardwareConcurrency || 8) <= 4;
  const maxFps = lowPower ? 24 : 30;
  const pixelRatio = Math.min(devicePixelRatio || 1, lowPower ? 1 : 1.5);
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: !lowPower,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearAlpha(0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = false;
  const canvas = renderer.domElement;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Alisher Farhadi’s interactive 3D avatar. Drag to rotate, or use the controls below.",
  );
  canvas.dataset.rendererState = "loading";
  canvas.dataset.pixelRatio = String(pixelRatio);
  container.appendChild(canvas);
  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.05, 30);
  const styles = getComputedStyle(container);
  const keyColour = styles.getPropertyValue("--avatar-key-light").trim();
  const fillColour = styles.getPropertyValue("--avatar-fill-light").trim();
  const groundColour = styles.getPropertyValue("--avatar-ground-light").trim();
  scene.add(new HemisphereLight(fillColour, groundColour, 2.4));
  const keyLight = new DirectionalLight(keyColour, 2.8);
  keyLight.position.set(2, 3, 4);
  scene.add(keyLight);
  const rimLight = new DirectionalLight(fillColour, 1.4);
  rimLight.position.set(-2, 2, -2);
  scene.add(rimLight);
  const controls = new OrbitControls(camera, canvas);
  // Vertical swipes over the portrait must still scroll the page.
  canvas.style.touchAction = "pan-y";
  controls.enablePan = false;
  controls.enableDamping = false;
  controls.autoRotate = false;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.65;
  controls.minPolarAngle = Math.PI * 0.28;
  controls.maxPolarAngle = Math.PI * 0.68;
  const offset = new Vector3();
  const spherical = new Spherical();

  function stopFrames() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    previous = 0;
  }
  function renderSoon() {
    dirty = true;
    if (!disposed && inView && !covered && !document.hidden && !raf)
      raf = requestAnimationFrame(render);
  }
  function render(time) {
    raf = 0;
    if (disposed || !inView || covered || document.hidden || !model) return;
    const elapsed = previous ? time - previous : 1000 / maxFps;
    if (dirty || elapsed >= 1000 / maxFps) {
      const delta = Math.min(elapsed / 1000, 0.06);
      previous = time;
      if (mixer && (motion || oneShot)) mixer.update(delta);
      if (entrance) updateEntrance(time);
      controls.update();
      renderer.render(scene, camera);
      frameCount++;
      if (frameCount === 1 || frameCount % maxFps === 0)
        canvas.dataset.frames = String(frameCount);
      canvas.dataset.rendererState = motion || oneShot ? "animating" : "still";
      dirty = false;
      if (model && !ready) {
        ready = true;
        canvas.dataset.drawCalls = String(renderer.info.render.calls);
        callbacks.onReady();
      }
    }
    if ((motion || oneShot || entrance) && !raf)
      raf = requestAnimationFrame(render);
  }

  function clearCloud() {
    if (!cloud) return;
    scene.remove(cloud);
    cloud.geometry.dispose();
    cloud.material.dispose();
    cloud = null;
    cloudHome = null;
    cloudScatter = null;
  }
  function finishEntrance() {
    pendingEntrance = false;
    if (entrance) {
      camera.position.copy(entranceCamera);
      controls.update();
    }
    entrance = false;
    clearCloud();
    for (const item of modelMaterials) {
      item.material.opacity = item.opacity;
      item.material.transparent = item.transparent;
      item.material.depthWrite = item.depthWrite;
      item.material.needsUpdate = true;
    }
    if (model) model.visible = true;
    controls.enabled = inView;
    canvas.dataset.entrance = "complete";
    renderSoon();
  }
  function beginEntrance(
    delay = document.querySelector(".opening-sequence") ? 1800 : 0,
  ) {
    if (!callbacks.cinematic || reducedMotion.matches || !model || !inView)
      return;
    finishEntrance();
    fit("portrait");
    entranceCamera.copy(camera.position);
    const home = [];
    const point = new Vector3();
    model.updateMatrixWorld(true);
    model.traverse((object) => {
      if (!object.isMesh) return;
      const count = object.geometry.attributes.position.count;
      const stride = Math.max(1, Math.ceil(count / 3200));
      for (let index = 0; index < count; index += stride) {
        object.getVertexPosition(index, point);
        object.localToWorld(point);
        home.push(point.x, point.y, point.z);
      }
    });
    cloudHome = Float32Array.from(home);
    cloudScatter = new Float32Array(home.length);
    const colours = new Float32Array(home.length);
    const accent = new Color(styles.getPropertyValue("--color-accent").trim());
    const ink = new Color(styles.getPropertyValue("--color-ink").trim());
    for (let index = 0; index < home.length; index += 3) {
      const n = index / 3;
      const angle = n * 2.399963;
      const radius = modelSize.y * (0.7 + ((n * 17) % 101) / 101);
      cloudScatter[index] = Math.cos(angle) * radius;
      cloudScatter[index + 1] = modelSize.y * (0.5 + Math.sin(n * 1.7) * 0.9);
      cloudScatter[index + 2] = Math.sin(angle) * radius * 0.65;
      (n % 4 === 0 ? ink : accent).toArray(colours, index);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new BufferAttribute(cloudScatter.slice(), 3),
    );
    geometry.setAttribute("color", new BufferAttribute(colours, 3));
    cloud = new Points(
      geometry,
      new PointsMaterial({
        size: modelSize.y * 0.006,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
      }),
    );
    cloud.frustumCulled = false;
    scene.add(cloud);
    if (!modelMaterials.length)
      model.traverse((object) => {
        for (const material of [object.material].flat().filter(Boolean)) {
          if (!modelMaterials.some((item) => item.material === material))
            modelMaterials.push({
              material,
              opacity: material.opacity,
              transparent: material.transparent,
              depthWrite: material.depthWrite,
            });
        }
      });
    for (const { material } of modelMaterials) {
      material.transparent = true;
      material.depthWrite = false;
      material.opacity = 0;
      material.needsUpdate = true;
    }
    model.visible = false;
    entrance = true;
    entranceStart = performance.now() + delay;
    controls.enabled = false;
    canvas.dataset.entrance = "assembling";
    renderSoon();
  }
  function updateEntrance(time) {
    const progress = Math.max(0, Math.min((time - entranceStart) / 2300, 1));
    const ease = 1 - (1 - progress) ** 3;
    const positions = cloud.geometry.attributes.position;
    for (let index = 0; index < cloudHome.length; index++)
      positions.array[index] =
        cloudScatter[index] * (1 - ease) + cloudHome[index] * ease;
    positions.needsUpdate = true;
    cloud.material.opacity = 1 - Math.max(0, (progress - 0.48) / 0.52);
    const solidity = Math.max(0, Math.min((progress - 0.5) / 0.38, 1));
    model.visible = solidity > 0;
    for (const item of modelMaterials)
      item.material.opacity = item.opacity * solidity;
    offset.copy(entranceCamera).sub(controls.target);
    spherical.setFromVector3(offset);
    spherical.theta -= (1 - ease) * 0.9;
    spherical.radius *= 1 + (1 - ease) * 0.85;
    camera.position
      .copy(controls.target)
      .add(offset.setFromSpherical(spherical));
    controls.update();
    if (progress >= 1) finishEntrance();
  }
  function fit(nextFraming = framing) {
    framing = nextFraming;
    if (!modelSize) return;
    const full = framing === "full";
    const height = modelSize.y * (full ? 1.13 : 0.53);
    const width = Math.min(modelSize.x, modelSize.y * (full ? 0.85 : 0.55));
    const distance = Math.max(
      height / 2 / Math.tan((camera.fov * Math.PI) / 360),
      width / 2 / Math.tan((camera.fov * Math.PI) / 360) / camera.aspect,
    );
    controls.target.set(0, modelSize.y * (full ? 0.5 : 0.765), 0);
    camera.position.set(0, controls.target.y + modelSize.y * 0.025, distance);
    controls.minDistance = distance * 0.65;
    controls.maxDistance = distance * 1.8;
    controls.update();
    controls.saveState();
    renderSoon();
  }
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fit();
    renderSoon();
  }
  function setMotion(enabled) {
    motion = enabled;
    if (!enabled) {
      if (entrance) finishEntrance();
      oneShot = false;
      stopFrames();
    }
    callbacks.onMotionChange(enabled);
    renderSoon();
  }
  function onVisibility() {
    if (document.hidden) {
      stopFrames();
      canvas.dataset.rendererState = "hidden";
    } else renderSoon();
  }
  function onReducedMotion(event) {
    if (event.matches) setMotion(false);
  }
  function onOpening() {
    covered = true;
    stopFrames();
  }
  function onOpeningEnd() {
    covered = false;
    finishEntrance();
  }
  function onReplay() {
    if (model && inView) beginEntrance(1800);
    else pendingEntrance = true;
  }
  function onSkipEntrance(event) {
    if (event.key === "Escape" && (entrance || pendingEntrance)) {
      finishEntrance();
      renderSoon();
    }
  }
  function finished(event) {
    if (event.action !== waveAction) return;
    waveAction.stop();
    idle.reset().setEffectiveWeight(1).play();
    mixer.update(0);
    oneShot = false;
    renderSoon();
  }
  function onContextLost(event) {
    event.preventDefault();
    dispose();
    callbacks.onError(
      "The 3D display was interrupted. You can retry or keep the photo.",
    );
  }
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(container);
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      inView = entry.isIntersecting;
      controls.enabled = inView;
      if (inView) {
        if (pendingEntrance && model) {
          pendingEntrance = false;
          beginEntrance(1800);
        }
        renderSoon();
      } else {
        stopFrames();
        canvas.dataset.rendererState = "offscreen";
      }
    },
    { threshold: 0.01 },
  );
  visibilityObserver.observe(container);
  controls.addEventListener("change", renderSoon);
  reducedMotion.addEventListener("change", onReducedMotion);
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);
  window.addEventListener("portfolio:replay", onReplay);
  window.addEventListener("portfolio:skip", onOpeningEnd);
  window.addEventListener("portfolio:opening", onOpening);
  document.addEventListener("keydown", onSkipEntrance);
  callbacks.onMotionChange(motion);
  resize();

  getAvatarAsset()
    .then(async (buffer) => {
      if (disposed) return;
      const gltf = await new GLTFLoader().parseAsync(buffer.slice(0), "");
      if (disposed) {
        disposeAvatarModel(gltf.scene);
        return;
      }
      model = gltf.scene;
      scene.add(model);
      mixer = new AnimationMixer(model);
      const idleClip = gltf.animations.find((clip) => clip.name === "idle");
      const waveClip = gltf.animations.find((clip) => clip.name === "wave");
      if (!idleClip || !waveClip)
        throw new Error("The avatar animations are unavailable");
      idle = mixer.clipAction(idleClip).play();
      waveAction = mixer.clipAction(waveClip);
      waveAction.setLoop(LoopOnce, 1);
      waveAction.clampWhenFinished = true;
      mixer.update(0);
      model.updateMatrixWorld(true);
      model.traverse((object) => {
        if (object.isSkinnedMesh) object.computeBoundingBox();
      });
      const box = new Box3().setFromObject(model);
      const center = box.getCenter(new Vector3());
      modelSize = box.getSize(new Vector3());
      model.position.x -= center.x;
      model.position.y -= box.min.y;
      model.position.z -= center.z;
      mixer.addEventListener("finished", finished);
      fit();
      pendingEntrance = false;
      beginEntrance();
      renderSoon();
    })
    .catch(() => {
      if (disposed) return;
      dispose();
      callbacks.onError(
        "The 3D portrait could not load. You can retry or keep the photo.",
      );
    });

  function dispose() {
    if (disposed) return;
    disposed = true;
    stopFrames();
    sizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    reducedMotion.removeEventListener("change", onReducedMotion);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    window.removeEventListener("portfolio:replay", onReplay);
    window.removeEventListener("portfolio:skip", onOpeningEnd);
    window.removeEventListener("portfolio:opening", onOpening);
    document.removeEventListener("keydown", onSkipEntrance);
    controls.removeEventListener("change", renderSoon);
    controls.dispose();
    if (mixer) {
      mixer.removeEventListener("finished", finished);
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    }
    disposeAvatarModel(model);
    clearCloud();
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }
  return {
    dispose,
    setMotion,
    frame: fit,
    reset() {
      controls.reset();
      renderSoon();
    },
    rotate(direction) {
      offset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(offset);
      spherical.theta += (direction * Math.PI) / 12;
      camera.position
        .copy(controls.target)
        .add(offset.setFromSpherical(spherical));
      controls.update();
      renderSoon();
    },
    wave() {
      if (!waveAction || !idle) return;
      oneShot = true;
      idle.fadeOut(0.2);
      waveAction.reset().setEffectiveWeight(1).fadeIn(0.2).play();
      renderSoon();
    },
  };
}
