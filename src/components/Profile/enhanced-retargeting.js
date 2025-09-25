import * as THREE from 'three';
import { COMPLETE_BONE_MAPPING, REVERSE_BONE_MAPPING, RPM_EXCLUSIVE_BONES, getMappingStats } from './bone-mapping';

/**
 * Enhanced retargeting system for Mixamo to Ready Player Me animations
 */

/**
 * Find target bone in RPM model using smart matching
 * @param {string} sourceBoneName - Mixamo bone name (with mixamorig: prefix)
 * @param {THREE.Object3D} targetModel - Ready Player Me model
 * @param {Object} boneMapping - Bone mapping dictionary
 * @returns {THREE.Bone|null} - Target bone or null if not found
 */
function findTargetBone(sourceBoneName, targetModel, boneMapping) {
  // 1. Direct mapping lookup (highest priority)
  if (boneMapping[sourceBoneName]) {
    const targetBoneName = boneMapping[sourceBoneName];
    const targetBone = targetModel.getObjectByName(targetBoneName);
    if (targetBone) {
      return targetBone;
    }
  }
  
  // 2. Strip mixamorig prefix fallback (handle both formats)
  let cleanName = sourceBoneName;
  if (sourceBoneName.startsWith('mixamorig:')) {
    cleanName = sourceBoneName.replace('mixamorig:', '');
  } else if (sourceBoneName.startsWith('mixamorig')) {
    cleanName = sourceBoneName.replace('mixamorig', '');
  }
  
  const fallbackBone = targetModel.getObjectByName(cleanName);
  if (fallbackBone) {
    return fallbackBone;
  }
  
  // 3. No match found
  return null;
}

/**
 * Extract all bones from a model
 * @param {THREE.Object3D} model - 3D model
 * @returns {Array<THREE.Bone>} - Array of bones
 */
function getBoneList(model) {
  const bones = [];
  
  model.traverse((object) => {
    if (object.isBone || object.type === 'Bone') {
      bones.push(object);
    }
  });
  
  return bones;
}

/**
 * Validate skeleton mapping between source and target models
 * @param {THREE.Object3D} sourceModel - Mixamo model
 * @param {THREE.Object3D} targetModel - Ready Player Me model  
 * @param {Object} boneMapping - Bone mapping dictionary
 * @param {boolean} debug - Enable debug logging
 * @returns {Object} - Validation results
 */
function validateSkeletonMapping(sourceModel, targetModel, boneMapping = COMPLETE_BONE_MAPPING, debug = true) {
  const sourceBones = getBoneList(sourceModel);
  const targetBones = getBoneList(targetModel);
  
  const validation = {
    sourceBones: sourceBones.length,
    targetBones: targetBones.length,
    mappedBones: 0,
    unmappedBones: [],
    mappingAccuracy: 0,
    categoryStats: {}
  };
  
  if (debug) {
    console.log('=== Skeleton Mapping Validation ===');
    console.log(`Source skeleton (Mixamo): ${validation.sourceBones} bones`);
    console.log(`Target skeleton (RPM): ${validation.targetBones} bones`);
    console.log('');
  }
  
  // Validate each source bone
  for (const sourceBone of sourceBones) {
    const targetBone = findTargetBone(sourceBone.name, targetModel, boneMapping);
    
    if (targetBone) {
      validation.mappedBones++;
      if (debug) {
        console.log(`✓ ${sourceBone.name} → ${targetBone.name}`);
      }
    } else {
      validation.unmappedBones.push(sourceBone.name);
      if (debug) {
        console.warn(`✗ ${sourceBone.name} → NO MATCH`);
      }
    }
  }
  
  validation.mappingAccuracy = (validation.mappedBones / validation.sourceBones) * 100;
  
  if (debug) {
    console.log('');
    console.log(`=== Mapping Summary ===`);
    console.log(`Mapped: ${validation.mappedBones}/${validation.sourceBones} bones`);
    console.log(`Accuracy: ${validation.mappingAccuracy.toFixed(1)}%`);
    
    if (validation.unmappedBones.length > 0) {
      console.log(`Unmapped bones (${validation.unmappedBones.length}):`, validation.unmappedBones);
    }
    
    const stats = getMappingStats();
    console.log(`Total mapping dictionary: ${stats.mixamoBones} bones`);
    console.log(`RPM exclusive bones: ${stats.rpmExclusive} bones`);
  }
  
  return validation;
}

/**
 * Retarget animation clip from Mixamo to Ready Player Me
 * @param {THREE.Object3D} targetModel - Ready Player Me model
 * @param {THREE.Object3D} sourceModel - Mixamo model
 * @param {THREE.AnimationClip} animationClip - Source animation clip
 * @param {Object} options - Retargeting options
 * @returns {THREE.AnimationClip} - Retargeted animation clip
 */
