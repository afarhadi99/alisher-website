"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { ARButton } from 'three/examples/jsm/webxr/ARButton';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';
import { Youtube, Twitter, Linkedin, Github } from 'lucide-react';
import { safeRetargetClip, validateSkeletonMapping, runRetargetingTests } from './enhanced-retargeting';
import { COMPLETE_BONE_MAPPING } from './bone-mapping';
import { createArmClearanceConstraint } from './arm-constraints';

const Profile = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    let scene, camera, renderer, mixer, controls, loadedModel, reticle, hitTestSource = null, hitTestSourceRequested = false, composer, bokehPass, headBone = null, leftEyeBone = null, rightEyeBone = null, neckBone = null, spineBone = null, chestBone = null, leftShoulderBone = null, rightShoulderBone = null, headInitQ = null, leftEyeInitQ = null, rightEyeInitQ = null, neckInitQ = null, spineInitQ = null, chestInitQ = null, leftShoulderInitQ = null, rightShoulderInitQ = null, armConstraint = null, arButtonEl = null, controller,
        // Staged camera + interaction state
        farDistance = 0, nearDistance = 0,
        waveLoopCount = 0,
        dollyActive = false, dollyStartMs = 0, dollyDurationMs = 5200,
        dollyFrom = new THREE.Vector3(), dollyLookAtStart = new THREE.Vector3(),
        pointer = new THREE.Vector2(0, 0), // normalized [-1, 1] in viewport space
        windowMoveHandler = null,
        cursorFollow = false;
    const clock = new THREE.Clock();
    let originalFarDistance = 0;
// Animation state and interaction flags
let actions = {};
let currentAction = null;
let state = 'init'; // 'init' | 'intro_wave' | 'idle' | 'showcase'
let showcaseTimeoutId = null;
// Smoother crossfades by default
let crossfadeSec = 1.2;
// Track if pointer is within the browser window (not just the container)
let isPointerInWindow = true;
let isPageVisible = true;
let waveCompleted = false;
let mixerFinishedHandler = null;
let pointerWindowEnterHandler = null;
let pointerWindowLeaveHandler = null;
let visibilityHandler = null;
let blurHandler = null;
let focusHandler = null;
let pointerOverHandler = null;
let pointerOutHandler = null;
    // Smoothly blend gaze target: 1 = cursor target, 0 = camera target
    let lookBlend = 1;
    // Enable interactions only after intro (wave → dolly) completes
    let interactionsEnabled = false;
    // Canonical zoom targets (captured once):
    // - zoomOutDistanceCanonical: distance at initial framing BEFORE wave/dolly
    // - zoomInDistanceCanonical: distance at the end of the intro dolly AFTER wave
    let zoomOutDistanceCanonical = 0;
    let zoomInDistanceCanonical = 0;

    // Dolly-zoom configuration (true vertigo effect)
    const FOV_MIN = 20; // deg
    const FOV_MAX = 65; // deg
    const FOV_RESTORE_MS = 1800; // smoother return of FOV to baseline after effect
// Pointer-driven zoom duration (no-delay but smooth)
const POINTER_ZOOM_MS = 1800;

// Cancel any in-flight camera transitions to remove perceived delay
function cancelCameraTransitions() {
  if (dollyActive) {
    dollyActive = false;
    if (controls) controls.enabled = true;
  }
  zoomTweenActive = false;
  fovTweenActive = false;
  pendingZoomTarget = null;
  pendingZoomBounds = null;
  pendingZoomOptions = null;
}

    // Post-wave dolly-zoom base (captured at dolly start)
    let dollyBaseFovDeg = 0;
    let dollyBaseDist = 0;
    let dollyK = 0; // K = d0 * tan(fov0/2)

    // Zoom tween dolly-zoom options/state
    let zoomDollyZoomEnabled = false;
    let zoomRestoreFovAfter = true;
    let zoomBaseFovDeg = 0;
    let zoomBaseDist = 0;
    let zoomK = 0;

    // Generic FOV tween (used to restore after dolly-zoom)
    let fovTweenActive = false, fovStartMs = 0, fovDurationMs = 0, fovFromDeg = 0, fovToDeg = 0;

    // When zoom tween is deferred during dolly, also preserve its options
    let pendingZoomOptions = null;
// Hoisted state and animation helpers (prevent ReferenceError in off-screen handlers)
function setState(next) {
  state = next;
}
// Feature flag: disable post-processing to preserve canvas transparency
// Full-screen passes like BokehPass often output opaque pixels, causing a black quad.
const ENABLE_POSTFX = false;

// Shared showcase sequence
const showcaseKeys = ['arm-stretch', 'happy-idle', 'headshake', 'sad-idle', 'spin', 'thankful', 'fishing-cast'];

// Crossfade helper following three.js AnimationAction cross-fade pattern
// See [WebGLRenderer / animation crossfade example](three.js-master/examples/misc_animation_groups.html:1)
function crossfadeTo(key, duration = crossfadeSec) {
  const next = actions[key];
  if (!next) return; // action not ready yet
  if (currentAction === next) return;

  next.enabled = true;
  next.reset();
  next.setEffectiveTimeScale(1);
  next.setEffectiveWeight(1);

  if (currentAction) {
    currentAction.crossFadeTo(next, duration, true);
  } else {
    next.fadeIn(duration);
  }
  next.play();
  currentAction = next;
}

function playShowcaseByIndex(i) {
  const ready = showcaseKeys.filter((k) => actions[k]);
  if (ready.length === 0) return;

  const key = ready[i % ready.length];
  const a = actions[key];
  if (!a) return;

  // Ensure one-shot playback and clamp on finish
  a.setLoop(THREE.LoopOnce, 1);
  a.clampWhenFinished = true;

  // Ensure zoom-out to showcase framing (with dolly-zoom)
  if (zoomOutDistanceCanonical > 0) {
    startZoomTween(
      zoomOutDistanceCanonical,
      POINTER_ZOOM_MS,
      { min: zoomOutDistanceCanonical * 0.9, max: zoomOutDistanceCanonical * 1.8 },
      { dollyZoom: true, restoreFov: true, ease: 'linear' }
    );
  }

  setState('showcase');
  crossfadeTo(key, crossfadeSec);
}

function advanceShowcase() {
  showcaseIndex = (showcaseIndex + 1) % showcaseKeys.length;
  playShowcaseByIndex(showcaseIndex);
}

