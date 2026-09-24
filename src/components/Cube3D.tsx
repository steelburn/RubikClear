import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { FullCubeState, Move, FaceName, CubeColor } from '../types/cube';
import { COLOR_HEX } from '../types/cube';
import { RotateCcw, Eye, Sparkles, ZoomIn, ZoomOut } from 'lucide-react';

interface Cube3DProps {
  state: FullCubeState;
  activeMove?: Move | null;
  onAnimationEnd?: () => void;
  interactive?: boolean;
  onFaceClick?: (face: FaceName, index: number) => void;
  speed?: number; // duration in ms, default 400ms
}

const PLASTIC_COLOR = 0x181a1f;

// Map face colors to hex
function getHexColor(color: CubeColor): number {
  return parseInt(COLOR_HEX[color].replace('#', '0x'), 16);
}

// Convert 3D coordinate to face index in 0..8
// For each face looking straight at it:
// U (+Y): z is row (back to front: -1=row0, 0=row1, 1=row2), x is col (-1=col0, 0=col1, 1=col2)
// D (-Y): z is row (front to back: 1=row0, 0=row1, -1=row2), x is col (-1=col0, 0=col1, 1=col2)
// F (+Z): y is row (top to bottom: 1=row0, 0=row1, -1=row2), x is col (-1=col0, 0=col1, 1=col2)
// B (-Z): y is row (top to bottom: 1=row0, 0=row1, -1=row2), x is col (right to left: 1=col0, 0=col1, -1=col2)
// L (-X): y is row (top to bottom: 1=row0, 0=row1, -1=row2), z is col (back to front: -1=col0, 0=col1, 1=col2)
// R (+X): y is row (top to bottom: 1=row0, 0=row1, -1=row2), z is col (front to back: 1=col0, 0=col1, -1=col2)

function getStickerIndex(face: FaceName, x: number, y: number, z: number): number {
  switch (face) {
    case 'U': { // looking down: -z is top, +z is bottom; -x is left, +x is right
      const r = z + 1; // z=-1->0, z=0->1, z=1->2
      const c = x + 1; // x=-1->0, x=0->1, x=1->2
      return r * 3 + c;
    }
    case 'D': { // looking up: +z is top, -z is bottom; -x is left, +x is right
      const r = 1 - z; // z=1->0, z=0->1, z=-1->2
      const c = x + 1;
      return r * 3 + c;
    }
    case 'F': { // looking at front: +y is top, -y is bottom; -x is left, +x is right
      const r = 1 - y; // y=1->0, y=0->1, y=-1->2
      const c = x + 1; // x=-1->0, x=0->1, x=1->2
      return r * 3 + c;
    }
    case 'B': { // looking at back: +y is top, -y is bottom; +x is left, -x is right
      const r = 1 - y;
      const c = 1 - x; // x=1->0, x=0->1, x=-1->2
      return r * 3 + c;
    }
    case 'L': { // looking at left: +y is top, -y is bottom; -z is left, +z is right
      const r = 1 - y;
      const c = z + 1; // z=-1->0, z=0->1, z=1->2
      return r * 3 + c;
    }
    case 'R': { // looking at right: +y is top, -y is bottom; +z is left, -z is right
      const r = 1 - y;
      const c = 1 - z; // z=1->0, z=0->1, z=-1->2
      return r * 3 + c;
    }
  }
}