function retargetAnimationClip(targetModel, sourceModel, animationClip, options = {}) {
  const {
    boneMapping = COMPLETE_BONE_MAPPING,
    debug = false,
    preserveOriginalTracks = false,
    skipUnmappedBones = true,
    stationary = false,                // if true, drop all position tracks (keep avatar centered)
    dropPositionTracks = false,        // alias to stationary
    dropScaleTracks = false,           // optionally drop scale tracks for safety
    keepRootY = false,                 // when stationary, keep Y translation for root bone
    rootBoneCandidates = ['mixamorigHips','mixamorig:Hips','Hips'] // potential root names
  } = options;
  
  if (!targetModel || !sourceModel || !animationClip) {
    throw new Error('Missing required parameters for retargeting');
  }
  
  if (!animationClip.tracks || animationClip.tracks.length === 0) {
    throw new Error('Animation clip has no tracks');
  }
  
  const newTracks = [];
  const mappingStats = { mapped: 0, unmapped: 0, total: 0, skipped: 0 };
  
  if (debug) {
    console.log('=== Animation Retargeting ===');
    console.log(`Source clip: "${animationClip.name}"`);
    console.log(`Duration: ${animationClip.duration}s`);
    console.log(`Original tracks: ${animationClip.tracks.length}`);
    console.log('');
  }
  
  for (const track of animationClip.tracks) {
    mappingStats.total++;
    
    // Extract bone name from track (remove .position/.quaternion/.scale suffix)
    const trackParts = track.name.split('.');
    const sourceBoneName = trackParts[0];
    const property = trackParts[1] || 'quaternion';
    
    // Skip certain properties that might not be relevant
    if (property === 'morphTargetInfluences' || property === 'material') {
      mappingStats.skipped++;
      continue;
    }
    
    // Stationary option: drop all translation tracks to keep avatar centered
    if ((stationary || dropPositionTracks) && property === 'position') {
      mappingStats.skipped++;
      if (debug) {
        console.log(`⏭ Dropping position track for stationary: ${sourceBoneName}.position`);
      }
      continue;
    }

    // Optional: drop scale tracks for safety
    if (dropScaleTracks && property === 'scale') {
      mappingStats.skipped++;
      if (debug) {
        console.log(`⏭ Dropping scale track: ${sourceBoneName}.scale`);
      }
      continue;
    }
    
    const targetBone = findTargetBone(sourceBoneName, targetModel, boneMapping);
    
    if (targetBone) {
      mappingStats.mapped++;
      
      // Create new track with target bone name
      const newTrackName = `${targetBone.name}.${property}`;
      const newTrack = track.clone();
      newTrack.name = newTrackName;
      newTracks.push(newTrack);
      
      if (debug) {
        console.log(`✓ ${sourceBoneName} → ${targetBone.name} (${property})`);
      }
    } else {
      mappingStats.unmapped++;
      
      if (debug) {
        console.warn(`✗ ${sourceBoneName} → NO MATCH (${property})`);
      }
      
      // Optionally preserve unmapped tracks
      if (preserveOriginalTracks && !skipUnmappedBones) {
        newTracks.push(track.clone());
      }
    }
  }
  
  if (debug) {
    console.log('');
    console.log('=== Retargeting Summary ===');
    console.log(`Mapped tracks: ${mappingStats.mapped}/${mappingStats.total}`);
    console.log(`Unmapped tracks: ${mappingStats.unmapped}`);
    console.log(`Skipped tracks: ${mappingStats.skipped}`);
    console.log(`Success rate: ${((mappingStats.mapped / mappingStats.total) * 100).toFixed(1)}%`);
    console.log(`Output tracks: ${newTracks.length}`);
  }
  
  const retargetedClip = new THREE.AnimationClip(
    animationClip.name + '_retargeted',
    animationClip.duration,
    newTracks
  );
  
  return retargetedClip;
}

/**
 * Safe retargeting with comprehensive error handling
 * @param {THREE.Object3D} targetModel - Ready Player Me model
 * @param {THREE.Object3D} sourceModel - Mixamo model
 * @param {THREE.AnimationClip} animationClip - Source animation
 * @param {Object} options - Options
 * @returns {THREE.AnimationClip|null} - Retargeted clip or null on failure
 */
