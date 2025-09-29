"use client";

import React, { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { FaYoutube, FaXTwitter, FaLinkedin, FaGithub } from 'react-icons/fa6';

const MobileProfileCard: React.FC = () => {
  const [arSupported, setArSupported] = useState<boolean | null>(null);
  const [arLaunching, setArLaunching] = useState(false);
  const hiddenButtonRef = useRef<HTMLButtonElement | null>(null);

  const checkArSupport = useCallback(async () => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
    if (!('xr' in navigator) || !isSecureContext) return false;
    try {
      // @ts-ignore
      const supported = await (navigator as any).xr?.isSessionSupported?.('immersive-ar');
      return !!supported;
    } catch {
      return false;
    }
  }, []);

  const startAR = useCallback(async () => {
    const supported = await checkArSupport();
    setArSupported(supported);
    if (!supported) {
      alert('AR not supported on this device or context. Try a compatible mobile browser over HTTPS.');
      return;
    }
    if (arLaunching) return;
    setArLaunching(true);

    // Lazy-load three.js and helpers
    const THREE = await import('three');
    const { ARButton } = await import('three/examples/jsm/webxr/ARButton.js');
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 30);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.xr.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '9999';
    document.body.appendChild(renderer.domElement);

    // Basic lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(1, 2, 1);
    scene.add(dir);

    // Reticle for hit-test placement
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.1, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffaa, side: THREE.DoubleSide })
    );
    reticle.rotation.x = -Math.PI / 2;
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Load model
    const gltfLoader = new GLTFLoader();
    let avatar: any = null;
    await new Promise<void>((resolve) => {
      gltfLoader.load('/model.glb', (gltf: any) => {
        avatar = gltf.scene;
        if (avatar) {
          avatar.visible = false;
          avatar.traverse((c: any) => {
            if (c.isMesh) {
              c.castShadow = true;
              c.receiveShadow = true;
            }
          });
          scene.add(avatar);
        }
        resolve();
      }, undefined, (err: unknown) => { console.error(err); resolve(); });
    });

    // XR plumbing
    let hitTestSource: any = null;
    let referenceSpace: any = null;

    const controller = renderer.xr.getController(0);
    controller.addEventListener('select', () => {
      if (reticle.visible && avatar) {
        avatar.position.setFromMatrixPosition(reticle.matrix);
        avatar.visible = true;
      }
    });
    scene.add(controller);

    // Create hidden AR button and programmatically click it
    const button = ARButton.createButton(renderer, {
      requiredFeatures: ['hit-test'],
    });
    button.style.display = 'none';
    document.body.appendChild(button);

    const onSessionStart = async () => {
      try {
        // @ts-ignore
        const session: XRSession | undefined = renderer.xr.getSession?.();
        if (!session) return;
        // @ts-ignore
        referenceSpace = renderer.xr.getReferenceSpace?.();
        const viewerSpace = await (session as any).requestReferenceSpace('viewer');
        // @ts-ignore
        hitTestSource = await (session as any).requestHitTestSource({ space: viewerSpace });
        session.addEventListener('end', onSessionEnd);
      } catch (e) {
        console.warn('WebXR hit-test not available', e);
      }
    };

    const onSessionEnd = () => {
      try {
        renderer.setAnimationLoop(null);
        if (button && button.parentElement) button.parentElement.removeChild(button);
        if (renderer.domElement && renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
        // Dispose minimal resources
        renderer.dispose();
      } finally {
        setArLaunching(false);
      }
    };

    renderer.xr.addEventListener('sessionstart', onSessionStart);

    // Animation loop
    renderer.setAnimationLoop(() => {
      // @ts-ignore
      const frame: XRFrame | undefined = renderer.xr.getFrame?.();
      if (frame && hitTestSource && referenceSpace) {
        const results = (frame as any).getHitTestResults(hitTestSource);
        if (results.length) {
          const hit = results[0];
          reticle.visible = true;
          // @ts-ignore
          const pose = hit.getPose(referenceSpace);
          if (pose) reticle.matrix.fromArray(pose.transform.matrix);
        } else {
          reticle.visible = false;
        }
      }
      renderer.render(scene, camera);
    });

    // Kick off session
    button.click();
  }, [arLaunching, checkArSupport]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 h-20">
        <button
          aria-label="Open AR headshot"
          className="relative w-16 h-16 rounded-full overflow-hidden ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary/60"
          onClick={startAR}
        >
          <Image
            src="/headshot.png"
            alt="Alisher Farhadi headshot"
            fill
            sizes="64px"
            className="object-cover"
            priority
          />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Alisher Farhadi</p>
          <p className="text-xs text-muted-foreground truncate">Developer, Educator, Entrepreneur</p>
          <div className="mt-1 flex items-center gap-2">
            <a
              href="https://www.youtube.com/channel/UCftW5EHVIF-_xStoVZL-fYg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              aria-label="YouTube Channel"
            >
              <FaYoutube className="w-5 h-5" />
            </a>
            <a
              href="https://x.com/AlisherFarhadi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              aria-label="X (Twitter) Profile"
            >
              <FaXTwitter className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/alisher-farhadi-540945184/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              aria-label="LinkedIn Profile"
            >
              <FaLinkedin className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/afarhadi99"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              aria-label="GitHub Profile"
            >
              <FaGithub className="w-5 h-5" />
            </a>
          </div>
        </div>
        {/* Optional tiny AR status indicator */}
        {arSupported === false && (
          <span className="text-[10px] text-muted-foreground">AR unsupported</span>
        )}
      </div>


      {/* Gentle hint for users */}
      {/* <p className="mt-1 text-[11px] text-muted-foreground">Tap the headshot to launch AR</p> */}
    </div>
  );
};

export default MobileProfileCard;