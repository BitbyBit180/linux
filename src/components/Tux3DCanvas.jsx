import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RotateCcw, Hand } from 'lucide-react';

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
    spinProgress: 0,
    isSpinning: false,
    initialCamPos: new THREE.Vector3(0, 0.4, 3.8),
    initialTarget: new THREE.Vector3(0, 0, 0),
  });

  // Handle click / tap on Tux for joyful spin
  const triggerJoyfulSpin = useCallback(() => {
    stateRef.current.isSpinning = true;
    stateRef.current.spinProgress = 0;
  }, []);

  // Reset camera to default view
  const handleResetCamera = useCallback((e) => {
    e?.stopPropagation();
    if (controlsRef.current && cameraRef.current) {
      const initPos = stateRef.current.initialCamPos;
      const initTarget = stateRef.current.initialTarget;
      cameraRef.current.position.copy(initPos);
      controlsRef.current.target.copy(initTarget);
      controlsRef.current.update();
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

        controls.update();

        if (pivotGroup) {
          // 1. Idle Floating & Breathing
          const floatY = Math.sin(elapsedTime * 2.2) * 0.06;
          const tiltZ = Math.sin(elapsedTime * 1.4) * 0.02;

          // 2. Click Spin Animation
          if (stateRef.current.isSpinning) {
            stateRef.current.spinProgress += delta * 6.0;
            if (stateRef.current.spinProgress >= Math.PI * 2) {
              stateRef.current.spinProgress = 0;
              stateRef.current.isSpinning = false;
            }
          }

          // 3. Mouse Parallax (when not dragging)
          const state = stateRef.current;
          if (!state.isPointerDown) {
            state.currentMouseX += (state.targetMouseX - state.currentMouseX) * 0.06;
            state.currentMouseY += (state.targetMouseY - state.currentMouseY) * 0.06;
          }

          // Apply combined transformations to pivotGroup
          pivotGroup.position.y = floatY + Math.sin(state.spinProgress) * 0.15;
          pivotGroup.rotation.z = tiltZ;
          pivotGroup.rotation.x = state.currentMouseY * 0.25;
          pivotGroup.rotation.y = state.currentMouseX * 0.4 + state.spinProgress;
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
    // If it was a quick click without dragging, do the happy spin!
    if (elapsed < 300 && dx < 6 && dy < 6) {
      triggerJoyfulSpin();
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

      {/* Interactive Helper Hint Badge */}
      {!isLoading && !loadError && (
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-tight text-white/80 pointer-events-auto shadow-lg backdrop-blur-md transition-all duration-300 border border-white/10 whitespace-nowrap"
          style={{
            backgroundColor: '#1C2229CC',
            borderColor: `${accentColor}40`,
          }}
        >
          <Hand className="w-3 h-3 text-[#E8A27C] animate-pulse" />
          <span>3D Tux • Drag to rotate</span>

          {hasInteracted && (
            <button
              onClick={handleResetCamera}
              className="ml-1 p-0.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Reset 3D camera"
              aria-label="Reset camera"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
