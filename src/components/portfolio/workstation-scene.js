import {
  ACESFilmicToneMapping,
  BoxGeometry,
  LinearFilter,
  LinearMipmapLinearFilter,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DataTexture,
  MeshPhysicalMaterial,
  PCFSoftShadowMap,
  FogExp2,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getAvatarAsset, disposeAvatarModel } from "./avatar-asset";
import { createWorkstationEffects } from "./workstation-effects";
import { buildWorkstationRoom } from "./workstation-room";
import { loadRoomMaterials, applyMetricUVs } from "./workstation-materials";
import { terminalFrame } from "./terminal-timeline";
import { batchStaticRoom } from "./workstation-batching";

export async function createWorkstationScene(container, callbacks = {}) {
  const bytes = await getAvatarAsset();
  const { scene: avatar } = await new GLTFLoader().parseAsync(
    bytes.slice(0),
    "",
  );
  const css = getComputedStyle(container);
  const c = (name) => css.getPropertyValue("--terminal-" + name).trim();
  const lowPower =
    matchMedia("(pointer: coarse)").matches ||
    (navigator.hardwareConcurrency || 8) <= 4;
  let renderer;
  try {
    renderer = new WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
  } catch (error) {
    disposeAvatarModel(avatar);
    throw error;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const canvas = renderer.domElement;
  canvas.dataset.scene = "workstation";
  container.appendChild(canvas);
  const scene = new Scene();
  scene.background = new Color(c("night"));
  scene.fog = new FogExp2(c("night"), 0.018);
  const camera = new PerspectiveCamera(36, 1, 0.01, 40);
  const materials = [];
  const textures = [];
  const mat = (name, roughness = 0.75, metalness = 0) => {
    const material = new MeshPhysicalMaterial({
      color: c(name),
      roughness,
      metalness,
    });
    materials.push(material);
    return material;
  };
  const plastic = mat("case"),
    trim = mat("trim"),
    metal = mat("metal", 0.4, 0.6);
  const paper = mat("paper"),
    wood = mat("wood"),
    black = mat("night");
  // Deterministic microstructure maps: linear data, never colour textures.
  function microtexture(kind) {
    const size = 256,
      bytes = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
        let value = 128 + (n - Math.floor(n) - 0.5) * 35;
        if (kind === "wood")
          value += Math.sin(y * 0.65 + Math.sin(x * 0.035) * 2) * 32;
        if (kind === "fabric") value += x % 4 < 2 !== y % 4 < 2 ? 24 : -24;
        bytes[i] = bytes[i + 1] = bytes[i + 2] = value;
        bytes[i + 3] = 255;
      }
    const map = new DataTexture(bytes, size, size);
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(5, 5);
    map.generateMipmaps = true;
    map.magFilter = LinearFilter;
    map.minFilter = LinearMipmapLinearFilter;
    map.needsUpdate = true;
    textures.push(map);
    return map;
  }
  const grainBump = microtexture("wood"),
    fineBump = microtexture("fine"),
    clothBump = microtexture("fabric");
  plastic.roughness = 0.72;
  plastic.bumpMap = fineBump;
  plastic.bumpScale = 0.00006;
  plastic.clearcoat = 0.035;
  plastic.clearcoatRoughness = 0.45;
  trim.roughness = 0.4;
  trim.bumpMap = fineBump;
  trim.bumpScale = 0.00005;
  wood.roughness = 0.58;
  wood.color.set(c("white"));
  wood.bumpMap = grainBump;
  wood.bumpScale = 0.003;
  wood.clearcoat = 0.12;
  wood.clearcoatRoughness = 0.32;
  metal.roughness = 0.28;
  metal.bumpMap = fineBump;
  metal.bumpScale = 0.00003;
  const wall = mat("wall", 0.98);
  wall.bumpMap = fineBump;
  wall.bumpScale = 0.004;
  const floorMaterial = mat("floor", 0.68);
  floorMaterial.bumpMap = grainBump;
  floorMaterial.bumpScale = 0.003;
  const leather = mat("night", 0.66);
  leather.bumpMap = clothBump;
  leather.bumpScale = 0.00015;
  leather.sheen = 0.22;
  leather.sheenColor.set(c("blue"));
  leather.sheenRoughness = 0.8;
  const ceramic = mat("paper", 0.2);
  ceramic.clearcoat = 1;
  ceramic.clearcoatRoughness = 0.16;
  const coffee = mat("night", 0.08);
  coffee.clearcoat = 1;
  function mesh(geometry, material, position, rotation, parent = scene) {
    if (material === wood || material === wall || material === floorMaterial)
      applyMetricUVs(geometry, position, material === wood ? 1.2 : 2);
    const object = new Mesh(geometry, material);
    object.position.set(...position);
    object.castShadow = true;
    object.receiveShadow = true;
    if (rotation) object.rotation.set(...rotation);
    parent.add(object);
    return object;
  }
  function box(
    size,
    position,
    material = plastic,
    radius = 0.025,
    rotation,
    parent,
  ) {
    return mesh(
      radius
        ? new RoundedBoxGeometry(
            ...size,
            lowPower ? 2 : 3,
            Math.min(radius, Math.min(...size) / 3),
          )
        : new BoxGeometry(...size),
      material,
      position,
      rotation,
      parent,
    );
  }
  function cylinder(top, bottom, height, position, material = metal, rotation) {
    return mesh(
      new CylinderGeometry(top, bottom, height, 24),
      material,
      position,
      rotation,
    );
  }
  await loadRoomMaterials(renderer, textures, wood, wall, floorMaterial);
  const {
    moon,
    lampLight,
    ctx,
    screenTexture,
    screenMaterial,
    crtUniform,
    display,
    screenWidth,
    screenHeight,
  } = buildWorkstationRoom({
    scene,
    c,
    css,
    lowPower,
    box,
    mesh,
    cylinder,
    mat,
    materials,
    textures,
    wood,
    wall,
    floorMaterial,
    plastic,
    trim,
    metal,
    paper,
    black,
    ceramic,
    coffee,
    leather,
  });

  canvas.dataset.batchedMeshes = String(batchStaticRoom(scene, display));
  // Seated pose derived from the original rig, without another animation asset.
  const up = new Vector3(0, 1, 0),
    direction = new Vector3(),
    parentQ = new Quaternion(),
    targetQ = new Quaternion();
  function pointBone(name, vector) {
    const bone = avatar.getObjectByName(name);
    if (!bone) return;
    avatar.updateMatrixWorld(true);
    bone.parent.getWorldQuaternion(parentQ);
    targetQ.setFromUnitVectors(up, direction.set(...vector).normalize());
    bone.quaternion.copy(parentQ.invert().multiply(targetQ));
  }
  pointBone("Spine", [0, 0.5, 0.87]);
  pointBone("Spine1", [0, 0.4, 0.92]);
  pointBone("Spine2", [0.08, 0.4, 0.92]);
  pointBone("Neck", [0.2, 0.45, 0.87]);
  pointBone("Head", [0.65, 0.2, 0.73]);
  avatar.getObjectByName("Head")?.rotateY(2.25);
  pointBone("LeftShoulder", [1, 0.05, 0]);
  pointBone("RightShoulder", [-1, 0.05, 0]);
  pointBone("LeftArm", [0.15, -0.06, 0.98]);
  pointBone("RightArm", [-0.2, -0.06, 0.98]);
  pointBone("LeftForeArm", [-0.85, 0.02, 0.5]);
  pointBone("RightForeArm", [0.85, 0.02, 0.5]);
  pointBone("LeftUpLeg", [0.1, -0.15, 0.98]);
  pointBone("RightUpLeg", [-0.1, -0.15, 0.98]);
  pointBone("LeftLeg", [0, -1, 0.05]);
  pointBone("RightLeg", [0, -1, 0.05]);
  pointBone("LeftFoot", [0, -0.15, 1]);
  pointBone("RightFoot", [0, -0.15, 1]);
  avatar.scale.setScalar(1);
  avatar.position.set(-0.43, -0.48, 0.64);
  avatar.rotation.y = Math.PI + 0.1;
  scene.add(avatar);
  avatar.updateMatrixWorld(true);
  avatar.traverse((object) => {
    if (object.isSkinnedMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      object.material.envMapIntensity = 0.4;
      object.frustumCulled = false;
      object.computeBoundingBox();
    }
  });
  const head = avatar.getObjectByName("Head");
  // This original rig has no blink morph. Small closed lids follow its eye bones.
  if (head) {
    const lidMaterial = new MeshStandardMaterial({
      color: c("skin"),
      roughness: 0.95,
    });
    for (const name of ["LeftEye", "RightEye"]) {
      const eye = avatar.getObjectByName(name);
      if (!eye) continue;
      const { x, y, z } = eye.position;
      const lid = mesh(
        new SphereGeometry(1, 16, 12),
        lidMaterial,
        [x, y, z + 0.012],
        null,
        head,
      );
      lid.scale.set(0.022, 0.013, 0.013);
      const crease = new CatmullRomCurve3([
        new Vector3(x - 0.017, y, z + 0.023),
        new Vector3(x, y - 0.003, z + 0.026),
        new Vector3(x + 0.017, y, z + 0.023),
      ]);
      mesh(
        new TubeGeometry(crease, 10, 0.0012, 4, false),
        black,
        [0, 0, 0],
        null,
        head,
      );
    }
  }
  const restingHead = head?.quaternion.clone();
  let lastScreen = "",
    disposed = false;
  const origin = new Vector3(),
    destination = new Vector3(),
    look = new Vector3();
  const screenCenter = display.localToWorld(new Vector3());
  const screenCorner = new Vector3();
  const wideTarget = new Vector3(-0.12, 0.92, -0.05);
  const ease = (t) => {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  };
  function drawTerminal(ms) {
    const frame = terminalFrame(ms);
    const portrait = camera.aspect < 0.8;
    const signature = JSON.stringify(frame) + portrait;
    if (signature === lastScreen) return;
    lastScreen = signature;
    ctx.fillStyle = c("screen");
    ctx.fillRect(0, 0, 1200, 800);
    const x = 100;
    const size = portrait ? 52 : 46;
    ctx.font = `${size}px ${css.getPropertyValue("--terminal-font").trim()}`;
    ctx.fillStyle = c("dim");
    ctx.fillText("alisher.space", x, 185);
    ctx.fillStyle = c("green");
    ctx.shadowColor = c("green");
    ctx.shadowBlur = 7;
    ctx.fillText("login: " + frame.login, x, 330);
    if (frame.passwordVisible)
      ctx.fillText("password: " + frame.password, x, 400);
    if (frame.accepted) ctx.fillText("Access granted.", x, 515);
    if (frame.opening) {
      ctx.fillStyle = c("dim");
      ctx.fillText("Opening portfolio...", x, 575);
    }
    if (!frame.accepted && frame.cursor) {
      const text = frame.passwordVisible
        ? "password: " + frame.password
        : "login: " + frame.login;
      ctx.fillStyle = c("green");
      ctx.fillRect(
        x + ctx.measureText(text).width + 5,
        frame.passwordVisible ? 370 : 300,
        size * 0.55,
        size,
      );
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = c("night");
    ctx.globalAlpha = 0.22;
    for (let y = 0; y < 800; y += 4) ctx.fillRect(0, y, 1200, 1);
    ctx.globalAlpha = 1;
    const vignette = ctx.createRadialGradient(600, 400, 170, 600, 400, 740);
    vignette.addColorStop(0, "transparent");
    vignette.addColorStop(1, c("night"));
    ctx.fillStyle = vignette;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, 0, 1200, 800);
    ctx.globalAlpha = 1;
    screenTexture.needsUpdate = true;
    canvas.dataset.login = frame.login;
    canvas.dataset.password = frame.password;
  }
  drawTerminal(0);
  const effects = createWorkstationEffects(
    renderer,
    scene,
    camera,
    c,
    lowPower,
  );
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = camera.aspect < 0.8 ? 43 : 34;
    camera.updateProjectionMatrix();
    effects.resize(width, height);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  function render(ms) {
    if (disposed || document.hidden) return;
    const portrait = camera.aspect < 0.8;
    origin.set(
      portrait ? -1.0 : -1.65,
      portrait ? 1.65 : 1.62,
      portrait ? 3.8 * Math.max(1, 0.46 / camera.aspect) : 2.55,
    );
    const zoom = ease((ms - 1600) / 4100);
    const portalProgress = ease((ms - 8500) / 3100);
    wideTarget.y = portrait ? 0.63 : 0.92;
    const tangent = Math.tan((camera.fov * Math.PI) / 360);
    const holdDistance =
      Math.max(
        screenHeight / (2 * tangent),
        screenWidth / (2 * tangent * camera.aspect),
      ) * 1.17;
    const finalDistance =
      Math.min(
        screenHeight / (2 * tangent),
        screenWidth / (2 * tangent * camera.aspect),
      ) * 0.95;
    destination.copy(screenCenter);
    destination.z +=
      holdDistance + (finalDistance - holdDistance) * portalProgress;
    camera.position.lerpVectors(origin, destination, zoom);
    look.lerpVectors(wideTarget, screenCenter, zoom);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    if (ms >= 8500) {
      const viewport = container.getBoundingClientRect();
      screenCorner.set(-screenWidth / 2, screenHeight / 2, 0);
      display.localToWorld(screenCorner).project(camera);
      const left = (screenCorner.x + 1) * 0.5 * viewport.width,
        top = (1 - screenCorner.y) * 0.5 * viewport.height;
      screenCorner.set(screenWidth / 2, -screenHeight / 2, 0);
      display.localToWorld(screenCorner).project(camera);
      const right = (screenCorner.x + 1) * 0.5 * viewport.width,
        bottom = (1 - screenCorner.y) * 0.5 * viewport.height;
      callbacks.onPortal?.({
        left,
        top,
        width: right - left,
        height: bottom - top,
        progress: portalProgress,
        reveal: ease((ms - 8500) / 240),
      });
    }
    if (head && restingHead) {
      head.quaternion.copy(restingHead);
      head.rotateX(Math.sin(ms / 1800) * 0.008);
    }
    drawTerminal(ms);
    crtUniform.value = ms * 0.001;
    screenMaterial.envMapIntensity = 0.35 * (1 - zoom) + 0.015;
    effects.render(ms, camera.position.distanceTo(look));
    canvas.dataset.elapsed = String(Math.round(ms));
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    effects.dispose();
    moon.shadow.dispose();
    lampLight.shadow.dispose();
    scene.remove(avatar);
    disposeAvatarModel(avatar);
    const geometries = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    scene.clear();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }
  return { render, dispose };
}
