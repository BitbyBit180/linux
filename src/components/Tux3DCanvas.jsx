import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Interactive 3D Tux Canvas using Three.js
 *
 * Features:
 * - Real-time WebGL rendering of the Tux 3D model
 * - Smooth drag-to-rotate with OrbitControls and inertia damping
 * - Subtle mouse-tracking parallax when idle
 * - Natural breathing/floating levitation animation
 * - Click/tap joyful spin and bounce reaction
 * - Dynamic reactive accent lighting matching the active/hovered Linux distro
 * - Elegant glowing aura and interactive control hint with reset camera button
 */
export default function Tux3DCanvas({
  activeDistro,
  size = 280,
  isMobile = false,
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const pivotGroupRef = useRef(null);
  const accentLightRef = useRef(null);
  const auraGlowRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Distro accent color fallback
  const accentColor = activeDistro?.accent || '#E05A38';

  // Animation and state refs to avoid re-renders during 60fps loop
  const stateRef = useRef({
    targetMouseX: 0,
    targetMouseY: 0,
    currentMouseX: 0,
    currentMouseY: 0,
    isPointerDown: false,
    clickStartTime: 0,
    pointerDownPos: { x: 0, y: 0 },
    isResetting: false,
    resetProgress: 0,
    resetDuration: 0.7,
    startSpherical: new THREE.Spherical(),
    targetSpherical: new THREE.Spherical(),
    dRadius: 0,
    dPhi: 0,
    dTheta: 0,
    startMouseX: 0,
    startMouseY: 0,
    initialCamPos: new THREE.Vector3(0, 0.35, 3.8),
    initialTarget: new THREE.Vector3(0, 0, 0),
  });

  // Return Tux and camera in a single, ultra-smooth spherical turning motion
  const resetToOriginalPosition = useCallback(() => {
    if (controlsRef.current && cameraRef.current) {
      const state = stateRef.current;
      const camera = cameraRef.current;

      // Extract spherical coordinates relative to the target center
      const offset = new THREE.Vector3().copy(camera.position).sub(controlsRef.current.target);
      state.startSpherical.setFromVector3(offset);

      const targetOffset = new THREE.Vector3().copy(state.initialCamPos).sub(state.initialTarget);
      state.targetSpherical.setFromVector3(targetOffset);

      // Shortest angular turn along the horizontal circle (theta)
      let dTheta = (state.targetSpherical.theta - state.startSpherical.theta) % (Math.PI * 2);
      if (dTheta > Math.PI) dTheta -= Math.PI * 2;
      if (dTheta < -Math.PI) dTheta += Math.PI * 2;
      state.dTheta = dTheta;

      // Polar elevation difference
      state.dPhi = state.targetSpherical.phi - state.startSpherical.phi;

      // Distance difference
      state.dRadius = state.targetSpherical.radius - state.startSpherical.radius;

      state.startMouseX = state.currentMouseX;
      state.startMouseY = state.currentMouseY;
      state.targetMouseX = 0;
      state.targetMouseY = 0;

      state.isResetting = true;
      state.resetProgress = 0;
      setHasInteracted(false);
    }
  }, []);

  // Update dynamic accent lighting when active distro changes
  useEffect(() => {
    if (accentLightRef.current) {
      const col = new THREE.Color(accentColor);
      accentLightRef.current.color.copy(col);
    }
  }, [accentColor]);

  // Main Three.js Scene Lifecycle
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animFrameId = null;
    let renderer = null;

    try {
      // Scene
      const scene = new THREE.Scene();

      // Camera
      const width = container.clientWidth || size;
      const height = container.clientHeight || size;
      const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.set(0, 0.35, 3.8);
      cameraRef.current = camera;

      // WebGL Renderer
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      // OrbitControls for touch and mouse rotation
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enableZoom = false; // Prevent accidental zoom on mobile/page scroll
      controls.enablePan = false; // Keep Tux centered
      controls.minPolarAngle = Math.PI * 0.25;
      controls.maxPolarAngle = Math.PI * 0.72;
      controls.rotateSpeed = 0.85;
      controls.target.set(0, 0, 0);
      controlsRef.current = controls;

      controls.addEventListener('start', () => {
        setHasInteracted(true);
        stateRef.current.isPointerDown = true;
        stateRef.current.isResetting = false;
      });
      controls.addEventListener('end', () => {
        stateRef.current.isPointerDown = false;
      });

      // Lighting Setup
      // 1. Soft global ambient
      const ambientLight = new THREE.AmbientLight(0xf1f5f9, 1.4);
      scene.add(ambientLight);

      // 2. Key front-right directional light
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(3, 4, 4);
      scene.add(keyLight);

      // 3. Cool rim/fill light from the left
      const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.2);
      fillLight.position.set(-3.5, 2, 1);
      scene.add(fillLight);

      // 4. Back rim light for edge definition
      const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
      rimLight.position.set(0, 4, -4);
      scene.add(rimLight);

      // 5. Dynamic distro colored accent light underneath
      const accentLight = new THREE.PointLight(accentColor, 4.0, 8);
      accentLight.position.set(0, -1.2, 1.8);
      scene.add(accentLight);
      accentLightRef.current = accentLight;

      // Pivot Group for animations and mouse parallax
      const pivotGroup = new THREE.Group();
      scene.add(pivotGroup);
      pivotGroupRef.current = pivotGroup;

      // GLTF Loader for Tux
      const loader = new GLTFLoader();
      loader.load(
        '/tux/scene.gltf',
        (gltf) => {
          const model = gltf.scene;

          // Compute exact bounding box to center & auto-scale model perfectly
          const bbox = new THREE.Box3().setFromObject(model);
          const center = bbox.getCenter(new THREE.Vector3());
          const modelSize = bbox.getSize(new THREE.Vector3());
          const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);

          const desiredHeight = 2.3;
          const scale = desiredHeight / (maxDim || 1);
          model.scale.setScalar(scale);

          // Center the geometry inside pivotGroup
          model.position.x = -center.x * scale;
          model.position.y = -center.y * scale - 0.05;
          model.position.z = -center.z * scale;

          // Enhance materials
          model.traverse((child) => {
            if (child.isMesh && child.material) {
              if (child.material.isMeshStandardMaterial) {
                child.material.roughness = 0.42;
                child.material.metalness = 0.08;
              }
            }
          });

          pivotGroup.add(model);
          setIsLoading(false);
        },
        undefined,
        (err) => {
          console.error('Failed to load Tux 3D model:', err);
          setLoadError(true);
          setIsLoading(false);
        },
      );

      // Resize observer
      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth || size;
        const h = container.clientHeight || size;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      // Animation Loop Clock
      const clock = new THREE.Clock();

      const animate = () => {
        animFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();
        const state = stateRef.current;

        // Ultra-smooth single-motion turn back to original position
        if (state.isResetting) {
          state.resetProgress += delta / state.resetDuration;
          const t = Math.min(1, state.resetProgress);

          // Silky smooth easeInOutCubic: gentle acceleration and deceleration
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

          // Interpolate along the spherical orbit at constant radius (no dipping/zooming)
          const curRadius = state.startSpherical.radius + state.dRadius * ease;
          const curPhi = state.startSpherical.phi + state.dPhi * ease;
          const curTheta = state.startSpherical.theta + state.dTheta * ease;

          const currentSpherical = new THREE.Spherical(curRadius, curPhi, curTheta);
          camera.position.setFromSpherical(currentSpherical);
          controls.target.set(0, 0, 0);
          controls.update();

          // Sync mouse parallax easing seamlessly with the turn
          state.currentMouseX = state.startMouseX * (1 - ease);
          state.currentMouseY = state.startMouseY * (1 - ease);

          if (t >= 1) {
            state.isResetting = false;
            camera.position.copy(state.initialCamPos);
            controls.target.copy(state.initialTarget);
            controls.update();
            state.currentMouseX = 0;
            state.currentMouseY = 0;
          }
        } else {
          controls.update();
        }

        if (pivotGroup) {
          // 1. Idle Floating & Breathing
          const floatY = Math.sin(elapsedTime * 2.2) * 0.06;
          const tiltZ = Math.sin(elapsedTime * 1.4) * 0.02;

          // 2. Mouse Parallax (when not dragging or resetting)
          if (!state.isPointerDown && !state.isResetting) {
            state.currentMouseX += (state.targetMouseX - state.currentMouseX) * 0.06;
            state.currentMouseY += (state.targetMouseY - state.currentMouseY) * 0.06;
          }

          // Apply clean transformations to pivotGroup (one unified, pure motion)
          pivotGroup.position.y = floatY;
          pivotGroup.rotation.z = tiltZ;
          pivotGroup.rotation.x = state.currentMouseY * 0.25;
          pivotGroup.rotation.y = state.currentMouseX * 0.4;
        }

        renderer.render(scene, camera);
      };

      animate();

      return () => {
        if (animFrameId) cancelAnimationFrame(animFrameId);
        window.removeEventListener('resize', handleResize);
        controls.dispose();
        renderer.dispose();
      };
    } catch (e) {
      console.error('Three.js initialization error:', e);
      setLoadError(true);
      setIsLoading(false);
    }
  }, [size]);

  // Pointer Move for subtle parallax effect
  const handlePointerMove = (e) => {
    if (stateRef.current.isPointerDown) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    stateRef.current.targetMouseX = THREE.MathUtils.clamp(x, -1, 1);
    stateRef.current.targetMouseY = THREE.MathUtils.clamp(y, -1, 1);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    stateRef.current.targetMouseX = 0;
    stateRef.current.targetMouseY = 0;
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerDown = (e) => {
    stateRef.current.clickStartTime = Date.now();
    stateRef.current.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e) => {
    const elapsed = Date.now() - stateRef.current.clickStartTime;
    const dx = Math.abs(e.clientX - stateRef.current.pointerDownPos.x);
    const dy = Math.abs(e.clientY - stateRef.current.pointerDownPos.y);
    // If it was a click/tap on the model without dragging, return to original position!
    if (elapsed < 350 && dx < 8 && dy < 8) {
      resetToOriginalPosition();
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`relative select-none flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        cursor: 'grab',
      }}
      title="Interactive 3D Tux: Drag to rotate, click to bounce!"
    >
      {/* Dynamic Background Glow Aura */}
      <div
        ref={auraGlowRef}
        className="absolute inset-0 rounded-full pointer-events-none transition-all duration-700 blur-2xl"
        style={{
          background: `radial-gradient(circle, ${accentColor}33 0%, ${accentColor}08 50%, transparent 75%)`,
          transform: isHovered ? 'scale(1.15)' : 'scale(1.0)',
          opacity: isLoading ? 0.4 : 0.85,
        }}
      />


      {/* Loading Spinner / Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mb-3"
            style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }}
          />
          <span className="text-xs font-mono tracking-wider text-white/60">
            LOADING 3D TUX...
          </span>
        </div>
      )}

      {/* Error Fallback (Graceful SVG Tux if WebGL fails) */}
      {loadError && (
        <div className="flex flex-col items-center justify-center pointer-events-none">
          <svg width={size * 0.4} height={size * 0.5} viewBox="0 0 110 130">
            <ellipse cx="55" cy="72" rx="38" ry="44" fill="#111111" />
            <ellipse cx="55" cy="82" rx="22" ry="28" fill="#F0F4F8" />
            <ellipse cx="20" cy="75" rx="13" ry="28" fill="#111111" transform="rotate(-15 20 75)" />
            <ellipse cx="90" cy="75" rx="13" ry="28" fill="#111111" transform="rotate(15 90 75)" />
            <circle cx="55" cy="32" r="26" fill="#111111" />
            <circle cx="46" cy="28" r="7" fill="white" />
            <circle cx="47" cy="29" r="3.5" fill="#111" />
            <circle cx="64" cy="28" r="7" fill="white" />
            <circle cx="65" cy="29" r="3.5" fill="#111" />
            <polygon points="55,38 49,48 61,48" fill="#E05A38" />
            <ellipse cx="41" cy="118" rx="12" ry="6" fill="#E05A38" transform="rotate(-10 41 118)" />
            <ellipse cx="69" cy="118" rx="12" ry="6" fill="#E05A38" transform="rotate(10 69 118)" />
          </svg>
          <span className="text-[11px] text-zinc-400 mt-2 font-mono">Tux (2D Mode)</span>
        </div>
      )}

      {/* WebGL 3D Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block transition-opacity duration-700 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ touchAction: 'none' }}
      />


    </div>
  );
}