export const Cube3D: React.FC<Cube3DProps> = ({
  state,
  activeMove = null,
  onAnimationEnd,
  speed = 350
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeletsRef = useRef<THREE.Mesh[]>([]);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const pivotGroupRef = useRef<THREE.Group | null>(null);
  const isAnimatingRef = useRef(false);
  const arrowGroupRef = useRef<THREE.Group | null>(null);

  // Camera Orbit state
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef({ radius: 7.2, theta: Math.PI / 4, phi: Math.PI / 3 });
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartRadiusRef = useRef<number>(7.2);

  const updateCameraPosition = useCallback(() => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = sphericalRef.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  }, []);

  // Update sticker colors from state
  const updateCubeColors = useCallback((cubeState: FullCubeState) => {
    cubeletsRef.current.forEach((mesh) => {
      const g = mesh.userData?.grid;
      if (!g) return;
      const materials = mesh.material as THREE.MeshStandardMaterial[];

      // Face order in BoxGeometry: +X (R), -X (L), +Y (U), -Y (D), +Z (F), -Z (B)
      // R: +X
      if (g.x === 1) {
        const idx = getStickerIndex('R', g.x, g.y, g.z);
        materials[0].color.setHex(getHexColor(cubeState.R[idx]));
      }
      // L: -X
      if (g.x === -1) {
        const idx = getStickerIndex('L', g.x, g.y, g.z);
        materials[1].color.setHex(getHexColor(cubeState.L[idx]));
      }
      // U: +Y
      if (g.y === 1) {
        const idx = getStickerIndex('U', g.x, g.y, g.z);
        materials[2].color.setHex(getHexColor(cubeState.U[idx]));
      }
      // D: -Y
      if (g.y === -1) {
        const idx = getStickerIndex('D', g.x, g.y, g.z);
        materials[3].color.setHex(getHexColor(cubeState.D[idx]));
      }
      // F: +Z
      if (g.z === 1) {
        const idx = getStickerIndex('F', g.x, g.y, g.z);
        materials[4].color.setHex(getHexColor(cubeState.F[idx]));
      }
      // B: -Z
      if (g.z === -1) {
        const idx = getStickerIndex('B', g.x, g.y, g.z);
        materials[5].color.setHex(getHexColor(cubeState.B[idx]));
      }
    });
  }, []);

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(10, 15, 12);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xddeeff, 0.8);
    dirLight2.position.set(-10, -10, -12);
    scene.add(dirLight2);

    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    rootGroupRef.current = rootGroup;

    const pivotGroup = new THREE.Group();
    scene.add(pivotGroup);
    pivotGroupRef.current = pivotGroup;

    const arrowGroup = new THREE.Group();
    scene.add(arrowGroup);
    arrowGroupRef.current = arrowGroup;

    // Build 27 cubelets
    const cubelets: THREE.Mesh[] = [];
    const size = 0.96;
    const spacing = 1.0;

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const geom = new THREE.BoxGeometry(size, size, size);
          // 6 materials: R(+X), L(-X), U(+Y), D(-Y), F(+Z), B(-Z)
          const materials = [
            new THREE.MeshStandardMaterial({ color: PLASTIC_COLOR, roughness: 0.25, metalness: 0.1 }),
            new THREE.MeshStandardMaterial({ color: PLASTIC_COLOR, roughness: 0.25, metalness: 0.1 }),
            new THREE.MeshStandardMaterial({ color: PLASTIC_COLOR, roughness: 0.25, metalness: 0.1 }),
            new THREE.MeshStandardMaterial({ color: PLASTIC_COLOR, roughness: 0.25, metalness: 0.1 }),
            new THREE.MeshStandardMaterial({ color: PLASTIC_COLOR, roughness: 0.25, metalness: 0.1 }),
            new THREE.MeshStandardMaterial({ color: PLASTIC_COLOR, roughness: 0.25, metalness: 0.1 }),
          ];

          const mesh = new THREE.Mesh(geom, materials);
          mesh.position.set(x * spacing, y * spacing, z * spacing);
          mesh.userData = { grid: { x, y, z } };
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          rootGroup.add(mesh);
          cubelets.push(mesh);
        }
      }
    }
    cubeletsRef.current = cubelets;
    updateCubeColors(state);

    // Animation Loop
    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
      renderer.dispose();
    };
  }, []);

  // Update colors when state changes (if not in active animation)
  useEffect(() => {
    if (!isAnimatingRef.current) {
      updateCubeColors(state);
    }
  }, [state, updateCubeColors]);

  // Draw 3D curved arrow showing rotation direction
  const updateVisualArrow = useCallback((move: Move | null) => {
    const arrowGroup = arrowGroupRef.current;
    if (!arrowGroup) return;

    while (arrowGroup.children.length > 0) {
      const child = arrowGroup.children[0];
      arrowGroup.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
      if ((child as any).material) (child as any).material.dispose();
    }

    if (!move) return;

    const face = move[0] as FaceName;
    const isPrime = move.endsWith("'");
    const isDouble = move.endsWith('2');

    // Create a circular glowing arc arrow on the corresponding face
    const arcRadius = 1.05;
    const sweep = isDouble ? Math.PI * 1.5 : Math.PI * 0.95;

    const curve = new THREE.EllipseCurve(
      0, 0,
      arcRadius, arcRadius,
      0, isPrime ? -sweep : sweep,
      isPrime,
      0
    );

    const points = curve.getPoints(32);
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 4,
      transparent: true,
      opacity: 0.95
    });

    const line = new THREE.Line(geom, mat);

    // Arrowhead cone
    const coneGeom = new THREE.ConeGeometry(0.18, 0.35, 16);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const cone = new THREE.Mesh(coneGeom, coneMat);

    const lastPt = points[points.length - 1];
    const prevPt = points[points.length - 2];
    cone.position.set(lastPt.x, lastPt.y, 0);

    const dir = new THREE.Vector3(lastPt.x - prevPt.x, lastPt.y - prevPt.y, 0).normalize();
    const angle = Math.atan2(dir.y, dir.x);
    cone.rotation.z = angle - Math.PI / 2;

    const faceArrowHolder = new THREE.Group();
    faceArrowHolder.add(line);
    faceArrowHolder.add(cone);

    const offset = 1.62;
    // Position and orient faceArrowHolder to face outward on the correct side
    switch (face) {
      case 'U': // +Y
        faceArrowHolder.position.set(0, offset, 0);
        faceArrowHolder.rotation.x = -Math.PI / 2;
        break;
      case 'D': // -Y
        faceArrowHolder.position.set(0, -offset, 0);
        faceArrowHolder.rotation.x = Math.PI / 2;
        break;
      case 'F': // +Z
        faceArrowHolder.position.set(0, 0, offset);
        break;
      case 'B': // -Z
        faceArrowHolder.position.set(0, 0, -offset);
        faceArrowHolder.rotation.y = Math.PI;
        break;
      case 'R': // +X
        faceArrowHolder.position.set(offset, 0, 0);
        faceArrowHolder.rotation.y = Math.PI / 2;
        break;
      case 'L': // -X
        faceArrowHolder.position.set(-offset, 0, 0);
        faceArrowHolder.rotation.y = -Math.PI / 2;
        break;
    }

    arrowGroup.add(faceArrowHolder);
  }, []);

  // Handle active Move Animation
  useEffect(() => {
    if (!activeMove || isAnimatingRef.current) {
      updateVisualArrow(activeMove);
      return;
    }

    const rootGroup = rootGroupRef.current;
    const pivotGroup = pivotGroupRef.current;
    if (!rootGroup || !pivotGroup) return;

    isAnimatingRef.current = true;
    updateVisualArrow(activeMove);

    const face = activeMove[0] as FaceName;
    const isPrime = activeMove.endsWith("'");
    const isDouble = activeMove.endsWith('2');

    let targetAngle = isDouble ? Math.PI : Math.PI / 2;
    if (isPrime) targetAngle = -targetAngle;

    // Normal direction of face rotation
    // U (+Y): CW looking down = -Y rotation
    // D (-Y): CW looking up = +Y rotation
    // F (+Z): CW looking at front = -Z rotation
    // B (-Z): CW looking at back = +Z rotation
    // R (+X): CW looking at right = -X rotation
    // L (-X): CW looking at left = +X rotation

    let rotAxis = new THREE.Vector3(0, 1, 0);
    let rotSign = 1;

    switch (face) {
      case 'U':
        rotAxis = new THREE.Vector3(0, 1, 0);
        rotSign = -1;
        break;
      case 'D':
        rotAxis = new THREE.Vector3(0, 1, 0);
        rotSign = 1;
        break;
      case 'R':
        rotAxis = new THREE.Vector3(1, 0, 0);
        rotSign = -1;
        break;
      case 'L':
        rotAxis = new THREE.Vector3(1, 0, 0);
        rotSign = 1;
        break;
      case 'F':
        rotAxis = new THREE.Vector3(0, 0, 1);
        rotSign = -1;
        break;
      case 'B':
        rotAxis = new THREE.Vector3(0, 0, 1);
        rotSign = 1;
        break;
    }

    // Select the 9 cubelets for this slice
    const selectedCubelets: THREE.Mesh[] = [];
    cubeletsRef.current.forEach((mesh) => {
      const g = mesh.userData?.grid;
      if (!g) return;
      let inSlice = false;
      if (face === 'U' && g.y === 1) inSlice = true;
      if (face === 'D' && g.y === -1) inSlice = true;
      if (face === 'R' && g.x === 1) inSlice = true;
      if (face === 'L' && g.x === -1) inSlice = true;
      if (face === 'F' && g.z === 1) inSlice = true;
      if (face === 'B' && g.z === -1) inSlice = true;

      if (inSlice) {
        selectedCubelets.push(mesh);
      }
    });

    // Reset pivot
    pivotGroup.rotation.set(0, 0, 0);
    pivotGroup.position.set(0, 0, 0);

    // Attach selected cubelets to pivot
    selectedCubelets.forEach((m) => pivotGroup.add(m));

    const startTime = performance.now();
    const finalAngle = targetAngle * rotSign;

    // For double turns (180 deg / isDouble), execute as two distinct 90-degree turns
    // with a slight pause/step in between so the user clearly sees the stepped motion.
    const isStepTurn = isDouble;
    const stepDuration = isStepTurn ? speed * 0.75 : speed;
    const pauseDuration = isStepTurn ? Math.max(90, speed * 0.25) : 0;
    const totalDuration = isStepTurn ? stepDuration * 2 + pauseDuration : stepDuration;

    // Helper easing for each 90-deg step
    const stepEase = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const animateSlice = (now: number) => {
      const elapsed = now - startTime;
      let currentAngle = 0;

      if (!isStepTurn) {
        const progress = Math.min(elapsed / totalDuration, 1.0);
        const ease = stepEase(progress);
        currentAngle = finalAngle * ease;
      } else {
        // Double turn: Step 1 (0 to 90 deg), Pause, Step 2 (90 to 180 deg)
        const halfAngle = finalAngle * 0.5;

        if (elapsed < stepDuration) {
          // First 90-deg step
          const p1 = elapsed / stepDuration;
          currentAngle = halfAngle * stepEase(p1);
        } else if (elapsed < stepDuration + pauseDuration) {
          // Brief plateau between steps
          currentAngle = halfAngle;
        } else {
          // Second 90-deg step
          const p2 = Math.min((elapsed - stepDuration - pauseDuration) / stepDuration, 1.0);
          currentAngle = halfAngle + halfAngle * stepEase(p2);
        }
      }

      pivotGroup.setRotationFromAxisAngle(rotAxis, currentAngle);

      if (elapsed < totalDuration) {
        requestAnimationFrame(animateSlice);
      } else {
        // Animation finished: restore cubelets to canonical slots with 0 rotation
        selectedCubelets.forEach((m) => {
          rootGroup.add(m);
          m.rotation.set(0, 0, 0);
          const g = m.userData.grid;
          m.position.set(g.x, g.y, g.z);
        });
        pivotGroup.rotation.set(0, 0, 0);
        isAnimatingRef.current = false;
        updateVisualArrow(null);
        if (onAnimationEnd) onAnimationEnd();
      }
    };

    requestAnimationFrame(animateSlice);
  }, [activeMove, speed, state, updateCubeColors, updateVisualArrow, onAnimationEnd]);

  // Multi-Touch Pinch Zoom and Orbit Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (activePointersRef.current.size === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else if (activePointersRef.current.size === 2) {
      isDraggingRef.current = false;
      const [p1, p2] = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      pinchStartRadiusRef.current = sphericalRef.current.radius;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two finger pinch-to-zoom
    if (activePointersRef.current.size === 2) {
      const [p1, p2] = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (pinchStartDistRef.current && pinchStartDistRef.current > 0 && dist > 10) {
        const factor = pinchStartDistRef.current / dist;
        const newRadius = Math.max(3.8, Math.min(15.0, pinchStartRadiusRef.current * factor));
        sphericalRef.current.radius = newRadius;
        updateCameraPosition();
      }
      return;
    }

    // Single finger or mouse drag orbit
    if (activePointersRef.current.size === 1 && isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };

      const rotSpeed = 0.007;
      sphericalRef.current.theta -= dx * rotSpeed;
      sphericalRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalRef.current.phi - dy * rotSpeed));
      updateCameraPosition();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointersRef.current.delete(e.pointerId);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (activePointersRef.current.size === 1) {
      const remaining = activePointersRef.current.values().next().value;
      if (remaining) {
        lastMousePosRef.current = { x: remaining.x, y: remaining.y };
        isDraggingRef.current = true;
      }
      pinchStartDistRef.current = null;
    } else if (activePointersRef.current.size === 0) {
      isDraggingRef.current = false;
      pinchStartDistRef.current = null;
    }
  };

  // Mouse wheel or trackpad zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.006;
    sphericalRef.current.radius = Math.max(3.8, Math.min(15.0, sphericalRef.current.radius + zoomDelta));
    updateCameraPosition();
  };

  const handleZoom = (delta: number) => {
    sphericalRef.current.radius = Math.max(3.8, Math.min(15.0, sphericalRef.current.radius + delta));
    updateCameraPosition();
  };

  const handleResetView = () => {
    sphericalRef.current = { radius: 7.2, theta: Math.PI / 4, phi: Math.PI / 3 };
    updateCameraPosition();
  };

  const handleAlignToFace = (face: FaceName) => {
    switch (face) {
      case 'F': sphericalRef.current = { radius: 6.8, theta: 0, phi: Math.PI / 2 }; break;
      case 'R': sphericalRef.current = { radius: 6.8, theta: Math.PI / 2, phi: Math.PI / 2 }; break;
      case 'B': sphericalRef.current = { radius: 6.8, theta: Math.PI, phi: Math.PI / 2 }; break;
      case 'L': sphericalRef.current = { radius: 6.8, theta: -Math.PI / 2, phi: Math.PI / 2 }; break;
      case 'U': sphericalRef.current = { radius: 6.8, theta: 0, phi: 0.15 }; break;
      case 'D': sphericalRef.current = { radius: 6.8, theta: 0, phi: Math.PI - 0.15 }; break;
    }
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center select-none touch-none overflow-hidden">
      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
      />

      {/* Orbit & Zoom Quick Controls Floating Overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-10 pointer-events-auto">
        <button
          onClick={handleResetView}
          title="Reset Camera View"
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleZoom(-1.2)}
          title="Zoom In"
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => handleZoom(1.2)}
          title="Zoom Out"
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-lg backdrop-blur-md transition-all active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {activeMove && (
          <button
            onClick={() => handleAlignToFace(activeMove[0] as FaceName)}
            title={`Focus Face ${activeMove[0]}`}
            className="p-2.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white border border-cyan-400/50 shadow-lg backdrop-blur-md transition-all active:scale-95 animate-pulse"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Subtle Orientation Help Badge */}
      <div className="absolute bottom-2 left-3 text-[11px] text-slate-400 bg-slate-950/70 px-2.5 py-1 rounded-full border border-slate-800/80 backdrop-blur-sm pointer-events-none flex items-center gap-1.5">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        <span>Drag to orbit • Pinch or scroll to zoom</span>
      </div>
    </div>
  );
};
