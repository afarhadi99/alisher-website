import {
  Color,
  CubeCamera,
  DepthTexture,
  HalfFloatType,
  Matrix4,
  PlaneGeometry,
  PMREMGenerator,
  Vector2,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLRenderTarget,
} from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";

// Depth-aware single scattering: integrate lit mist only between the camera and
// the visible surface. Window slats and the lamp shade shape the light volumes.
const mistShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    inverseProjection: { value: new Matrix4() },
    cameraWorld: { value: new Matrix4() },
    cameraPositionWorld: { value: new Vector3() },
    blue: { value: new Color() },
    amber: { value: new Color() },
    green: { value: new Color() },
    time: { value: 0 },
    strength: { value: 1 },
    focusDistance: { value: 5 },
    resolution: { value: new Vector2(1, 1) },
    steps: { value: 36 },
  },
  vertexShader: `varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse, tDepth;
    uniform mat4 inverseProjection, cameraWorld;
    uniform vec3 cameraPositionWorld, blue, amber, green;
    uniform float time, strength, steps, focusDistance;
    uniform vec2 resolution;
    float hash(vec3 p) { p = fract(p * .1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
    float noise(vec3 p) {
      vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
        mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
    }
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      if (strength < .001) { gl_FragColor = base; return; }
      float depth = texture2D(tDepth, vUv).x;
      vec4 view = inverseProjection * vec4(vUv*2.0-1.0, depth*2.0-1.0, 1.0);
      view /= view.w;
      // A restrained lens falloff separates the sleeper from the far wall.
      float coc = clamp(abs(-view.z-focusDistance)/(focusDistance*.6),0.0,2.5)*strength;
      vec2 radius = vec2(1.5)*coc/resolution;
      base = base*.4;
      base += texture2D(tDiffuse,vUv+radius*vec2(1,0))*.075;
      base += texture2D(tDiffuse,vUv+radius*vec2(-1,0))*.075;
      base += texture2D(tDiffuse,vUv+radius*vec2(0,1))*.075;
      base += texture2D(tDiffuse,vUv+radius*vec2(0,-1))*.075;
      base += texture2D(tDiffuse,vUv+radius*vec2(.7,.7))*.075;
      base += texture2D(tDiffuse,vUv+radius*vec2(-.7,.7))*.075;
      base += texture2D(tDiffuse,vUv+radius*vec2(.7,-.7))*.075;
      base += texture2D(tDiffuse,vUv+radius*vec2(-.7,-.7))*.075;
      vec3 end = (cameraWorld * view).xyz;
      vec3 direction = normalize(end-cameraPositionWorld);
      float distanceToSurface = min(length(end-cameraPositionWorld), 15.0);
      float stride = distanceToSurface / steps;
      float jitter = .5;
      vec3 scattering = vec3(0.0); float transmission = 1.0;
      for (int i=0; i<40; i++) {
        if (float(i) >= steps) break;
        vec3 p = cameraPositionWorld + direction * ((float(i)+jitter)*stride);
        float n = noise(p*1.4+vec3(time*.018,0,time*.012));
        float density = (.014 + .018*n) * strength;
        float travel = p.z+1.54;
        float wx = p.x-travel*.28, wy = p.y+travel*.45;
        float bounds = smoothstep(-1.89,-1.82,wx)*(1.0-smoothstep(-.88,-.81,wx));
        bounds *= smoothstep(.8,.86,wy)*(1.0-smoothstep(2.13,2.2,wy))*step(0.0,travel);
        // Analytically average each blind band over the ray segment. This
        // prevents undersampling from turning phone fog into stippled stripes.
        float bandWidth = abs((direction.y+direction.z*.45)*stride*44.25);
        float bandFilter = bandWidth > .001 ? sin(bandWidth)/bandWidth : 1.0;
        float slats = .5+.5*sin((wy-.84)*88.5)*bandFilter;
        float windowLight = bounds*slats*exp(-travel*.12);
        float belowLamp = 1.105-p.y;
        float radius = .09 + max(belowLamp,0.0)*.6;
        float lampCone = (1.0-smoothstep(radius*.65,radius,length(p.xz-vec2(-.72,-.32))))*step(0.0,belowLamp);
        lampCone *= exp(-max(belowLamp,0.0)*1.0);
        float screenGlow = exp(-length((p-vec3(.34,1.03,0))*vec3(1.3,1.2,1.0))*6.0);
        float forward = .6+.4*pow(max(dot(direction,normalize(vec3(.32,-.38,1.0))),0.0),4.0);
        vec3 light = blue*windowLight*1.8*forward + amber*lampCone*2.0 + green*screenGlow*.45;
        scattering += transmission * light * density * stride;
        transmission *= exp(-density*stride*.35);
      }
      gl_FragColor = vec4(base.rgb * transmission + scattering, base.a);
    }`,
};

