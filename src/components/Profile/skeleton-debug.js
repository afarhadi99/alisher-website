import * as THREE from 'three';
import { COMPLETE_BONE_MAPPING, BONE_CATEGORIES } from './bone-mapping';
import { getBoneList } from './enhanced-retargeting';

/**
 * Skeleton debugging utilities for 3D animation retargeting
 */

/**
 * Print detailed skeleton hierarchy
 * @param {THREE.Object3D} model - 3D model
 * @param {string} title - Title for the output
 */
function printSkeletonHierarchy(model, title = 'Skeleton Hierarchy') {
  console.log(`=== ${title} ===`);
  
  const bones = getBoneList(model);
  console.log(`Total bones: ${bones.length}`);
  console.log('');
  
  // Find root bones (bones with no bone parents)
  const rootBones = bones.filter(bone => {
    let parent = bone.parent;
    while (parent) {
      if (parent.isBone) return false;
      parent = parent.parent;
    }
    return true;
  });
  
  rootBones.forEach(rootBone => {
    printBoneHierarchy(rootBone, 0);
  });
}

/**
 * Recursively print bone hierarchy
 * @param {THREE.Bone} bone - Bone to print
 * @param {number} depth - Current depth for indentation
 */
function printBoneHierarchy(bone, depth = 0) {
  const indent = '  '.repeat(depth);
  const childBones = bone.children.filter(child => child.isBone);
  
  console.log(`${indent}${bone.name} ${childBones.length > 0 ? `(${childBones.length} children)` : ''}`);
  
  childBones.forEach(child => {
    printBoneHierarchy(child, depth + 1);
  });
}

/**
 * Compare two skeletons side by side
 * @param {THREE.Object3D} sourceModel - Source model (Mixamo)
 * @param {THREE.Object3D} targetModel - Target model (RPM)
 */
function compareSkeletons(sourceModel, targetModel) {
  console.log('=== Skeleton Comparison ===');
  
  const sourceBones = getBoneList(sourceModel);
  const targetBones = getBoneList(targetModel);
  
  console.log(`Source bones: ${sourceBones.length}`);
  console.log(`Target bones: ${targetBones.length}`);
  console.log('');
  
  // Create bone name sets for comparison
  const sourceNames = new Set(sourceBones.map(b => b.name));
  const targetNames = new Set(targetBones.map(b => b.name));
  
  // Find mapping coverage
  let mappedCount = 0;
  let unmappedSource = [];
  let unmappedTarget = [];
  
  sourceBones.forEach(bone => {
    const mappedName = COMPLETE_BONE_MAPPING[bone.name];
    if (mappedName && targetNames.has(mappedName)) {
      mappedCount++;
    } else {
      unmappedSource.push(bone.name);
    }
  });
  
  targetBones.forEach(bone => {
    if (!Object.values(COMPLETE_BONE_MAPPING).includes(bone.name)) {
      unmappedTarget.push(bone.name);
    }
  });
  
  console.log(`Mapping coverage: ${mappedCount}/${sourceBones.length} source bones`);
  console.log(`Unmapped source bones: ${unmappedSource.length}`);
  console.log(`Unmapped target bones: ${unmappedTarget.length}`);
  
  if (unmappedSource.length > 0) {
    console.log('\nUnmapped source bones:', unmappedSource.join(', '));
  }
  
  if (unmappedTarget.length > 0) {
    console.log('\nUnmapped target bones:', unmappedTarget.join(', '));
  }
}

/**
 * Analyze bone categories mapping
 * @param {THREE.Object3D} sourceModel - Source model
 * @param {THREE.Object3D} targetModel - Target model
 */
function analyzeBoneCategories(sourceModel, targetModel) {
  console.log('=== Bone Category Analysis ===');
  
  const targetNames = new Set(getBoneList(targetModel).map(b => b.name));
  
  Object.entries(BONE_CATEGORIES).forEach(([category, bones]) => {
    let mappedCount = 0;
    let unmappedBones = [];
    
    bones.forEach(boneName => {
      if (targetNames.has(boneName)) {
        mappedCount++;
      } else {
        unmappedBones.push(boneName);
      }
    });
    
    const coverage = ((mappedCount / bones.length) * 100).toFixed(1);
    console.log(`${category}: ${mappedCount}/${bones.length} (${coverage}%)`);
    
    if (unmappedBones.length > 0) {
      console.log(`  Missing: ${unmappedBones.join(', ')}`);
    }
  });
}

/**
 * Debug animation track mapping
 * @param {THREE.AnimationClip} clip - Animation clip
 * @param {THREE.Object3D} targetModel - Target model
 */
function debugAnimationTracks(clip, targetModel) {
  console.log('=== Animation Track Debug ===');
  console.log(`Clip: "${clip.name}"`);
  console.log(`Duration: ${clip.duration}s`);
  console.log(`Tracks: ${clip.tracks.length}`);
  console.log('');
  
  const targetNames = new Set(getBoneList(targetModel).map(b => b.name));
  
  let mappableCount = 0;
  let unmappableCount = 0;
  let tracksByProperty = {};
  
  clip.tracks.forEach((track, index) => {
    const [boneName, property] = track.name.split('.');
    
    // Count by property type
    if (!tracksByProperty[property]) {
      tracksByProperty[property] = { mappable: 0, unmappable: 0 };
    }
    
    // Check if track is mappable
    const mappedName = COMPLETE_BONE_MAPPING[boneName];
    const isMappable = mappedName && targetNames.has(mappedName);
    
    if (isMappable) {
      mappableCount++;
      tracksByProperty[property].mappable++;
      
      if (index < 10) { // Show first 10 mappable tracks
        console.log(`✓ ${track.name} → ${mappedName}.${property}`);
      }
    } else {
      unmappableCount++;
      tracksByProperty[property].unmappable++;
      
      if (index < 5) { // Show first 5 unmappable tracks
        console.log(`✗ ${track.name} → NO MAPPING`);
      }
    }
  });
  
  console.log('');
  console.log('=== Track Summary ===');
  console.log(`Mappable: ${mappableCount}/${clip.tracks.length}`);
  console.log(`Unmappable: ${unmappableCount}/${clip.tracks.length}`);
  console.log(`Success rate: ${((mappableCount / clip.tracks.length) * 100).toFixed(1)}%`);
  
  console.log('\n=== Tracks by Property ===');
  Object.entries(tracksByProperty).forEach(([property, stats]) => {
    const total = stats.mappable + stats.unmappable;
    const rate = ((stats.mappable / total) * 100).toFixed(1);
    console.log(`${property}: ${stats.mappable}/${total} (${rate}%)`);
  });
}

