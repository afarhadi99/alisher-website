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
        dollyActive = false, dollyStartMs = 0, dollyDurationMs = 2200,
        dollyFrom = new THREE.Vector3(), dollyLookAtStart = new THREE.Vector3(),
        pointer = new THREE.Vector2(0, 0), // normalized [-1, 1] in viewport space
        windowMoveHandler = null,
        cursorFollow = false;
    const clock = new THREE.Clock();
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
    // Smoothly blend gaze target: 1 = cursor target, 0 = camera target
    let lookBlend = 1;
// Hoisted state and animation helpers (prevent ReferenceError in off-screen handlers)
function setState(next) {
  console.log(`State change: ${state} -> ${next}`);
  state = next;
}

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
function startZoomTween(toDist, durationMs = 1400, adjustBounds = null) {
  if (!camera || !controls) return;

  // If the intro dolly is still active, defer starting the tween to avoid fighting animations
  if (dollyActive) {
    pendingZoomTarget = toDist;
    pendingZoomBounds = adjustBounds || null;
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

      // Camera - Better angle to see animation
      camera = new THREE.PerspectiveCamera(30, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.set(0, 0.5, 2.5);
      camera.lookAt(0, 0.5, 0);

      // Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      renderer.xr.enabled = true;


      // High fidelity renderer settings
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; // [Renderer.toneMapping](three.js-master/docs/api/en/renderers/WebGLRenderer.html:318)
      renderer.toneMappingExposure = 1.05;
      renderer.physicallyCorrectLights = true;

      // Skip explicit color space setting per request (defaults used)

      currentMount.appendChild(renderer.domElement);

      // AR Button
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);

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
  // Stop any off-screen cycle and return to idle with smooth crossfade
  if (state !== 'idle' && actions['idle']) {
    setState('idle');
    crossfadeTo('idle', crossfadeSec);
  }
  pendingOffscreenCycle = false;
  // Smoothly zoom back in to the dolly-in distance (near) after pointer returns (eased like dolly)
  if (cameraDistBase > 0) {
    startZoomTween(cameraDistBase, dollyDurationMs, { min: nearDistance * 0.9, max: nearDistance * 1.6 });
  }
};
pointerWindowLeaveHandler = () => {
  isPointerInWindow = false;
  console.log('Pointer left window. Scheduling showcase cycle.');
  // Wait 2 seconds, then start cycling showcase animations
  if (showcaseTimeoutId) clearTimeout(showcaseTimeoutId);
  showcaseTimeoutId = setTimeout(() => {
    if (!isPointerInWindow && isPageVisible) {
      console.log('Starting showcase cycle.');
      // Zoom back out to the original framed distance for showcase (eased like dolly)
      if (farDistance > 0) {
        startZoomTween(farDistance, dollyDurationMs, { min: farDistance * 0.9, max: farDistance * 1.8 });
      }
      setState('showcase');
      advanceShowcase();
    }
  }, 2000);
};
document.addEventListener('mouseenter', pointerWindowEnterHandler);
document.addEventListener('mouseleave', pointerWindowLeaveHandler);

// Page/tab visibility and window focus, used to gate tracking toward camera
isPageVisible = !document.hidden;
visibilityHandler = () => { isPageVisible = !document.hidden; };
document.addEventListener('visibilitychange', visibilityHandler);
blurHandler = () => { isPageVisible = false; };
focusHandler = () => { isPageVisible = true; };
window.addEventListener('blur', blurHandler);
window.addEventListener('focus', focusHandler);

      // Cap DPR after device check to balance fidelity and performance
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2)); // [WebGLRenderer.setPixelRatio()](three.js-master/docs/api/en/renderers/WebGLRenderer.html:586)

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
      directionalLight.shadow.mapSize.set(1024, 1024);
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

      // Post-processing composer for cinematic look
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

      // Final color/tone mapping output
      composer.addPass(new OutputPass());

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

            controls.target.copy(headWorld);
            camera.position.set(headWorld.x, headWorld.y + size.y * 0.02, headWorld.z + farDistance);
            camera.lookAt(headWorld);

            controls.minDistance = farDistance * 0.9;
            controls.maxDistance = farDistance * 1.8; // More zoom-out range
            controls.enablePan = false;
          } else {
            // Fallback without a head bone: aim above center toward head region
            controls.target.set(center.x, center.y + size.y * 0.7, center.z);
            const farVisible = 1.1, nearVisible = 0.58;
            farDistance = Math.max((size.y * farVisible / 2) / Math.tan(fov / 2), 1.0);
            nearDistance = Math.max((size.y * nearVisible / 2) / Math.tan(fov / 2), 0.6);

            camera.position.set(center.x, controls.target.y, center.z + farDistance);
            camera.lookAt(controls.target);

            controls.minDistance = farDistance * 0.9;
            controls.maxDistance = farDistance * 1.8; // More zoom-out range
            controls.enablePan = false;
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



        
        function returnToIdle() {
          setState('idle');
          if (actions['idle']) crossfadeTo('idle', crossfadeSec);
        }

        // Load required clips and start sequence
        (async () => {
          await loadFBXClip('idle', '/idle.fbx', { loopMode: THREE.LoopRepeat, repetitions: Infinity, clamp: false });
          await loadFBXClip('wave', '/wave.fbx', { loopMode: THREE.LoopRepeat, repetitions: 2, clamp: true });

          // Load showcases in background
          showcaseKeys.forEach(k => {
            loadFBXClip(k, `/${k}.fbx`, { loopMode: THREE.LoopOnce, repetitions: 1, clamp: true });
          });

          // Start with wave
          setState('intro_wave');
          crossfadeTo('wave', 0.1);

          // Single handler for both wave-end and showcase-end
          mixerFinishedHandler = (e) => {
            if (!e || !e.action) return;
            
            // Wave completed: dolly-in, then idle (off-screen cycling is pointer-gated)
            if (state === 'intro_wave' && actions['wave'] && e.action === actions['wave']) {
              returnToIdle();

              if (!dollyActive) {
                const headWorldNow = new THREE.Vector3();
                if (headBone) headBone.getWorldPosition(headWorldNow); else headWorldNow.copy(controls.target);
                dollyFrom.copy(camera.position);
                dollyLookAtStart.copy(headWorldNow);
                dollyActive = true;
                dollyStartMs = performance.now();
                controls.enabled = false;
              }
            } else if (state === 'showcase') {
              // Continue cycling only when pointer is off-screen and page visible
              if (!isPointerInWindow && isPageVisible) {
                console.log('Advancing showcase.');
                advanceShowcase();
              } else {
                console.log('Returning to idle from showcase.');
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

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    const animate = () => {
      requestAnimationFrame(animate);

      // Use THREE.Clock for accurate delta time, which is crucial for animations
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
        if (armConstraint) armConstraint.update(delta);
      }

      // Update DOF focus to the head if available and keep head position handy
      let headWorld = null;
      if (bokehPass && headBone) {
        headWorld = new THREE.Vector3();
        headBone.getWorldPosition(headWorld);
        const focus = camera.position.distanceTo(headWorld);
        if (bokehPass.materialBokeh && bokehPass.materialBokeh.uniforms && bokehPass.materialBokeh.uniforms.focus) {
          bokehPass.materialBokeh.uniforms.focus.value = focus;
        }
      }


      // Smooth camera dolly-in after the wave loops
      if (dollyActive && headWorld) {
        const elapsed = performance.now() - dollyStartMs;
        const progress = Math.min(1, elapsed / dollyDurationMs);
        
        const k = easeInOutCubic(progress);

        const startDistance = dollyFrom.distanceTo(dollyLookAtStart);
        const endDistance = nearDistance > 0 ? nearDistance : startDistance * 0.8;
        const currentDistance = THREE.MathUtils.lerp(startDistance, endDistance, k);

        const dir = dollyFrom.clone().sub(dollyLookAtStart).normalize();
        camera.position.copy(dollyLookAtStart).add(dir.multiplyScalar(currentDistance));
        camera.lookAt(headWorld);

        // Smoothly update controls target during dolly
        controls.target.lerp(headWorld, k * 0.3);

        if (progress >= 1) {
          dollyActive = false;
          // --- FIX: Set min/max distance BEFORE setting camera position ---
          controls.minDistance = nearDistance * 0.9;
          controls.maxDistance = nearDistance * 1.6; // Allow further zoom-out post-dolly

          // Set final camera position and controls target
          const finalDir = dollyFrom.clone().sub(dollyLookAtStart).normalize();
          const finalDistance = nearDistance > 0 ? nearDistance : dollyFrom.distanceTo(dollyLookAtStart) * 0.8;
          const finalPosition = dollyLookAtStart.clone().add(finalDir.multiplyScalar(finalDistance));
          camera.position.copy(finalPosition);
          controls.target.copy(headWorld);

          // Clamp camera position to allowed range (OrbitControls will do this on update)
          controls.update();

          // Save the new state as the controls' baseline to prevent snapping
          if (typeof controls.saveState === 'function') {
            controls.saveState();
          }

          // Now re-enable controls
          controls.enabled = true;

          // Initialize camera auto-zoom baselines after dolly completes
          cameraDistBase = nearDistance;
          cameraDistOut = nearDistance * 1.18;
          cameraDistCurrent = camera.position.distanceTo(controls.target);
          cameraDistTarget = cameraDistCurrent;

          // If a zoom tween was requested while dolly was active, start it now for smoothness
          if (pendingZoomTarget !== null) {
            startZoomTween(pendingZoomTarget, dollyDurationMs, pendingZoomBounds);
            pendingZoomTarget = null;
            pendingZoomBounds = null;
          }
        }
      }


      // Smooth camera zoom tween (matches intro dolly easing)
      if (!dollyActive && zoomTweenActive) {
        const elapsed = performance.now() - zoomStartMs;
        const progress = Math.min(1, elapsed / zoomDurationMs);
        const k = easeInOutCubic(progress);
        const dist = THREE.MathUtils.lerp(zoomFromDist, zoomToDist, k);
        const dirToCamTween = camera.position.clone().sub(controls.target).normalize();
        camera.position.copy(controls.target).add(dirToCamTween.multiplyScalar(dist));
        cameraDistCurrent = dist;
        cameraDistTarget = dist;
        if (progress >= 1) {
          zoomTweenActive = false;
          // Apply pending bounds only after tween completes to avoid snaps
          if (pendingZoomBounds && typeof pendingZoomBounds === 'object') {
            const { min, max } = pendingZoomBounds;
            if (typeof min === 'number') controls.minDistance = min;
            if (typeof max === 'number') controls.maxDistance = max;
            pendingZoomBounds = null;
          }
        }
      }

      // Tracking gates (idle only):
      // Use a smoothed blend between cursor target (1) and camera target (0)
      if (state === 'idle') {
        const anchor = headWorld ? headWorld : controls.target;
        const cursorPt = computeCursorTarget(anchor);
        const cameraPt = camera.position;

        const targetLook = (isPointerInWindow && isPageVisible) ? 1 : 0;
        // Smoothly approach the target blend each frame (higher lambda = faster)
        lookBlend = THREE.MathUtils.damp(lookBlend, targetLook, 6, delta);

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
  cameraDistCurrent = THREE.MathUtils.damp(cameraDistCurrent, cameraDistTarget, 6, delta);
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

        if (!dollyActive) controls.update();
        renderer.render(scene, camera); // Use direct render in XR
      } else {
        if (!dollyActive) controls.update();
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
      <div className="text-center py-2 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Alisher Farhadi
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Developer, Educator, Entrepreneur
        </p>
      </div>

      {/* Canvas Section - 3D Model */}
      <div className="flex-1 relative min-h-0">
        <div ref={mountRef} className="w-full h-full" />
      </div>

      {/* Footer Section - Social Media Icons */}
      <div className="py-2 border-t border-border">
        <div className="flex justify-center space-x-4">
          <a
            href="https://youtube.com/@your-channel"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 group"
            aria-label="YouTube Channel"
          >
            <Youtube className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          </a>
          <a
            href="https://x.com/your-handle"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 group"
            aria-label="X (Twitter) Profile"
          >
            <Twitter className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          </a>
          <a
            href="https://linkedin.com/in/your-profile"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 group"
            aria-label="LinkedIn Profile"
          >
            <Linkedin className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          </a>
          <a
            href="https://github.com/your-username"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200 group"
            aria-label="GitHub Profile"
          >
            <Github className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Profile;

