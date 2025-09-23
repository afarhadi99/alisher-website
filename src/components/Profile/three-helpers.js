import * as THREE from 'three';
import { safeRetargetClip, retargetAnimationClip } from './enhanced-retargeting';
import { COMPLETE_BONE_MAPPING } from './bone-mapping';

/**
 * Legacy retarget function for backward compatibility
 * @deprecated Use enhanced-retargeting.js functions instead
 */
function retarget( target, source, options = {} ) {
	console.warn('retarget() is deprecated. Use enhanced retargeting system instead.');

	const pos = new THREE.Vector3(),
		quat = new THREE.Quaternion(),
		scale = new THREE.Vector3();

	options.preserveMatrix = options.preserveMatrix !== undefined ? options.preserveMatrix : true;
	options.useTargetMatrix = options.useTargetMatrix !== undefined ? options.useTargetMatrix : false;

	target.updateWorldMatrix( true, false );
	source.updateWorldMatrix( true, false );

	target.matrix.copy( source.matrix );

	if ( options.preserveMatrix ) {
		target.matrixWorld.copy( source.matrixWorld );
	}

	if ( options.useTargetMatrix ) {
		target.matrix.decompose( pos, quat, scale );
		source.matrix.decompose( pos, quat, scale );
	}

	target.matrix.copy( source.matrix );
	target.matrix.premultiply( source.matrixWorld.invert() );
	target.matrix.multiply( target.matrixWorld );

	target.matrix.decompose( pos, quat, scale );
	target.position.copy( pos );
	target.quaternion.copy( quat );
	target.scale.copy( scale );

	target.updateMatrixWorld( true );

	for ( const child of target.children ) {
		const sourceChild = source.children.find( ( c ) => c.name === child.name );
		if ( sourceChild ) {
			retarget( child, sourceChild, options );
		}
	}

	return target;
}

/**
 * Enhanced retargetClip function with improved bone mapping
 * @param {THREE.Object3D} target - Target RPM model
 * @param {THREE.Object3D} source - Source Mixamo model
 * @param {THREE.AnimationClip} clip - Animation clip to retarget
 * @param {Object} options - Retargeting options
 * @returns {THREE.AnimationClip} - Retargeted animation clip
 */
function retargetClip( target, source, clip, options = {} ) {
	console.log('Using enhanced retargetClip with comprehensive bone mapping...');
	
	// Use the new enhanced retargeting system
	return safeRetargetClip(target, source, clip, {
		boneMapping: COMPLETE_BONE_MAPPING,
		debug: options.debug !== undefined ? options.debug : true,
		preserveOriginalTracks: options.preserveOriginalTracks || false,
		skipUnmappedBones: true,
		...options
	});
}

/**
 * Extract bone list from model
 * @param {THREE.Object3D} object - 3D object
 * @returns {Array<THREE.Bone>} - Array of bones
 */
function getBoneList( object ) {
	const boneList = [];

	if ( object.isBone ) {
		boneList.push( object );
	}

	for ( const child of object.children ) {
		boneList.push.apply( boneList, getBoneList( child ) );
	}

	return boneList;
}

/**
 * Helper function to create animation mixer with enhanced error handling
 * @param {THREE.Object3D} model - 3D model
 * @returns {THREE.AnimationMixer} - Animation mixer
 */
function createAnimationMixer(model) {
	if (!model) {
		throw new Error('Model is required to create AnimationMixer');
	}
	
	const mixer = new THREE.AnimationMixer(model);
	
	// Add event listeners for debugging
	mixer.addEventListener('loop', (event) => {
		console.log(`Animation loop: ${event.action.getClip().name}`);
	});
	
	mixer.addEventListener('finished', (event) => {
		console.log(`Animation finished: ${event.action.getClip().name}`);
	});
	
	return mixer;
}

/**
 * Utility to play animation with enhanced logging
 * @param {THREE.AnimationMixer} mixer - Animation mixer
 * @param {THREE.AnimationClip} clip - Animation clip
 * @param {Object} options - Play options
 * @returns {THREE.AnimationAction} - Animation action
 */
function playAnimation(mixer, clip, options = {}) {
	if (!mixer || !clip) {
		console.error('Mixer and clip are required to play animation');
		return null;
	}
	
	const {
		loop = THREE.LoopRepeat,
		fadeIn = 0,
		fadeOut = 0,
		weight = 1,
		timeScale = 1
	} = options;
	
	const action = mixer.clipAction(clip);
	action.setLoop(loop);
	action.fadeIn(fadeIn);
	action.weight = weight;
	action.timeScale = timeScale;
	action.play();
	
	console.log(`▶️  Playing animation: "${clip.name}"`);
	console.log(`   Duration: ${clip.duration}s`);
	console.log(`   Tracks: ${clip.tracks.length}`);
	console.log(`   Loop: ${loop === THREE.LoopRepeat ? 'Repeat' : 'Once'}`);
	
	return action;
}

/**
 * Debug function to analyze animation clip
 * @param {THREE.AnimationClip} clip - Animation clip to analyze
 */
function analyzeAnimationClip(clip) {
	if (!clip) {
		console.error('No animation clip to analyze');
		return;
	}
	
	console.log('=== Animation Clip Analysis ===');
	console.log(`Name: ${clip.name}`);
	console.log(`Duration: ${clip.duration}s`);
	console.log(`Tracks: ${clip.tracks.length}`);
	console.log('');
	
	const tracksByType = {};
	const boneNames = new Set();
	
	clip.tracks.forEach((track, index) => {
		const [boneName, property] = track.name.split('.');
		boneNames.add(boneName);
		
		if (!tracksByType[property]) {
			tracksByType[property] = 0;
		}
		tracksByType[property]++;
		
		if (index < 10) { // Show first 10 tracks
			console.log(`Track ${index}: ${track.name} (${track.times.length} keyframes)`);
		}
	});
	
	console.log('');
	console.log('=== Track Statistics ===');
	Object.entries(tracksByType).forEach(([type, count]) => {
		console.log(`${type}: ${count} tracks`);
	});
	
	console.log('');
	console.log(`Unique bones: ${boneNames.size}`);
	console.log('Bone names:', Array.from(boneNames).slice(0, 10).join(', ') +
		(boneNames.size > 10 ? '...' : ''));
}

export {
	retarget,
	retargetClip,
	getBoneList,
	createAnimationMixer,
	playAnimation,
	analyzeAnimationClip
};