// Helper to smoothly target a new camera distance with optional OrbitControls bounds
function setCameraDistanceTarget(dist, adjustBounds = null) {
  cameraDistTarget = dist;
  if (camera && controls) {
    // Restart damping from current distance to avoid jumps
    cameraDistCurrent = camera.position.distanceTo(controls.target);
    if (adjustBounds && typeof adjustBounds === 'object') {
      const { min, max } = adjustBounds;
      if (typeof min === 'number') controls.minDistance = min;
      if (typeof max === 'number') controls.maxDistance = max;
    }
  }
}
// Smooth zoom tween (cubic ease like the intro dolly)
function startZoomTween(toDist, durationMs = 1400, adjustBounds = null, options = {}) {
  if (!camera || !controls) return;

  // If the intro dolly is still active, defer starting the tween to avoid fighting animations
  if (dollyActive) {
    pendingZoomTarget = toDist;
    pendingZoomBounds = adjustBounds || null;
    pendingZoomOptions = options || null;
    return;
  }

  const currentDist = camera.position.distanceTo(controls.target);
  const goingOutward = toDist > currentDist;
  const goingInward = toDist < currentDist;

  // Prepare bounds to avoid OrbitControls clamping during tween
  if (adjustBounds && typeof adjustBounds === 'object') {
    const { min, max } = adjustBounds;

    if (goingOutward) {
      // Allow going farther by relaxing maxDistance up-front (safe, no snapping)
      if (typeof max === 'number' && max > (controls?.maxDistance ?? 0)) {
        controls.maxDistance = max;
      }
    } else if (goingInward) {
      // Allow going closer by relaxing minDistance up-front (prevent clamp on inward tween)
      const desiredMin = typeof min === 'number' ? min : toDist * 0.9;
      if (typeof desiredMin === 'number' && desiredMin < (controls?.minDistance ?? Infinity)) {
        controls.minDistance = desiredMin;
      }
    }

    // Apply final target bounds after tween completes
    pendingZoomBounds = adjustBounds;
  } else {
    // No explicit bounds provided; no pre-relax, no post-tighten
    pendingZoomBounds = null;
  }

  zoomTweenActive = true;
  zoomStartMs = performance.now();
  zoomDurationMs = durationMs;
  zoomFromDist = currentDist;
  zoomToDist = toDist;
  /** Select easing for this zoom tween (default to linear for immediate response) */
  zoomEaseMode = (options && options.ease) ? options.ease : 'linear';

  // Dolly-zoom setup (true vertigo)
  zoomDollyZoomEnabled = !!options.dollyZoom && !(renderer?.xr?.isPresenting);
  zoomRestoreFovAfter = options.restoreFov !== false; // default true
  if (zoomDollyZoomEnabled) {
    zoomBaseFovDeg = camera.fov;
    zoomBaseDist = currentDist;
    const baseFovRad = THREE.MathUtils.degToRad(zoomBaseFovDeg);
    zoomK = zoomBaseDist * Math.tan(baseFovRad / 2);
  } else {
    zoomK = 0;
  }

}
    // Off-screen showcase control and camera auto-zoom
    let showcaseIndex = 0;
    let pendingOffscreenCycle = false;

    // Camera auto-zoom state (applies after intro dolly only)
    let cameraDistBase = 0, cameraDistOut = 0, cameraDistCurrent = 0, cameraDistTarget = 0;
let zoomTweenActive = false, zoomStartMs = 0, zoomDurationMs = 0, zoomFromDist = 0, zoomToDist = 0;
const zoomDir = new THREE.Vector3();
let pendingZoomTarget = null;
let pendingZoomBounds = null;
/**
 * Current easing mode for zoom tweens.
 * Default: 'linear' for immediate, constant-speed zooms without perceived start delay.
 * Supported: 'linear' | 'outCubic' | 'inOutSine'
 */
