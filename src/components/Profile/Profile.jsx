"use client"

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Youtube, Twitter, Linkedin, Github } from 'lucide-react';
import { safeRetargetClip, validateSkeletonMapping, runRetargetingTests } from './enhanced-retargeting';
import { COMPLETE_BONE_MAPPING } from './bone-mapping';

const Profile = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    let scene, camera, renderer, mixer, controls, loadedModel;
    const clock = new THREE.Clock();

    const init = () => {
      // Scene
      scene = new THREE.Scene();
      scene.background = null; // Transparent background

      // Camera - Better angle to see animation
      camera = new THREE.PerspectiveCamera(75, currentMount.clientWidth / currentMount.clientHeight, 0.1, 1000);
      camera.position.set(1.5, 1.0, 2.5); // Angled to better see arm/body movement
      camera.lookAt(0, 0, 0);

      // Renderer
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
      currentMount.appendChild(renderer.domElement);

      // Controls - Enable zoom to better see animation
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = true;
      controls.enableZoom = true;
      controls.minDistance = 1.0;
      controls.maxDistance = 5.0;
      controls.target.set(0, 0.5, 0); // Focus on upper body where wave happens

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      // Load Model and Animation
      const gltfLoader = new GLTFLoader();
      gltfLoader.load('/model.glb', (gltf) => {
        loadedModel = gltf.scene; // Store in higher scope
        loadedModel.position.y = -1; // Lower the model
        scene.add(loadedModel);
        
        // Find and setup ALL SkinnedMesh objects for animation
        const skinnedMeshes = [];
        let skeleton = null;
        
        loadedModel.traverse((child) => {
          if (child.isSkinnedMesh) {
            skinnedMeshes.push(child);
            skeleton = child.skeleton; // All meshes should share the same skeleton
            child.frustumCulled = false; // Prevent culling during animation
            
            // Force skeleton update
            child.skeleton.update();
            
            console.log('Found SkinnedMesh:', child.name);
            console.log('Skeleton bones:', child.skeleton.bones.length);
          }
        });
        
        if (skinnedMeshes.length === 0) {
          console.error('No SkinnedMesh found in GLB model - animation will not work');
          return;
        }
        
        console.log(`Found ${skinnedMeshes.length} SkinnedMesh objects`);
        console.log('Skeleton bone names:', skeleton.bones.slice(0, 10).map(b => b.name).join(', '), '...');
        
        // Store references for animation updates
        window.skinnedMeshes = skinnedMeshes;
        window.loadedModel = loadedModel; // Global reference for debugging

        const fbxLoader = new FBXLoader();
        fbxLoader.load('/wave.fbx', (animFbx) => {
          const animationClip = animFbx.animations[0];
          
          if (!animationClip) {
            console.error('No animation found in wave.fbx');
            return;
          }
          
          console.log('=== 3D Animation Retargeting Debug ===');
          console.log(`Animation: "${animationClip.name}"`);
          console.log(`Duration: ${animationClip.duration}s`);
          console.log(`Tracks: ${animationClip.tracks.length}`);
          
          // Debug: Show actual track names from the animation
          console.log('\n=== Animation Track Names (First 10) ===');
          animationClip.tracks.slice(0, 10).forEach((track, i) => {
            console.log(`${i + 1}. ${track.name} (${track.times.length} keyframes)`);
          });
          
          // Debug: Show actual bone names from both models
          console.log('\n=== Source Model Bones (Mixamo FBX) ===');
          const sourceBones = [];
          animFbx.traverse(obj => {
            if (obj.isBone) sourceBones.push(obj.name);
          });
          console.log(`Found ${sourceBones.length} bones:`, sourceBones.slice(0, 10).join(', '), '...');
          
          console.log('\n=== Target Model Bones (RPM GLB) ===');
          const targetBones = [];
          loadedModel.traverse(obj => {
            if (obj.isBone) targetBones.push(obj.name);
          });
          console.log(`Found ${targetBones.length} bones:`, targetBones.slice(0, 10).join(', '), '...');
          
          console.log('\n=== Bone Name Analysis ===');
          // Check if source bones have mixamorig prefix
          const hasMixamoPrefix = sourceBones.some(name => name.startsWith('mixamorig:'));
          console.log(`Source has mixamorig prefix: ${hasMixamoPrefix}`);
          
          // Check for direct name matches (without mapping)
          let directMatches = 0;
          sourceBones.forEach(sourceName => {
            const cleanName = sourceName.replace('mixamorig:', '');
            if (targetBones.includes(cleanName)) {
              directMatches++;
            }
          });
          console.log(`Direct name matches (stripped prefix): ${directMatches}/${sourceBones.length}`);
          
          // Check mapping dictionary matches
          let mappingMatches = 0;
          sourceBones.forEach(sourceName => {
            const mappedName = COMPLETE_BONE_MAPPING[sourceName];
            if (mappedName && targetBones.includes(mappedName)) {
              mappingMatches++;
            }
          });
          console.log(`Mapping dictionary matches: ${mappingMatches}/${sourceBones.length}`);
          
          // Initialize animation mixer with the root object
          // This is crucial - the mixer should target the root that contains the skeleton
          mixer = new THREE.AnimationMixer(loadedModel);
          
          console.log('Animation mixer created with target:', loadedModel.type);
          console.log('Mixer root object:', loadedModel);
          
          // Try retargeting with enhanced debugging
          console.log('\n=== Attempting Retargeting ===');

          // Configure retargeting options so we can reference them later in debug checks
          const retargetOptions = {
            boneMapping: COMPLETE_BONE_MAPPING,
            debug: true,                 // enable detailed logging
            preserveOriginalTracks: false,
            skipUnmappedBones: true,
            stationary: true,            // drop all position tracks to keep avatar centered
            dropScaleTracks: true        // drop scale tracks to avoid scale jumps
          };

          const retargetedClip = safeRetargetClip(
            loadedModel,     // target model (RPM)
            animFbx,         // source model (Mixamo)
            animationClip,   // source animation
            retargetOptions
          );
          
          if (retargetedClip && retargetedClip.tracks.length > 0) {
            console.log('\n=== Creating Animation Action ===');
            
            // Create action from retargeted clip
            const action = mixer.clipAction(retargetedClip);
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            action.enabled = true;
            action.weight = 1.0;
            action.timeScale = 1.0;
            
            // Debug: Verify action setup
            console.log('Action created:', action);
            console.log('Action clip:', action.getClip().name);
            console.log('Action weight:', action.weight);
            console.log('Action enabled:', action.enabled);
            
            // Reset and play the action
            action.reset();
            action.play();
            
            // Verify the action is running
            console.log('Action after play - isRunning():', action.isRunning());
            console.log('Action after play - isScheduled():', action.isScheduled());
            
            // Force multiple updates to kick-start the animation
            for (let i = 0; i < 5; i++) {
              mixer.update(0.016);
            }
            
            // Test bone transform changes (position or rotation)
            const testBone = loadedModel.getObjectByName('Hips');
            if (testBone) {
              // Capture initial local + world transforms
              const initialLocalPos = testBone.position.clone();
              const initialLocalQuat = testBone.quaternion.clone();

              const initialWorldPos = new THREE.Vector3();
              const initialWorldQuat = new THREE.Quaternion();
              testBone.updateWorldMatrix(true, false);
              testBone.getWorldPosition(initialWorldPos);
              testBone.getWorldQuaternion(initialWorldQuat);

              console.log('Hips initial local pos:', initialLocalPos.toArray().map(v => v.toFixed(3)));
              console.log('Hips initial world pos:', initialWorldPos.toArray().map(v => v.toFixed(3)));

              // Update a few frames and check if transforms changed
              setTimeout(() => {
                mixer.update(0.1); // Update ~0.1 seconds
                testBone.updateWorldMatrix(true, false);

                const newLocalPos = testBone.position.clone();
                const newLocalQuat = testBone.quaternion.clone();

                const newWorldPos = new THREE.Vector3();
                const newWorldQuat = new THREE.Quaternion();
                testBone.getWorldPosition(newWorldPos);
                testBone.getWorldQuaternion(newWorldQuat);

                const posChanged = !initialWorldPos.equals(newWorldPos);
                const rotAngle = initialWorldQuat.angleTo(newWorldQuat);
                const rotChanged = rotAngle > 1e-3; // radians threshold

                console.log('Hips after 0.1s world pos:', newWorldPos.toArray().map(v => v.toFixed(3)));
                console.log('Hips rotation changed:', rotChanged, 'angle(rad):', rotAngle.toFixed(4));

                // If stationary mode is on, rotation change is sufficient; otherwise either pos or rot must change
                const affected = rotChanged || (!retargetOptions.stationary && posChanged);
                console.log('Bone transform changed → position:', posChanged, 'rotation:', rotChanged, 'stationary:', !!retargetOptions.stationary);

                if (!affected) {
                  console.error('❌ ISSUE: Bone transforms not updating - animation may not be affecting model');

                  // Debug: Check if tracks are properly connected
                  retargetedClip.tracks.slice(0, 3).forEach(track => {
                    const [boneName] = track.name.split('.');
                    const bone = loadedModel.getObjectByName(boneName);
                    console.log(`Track ${track.name} - Bone exists:`, !!bone);
                    if (bone) {
                      console.log('  Bone type:', bone.type, 'isBone:', bone.isBone);
                    }
                  });
                } else {
                  console.log('✅ Bone transforms updating as expected');
                }
              }, 100);
            }
            
            console.log('\n🎯 Animation setup complete - should be playing visually');
          } else {
            console.error('\n❌ FAILED: No valid tracks produced');
            
            // Enhanced debugging for track analysis
            console.log('\n=== Track Analysis ===');
            animationClip.tracks.forEach((track, i) => {
              const [boneName] = track.name.split('.');
              const mappedName = COMPLETE_BONE_MAPPING[boneName];
              const targetBone = loadedModel.getObjectByName(mappedName || boneName.replace('mixamorig:', ''));
              
              if (i < 5) { // Show first 5 track analysis
                console.log(`Track ${i + 1}: ${track.name}`);
                console.log(`  Bone: ${boneName}`);
                console.log(`  Mapped: ${mappedName || 'NO MAPPING'}`);
                console.log(`  Target exists: ${targetBone ? 'YES' : 'NO'}`);
                console.log('');
              }
            });
            
            // Try a simplified direct mapping approach
            console.log('=== Trying Direct Mapping Approach ===');
            const simpleTracks = [];
            
            animationClip.tracks.forEach(track => {
              const [boneName, property] = track.name.split('.');
              
              // Try direct name match (strip mixamorig prefix)
              const cleanName = boneName.replace('mixamorig:', '');
              const targetBone = loadedModel.getObjectByName(cleanName);
              
              if (targetBone) {
                const newTrack = track.clone();
                newTrack.name = `${cleanName}.${property}`;
                simpleTracks.push(newTrack);
              }
            });
            
            console.log(`Direct mapping produced ${simpleTracks.length} tracks`);
            
            if (simpleTracks.length > 0) {
              const simpleClip = new THREE.AnimationClip('wave_direct_mapped', animationClip.duration, simpleTracks);
              const action = mixer.clipAction(simpleClip);
              action.setLoop(THREE.LoopRepeat);
              action.play();
              
              console.log('✅ Playing with direct mapping approach!');
            }
          }
        },
        // Progress callback
        (progress) => {
          console.log(`Loading wave.fbx: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`);
        },
        // Error callback
        (error) => {
          console.error('Failed to load wave.fbx:', error);
        });
      });

      animate();
    };

    const animate = () => {
      requestAnimationFrame(animate);

      // Use THREE.Clock for accurate delta time, which is crucial for animations
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
      }

      controls.update();
      renderer.render(scene, camera);
    };

    const onWindowResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('resize', onWindowResize);

    init();

    return () => {
      window.removeEventListener('resize', onWindowResize);
      currentMount.removeChild(renderer.domElement);
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