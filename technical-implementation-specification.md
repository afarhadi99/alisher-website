# Technical Implementation Specification

## Enhanced Retargeting System Architecture

### File Structure
```
src/components/Profile/
├── Profile.jsx                 // Updated main component
├── bone-mapping.js            // Complete bone mapping dictionary  
├── enhanced-retargeting.js    // New retargeting system
├── three-helpers.js           // Updated helper functions
└── skeleton-debug.js          // Debug utilities
```

## 1. Bone Mapping Dictionary (`bone-mapping.js`)

### Complete Implementation
```javascript
/**
 * Complete bone mapping from Mixamo to Ready Player Me
 * Maps all 69 bones with 1:1 correspondence
 */
export const COMPLETE_BONE_MAPPING = {
  // [All 69 mappings from specification]
};

/**
 * Reverse mapping for debugging
 */
export const REVERSE_BONE_MAPPING = Object.fromEntries(
  Object.entries(COMPLETE_BONE_MAPPING).map(([k, v]) => [v, k])
);

/**
 * RPM-exclusive bones that don't exist in Mixamo
 */
export const RPM_EXCLUSIVE_BONES = ['LeftEye', 'RightEye'];
```

## 2. Enhanced Retargeting System (`enhanced-retargeting.js`)

### Core Functions

#### A. Smart Bone Finder
```javascript
function findTargetBone(sourceBoneName, targetModel, boneMapping) {
  // 1. Direct mapping lookup (highest priority)
  if (boneMapping[sourceBoneName]) {
    const targetBone = targetModel.getObjectByName(boneMapping[sourceBoneName]);
    if (targetBone) return targetBone;
  }
  
  // 2. Strip mixamorig prefix fallback
  const cleanName = sourceBoneName.replace('mixamorig:', '');
  const fallbackBone = targetModel.getObjectByName(cleanName);
  if (fallbackBone) return fallbackBone;
  
  // 3. No match found
  return null;
}
```

#### B. Animation Clip Retargeting
```javascript
function retargetAnimationClip(targetModel, sourceModel, animationClip, options = {}) {
  const { 
    boneMapping = COMPLETE_BONE_MAPPING,
    debug = false,
    preserveOriginalTracks = false 
  } = options;
  
  const newTracks = [];
  const mappingStats = { mapped: 0, unmapped: 0, total: 0 };
  
  for (const track of animationClip.tracks) {
    mappingStats.total++;
    
    // Extract bone name from track (remove .position/.quaternion/.scale)
    const trackParts = track.name.split('.');
    const sourceBoneName = trackParts[0];
    const property = trackParts[1] || 'quaternion';
    
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
      if (preserveOriginalTracks) {
        newTracks.push(track.clone());
      }
    }
  }
  
  if (debug) {
    console.log('=== Retargeting Summary ===');
    console.log(`Mapped: ${mappingStats.mapped}/${mappingStats.total} tracks`);
    console.log(`Success Rate: ${((mappingStats.mapped / mappingStats.total) * 100).toFixed(1)}%`);
  }
  
  return new THREE.AnimationClip(
    animationClip.name + '_retargeted',
    animationClip.duration,
    newTracks
  );
}
```

#### C. Skeleton Validation
```javascript
function validateSkeletonMapping(sourceModel, targetModel, boneMapping, debug = true) {
  const sourceBones = getBoneList(sourceModel);
  const targetBones = getBoneList(targetModel);
  
  const validation = {
    sourceBones: sourceBones.length,
    targetBones: targetBones.length,
    mappedBones: 0,
    unmappedBones: [],
    mappingAccuracy: 0
  };
  
  if (debug) {
    console.log('=== Skeleton Validation ===');
    console.log(`Source skeleton: ${validation.sourceBones} bones`);
    console.log(`Target skeleton: ${validation.targetBones} bones`);
    console.log('');
  }
  
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
    console.log(`Mapping Accuracy: ${validation.mappingAccuracy.toFixed(1)}%`);
    console.log(`Unmapped bones: ${validation.unmappedBones.length}`);
    
    if (validation.unmappedBones.length > 0) {
      console.log('Unmapped bone list:', validation.unmappedBones);
    }
  }
  
  return validation;
}
```

#### D. Bone List Extraction
```javascript
function getBoneList(model) {
  const bones = [];
  
  model.traverse((object) => {
    if (object.isBone || object.type === 'Bone') {
      bones.push(object);
    }
  });
  
  return bones;
}
```

## 3. Updated Profile Component (`Profile.jsx`)

