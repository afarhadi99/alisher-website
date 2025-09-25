import * as THREE from 'three';

/**
 * Gentle runtime arm clearance constraint to reduce hand–thigh clipping.
 * - Applies a small outward yaw at the shoulders (and a bit at forearms)
 * - Non-destructive: runs AFTER mixer.update(delta), multiplying a small delta quaternion
 * - Recomputes every frame from current animated pose (no drift)
 *
 * Usage:
 *   const constraint = createArmClearanceConstraint(loadedModel);
 *   ...
 *   mixer.update(delta);
 *   constraint.update(delta);
 */
export function createArmClearanceConstraint(root, options = {}) {
  const opts = {
    minClearance: 0.07,      // meters: desired lateral XZ clearance between hand and same-side thigh
    maxYawDeg: 8,            // shoulder outward yaw clamp in degrees
    forearmFactor: 0.5,      // forearm yaw fraction of shoulder yaw
    belowHipsBias: 0.03,     // require hand to be this much below hips to trigger
    smoothEase: 1.0,         // easing factor for response (1.0 = linear)
    ...options
  };

  const maxYaw = THREE.MathUtils.degToRad(opts.maxYawDeg);

  // Helper to find a bone by possible names
  function findBone(names) {
    for (const n of names) {
      const bone = root.getObjectByName(n);
      if (bone) return bone;
    }
    return null;
  }

  // Common RPM / Mixamo bone name variants
  const bones = {
    hips: findBone(['Hips', 'mixamorigHips', 'mixamorig:Hips']),
    left: {
      shoulder: findBone(['LeftShoulder', 'mixamorigLeftShoulder', 'mixamorig:LeftShoulder']),
      forearm: findBone(['LeftForeArm', 'mixamorigLeftForeArm', 'mixamorig:LeftForeArm']),
      hand: findBone(['LeftHand', 'mixamorigLeftHand', 'mixamorig:LeftHand']),
      thigh: findBone(['LeftUpLeg', 'mixamorigLeftUpLeg', 'mixamorig:LeftUpLeg'])
    },
    right: {
      shoulder: findBone(['RightShoulder', 'mixamorigRightShoulder', 'mixamorig:RightShoulder']),
      forearm: findBone(['RightForeArm', 'mixamorigRightForeArm', 'mixamorig:RightForeArm']),
      hand: findBone(['RightHand', 'mixamorigRightHand', 'mixamorig:RightHand']),
      thigh: findBone(['RightUpLeg', 'mixamorigRightUpLeg', 'mixamorig:RightUpLeg'])
    }
  };

  // If required bones are missing, noop to be safe
  const haveLeft = bones.left.shoulder && bones.left.hand && bones.left.thigh;
  const haveRight = bones.right.shoulder && bones.right.hand && bones.right.thigh;
  if (!haveLeft && !haveRight) {
    return { update: () => {} };
  }

  // Reusable vectors and quaternions
  const tmpHand = new THREE.Vector3();
  const tmpThigh = new THREE.Vector3();
  const tmpHips = new THREE.Vector3();
  const yAxis = new THREE.Vector3(0, 1, 0);
  const qDelta = new THREE.Quaternion();
  const qForearm = new THREE.Quaternion();

  function outwardYawAmount(clearance) {
    if (clearance >= opts.minClearance) return 0;
    const t = THREE.MathUtils.clamp((opts.minClearance - clearance) / opts.minClearance, 0, 1);
    const eased = opts.smoothEase !== 1.0 ? Math.pow(t, opts.smoothEase) : t;
    return eased * maxYaw;
  }

  function belowHips(handY) {
    if (!bones.hips) return true;
    bones.hips.getWorldPosition(tmpHips);
    return handY < (tmpHips.y - opts.belowHipsBias);
  }

  function applySide(side, sign) {
    const data = bones[side];
    if (!data || !data.shoulder || !data.hand || !data.thigh) return;

    data.hand.getWorldPosition(tmpHand);
    data.thigh.getWorldPosition(tmpThigh);

    // lateral XZ-plane distance between hand and thigh
    const dx = tmpHand.x - tmpThigh.x;
    const dz = tmpHand.z - tmpThigh.z;
    const clearance = Math.hypot(dx, dz);

    if (!belowHips(tmpHand.y)) return;

    const yaw = outwardYawAmount(clearance);
    if (yaw <= 0) return;

    // Shoulder outward yaw (about parent's Y axis), signed per side
    qDelta.setFromAxisAngle(yAxis, sign * yaw);
    // Multiply in parent space; bone.quaternion is local relative to parent
    data.shoulder.quaternion.premultiply(qDelta);

    // Small complementary yaw at forearm
    if (data.forearm) {
      qForearm.setFromAxisAngle(yAxis, sign * yaw * opts.forearmFactor);
      data.forearm.quaternion.premultiply(qForearm);
    }
  }

  function update() {
    // Left outward = +Y, Right outward = -Y (approximation in character-forward rigs)
    if (haveLeft) applySide('left', +1);
    if (haveRight) applySide('right', -1);
  }

  return { update };
}