/**
 * Generate bone mapping report
 * @param {THREE.Object3D} sourceModel - Source model
 * @param {THREE.Object3D} targetModel - Target model
 */
function generateMappingReport(sourceModel, targetModel) {
  console.log('=== Complete Bone Mapping Report ===');
  console.log(new Date().toISOString());
  console.log('');
  
  // Basic statistics
  printSkeletonHierarchy(sourceModel, 'Source Skeleton (Mixamo)');
  console.log('');
  printSkeletonHierarchy(targetModel, 'Target Skeleton (Ready Player Me)');
  console.log('');
  
  // Comparison
  compareSkeletons(sourceModel, targetModel);
  console.log('');
  
  // Category analysis
  analyzeBoneCategories(sourceModel, targetModel);
  console.log('');
  
  // Mapping dictionary stats
  console.log('=== Mapping Dictionary Stats ===');
  console.log(`Total mappings: ${Object.keys(COMPLETE_BONE_MAPPING).length}`);
  console.log(`Categories: ${Object.keys(BONE_CATEGORIES).length}`);
  
  // Validate mapping completeness
  const sourceBones = getBoneList(sourceModel);
  const mappedSourceBones = sourceBones.filter(bone => COMPLETE_BONE_MAPPING[bone.name]);
  const mappingCompleteness = ((mappedSourceBones.length / sourceBones.length) * 100).toFixed(1);
  
  console.log(`Mapping completeness: ${mappedSourceBones.length}/${sourceBones.length} (${mappingCompleteness}%)`);
  
  console.log('\n=== Report Complete ===');
}

/**
 * Test bone transformations
 * @param {THREE.Object3D} sourceModel - Source model
 * @param {THREE.Object3D} targetModel - Target model
 */
function testBoneTransformations(sourceModel, targetModel) {
  console.log('=== Bone Transformation Test ===');
  
  const testBones = ['mixamorig:Hips', 'mixamorig:RightArm', 'mixamorig:LeftHand'];
  
  testBones.forEach(sourceBoneName => {
    const sourceBone = sourceModel.getObjectByName(sourceBoneName);
    const targetBoneName = COMPLETE_BONE_MAPPING[sourceBoneName];
    const targetBone = targetModel.getObjectByName(targetBoneName);
    
    if (sourceBone && targetBone) {
      console.log(`\nTesting: ${sourceBoneName} → ${targetBoneName}`);
      console.log(`Source position: ${sourceBone.position.toArray().map(v => v.toFixed(3)).join(', ')}`);
      console.log(`Target position: ${targetBone.position.toArray().map(v => v.toFixed(3)).join(', ')}`);
      console.log(`Source rotation: ${sourceBone.rotation.toArray().slice(0,3).map(v => v.toFixed(3)).join(', ')}`);
      console.log(`Target rotation: ${targetBone.rotation.toArray().slice(0,3).map(v => v.toFixed(3)).join(', ')}`);
    } else {
      console.log(`\n❌ Test failed: ${sourceBoneName} → ${targetBoneName || 'NOT FOUND'}`);
    }
  });
}

/**
 * Monitor animation playback
 * @param {THREE.AnimationMixer} mixer - Animation mixer
 * @param {string} animationName - Animation name to monitor
 */
function monitorAnimation(mixer, animationName = 'wave') {
  if (!mixer) {
    console.error('No mixer provided for monitoring');
    return;
  }
  
  console.log(`=== Animation Monitor: ${animationName} ===`);
  
  const startTime = Date.now();
  let frameCount = 0;
  
  const monitor = () => {
    frameCount++;
    
    if (frameCount % 60 === 0) { // Log every 60 frames (~1 second at 60fps)
      const elapsed = (Date.now() - startTime) / 1000;
      const fps = frameCount / elapsed;
      
      console.log(`Animation running: ${elapsed.toFixed(1)}s | FPS: ${fps.toFixed(1)} | Frames: ${frameCount}`);
      
      // Log active actions
      const actions = mixer._actions || [];
      const activeActions = actions.filter(action => action.isRunning());
      console.log(`Active actions: ${activeActions.length}`);
      
      activeActions.forEach(action => {
        const clip = action.getClip();
        console.log(`  "${clip.name}": time=${action.time.toFixed(2)}s, weight=${action.weight}`);
      });
    }
    
    requestAnimationFrame(monitor);
  };
  
  requestAnimationFrame(monitor);
}

export {
  printSkeletonHierarchy,
  printBoneHierarchy,
  compareSkeletons,
  analyzeBoneCategories,
  debugAnimationTracks,
  generateMappingReport,
  testBoneTransformations,
  monitorAnimation
};