### Key Changes
```javascript
import { retargetAnimationClip, validateSkeletonMapping } from './enhanced-retargeting';
import { COMPLETE_BONE_MAPPING } from './bone-mapping';

// In the FBX loader success callback:
fbxLoader.load('/wave.fbx', (animFbx) => {
  const animationClip = animFbx.animations[0];
  
  if (!animationClip) {
    console.error('No animation found in FBX file');
    return;
  }
  
  mixer = new THREE.AnimationMixer(model);
  
  // Validate skeleton mapping (debug mode)
  const validation = validateSkeletonMapping(
    animFbx, 
    model, 
    COMPLETE_BONE_MAPPING, 
    true // Enable debug logging
  );
  
  // Retarget the animation with enhanced system
  const retargetedClip = retargetAnimationClip(
    model,           // target model (RPM)
    animFbx,         // source model (Mixamo)
    animationClip,   // source animation
    {
      boneMapping: COMPLETE_BONE_MAPPING,
      debug: true,   // Enable debug logging
      preserveOriginalTracks: false
    }
  );
  
  if (retargetedClip.tracks.length > 0) {
    const action = mixer.clipAction(retargetedClip);
    action.setLoop(THREE.LoopRepeat);
    action.play();
    console.log('✓ Wave animation started successfully');
  } else {
    console.error('✗ No valid tracks in retargeted animation');
  }
});
```

## 4. T-Pose Adjustment System

### Implementation Plan
```javascript
function adjustTPoseDifferences(sourceModel, targetModel, animationClip) {
  // 1. Sample T-pose from both models
  const sourceTPose = extractTPose(sourceModel);
  const targetTPose = extractTPose(targetModel);
  
  // 2. Calculate rotation offsets between T-poses
  const rotationOffsets = calculateRotationOffsets(sourceTPose, targetTPose);
  
  // 3. Apply offsets to animation tracks
  return applyRotationOffsets(animationClip, rotationOffsets);
}

function extractTPose(model) {
  const tPose = {};
  const bones = getBoneList(model);
  
  bones.forEach(bone => {
    tPose[bone.name] = {
      position: bone.position.clone(),
      quaternion: bone.quaternion.clone(),
      scale: bone.scale.clone()
    };
  });
  
  return tPose;
}
```

## 5. Performance Optimizations

### Caching Strategy
```javascript
class RetargetingCache {
  constructor() {
    this.boneMappingCache = new Map();
    this.animationClipCache = new Map();
  }
  
  getCachedBoneMapping(sourceModelId, targetModelId) {
    const key = `${sourceModelId}-${targetModelId}`;
    return this.boneMappingCache.get(key);
  }
  
  setCachedBoneMapping(sourceModelId, targetModelId, mapping) {
    const key = `${sourceModelId}-${targetModelId}`;
    this.boneMappingCache.set(key, mapping);
  }
  
  getCachedAnimation(clipName, sourceModelId, targetModelId) {
    const key = `${clipName}-${sourceModelId}-${targetModelId}`;
    return this.animationClipCache.get(key);
  }
  
  setCachedAnimation(clipName, sourceModelId, targetModelId, clip) {
    const key = `${clipName}-${sourceModelId}-${targetModelId}`;
    this.animationClipCache.set(key, clip);
  }
}
```

## 6. Error Handling & Fallbacks

### Robust Error Management
```javascript
function safeRetargetClip(targetModel, sourceModel, animationClip, options = {}) {
  try {
    // Validate inputs
    if (!targetModel || !sourceModel || !animationClip) {
      throw new Error('Missing required parameters for retargeting');
    }
    
    if (!animationClip.tracks || animationClip.tracks.length === 0) {
      throw new Error('Animation clip has no tracks');
    }
    
    // Perform retargeting
    const retargetedClip = retargetAnimationClip(targetModel, sourceModel, animationClip, options);
    
    // Validate output
    if (retargetedClip.tracks.length === 0) {
      console.warn('Retargeting produced no valid tracks - using fallback');
      return createFallbackAnimation(targetModel, animationClip);
    }
    
    return retargetedClip;
    
  } catch (error) {
    console.error('Retargeting failed:', error);
    return createFallbackAnimation(targetModel, animationClip);
  }
}

function createFallbackAnimation(model, originalClip) {
  // Create a simple idle animation or return null
  // This prevents complete animation failure
  return new THREE.AnimationClip('fallback_idle', originalClip.duration, []);
}
```

## 7. Integration Testing Strategy

### Automated Validation
```javascript
function runRetargetingTests(sourceModel, targetModel) {
  const tests = [
    () => testBoneMappingCompleteness(),
    () => testAnimationTrackMapping(), 
    () => testPerformance(),
    () => testErrorHandling()
  ];
  
  tests.forEach((test, index) => {
    try {
      console.log(`Running test ${index + 1}...`);
      test();
      console.log(`✓ Test ${index + 1} passed`);
    } catch (error) {
      console.error(`✗ Test ${index + 1} failed:`, error);
    }
  });
}
```

## Expected Implementation Results

After implementing this system:

1. **100% Bone Mapping Coverage**: All 69 Mixamo bones map to RPM bones
2. **High-Fidelity Animation**: Wave animation transfers with complete detail
3. **Robust Error Handling**: Graceful degradation if mapping fails
4. **Debug Visibility**: Clear logging of mapping success/failures
5. **Performance Optimized**: Cached mappings for repeated use
6. **Extensible Architecture**: Easy to add new animations/models

## Next Steps

1. Switch to Code mode for implementation
2. Create bone-mapping.js with complete dictionary
3. Implement enhanced-retargeting.js system
4. Update Profile.jsx with new retargeting calls
5. Test with wave.fbx animation
6. Refine based on results