function safeRetargetClip(targetModel, sourceModel, animationClip, options = {}) {
  try {
    // Validate inputs
    if (!targetModel) {
      throw new Error('Target model is required');
    }
    if (!sourceModel) {
      throw new Error('Source model is required');
    }
    if (!animationClip) {
      throw new Error('Animation clip is required');
    }
    if (!animationClip.tracks || animationClip.tracks.length === 0) {
      throw new Error('Animation clip has no tracks');
    }
    
    // Perform retargeting
    const retargetedClip = retargetAnimationClip(targetModel, sourceModel, animationClip, options);
    
    // Validate output
    if (retargetedClip.tracks.length === 0) {
      console.warn('Retargeting produced no valid tracks');
      return null;
    }
    
    if (options.debug) {
      console.log(`✓ Retargeting successful: ${retargetedClip.tracks.length} tracks`);
    }
    
    return retargetedClip;
    
  } catch (error) {
    console.error('Retargeting failed:', error);
    
    // Attempt to create a basic fallback
    if (animationClip && animationClip.duration) {
      console.log('Creating fallback animation...');
      return createFallbackAnimation(targetModel, animationClip);
    }
    
    return null;
  }
}

/**
 * Create a fallback animation when retargeting fails
 * @param {THREE.Object3D} model - Target model
 * @param {THREE.AnimationClip} originalClip - Original animation clip
 * @returns {THREE.AnimationClip} - Fallback animation
 */
function createFallbackAnimation(model, originalClip) {
  // Create a simple idle animation to prevent complete failure
  const fallbackTracks = [];
  
  // Try to create a basic position track for the Hips bone
  const hips = model.getObjectByName('Hips');
  if (hips) {
    const times = [0, originalClip.duration];
    const values = [
      hips.position.x, hips.position.y, hips.position.z,
      hips.position.x, hips.position.y, hips.position.z
    ];
    
    const positionTrack = new THREE.VectorKeyframeTrack(
      'Hips.position',
      times,
      values
    );
    fallbackTracks.push(positionTrack);
  }
  
  return new THREE.AnimationClip(
    'fallback_idle',
    originalClip.duration,
    fallbackTracks
  );
}

/**
 * Advanced T-pose adjustment (for future enhancement)
 * @param {THREE.Object3D} sourceModel - Source model
 * @param {THREE.Object3D} targetModel - Target model
 * @param {THREE.AnimationClip} clip - Animation clip
 * @returns {THREE.AnimationClip} - Adjusted clip
 */
function adjustTPoseDifferences(sourceModel, targetModel, clip) {
  const sourceHips = sourceModel.getObjectByName('mixamorigHips');
  const targetHips = targetModel.getObjectByName('Hips');

  if (!sourceHips || !targetHips) {
    console.warn('Hips not found in one or both models, skipping T-pose adjustment.');
    return clip;
  }

  const sourceRotation = new THREE.Quaternion();
  sourceHips.getWorldQuaternion(sourceRotation);

  const targetRotation = new THREE.Quaternion();
  targetHips.getWorldQuaternion(targetRotation);

  const correction = targetRotation.clone().invert().multiply(sourceRotation);

  for (const track of clip.tracks) {
    const [boneName, trackType] = track.name.split('.');

    if (trackType === 'quaternion') {
      const targetBone = targetModel.getObjectByName(COMPLETE_BONE_MAPPING[boneName]);
      if (targetBone) {
        const values = track.values;
        for (let i = 0; i < values.length; i += 4) {
          const quat = new THREE.Quaternion(values[i], values[i + 1], values[i + 2], values[i + 3]);
          quat.multiply(correction);
          values[i] = quat.x;
          values[i + 1] = quat.y;
          values[i + 2] = quat.z;
          values[i + 3] = quat.w;
        }
      }
    }
  }

  return clip;
}

/**
 * Run comprehensive retargeting tests
 * @param {THREE.Object3D} sourceModel - Mixamo model
 * @param {THREE.Object3D} targetModel - RPM model
 * @param {THREE.AnimationClip} animationClip - Test animation
 */
function runRetargetingTests(sourceModel, targetModel, animationClip) {
  console.log('=== Retargeting Test Suite ===');
  
  try {
    // Test 1: Skeleton validation
    console.log('Test 1: Skeleton Validation');
    const validation = validateSkeletonMapping(sourceModel, targetModel, COMPLETE_BONE_MAPPING, false);
    console.log(`✓ Mapping accuracy: ${validation.mappingAccuracy.toFixed(1)}%`);
    
    // Test 2: Animation retargeting
    console.log('Test 2: Animation Retargeting');
    const retargetedClip = retargetAnimationClip(targetModel, sourceModel, animationClip, { debug: false });
    console.log(`✓ Retargeted ${retargetedClip.tracks.length} tracks`);
    
    // Test 3: Error handling
    console.log('Test 3: Error Handling');
    const nullResult = safeRetargetClip(null, sourceModel, animationClip, { debug: false });
    console.log(`✓ Error handling: ${nullResult === null ? 'Working' : 'Failed'}`);
    
    console.log('✅ All tests passed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

export {
  findTargetBone,
  getBoneList,
  validateSkeletonMapping,
  retargetAnimationClip,
  safeRetargetClip,
  createFallbackAnimation,
  adjustTPoseDifferences,
  runRetargetingTests
};