import {
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  RectAreaLight,
  SphereGeometry,
  SpotLight,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";

// Every dimension is metres. The 1.8 m desk, 17-inch CRT, 44 cm keyboard,
// 9 cm mug and 46 cm chair seat share the unscaled adult character's units.
export function buildWorkstationRoom({
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
}) {
  RectAreaLightUniformsLib.init();
  const glow = (name, intensity) => {
    const material = new MeshStandardMaterial({
      color: c(name),
      emissive: c(name),
      emissiveIntensity: intensity,
    });
    materials.push(material);
    return material;
  };
  const greenGlow = glow("green", 1.4),
    amberGlow = glow("amber", 3);
  scene.add(new HemisphereLight(c("blue"), c("night"), 0.6));
  const moon = new DirectionalLight(c("blue"), 2.6);
  moon.position.set(-1.8, 2.6, -3.8);
  moon.target.position.set(-0.3, 0.15, 1.6);
  scene.add(moon, moon.target);
  moon.castShadow = true;
  moon.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  Object.assign(moon.shadow.camera, {
    left: -2.8,
    right: 2.8,
    top: 2.7,
    bottom: -2,
    near: 0.1,
    far: 9,
  });
  moon.shadow.camera.updateProjectionMatrix();
  moon.shadow.normalBias = 0.006;
  moon.shadow.bias = -0.00015;
  moon.shadow.radius = 3;
  const lampLight = new SpotLight(c("amber"), 2.8, 3, Math.PI / 3.1, 0.8, 2);
  lampLight.position.set(-0.72, 1.105, -0.32);
  lampLight.target.position.set(-0.5, 0.76, 0.1);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(1024, 1024);
  lampLight.shadow.normalBias = 0.003;
  lampLight.shadow.bias = -0.0001;
  scene.add(lampLight, lampLight.target);
  const bounce = new RectAreaLight(c("amber"), 1.5, 0.5, 0.35);
  bounce.position.set(-0.65, 0.81, 0.05);
  bounce.lookAt(-0.3, 1, 0.5);
  scene.add(bounce);
  // Broad secondary light approximates the window reflected by the opposite wall.
  const wallBounce = new RectAreaLight(c("blue"), 1.3, 1.5, 1.1);
  wallBounce.position.set(1.8, 1.7, 0.7);
  wallBounce.lookAt(0.1, 1, -0.4);
  scene.add(wallBounce);
  const monitorLight = new RectAreaLight(
    new Color(c("green")).lerp(new Color(c("white")), 0.7),
    2.3,
    0.34,
    0.25,
  );
  monitorLight.position.set(0.34, 1.03, -0.045);
  monitorLight.lookAt(0.2, 0.9, 1);
  scene.add(monitorLight);
  const faceBounce = new PointLight(c("amber"), 0.23, 2, 2);
  faceBounce.position.set(-0.85, 1.25, 0.9);
  scene.add(faceBounce);

  // Enclosed room with an opening for the window, skirting, trim and sill.
  box([5, 0.08, 6], [0, -0.05, 0.3], floorMaterial, 0);
  box([0.65, 2.8, 0.12], [-2.175, 1.4, -1.65], wall, 0);
  box([3.35, 2.8, 0.12], [0.825, 1.4, -1.65], wall, 0);
  box([1, 0.8, 0.12], [-1.35, 0.4, -1.65], wall, 0);
  box([1, 0.6, 0.12], [-1.35, 2.5, -1.65], wall, 0);
  box([0.12, 2.8, 6], [-2.55, 1.4, 1.3], wall, 0);
  box([0.12, 2.8, 6], [2.55, 1.4, 1.3], wall, 0);
  box([5, 0.12, 6], [0, 2.85, 1.3], wall, 0);
  box([5, 0.1, 0.035], [0, 0.05, -1.57], trim, 0.004);
  box([0.035, 0.1, 5], [-2.47, 0.05, 0.8], trim, 0.004);
  const pane = box(
    [0.96, 1.35, 0.015],
    [-1.35, 1.5, -1.67],
    glow("blue", 0.4),
    0,
  );
  pane.castShadow = false;
  for (const x of [-1.88, -0.82])
    box([0.045, 1.5, 0.08], [x, 1.5, -1.56], trim, 0.003);
  for (const y of [0.76, 2.24])
    box([1.1, 0.045, 0.08], [-1.35, y, -1.56], trim, 0.003);
  box([1.16, 0.04, 0.19], [-1.35, 0.77, -1.5], paper, 0.006);
  for (let i = 0; i < 19; i++)
    box(
      [1.02, 0.043, 0.06],
      [-1.35, 0.84 + i * 0.071, -1.54],
      metal,
      0.001,
      [0.25, 0, 0],
    );
  for (const x of [-1.65, -1.05])
    box([0.007, 1.4, 0.006], [x, 1.5, -1.5], trim, 0);

  box([1.8, 0.036, 0.8], [0, 0.752, -0.1], wood, 0.008);
  for (const x of [-0.81, 0.81])
    for (const z of [-0.43, 0.23])
      box([0.035, 0.73, 0.035], [x, 0.365, z], metal, 0.003);
  box([1.65, 0.055, 0.03], [0, 0.68, -0.43], metal, 0.003);
  for (const x of [-0.81, 0.81]) {
    box([0.03, 0.04, 0.68], [x, 0.69, -0.1], metal, 0.003);
    for (const z of [-0.43, 0.23])
      cylinder(0.024, 0.024, 0.012, [x, 0.008, z], black);
  }
  // Modest shelf, book bindings and page blocks, fixed into the actual wall.
  box([0.95, 0.024, 0.22], [0.48, 1.76, -1.46], wood, 0.004);
  for (const x of [0.12, 0.83]) {
    box([0.018, 0.18, 0.018], [x, 1.66, -1.53], metal, 0.002);
    box([0.018, 0.018, 0.15], [x, 1.68, -1.47], metal, 0.002, [0.7, 0, 0]);
  }
  for (let i = 0; i < 9; i++) {
    const x = 0.12 + i * 0.075,
      h = 0.19 + (i % 3) * 0.018;
    box(
      [0.055, h, 0.14],
      [x, 1.78 + h / 2, -1.46],
      i % 3 ? plastic : trim,
      0.002,
    );
    box([0.045, h - 0.012, 0.134], [x, 1.78 + h / 2, -1.456], paper, 0.001);
    box([0.057, 0.009, 0.144], [x, 1.79, -1.46], trim, 0.001);
  }

  // A tapered CRT enclosure, inset bezel, separate glass and service details.
  const screenWidth = 0.355,
    screenHeight = 0.266;
  const screenX = 0.34,
    screenY = 1.035,
    screenZ = -0.048;
  const shell = box(
    [0.43, 0.35, 0.38],
    [screenX, 1.025, -0.24],
    plastic,
    0.018,
  );
  const pos = shell.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const taper = 1 - 0.28 * Math.max(0, -pos.getZ(i) / 0.19);
    pos.setX(i, pos.getX(i) * taper);
    pos.setY(i, pos.getY(i) * taper);
  }
  pos.needsUpdate = true;
  shell.geometry.computeVertexNormals();
  box([0.389, 0.299, 0.009], [screenX, screenY, -0.044], black, 0.014);
  box([0.23, 0.024, 0.23], [screenX, 0.784, -0.24], plastic, 0.01);
  cylinder(0.055, 0.07, 0.065, [screenX, 0.828, -0.24], plastic);
  for (let i = 0; i < 12; i++)
    box([0.002, 0.05, 0.009], [0.55, 0.96 + i * 0.012, -0.22], black, 0);
  box([0.036, 0.012, 0.006], [0.487, 0.878, -0.042], trim, 0.002);
  const led = mesh(
    new SphereGeometry(0.0025, 8, 8),
    greenGlow,
    [0.458, 0.878, -0.037],
  );
  led.castShadow = false;
  for (let i = 0; i < 4; i++)
    cylinder(0.003, 0.003, 0.003, [0.39 + i * 0.014, 0.878, -0.037], trim, [
      Math.PI / 2,
      0,
      0,
    ]);
  const terminal = document.createElement("canvas");
  terminal.width = 1440;
  terminal.height = 1080;
  const ctx = terminal.getContext("2d");
  ctx.scale(1.2, 1.35);
  const screenTexture = new CanvasTexture(terminal);
  screenTexture.colorSpace = SRGBColorSpace;
  textures.push(screenTexture);
  const screenMaterial = new MeshPhysicalMaterial({
    map: screenTexture,
    emissiveMap: screenTexture,
    emissive: c("white"),
    emissiveIntensity: 1.6,
    roughness: 0.13,
    clearcoat: 1,
    clearcoatRoughness: 0.09,
    envMapIntensity: 0.22,
  });
  materials.push(screenMaterial);
  const crtUniform = { value: 0 };
  screenMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.crtTime = crtUniform;
    shader.fragmentShader = "uniform float crtTime;\n" + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n totalEmissiveRadiance *= .99 + .01*sin(gl_FragCoord.y*1.6+crtTime*.6);",
    );
  };
  const glass = new PlaneGeometry(screenWidth, screenHeight, 40, 32),
    gp = glass.attributes.position;
  for (let i = 0; i < gp.count; i++)
    gp.setZ(
      i,
      0.004 *
        (1 - (gp.getX(i) / (0.5 * screenWidth)) ** 2) *
        (1 - (gp.getY(i) / (0.5 * screenHeight)) ** 2),
    );
  glass.computeVertexNormals();
  const display = mesh(glass, screenMaterial, [
    screenX,
    screenY,
    screenZ + 0.008,
  ]);
  display.castShadow = false;

  // Correct key pitch (19 mm), staggered rows, distinct modifier widths.
  const atlas = document.createElement("canvas");
  atlas.width = 1024;
  atlas.height = 512;
  const ink = atlas.getContext("2d");
  ink.fillStyle = c("key");
  ink.fillRect(0, 0, 1024, 512);
  ink.fillStyle = c("night");
  ink.font = "22px " + css.getPropertyValue("--terminal-font").trim();
  const rows = [
    ["esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "←"],
    ["tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
    ["caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "↵"],
    ["shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "shift"],
    ["ctrl", "alt", "", "", "", "", "", "", "", "←", "↓", "↑", "→"],
  ];
  const cells = [];
  rows.forEach((row, y) =>
    row.forEach((label, x) => {
      const i = cells.length;
      ink.fillText(label, (i % 16) * 64 + 7, Math.floor(i / 16) * 64 + 27);
      cells.push({ x, y, i });
    }),
  );
  const keyTexture = new CanvasTexture(atlas);
  keyTexture.colorSpace = SRGBColorSpace;
  textures.push(keyTexture);
  const keyMaterial = mat("white", 0.58);
  keyMaterial.map = keyTexture;
  keyMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = "attribute vec2 keyCell;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <uv_vertex>",
      "#include <uv_vertex>\n vMapUv=(vMapUv+keyCell)/vec2(16.,8.);",
    );
  };
  const keys = new InstancedMesh(
    new RoundedBoxGeometry(0.0165, 0.009, 0.016, 2, 0.0018),
    keyMaterial,
    cells.length,
  );
  const offsets = new Float32Array(cells.length * 2),
    matrix = new Matrix4();
  cells.forEach(({ x, y, i }) => {
    offsets[i * 2] = i % 16;
    offsets[i * 2 + 1] = 7 - Math.floor(i / 16);
    matrix.makeTranslation(
      0.17 + x * 0.019 + (y % 2) * 0.005,
      0.795,
      0.105 + y * 0.019,
    );
    keys.setMatrixAt(i, matrix);
  });
  keys.geometry.setAttribute(
    "keyCell",
    new InstancedBufferAttribute(offsets, 2),
  );
  keys.castShadow = true;
  keys.receiveShadow = true;
  scene.add(keys);
  box([0.44, 0.018, 0.145], [0.36, 0.78, 0.144], plastic, 0.005);
  box([0.114, 0.009, 0.016], [0.29, 0.798, 0.181], trim, 0.002);
  // Navigation cluster and keypad, positioned beside the main typing field.
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 3; x++)
      box(
        [0.016, 0.009, 0.016],
        [0.478 + x * 0.019, 0.795, 0.11 + y * 0.019],
        trim,
        0.002,
      );
  const mouse = mesh(
    new SphereGeometry(1, 32, 24),
    plastic,
    [0.67, 0.787, 0.14],
  );
  mouse.scale.set(0.03, 0.019, 0.052);
  box([0.002, 0.002, 0.034], [0.67, 0.806, 0.115], black, 0.0005);
  cylinder(0.003, 0.003, 0.011, [0.67, 0.807, 0.113], trim, [
    0,
    0,
    Math.PI / 2,
  ]);
  const cable = (points) =>
    mesh(
      new TubeGeometry(
        new CatmullRomCurve3(points.map((p) => new Vector3(...p))),
        48,
        0.002,
        6,
        false,
      ),
      black,
      [0, 0, 0],
    );
  cable([
    [0.67, 0.775, 0.09],
    [0.69, 0.773, -0.04],
    [0.6, 0.772, -0.2],
    [0.5, 0.772, -0.49],
    [0.55, 0.2, -0.52],
  ]);
  cable([
    [0.35, 0.781, 0.07],
    [0.25, 0.774, -0.08],
    [0.27, 0.772, -0.32],
    [0.17, 0.68, -0.52],
  ]);
  box([0.18, 0.38, 0.38], [0.71, 0.205, -0.22], plastic, 0.006);
  for (const x of [0.64, 0.78])
    for (const z of [-0.36, -0.08])
      cylinder(0.009, 0.011, 0.025, [x, 0.0025, z], black);
  for (let i = 0; i < 3; i++)
    box([0.14, 0.022, 0.003], [0.71, 0.31 - i * 0.035, -0.028], black, 0.001);
  for (let i = 0; i < 8; i++)
    box([0.105, 0.002, 0.002], [0.71, 0.09 + i * 0.009, -0.027], black, 0);
  mesh(new SphereGeometry(0.002, 8, 8), greenGlow, [0.76, 0.205, -0.027]);

  box([0.15, 0.012, 0.21], [-0.66, 0.781, 0.02], black, 0.002, [0, 0.12, 0]);
  box([0.143, 0.009, 0.2], [-0.66, 0.786, 0.02], paper, 0.001, [0, 0.12, 0]);
  box([0.148, 0.003, 0.207], [-0.66, 0.792, 0.02], trim, 0.001, [0, 0.12, 0]);
  cylinder(0.003, 0.003, 0.14, [-0.55, 0.777, 0.065], metal, [
    0,
    0,
    Math.PI / 2 - 0.2,
  ]);
  const mugProfile = [
    [0, 0],
    [0.03, 0],
    [0.038, 0.008],
    [0.04, 0.09],
    [0.039, 0.095],
    [0.034, 0.095],
    [0.032, 0.009],
    [0, 0.009],
  ].map(([x, y]) => new Vector2(x, y));
  mesh(new LatheGeometry(mugProfile, 48), ceramic, [-0.59, 0.771, -0.27]);
  cylinder(0.034, 0.034, 0.002, [-0.59, 0.852, -0.27], coffee);
  mesh(
    new TorusGeometry(0.026, 0.006, 12, 28),
    ceramic,
    [-0.632, 0.821, -0.27],
    [0, Math.PI / 2, 0],
  );
  cylinder(0.085, 0.09, 0.016, [-0.72, 0.779, -0.32], metal);
  cylinder(0.007, 0.007, 0.31, [-0.72, 0.94, -0.32], metal);
  const shade = mesh(
    new CylinderGeometry(0.055, 0.105, 0.11, 48, 1, true),
    metal,
    [-0.72, 1.16, -0.32],
  );
  shade.material.side = 2;
  cylinder(0.088, 0.088, 0.003, [-0.72, 1.108, -0.32], paper);
  const bulb = mesh(
    new SphereGeometry(0.019, 20, 16),
    amberGlow,
    [-0.72, 1.103, -0.32],
  );
  bulb.castShadow = false;

  // Full-size chair: separate cushion, curved back, gas lift and rolling base.
  box([0.48, 0.075, 0.45], [-0.43, 0.423, 0.64], leather, 0.025);
  box([0.46, 0.32, 0.055], [-0.43, 0.66, 0.86], leather, 0.028, [-0.15, 0, 0]);
  for (const x of [-0.63, -0.23])
    box([0.018, 0.25, 0.018], [x, 0.49, 0.82], metal, 0.003);
  cylinder(0.021, 0.026, 0.32, [-0.43, 0.22, 0.64], metal);
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    box(
      [0.29, 0.025, 0.028],
      [-0.43 + Math.cos(a) * 0.13, 0.07, 0.64 + Math.sin(a) * 0.13],
      metal,
      0.005,
      [0, -a, 0],
    );
    cylinder(
      0.026,
      0.026,
      0.035,
      [-0.43 + Math.cos(a) * 0.27, 0.034, 0.64 + Math.sin(a) * 0.27],
      black,
      [0, 0, Math.PI / 2],
    );
  }
  return {
    moon,
    lampLight,
    ctx,
    screenTexture,
    screenMaterial,
    crtUniform,
    display,
    screenWidth,
    screenHeight,
  };
}