let zoomEaseMode = 'linear';


    // Smooth tracking state with frame-rate independent damping
    const targetYaw = { head: 0, neck: 0, chest: 0, spine: 0, leftShoulder: 0, rightShoulder: 0, leftEye: 0, rightEye: 0 };
    const targetPitch = { head: 0, neck: 0, chest: 0, spine: 0, leftShoulder: 0, rightShoulder: 0, leftEye: 0, rightEye: 0 };
    const currentYaw = { head: 0, neck: 0, chest: 0, spine: 0, leftShoulder: 0, rightShoulder: 0, leftEye: 0, rightEye: 0 };
    const currentPitch = { head: 0, neck: 0, chest: 0, spine: 0, leftShoulder: 0, rightShoulder: 0, leftEye: 0, rightEye: 0 };

    // Working vectors for calculations
    const headWorldPosition = new THREE.Vector3();
    const cursorWorldPoint = new THREE.Vector3();
    const blendedTargetPoint = new THREE.Vector3();
    const cameraToHeadNormal = new THREE.Vector3();
    const rayDirection = new THREE.Vector3();
    const rayStart = new THREE.Vector3();
    const rayEnd = new THREE.Vector3();
    const cursorPlane = new THREE.Plane();
    const cursorLine = new THREE.Line3();
    const parentQuat = new THREE.Quaternion();
    const invParentQuat = new THREE.Quaternion();
    const boneWorldPos = new THREE.Vector3();
    const worldDirection = new THREE.Vector3();
    const localDirection = new THREE.Vector3();
    const targetQuaternion = new THREE.Quaternion();
    const yawQuat = new THREE.Quaternion();
    const pitchQuat = new THREE.Quaternion();
    const axisY = new THREE.Vector3(0, 1, 0);
    const axisX = new THREE.Vector3(1, 0, 0);

        // Damping parameters for smooth motion
        const dampingLambda = 14; // Slightly lower for smoother, more natural motion
        // Per-bone damping for realistic chain-follow
        const dampingByBone = {
          head: 18,
          neck: 15,
          chest: 11,
          spine: 9,
          leftShoulder: 7,
          rightShoulder: 7,
          leftEye: 22,
          rightEye: 22
        };

    const computeCursorTarget = (headPoint) => {
      if (!camera || !headPoint) return headPoint;

      // Create a simple offset from head based on pointer position
      // Fix Y direction - invert it so up cursor = look up
      const lookOffset = new THREE.Vector3(
        pointer.x * 0.3, // Horizontal offset based on cursor X
        -pointer.y * 0.7 - 0.2, // Adjust vertical offset for better centering
        0.5 // Forward offset for natural gaze direction
      );

      // Transform offset to world space relative to camera
      lookOffset.applyQuaternion(camera.quaternion);
      cursorWorldPoint.copy(headPoint).add(lookOffset);

      return cursorWorldPoint;
    };

    const aimBoneTowardWorldPoint = (bone, initQ, yawLimit, pitchLimit, targetPoint, boneKey, delta) => {
      if (!bone || !initQ || !targetPoint) return;

      bone.getWorldPosition(boneWorldPos);
      worldDirection.copy(targetPoint).sub(boneWorldPos);

      if (worldDirection.lengthSq() < 1e-8) return;

      worldDirection.normalize();

      if (bone.parent) {
        bone.parent.getWorldQuaternion(parentQuat);
        invParentQuat.copy(parentQuat).invert();
        localDirection.copy(worldDirection).applyQuaternion(invParentQuat);
      } else {
        localDirection.copy(worldDirection);
      }

      const horiz = Math.hypot(localDirection.x, localDirection.z) || 1e-8;
      const rawYaw = Math.atan2(localDirection.x, localDirection.z);
      const rawPitch = Math.atan2(localDirection.y, horiz);

      // Set target angles with clamping
      targetYaw[boneKey] = THREE.MathUtils.clamp(rawYaw, -yawLimit, yawLimit);
      targetPitch[boneKey] = THREE.MathUtils.clamp(rawPitch, -pitchLimit, pitchLimit);

      // Smooth damp toward target using per-bone response
      const lam = (dampingByBone && dampingByBone[boneKey]) ? dampingByBone[boneKey] : dampingLambda;
      currentYaw[boneKey] = THREE.MathUtils.damp(currentYaw[boneKey], targetYaw[boneKey], lam, delta);
      currentPitch[boneKey] = THREE.MathUtils.damp(currentPitch[boneKey], targetPitch[boneKey], lam, delta);

      // Apply smoothed rotation
      yawQuat.setFromAxisAngle(axisY, currentYaw[boneKey]);
      pitchQuat.setFromAxisAngle(axisX, currentPitch[boneKey]);

      targetQuaternion.copy(initQ).premultiply(yawQuat).premultiply(pitchQuat);
      bone.quaternion.copy(targetQuaternion);
    };

    // Enhanced eye convergence to prevent cross-eyed appearance
    const applyEyeConvergence = (leftEyeBone, rightEyeBone, leftInitQ, rightInitQ, targetPoint, maxYaw, maxPitch, delta) => {
      if (!leftEyeBone || !rightEyeBone || !leftInitQ || !rightInitQ || !targetPoint) return;

      // Get eye positions and head center for better convergence calculation
      const leftEyePos = new THREE.Vector3();
      const rightEyePos = new THREE.Vector3();
      leftEyeBone.getWorldPosition(leftEyePos);
      rightEyeBone.getWorldPosition(rightEyePos);
      
      const eyeCenter = new THREE.Vector3().addVectors(leftEyePos, rightEyePos).multiplyScalar(0.5);
      const distanceToTarget = eyeCenter.distanceTo(targetPoint);
      
      // Reduce eye movement range when target is very close to prevent extreme convergence
      const minSafeDistance = 0.4; // meters
      const convergenceScale = Math.min(1.0, distanceToTarget / minSafeDistance);
      
      // Further reduce eye movement limits to prevent cross-eyed appearance
      const reducedMaxYaw = maxYaw * 0.7 * convergenceScale; // Reduce by 30%
      const reducedMaxPitch = maxPitch * 0.8 * convergenceScale; // Reduce by 20%

      // Apply reduced eye movements
      aimBoneTowardWorldPoint(leftEyeBone, leftInitQ, reducedMaxYaw, reducedMaxPitch, targetPoint, 'leftEye', delta);
      aimBoneTowardWorldPoint(rightEyeBone, rightInitQ, reducedMaxYaw, reducedMaxPitch, targetPoint, 'rightEye', delta);
    };

    const init = () => {
      // Scene
      scene = new THREE.Scene();
      scene.background = null; // Transparent background

      // Enable caching so loaders reuse fetched assets/shaders
      THREE.Cache.enabled = true;

      // Camera - Better angle to see animation
      camera = new THREE.PerspectiveCamera(30, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.set(0, 0.5, 2.5);
      camera.lookAt(0, 0.5, 0);

      // Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      // Do NOT enable XR unless we’re actually in mobile AR; XR framebuffers often clear opaque backgrounds
      renderer.xr.enabled = false;

      // Make canvas fully transparent so it blends with the page background
      renderer.setClearColor(0x000000, 0); // [WebGLRenderer.setClearColor(color, alpha)](three.js-master/docs/api/en/renderers/WebGLRenderer.html:613)
      if (typeof renderer.setClearAlpha === 'function') {
        renderer.setClearAlpha(0); // [WebGLRenderer.clearAlpha](three.js-master/docs/api/en/renderers/WebGLRenderer.html:301)
      }
      renderer.domElement.style.background = 'transparent';
      renderer.domElement.style.backgroundColor = 'transparent';

      // High fidelity renderer settings
      renderer.shadowMap.enabled = true;
      // Smoother, denoised shadows
      renderer.shadowMap.type = THREE.VSMShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; // [Renderer.toneMapping](three.js-master/docs/api/en/renderers/WebGLRenderer.html:318)
      renderer.toneMappingExposure = 1.05;
      renderer.physicallyCorrectLights = true;

      // Skip explicit color space setting per request (defaults used)

      currentMount.appendChild(renderer.domElement);

      // AR Button
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      if (isMobile) {
        renderer.xr.enabled = true; // enable XR only on mobile to avoid desktop opaque clears
      }

      // Desktop pointer tracking for cursor-follow relative to the profile container
      if (!isMobile) {
        windowMoveHandler = (event) => {
          // Get coordinates relative to the profile container, not the entire window
          const rect = currentMount.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          
          // Convert to normalized device coordinates [-1, 1]
          pointer.set(
            (x * 2) - 1,
            -((y * 2) - 1) // Y-flip for screen-to-world coords
          );
        };
        window.addEventListener('mousemove', windowMoveHandler);
      }
// Interaction listeners: window enter/leave and page visibility

pointerWindowEnterHandler = () => {
  isPointerInWindow = true;
  // Gate pointer enter reactions until intro completes
  if (!interactionsEnabled) { return; }

  // Stop any off-screen cycle and return to idle with smooth crossfade
  if (state !== 'idle' && actions['idle']) {
    setState('idle');
    crossfadeTo('idle', crossfadeSec);
  }
  pendingOffscreenCycle = false;

  // Instant reaction: cancel in-flight transitions and zoom to a fixed nearDistance
  cancelCameraTransitions();
  if (nearDistance > 0) {
    const targetNear = (zoomInDistanceCanonical > 0 ? zoomInDistanceCanonical : nearDistance);
    startZoomTween(
      targetNear,
      POINTER_ZOOM_MS,
      { min: targetNear * 0.9, max: targetNear * 1.6 },
      { dollyZoom: true, restoreFov: true, ease: 'linear' }
    );
  }
};
pointerWindowLeaveHandler = () => {
  isPointerInWindow = false;
  // Gate pointer leave reactions until intro completes
  if (!interactionsEnabled) { return; }

  // Cancel any pending timers
  if (showcaseTimeoutId) {
    clearTimeout(showcaseTimeoutId);
    showcaseTimeoutId = null;
  }
  // Instant reaction: cancel in-flight transitions and dolly-zoom out to a fixed farDistance
  if (isPageVisible) {
    cancelCameraTransitions();
    if (originalFarDistance > 0) {
      const targetFar = (zoomOutDistanceCanonical > 0 ? zoomOutDistanceCanonical : originalFarDistance);
      startZoomTween(
        targetFar,
        POINTER_ZOOM_MS,
        { min: targetFar * 0.9, max: targetFar * 1.8 },
        { dollyZoom: true, restoreFov: true, ease: 'linear' }
      );
    }
    setState('showcase');
    advanceShowcase();
  }
};
document.addEventListener('mouseenter', pointerWindowEnterHandler);
document.addEventListener('mouseleave', pointerWindowLeaveHandler);

// Also listen to pointerover/out on window for zero-latency reactions
pointerOverHandler = (e) => { if (e && e.type === 'pointerover') pointerWindowEnterHandler(); };
pointerOutHandler = (e) => { if (!e || e.relatedTarget === null) pointerWindowLeaveHandler(); };
window.addEventListener('pointerover', pointerOverHandler);
window.addEventListener('pointerout', pointerOutHandler);

// Page/tab visibility and window focus, used to gate tracking toward camera
isPageVisible = !document.hidden;
visibilityHandler = () => { isPageVisible = !document.hidden; };
document.addEventListener('visibilitychange', visibilityHandler);
blurHandler = () => { isPageVisible = false; };
focusHandler = () => { isPageVisible = true; };
window.addEventListener('blur', blurHandler);
window.addEventListener('focus', focusHandler);

      // Cap DPR after device check to balance fidelity and performance
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2.25)); // [WebGLRenderer.setPixelRatio()](three.js-master/docs/api/en/renderers/WebGLRenderer.html:586)

      // Mobile AR button inside the container with WebXR hit-test + DOM overlay
      if (isMobile) {
        arButtonEl = ARButton.createButton(renderer, {
          requiredFeatures: ['hit-test', 'dom-overlay'],
          domOverlay: { root: currentMount }
        });
        currentMount.appendChild(arButtonEl);
      }

      // AR Reticle for hit-test placement
      reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.08, 0.1, 32),
        new THREE.MeshBasicMaterial({ color: 0x00ffaa, side: THREE.DoubleSide })
      );
      reticle.rotation.x = -Math.PI / 2;
      reticle.matrixAutoUpdate = false;
      reticle.visible = false;
      scene.add(reticle);

      // Setup XR controller for 'select' placement
      controller = renderer.xr.getController(0);
      controller.addEventListener('select', onSelect);
      scene.add(controller);

      // Manage hit-test source lifecycle
      renderer.xr.addEventListener('sessionstart', () => {
        (async () => {
          try {
            const session = renderer.xr.getSession();
            const viewerSpace = await session.requestReferenceSpace('viewer');
            hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
            hitTestSourceRequested = true;
            session.addEventListener('end', () => {
              hitTestSource = null;
              hitTestSourceRequested = false;
              if (reticle) reticle.visible = false;
            });
          } catch (e) {
            console.warn('WebXR hit-test not available', e);
          }
        })();
      });

      // Controls - Enable zoom to better see animation with smooth damping
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05; // Smoother damping for more fluid motion
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.zoomSpeed = 0.5; // Slower zoom for more control
      controls.minDistance = 2.0;
      controls.maxDistance = 3.0; // Keep initial zoom same as before; extended range applied after framing
      controls.target.set(0, 0.5, 0); // Focus on upper body where wave happens

      // Enhanced lighting for better illumination
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Much brighter ambient
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0); // Much brighter directional
      directionalLight.position.set(5, 5, 5);
      directionalLight.castShadow = true;
      // Higher shadow resolution; mobile lower, desktop higher
      directionalLight.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
      // Reduce acne/self-shadowing
      directionalLight.shadow.bias = -0.00025;
      directionalLight.shadow.normalBias = 0.3;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 20;
      scene.add(directionalLight);

      // Add fill light from the left
      const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
      fillLight.position.set(-3, 3, 2);
      scene.add(fillLight);

      // Add back light for rim lighting
      const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
      backLight.position.set(0, 3, -5);
      scene.add(backLight);

      // Keep background transparent to blend with page; no global fog needed
      scene.fog = null;

      // Post-processing composer for cinematic look (guarded for transparency)
      if (ENABLE_POSTFX) {
        composer = new EffectComposer(renderer); // [EffectComposer](three.js-master/docs/examples/en/postprocessing/EffectComposer.html:62)
        const renderPass = new RenderPass(scene, camera);
        // Ensure transparent background for proper blending
        renderPass.clear = true;
        renderPass.clearAlpha = 0;
        composer.addPass(renderPass);

        // Portrait depth-of-field (focus adjusted per-frame to head)
        bokehPass = new BokehPass(scene, camera, {
          focus: 1.2,
          aperture: 0.00025,
          maxblur: 0.01
        });
        composer.addPass(bokehPass);

        // Do not use OutputPass; make last pass render to screen so alpha is preserved
        if (bokehPass) {
          bokehPass.renderToScreen = true;
        } else {
          renderPass.renderToScreen = true;
        }
      } else {
        // Disable composer entirely to keep the canvas alpha blending with the page
        composer = null;
        bokehPass = null;
      }

      // Load Model and Animation
      const gltfLoader = new GLTFLoader();
      gltfLoader.load('/model.glb', (gltf) => {
        loadedModel = gltf.scene; // Store in higher scope
        // Keep original model origin; camera framing will compose the shot
        scene.add(loadedModel);

        // Identify head/eye bones for DOF and gaze + supporting bones for subtle body follow
        headBone =
          loadedModel.getObjectByName('Head') ||
          loadedModel.getObjectByName('mixamorigHead') ||
          loadedModel.getObjectByName('mixamorig:Head') ||
          loadedModel.getObjectByName('HeadTop') ||
          null;

        leftEyeBone =
          loadedModel.getObjectByName('LeftEye') ||
          loadedModel.getObjectByName('mixamorigLeftEye') ||
          loadedModel.getObjectByName('mixamorig:LeftEye') ||
          null;

        rightEyeBone =
          loadedModel.getObjectByName('RightEye') ||
          loadedModel.getObjectByName('mixamorigRightEye') ||
          loadedModel.getObjectByName('mixamorig:RightEye') ||
          null;

        neckBone =
          loadedModel.getObjectByName('Neck') ||
          loadedModel.getObjectByName('mixamorigNeck') ||
          loadedModel.getObjectByName('mixamorig:Neck') ||
          null;

        chestBone =
          loadedModel.getObjectByName('Chest') ||
          loadedModel.getObjectByName('UpperChest') ||
          loadedModel.getObjectByName('Spine2') ||
          loadedModel.getObjectByName('mixamorigSpine2') ||
          loadedModel.getObjectByName('mixamorig:Spine2') ||
          null;

        spineBone =
          loadedModel.getObjectByName('Spine') ||
          loadedModel.getObjectByName('Spine1') ||
          loadedModel.getObjectByName('mixamorigSpine') ||
          loadedModel.getObjectByName('mixamorig:Spine') ||
          null;

        leftShoulderBone =
          loadedModel.getObjectByName('LeftShoulder') ||
          loadedModel.getObjectByName('mixamorigLeftShoulder') ||
          loadedModel.getObjectByName('mixamorig:LeftShoulder') ||
          null;

        rightShoulderBone =
          loadedModel.getObjectByName('RightShoulder') ||
          loadedModel.getObjectByName('mixamorigRightShoulder') ||
          loadedModel.getObjectByName('mixamorig:RightShoulder') ||
          null;

        // Capture initial orientations to prevent drift when applying gaze
        headInitQ = headBone ? headBone.quaternion.clone() : null;
        leftEyeInitQ = leftEyeBone ? leftEyeBone.quaternion.clone() : null;
        rightEyeInitQ = rightEyeBone ? rightEyeBone.quaternion.clone() : null;
        neckInitQ = neckBone ? neckBone.quaternion.clone() : null;
        chestInitQ = chestBone ? chestBone.quaternion.clone() : null;
        spineInitQ = spineBone ? spineBone.quaternion.clone() : null;
        leftShoulderInitQ = leftShoulderBone ? leftShoulderBone.quaternion.clone() : null;
        rightShoulderInitQ = rightShoulderBone ? rightShoulderBone.quaternion.clone() : null;

        // Auto-frame for top-half portrait (focus on head)
        try {
          const box = new THREE.Box3().setFromObject(loadedModel);
          const size = new THREE.Vector3();
          const center = new THREE.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const fov = THREE.MathUtils.degToRad(camera.fov);

          if (headBone) {
            const headWorld = new THREE.Vector3();
            headBone.getWorldPosition(headWorld);

            // Portrait staging distances (far ~110%, near ~58% of body height)
            const farVisible = 1.1, nearVisible = 0.58;
            farDistance = Math.max((size.y * farVisible / 2) / Math.tan(fov / 2), 1.0);
            nearDistance = Math.max((size.y * nearVisible / 2) / Math.tan(fov / 2), 0.6);
            originalFarDistance = farDistance;
            zoomOutDistanceCanonical = farDistance;

            controls.target.copy(headWorld);
            camera.position.set(headWorld.x, headWorld.y + size.y * 0.02, headWorld.z + farDistance);
            camera.lookAt(headWorld);

            controls.minDistance = farDistance * 0.9;
            controls.maxDistance = farDistance * 1.8; // More zoom-out range
            controls.enablePan = false;

            // Fit directional light shadow camera around the avatar bounds for crisper shadows
            if (directionalLight && directionalLight.shadow && directionalLight.shadow.camera) {
              const shCam = directionalLight.shadow.camera;
              const r = Math.max(size.x, size.y, size.z) * 0.75;
              if (shCam.isOrthographicCamera) {
                shCam.left = -r; shCam.right = r; shCam.top = r; shCam.bottom = -r;
                shCam.near = 0.1; shCam.far = Math.max(10, r * 4);
                shCam.updateProjectionMatrix();
              }
            }
          } else {
            // Fallback without a head bone: aim above center toward head region
            controls.target.set(center.x, center.y + size.y * 0.7, center.z);
            const farVisible = 1.1, nearVisible = 0.58;
            farDistance = Math.max((size.y * farVisible / 2) / Math.tan(fov / 2), 1.0);
            nearDistance = Math.max((size.y * nearVisible / 2) / Math.tan(fov / 2), 0.6);
            originalFarDistance = farDistance;
            zoomOutDistanceCanonical = farDistance;

            camera.position.set(center.x, controls.target.y, center.z + farDistance);
            camera.lookAt(controls.target);

            controls.minDistance = farDistance * 0.9;
            controls.maxDistance = farDistance * 1.8; // More zoom-out range
            controls.enablePan = false;

            // Fit directional light shadow camera around the avatar bounds for crisper shadows
            if (directionalLight && directionalLight.shadow && directionalLight.shadow.camera) {
              const shCam = directionalLight.shadow.camera;
              const r = Math.max(size.x, size.y, size.z) * 0.75;
              if (shCam.isOrthographicCamera) {
                shCam.left = -r; shCam.right = r; shCam.top = r; shCam.bottom = -r;
                shCam.near = 0.1; shCam.far = Math.max(10, r * 4);
                shCam.updateProjectionMatrix();
              }
            }
          }
        } catch (e) {
          // Safe fallback portrait
          camera.position.set(0, 1.5, 1.2);
          controls.target.set(0, 1.65, 0);
        }

        // Rotate model to face camera
        loadedModel.rotation.y = 0;
        
        // Find and setup ALL SkinnedMesh objects for animation
        const skinnedMeshes = [];
        let skeleton = null;
        
        loadedModel.traverse((child) => {
          if (child.isSkinnedMesh) {
            skinnedMeshes.push(child);
            skeleton = child.skeleton; // All meshes should share the same skeleton
            child.frustumCulled = false; // Prevent culling during animation
            child.castShadow = true;

            // Ensure the material is matte, physically-based, and non-shiny
            if (child.material) {
              const oldMaterial = child.material;
              const phys = new THREE.MeshPhysicalMaterial({
                map: oldMaterial.map || null,
                normalMap: oldMaterial.normalMap || null,
                roughnessMap: oldMaterial.roughnessMap || null,
                metalness: 0.0,
                roughness: 0.85,
                envMapIntensity: 0.0
              });
              child.material = phys;

              // Improve texture sharpness
              const maxAniso = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;
              if (phys.map) phys.map.anisotropy = maxAniso;
              if (phys.normalMap) phys.normalMap.anisotropy = maxAniso;
              if (phys.roughnessMap) phys.roughnessMap.anisotropy = maxAniso;
            }

            child.receiveShadow = true;
            // Force skeleton update
            child.skeleton.update();
            
          }
        });
        
        if (skinnedMeshes.length === 0) {
          console.error('No SkinnedMesh found in GLB model - animation will not work');
          return;
        }
        
        // Store references for animation updates
        window.skinnedMeshes = skinnedMeshes;
        window.loadedModel = loadedModel; // Global reference for debugging

        // Build crossfaded multi-animation system
        // Helper: configure an action's loop/clamp/weights
        function configureAction(action, loopMode, repetitions, clamp, timeScale = 1) {
          action.setLoop(loopMode, repetitions === Infinity ? Infinity : repetitions);
          action.clampWhenFinished = !!clamp;
          action.enabled = true;
          action.weight = 1.0;
          action.timeScale = timeScale;
          return action;
        }

        async function loadFBXClip(key, url, opts = {}) {
          return new Promise((resolve) => {
            const fbx = new FBXLoader();
            fbx.load(url, (animFbx) => {
              const animationClip = animFbx.animations?.[0];
              if (!animationClip) {
                console.warn('No animation found in', url);
                resolve(null);
                return;
              }
              const retargetOptions = {
                boneMapping: COMPLETE_BONE_MAPPING,
                debug: false,
                preserveOriginalTracks: false,
                skipUnmappedBones: true,
                stationary: true,
                dropScaleTracks: true
              };
              const retargetedClip = safeRetargetClip(loadedModel, animFbx, animationClip, retargetOptions);
              if (!retargetedClip) {
                console.warn('Retargeting failed for', url);
                resolve(null);
                return;
              }
              if (!mixer) mixer = new THREE.AnimationMixer(loadedModel);
              const action = mixer.clipAction(retargetedClip);
              configureAction(
                action,
                opts.loopMode ?? THREE.LoopOnce,
                opts.repetitions ?? 1,
                opts.clamp ?? true,
                opts.timeScale ?? 1
              );
              actions[key] = action;
              resolve(action);
            }, undefined, (err) => {
              console.error('Failed to load', url, err);
              resolve(null);
            });
          });
        }



        
        function returnToIdle(skipZoom = false) {
          setState('idle');
          if (actions['idle']) crossfadeTo('idle', crossfadeSec);
          // Always go to fixed nearDistance (true set distance), unless explicitly suppressed
          if (!skipZoom && nearDistance > 0) {
            cancelCameraTransitions();
            const targetNearIdle = (zoomInDistanceCanonical > 0 ? zoomInDistanceCanonical : nearDistance);
            startZoomTween(
              targetNearIdle,
              POINTER_ZOOM_MS,
              { min: targetNearIdle * 0.9, max: targetNearIdle * 1.6 },
              { dollyZoom: true, restoreFov: true, ease: 'linear' }
            );
          }
        }

        // Load required clips and start sequence
        (async () => {
          await loadFBXClip('idle', '/idle.fbx', { loopMode: THREE.LoopRepeat, repetitions: Infinity, clamp: false });
          await loadFBXClip('wave', '/wave.fbx', { loopMode: THREE.LoopRepeat, repetitions: 2, clamp: true });

          // Load showcases in background
          showcaseKeys.forEach(k => {
            loadFBXClip(k, `/${k}.fbx`, { loopMode: THREE.LoopOnce, repetitions: 1, clamp: true });
          });

          // Prewarm: hide canvas, pre-render a couple frames so the wave starts without a hitch
          if (renderer && renderer.domElement && renderer.domElement.style) {
            renderer.domElement.style.visibility = 'hidden';
          }
          await prewarmRendererFrames(2);
          if (renderer && renderer.domElement && renderer.domElement.style) {
            renderer.domElement.style.visibility = 'visible';
          }

          // Start with wave (after prewarm)
          setState('intro_wave');
          crossfadeTo('wave', 0.1);

          // Single handler for both wave-end and showcase-end
          mixerFinishedHandler = (e) => {
            if (!e || !e.action) return;
            
            // Wave completed: dolly-in (true dolly-zoom), then idle (off-screen cycling is pointer-gated)
            if (state === 'intro_wave' && actions['wave'] && e.action === actions['wave']) {
              // Skip the idle zoom here to avoid fighting with the upcoming intro dolly-zoom
              returnToIdle(true);

              if (!dollyActive) {
                const headWorldNow = new THREE.Vector3();
                if (headBone) headBone.getWorldPosition(headWorldNow); else headWorldNow.copy(controls.target);
                dollyFrom.copy(camera.position);
                dollyLookAtStart.copy(headWorldNow);

                // Capture dolly-zoom base (FOV and distance at start)
                dollyBaseFovDeg = camera.fov;
                dollyBaseDist = camera.position.distanceTo(headWorldNow);
                const baseFovRad = THREE.MathUtils.degToRad(dollyBaseFovDeg);
                dollyK = dollyBaseDist * Math.tan(baseFovRad / 2);

                dollyActive = true;
                dollyStartMs = performance.now();
                // Begin a smooth gaze transition toward the cursor during the dolly
                lookBlend = 0;
                controls.enabled = false;
              }
            } else if (state === 'showcase') {
              // Continue cycling while pointer is off-screen; loop until cursor returns
              if (!isPointerInWindow) {
                advanceShowcase();
              } else {
                returnToIdle();
              }
            }
          };

          mixer.addEventListener('finished', mixerFinishedHandler);

          // Runtime arm clearance constraint to reduce hand–thigh clipping
          armConstraint = createArmClearanceConstraint(loadedModel);
        })();
      });

      animate();
    };

    // Gaze constraint: gently aim head/eyes toward camera (clamped, no long-term drift)
    const maxYawHead = THREE.MathUtils.degToRad(20);
    const maxPitchHead = THREE.MathUtils.degToRad(20);
    const maxYawEye = THREE.MathUtils.degToRad(12); // Reduced to prevent cross-eyed look
    const maxPitchEye = THREE.MathUtils.degToRad(12); // Reduced to prevent cross-eyed look
    const tmpVec = new THREE.Vector3();
    function aimBoneAtCamera(bone, initQ, yawLimit, pitchLimit, slerpWeight = 0.35) {
      if (!bone || !initQ) return;
      const boneWorld = new THREE.Vector3();
      bone.getWorldPosition(boneWorld);
      tmpVec.copy(camera.position).sub(boneWorld);
      const horiz = Math.hypot(tmpVec.x, tmpVec.z) || 1e-6;
      const yaw = THREE.MathUtils.clamp(Math.atan2(tmpVec.x, tmpVec.z), -yawLimit, yawLimit);
      const pitch = THREE.MathUtils.clamp(Math.atan2(tmpVec.y, horiz), -pitchLimit, pitchLimit);
      const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
      const qTarget = initQ.clone().premultiply(qYaw).premultiply(qPitch);
      bone.quaternion.slerp(qTarget, slerpWeight);
    }

    // Cursor-driven aiming (used after dolly completes on desktop)
    function aimBoneByCursor(bone, initQ, yawLimit, pitchLimit, nx, ny, slerpWeight = 0.35) {
      if (!bone || !initQ) return;
      const yaw = THREE.MathUtils.clamp(nx * yawLimit, -yawLimit, yawLimit);
      const pitch = THREE.MathUtils.clamp(-ny * pitchLimit, -pitchLimit, pitchLimit);
      const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
      const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
      const qTarget = initQ.clone().premultiply(qYaw).premultiply(qPitch);
      bone.quaternion.slerp(qTarget, slerpWeight);
    }

    // Smoother easing for longer, more cinematic camera moves
    function easeInOutSine(t) {
      return -(Math.cos(Math.PI * t) - 1) / 2;
    }
    // Snappy start, smooth end (removes perceived delay on pointer-triggered zooms)
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    // Compute FOV that preserves subject size for a given distance using K = d0 * tan(fov0/2)
    function computeFovFromKAndDistance(K, dist) {
      if (!isFinite(K) || K <= 0) return camera.fov;
      const d = Math.max(1e-6, dist);
      const rad = 2 * Math.atan(K / d);
      const deg = THREE.MathUtils.radToDeg(rad);
      return THREE.MathUtils.clamp(deg, FOV_MIN, FOV_MAX);
    }

    // Tween the camera's FOV back to a baseline value
    function startFovRestore(toDeg, durationMs = FOV_RESTORE_MS) {
      if (!camera) return;
      fovTweenActive = true;
      fovStartMs = performance.now();
      fovDurationMs = durationMs;
      fovFromDeg = camera.fov;
      fovToDeg = THREE.MathUtils.clamp(toDeg, FOV_MIN, FOV_MAX);
    }

    // Prewarm renderer/shaders/textures to eliminate first-frame hitch
    async function prewarmRendererFrames(frames = 2) {
      if (!renderer || !scene || !camera) return;
      try {
        renderer.compile(scene, camera); // [WebGLRenderer.compile()](three.js-master/docs/api/en/renderers/WebGLRenderer.html:1)
      } catch (e) {
        // compile may not cover all materials; still proceed with warm-up renders
      }
      for (let i = 0; i < frames; i++) {
        if (mixer) mixer.update(1 / 60);
        if (composer) {
          composer.render(1 / 60);
        } else {
          renderer.render(scene, camera);
        }
        await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      }
    }

    const animate = () => {
      requestAnimationFrame(animate);

      // Use THREE.Clock for accurate delta time, which is crucial for animations
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
        if (armConstraint) armConstraint.update(delta);
      }

      // Update DOF focus (if enabled) and always compute head position for dolly/zoom logic
      let headWorld = null;
      if (headBone) {
        headWorld = new THREE.Vector3();
        headBone.getWorldPosition(headWorld);
        // If Bokeh is enabled, update its focus target; otherwise skip
        if (bokehPass) {
          const focus = camera.position.distanceTo(headWorld);
          if (bokehPass.materialBokeh && bokehPass.materialBokeh.uniforms && bokehPass.materialBokeh.uniforms.focus) {
            bokehPass.materialBokeh.uniforms.focus.value = focus;
          }
        }
      }


      // Smooth camera dolly-in after the wave loops (with true dolly-zoom)
      if (dollyActive) {
        const elapsed = performance.now() - dollyStartMs;
        const progress = Math.min(1, elapsed / dollyDurationMs);
        const k = easeInOutSine(progress);

        // Anchor to the head if available, otherwise use current controls target
        const anchor = (headWorld ? headWorld : controls.target.clone());

        const startDistance = dollyFrom.distanceTo(dollyLookAtStart);
        const endDistance = nearDistance > 0 ? nearDistance : startDistance * 0.8;
        const currentDistance = THREE.MathUtils.lerp(startDistance, endDistance, k);

        const dir = dollyFrom.clone().sub(dollyLookAtStart).normalize();
        camera.position.copy(dollyLookAtStart).add(dir.multiplyScalar(currentDistance));
        camera.lookAt(anchor);

        // Apply FOV compensation unless XR session is active
        if (!(renderer.xr.isPresenting)) {
          const fovDeg = computeFovFromKAndDistance(dollyK, currentDistance);
          if (Math.abs(camera.fov - fovDeg) > 1e-3) {
            camera.fov = fovDeg;
            camera.updateProjectionMatrix(); // [PerspectiveCamera.updateProjectionMatrix()](three.js-master/docs/api/en/cameras/PerspectiveCamera.html:1)
          }
        }

        // Smoothly update controls target during dolly
        controls.target.lerp(anchor, k * 0.3);

        if (progress >= 1) {
          dollyActive = false;
          // Set min/max distance BEFORE setting final camera position
          controls.minDistance = nearDistance * 0.9;
          controls.maxDistance = nearDistance * 1.6;

          // Set final camera position and controls target
          const finalDir = dollyFrom.clone().sub(dollyLookAtStart).normalize();
          const finalDistance = nearDistance > 0 ? nearDistance : dollyFrom.distanceTo(dollyLookAtStart) * 0.8;
          const finalPosition = dollyLookAtStart.clone().add(finalDir.multiplyScalar(finalDistance));
          camera.position.copy(finalPosition);
          controls.target.copy(anchor);

          // Use the actual dolly-in end distance as the new "near" distance baseline
          nearDistance = finalDistance;
          zoomInDistanceCanonical = finalDistance;

          // Clamp camera position to allowed range and save state
          controls.update();
          if (typeof controls.saveState === 'function') {
            controls.saveState();
          }

          // Re-enable controls
          controls.enabled = true;

          // Initialize camera auto-zoom baselines after dolly completes
          cameraDistBase = nearDistance;
          cameraDistOut = nearDistance * 1.18;
          cameraDistCurrent = camera.position.distanceTo(controls.target);
          cameraDistTarget = cameraDistCurrent;

          // Restore FOV back to baseline after effect (smooth)
          if (!(renderer.xr.isPresenting)) {
            startFovRestore(dollyBaseFovDeg, FOV_RESTORE_MS);
          }

          // If a zoom tween was requested while dolly was active, start it now for smoothness
          if (pendingZoomTarget !== null) {
            startZoomTween(pendingZoomTarget, dollyDurationMs, pendingZoomBounds, pendingZoomOptions || {});
            pendingZoomTarget = null;
            pendingZoomBounds = null;
            pendingZoomOptions = null;
          }

          // Enable all post-intro interactions (cursor tracking, window enter/leave, showcase)
          interactionsEnabled = true;
        }
      }


      // Smooth camera zoom tween (matches intro dolly easing) + optional true dolly-zoom
      if (!dollyActive && zoomTweenActive) {
        const elapsed = performance.now() - zoomStartMs;
        const progress = Math.min(1, elapsed / zoomDurationMs);
        let k;
        if (zoomEaseMode === 'inOutSine') {
          k = easeInOutSine(progress);
        } else if (zoomEaseMode === 'outCubic') {
          k = easeOutCubic(progress);
        } else {
          // Linear easing: remove perceived start delay
          k = progress;
        }
        const dist = THREE.MathUtils.lerp(zoomFromDist, zoomToDist, k);
        const dirToCamTween = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(controls.target).add(dirToCamTween.multiplyScalar(dist));
        cameraDistCurrent = dist;
        cameraDistTarget = dist;

        // Apply FOV compensation during zoom tween when enabled (and not XR)
        if (zoomDollyZoomEnabled && !(renderer.xr.isPresenting)) {
          const fovDeg = computeFovFromKAndDistance(zoomK, dist);
          if (Math.abs(camera.fov - fovDeg) > 1e-3) {
            camera.fov = fovDeg;
            camera.updateProjectionMatrix();
          }
        }

        if (progress >= 1) {
          zoomTweenActive = false;

          // Apply pending bounds only after tween completes to avoid snaps
          if (pendingZoomBounds && typeof pendingZoomBounds === 'object') {
            const { min, max } = pendingZoomBounds;
            if (typeof min === 'number') controls.minDistance = min;
            if (typeof max === 'number') controls.maxDistance = max;
            pendingZoomBounds = null;
          }

          // After dolly-zoom completes, restore FOV if requested
          if (zoomDollyZoomEnabled && zoomRestoreFovAfter && !(renderer.xr.isPresenting)) {
            startFovRestore(zoomBaseFovDeg, FOV_RESTORE_MS);
          }
          zoomDollyZoomEnabled = false;
          zoomK = 0;

        }
      }

      // Smoothly restore FOV if a restore tween is active
      if (fovTweenActive) {
        const elapsedFov = performance.now() - fovStartMs;
        const progressFov = Math.min(1, elapsedFov / Math.max(1, fovDurationMs));
        const kFov = easeInOutSine(progressFov);
        const fovNow = THREE.MathUtils.lerp(fovFromDeg, fovToDeg, kFov);
        if (Math.abs(camera.fov - fovNow) > 1e-3) {
          camera.fov = THREE.MathUtils.clamp(fovNow, FOV_MIN, FOV_MAX);
          camera.updateProjectionMatrix();
        }
        if (progressFov >= 1) {
          fovTweenActive = false;
        }
      }

      // Tracking gates (idle only):
      // Use a smoothed blend between cursor target (1) and camera target (0)
      if (state === 'idle') {
        const anchor = headWorld ? headWorld : controls.target;
        const cursorPt = computeCursorTarget(anchor);
        const cameraPt = camera.position;

        // Eyes follow the cursor only AFTER the wave has finished AND the dolly-in is complete
        const desiredLook = (interactionsEnabled && isPointerInWindow && isPageVisible && !dollyActive) ? 1 : 0;
        // Smoothly approach the target blend each frame (higher lambda = faster)
        lookBlend = THREE.MathUtils.damp(lookBlend, desiredLook, 4, delta);

        // Interpolate world-space target between camera and cursor
        blendedTargetPoint.copy(cameraPt);
        if (cursorPt) blendedTargetPoint.lerp(cursorPt, lookBlend);

        // Distribute subtle motion through the chain with damping toward the blended target
        aimBoneTowardWorldPoint(headBone, headInitQ, maxYawHead, maxPitchHead, blendedTargetPoint, 'head', delta);
// Auto-zoom smoothing (after dolly completes): gently adjust camera distance toward target
if (!dollyActive && !zoomTweenActive && cameraDistTarget > 0) {
  const dirToCam = camera.position.clone().sub(controls.target).normalize();
  const currentDist = camera.position.distanceTo(controls.target);
  if (cameraDistCurrent === 0) cameraDistCurrent = currentDist;
  cameraDistCurrent = THREE.MathUtils.damp(cameraDistCurrent, cameraDistTarget, 4, delta);
  camera.position.copy(controls.target).add(dirToCam.multiplyScalar(cameraDistCurrent));
}

// If pointer left window: wait for gaze to blend to camera before starting off-screen cycle
if (pendingOffscreenCycle && state === 'idle' && isPageVisible && !isPointerInWindow && lookBlend <= 0.08) {
  pendingOffscreenCycle = false;
  showcaseIndex = 0;
  if (typeof playShowcaseByIndex === 'function') {
    playShowcaseByIndex(showcaseIndex); // sequential cycle (no idle between)
  }
}
        aimBoneTowardWorldPoint(neckBone, neckInitQ, maxYawHead * 0.6, maxPitchHead * 0.6, blendedTargetPoint, 'neck', delta);
        aimBoneTowardWorldPoint(chestBone, chestInitQ, maxYawHead * 0.35, maxPitchHead * 0.35, blendedTargetPoint, 'chest', delta);
        aimBoneTowardWorldPoint(spineBone, spineInitQ, maxYawHead * 0.2, maxPitchHead * 0.2, blendedTargetPoint, 'spine', delta);

        const yawShoulder = THREE.MathUtils.degToRad(8), pitchShoulder = THREE.MathUtils.degToRad(6);
        aimBoneTowardWorldPoint(leftShoulderBone, leftShoulderInitQ, yawShoulder, pitchShoulder, blendedTargetPoint, 'leftShoulder', delta);
        aimBoneTowardWorldPoint(rightShoulderBone, rightShoulderInitQ, yawShoulder, pitchShoulder, blendedTargetPoint, 'rightShoulder', delta);

        applyEyeConvergence(leftEyeBone, rightEyeBone, leftEyeInitQ, rightEyeInitQ, blendedTargetPoint, maxYawEye, maxPitchEye, delta);
      }

      if (renderer.xr.isPresenting) {
        if (reticle) {
          const frame = renderer.xr.getFrame();
          if (frame) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            if (hitTestSource) {
              const hitTestResults = frame.getHitTestResults(hitTestSource);
              if (hitTestResults.length) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
              } else {
                reticle.visible = false;
              }
            }
          }
        }

        if (!dollyActive && !zoomTweenActive) controls.update();
        renderer.render(scene, camera); // Use direct render in XR
      } else {
        if (!dollyActive && !zoomTweenActive) controls.update();
        if (composer) {
          composer.render(delta); // [EffectComposer.render()](three.js-master/docs/examples/en/postprocessing/EffectComposer.html:136)
        } else {
          renderer.render(scene, camera);
        }
      }
    };

    function onSelect() {
      if (reticle && reticle.visible) {
        loadedModel.position.setFromMatrixPosition(reticle.matrix);
        loadedModel.visible = true;
      }
    }

    const onWindowResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      if (composer) composer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('resize', onWindowResize);

    init();

    return () => {
      // Window + size
      window.removeEventListener('resize', onWindowResize);

      // Pointer tracking
      if (windowMoveHandler) {
        window.removeEventListener('mousemove', windowMoveHandler);
        windowMoveHandler = null;
      }

      // Window enter/leave listeners
      if (pointerWindowEnterHandler) {
        document.removeEventListener('mouseenter', pointerWindowEnterHandler);
        pointerWindowEnterHandler = null;
      }
      if (pointerWindowLeaveHandler) {
        document.removeEventListener('mouseleave', pointerWindowLeaveHandler);
        pointerWindowLeaveHandler = null;
      }
      if (pointerOverHandler) {
        window.removeEventListener('pointerover', pointerOverHandler);
        pointerOverHandler = null;
      }
      if (pointerOutHandler) {
        window.removeEventListener('pointerout', pointerOutHandler);
        pointerOutHandler = null;
      }

      // Page visibility / focus listeners
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
      }
      if (blurHandler) {
        window.removeEventListener('blur', blurHandler);
        blurHandler = null;
      }
      if (focusHandler) {
        window.removeEventListener('focus', focusHandler);
        focusHandler = null;
      }

      // Animation mixer events
      if (mixer && mixerFinishedHandler) {
        mixer.removeEventListener('finished', mixerFinishedHandler);
        mixerFinishedHandler = null;
      }

      // Showcase timer
      if (showcaseTimeoutId) {
        clearTimeout(showcaseTimeoutId);
        showcaseTimeoutId = null;
      }

      // AR button node
      if (arButtonEl && arButtonEl.parentElement) {
        arButtonEl.parentElement.removeChild(arButtonEl);
      }

      // Renderer DOM
      if (renderer && renderer.domElement && renderer.domElement.parentElement === currentMount) {
        currentMount.removeChild(renderer.domElement);
      }

      // Controls
      if (controls) controls.dispose();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header Section - Name */}
      <div className="text-center py-2 border-b border-border space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Alisher Farhadi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Developer, Educator, Entrepreneur
        </p>
                <div className="flex justify-center space-x-4">
          <a
            href="https://www.youtube.com/channel/UCftW5EHVIF-_xStoVZL-fYg"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 group"
            aria-label="YouTube Channel"
          >
            <Youtube className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          </a>
          <a
            href="https://x.com/AlisherFarhadi"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 group"
            aria-label="X (Twitter) Profile"
          >
            <Twitter className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          </a>
          <a
            href="https://www.linkedin.com/in/alisher-farhadi-540945184/"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 group"
            aria-label="LinkedIn Profile"
          >
            <Linkedin className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          </a>
          <a
            href="https://github.com/afarhadi99"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 group"
            aria-label="GitHub Profile"
          >
            <Github className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          </a>
        </div>
      </div>

      {/* Canvas Section - 3D Model */}
      <div className="flex-1 relative min-h-0">
        {/* Ensure container is transparent so the canvas blends with page */}
        <div
          ref={mountRef}
          className="w-full h-full bg-transparent"
          style={{ background: 'transparent' }}
        />
      </div>


    </div>
  );
};

export default Profile;