export function createWorkstationEffects(
  renderer,
  scene,
  camera,
  colour,
  lowPower,
) {
  // Capture the actual room once for roughness-filtered PBR reflections.
  const cube = new WebGLCubeRenderTarget(lowPower ? 128 : 256, {
    type: HalfFloatType,
  });
  const probe = new CubeCamera(0.05, 25, cube);
  probe.position.set(0.1, 1.1, 0.4);
  probe.update(renderer, scene);
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromCubemap(cube.texture);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();
  cube.dispose();

  // Rough planar reflections blend with the floor, rather than making it a mirror.
  const reflectionShader = {
    ...Reflector.ReflectorShader,
    fragmentShader: Reflector.ReflectorShader.fragmentShader
      .replace(
        "vec4 base = texture2DProj( tDiffuse, vUv );",
        `
        vec2 uv = vUv.xy/vUv.w;
        vec2 d = vec2(.006, .010);
        vec4 base = texture2D(tDiffuse, uv)*.28;
        base += texture2D(tDiffuse, uv+vec2(d.x,0.0))*.18;
        base += texture2D(tDiffuse, uv-vec2(d.x,0.0))*.18;
        base += texture2D(tDiffuse, uv+vec2(0.0,d.y))*.18;
        base += texture2D(tDiffuse, uv-vec2(0.0,d.y))*.18;`,
      )
      .replace(
        "vec4( blendOverlay( base.rgb, color ), 1.0 )",
        "vec4(base.rgb, .075)",
      ),
  };
  const floor = new Reflector(new PlaneGeometry(14, 12), {
    color: colour("metal"),
    textureWidth: lowPower ? 384 : 768,
    textureHeight: lowPower ? 384 : 768,
    multisample: 0,
    clipBias: 0.003,
    shader: reflectionShader,
  });
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.009;
  floor.material.transparent = true;
  floor.material.depthWrite = false;
  scene.add(floor);
  const reflect = floor.onBeforeRender;
  floor.onBeforeRender = function (...args) {
    if (!scene.overrideMaterial) reflect.apply(this, args);
  };

  const target = new WebGLRenderTarget(1, 1, {
    type: HalfFloatType,
    depthBuffer: true,
    samples: lowPower ? 2 : 4,
  });
  target.depthTexture = new DepthTexture(1, 1);
  const composer = new EffectComposer(renderer, target);
  composer.renderTarget2.depthTexture = new DepthTexture(1, 1);
  const basePass = new RenderPass(scene, camera);
  const contact = new GTAOPass(scene, camera, 1, 1);
  contact.blendIntensity = 0.8;
  contact.updateGtaoMaterial({
    radius: 0.18,
    thickness: 0.065,
    distanceExponent: 2,
    scale: 1,
    samples: lowPower ? 8 : 16,
  });
  contact.updatePdMaterial({ radius: 5, samples: 8 });
  const mist = new ShaderPass(mistShader);
  mist.uniforms.blue.value.set(colour("blue"));
  mist.uniforms.amber.value.set(colour("amber"));
  mist.uniforms.green.value.set(colour("green"));
  mist.uniforms.steps.value = lowPower ? 18 : 36;
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.3, 0.6, 0.8);
  const output = new OutputPass();
  const fxaa = new ShaderPass(FXAAShader);
  for (const pass of [basePass, contact, mist, bloom, output, fxaa])
    composer.addPass(pass);
  let ratio = Math.min(renderer.getPixelRatio(), lowPower ? 1.5 : 2);
  let width = 1,
    height = 1,
    frame = 0,
    slow = 0,
    previousTime = 0,
    disposed = false;
  const canvas = renderer.domElement;
  canvas.dataset.effects =
    "photographic-pbr,gtao,area-light,shadow,reflection,volumetric,dof,msaa,bloom,fxaa";
  canvas.dataset.quality = lowPower ? "mobile" : "desktop";
  renderer.info.autoReset = false;
  function resize(w, h) {
    width = w;
    height = h;
    composer.setPixelRatio(ratio);
    composer.setSize(w, h);
    contact.setSize(Math.ceil(w * ratio * 0.6), Math.ceil(h * ratio * 0.6));
    fxaa.uniforms.resolution.value.set(1 / (w * ratio), 1 / (h * ratio));
    canvas.dataset.effectRatio = String(ratio);
    mist.uniforms.resolution.value.set(w * ratio, h * ratio);
  }
  function render(ms, focusDistance = 5) {
    if (disposed) return;
    const began = performance.now();
    frame++;
    const fade = 1 - Math.min(1, Math.max(0, (ms - 3600) / 1900));
    floor.visible = fade > 0.05;
    // The sleeper only breathes slightly; update shadows at 5 Hz while in view.
    renderer.shadowMap.needsUpdate = ms < 4200 && frame % 6 === 1;
    camera.updateMatrixWorld();
    contact.enabled = fade > 0.001;
    contact.blendIntensity = 0.8 * fade;
    mist.uniforms.tDepth.value = contact.normalRenderTarget.depthTexture;
    mist.uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
    mist.uniforms.cameraWorld.value.copy(camera.matrixWorld);
    mist.uniforms.cameraPositionWorld.value.copy(camera.position);
    mist.uniforms.time.value = ms * 0.001;
    mist.uniforms.focusDistance.value = focusDistance;
    mist.uniforms.strength.value = fade;
    bloom.strength = 0.018 + fade * 0.13;
    renderer.info.reset();
    composer.render(1 / 30);
    const duration = performance.now() - began;
    if (frame % 10 === 0) canvas.dataset.renderMs = duration.toFixed(1);
    const cadence = previousTime ? ms - previousTime : 0;
    previousTime = ms;
    if (frame > 30 && (duration > 42 || cadence > 58)) slow++;
    else slow = Math.max(0, slow - 1);
    if (slow >= 24 && ratio > 1) {
      ratio = Math.max(1, ratio - 0.25);
      mist.uniforms.steps.value = 16;
      canvas.dataset.quality = "adaptive";
      resize(width, height);
      slow = 0;
    }
    canvas.dataset.volumeSteps = String(mist.uniforms.steps.value);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    scene.remove(floor);
    floor.geometry.dispose();
    floor.dispose();
    for (const pass of composer.passes) pass.dispose?.();
    composer.dispose();
    scene.environment = null;
    environment.dispose();
  }
  return { render, resize, dispose };
}
