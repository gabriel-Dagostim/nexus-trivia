'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CATEGORIES } from '@/lib/categories';
import { soundEngine } from '@/lib/sound';
import { BoltIcon, CategoryIcon, CrownIcon } from './GameIcons';

interface TriviaWheel3DProps {
  spinId: number;
  targetSector: number; // 0..5 categories, 6 = Coroa Especial
  isSpinning: boolean;
  canSpin: boolean;
  onSpinClick: () => void;
  onSpinComplete?: () => void;
}

const SECTOR_COLORS = [
  ...CATEGORIES.map((c) => c.color),
  '#FFB800', // 6 = Coroa Especial (Ouro Massinha)
];

function drawVectorSectorGlyph(ctx: CanvasRenderingContext2D, key: string, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(20, 18, 41, 0.55)';
  ctx.shadowBlur = 5;

  switch (key) {
    case 'pop': {
      // Star burst
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const outer = ((i * 72 - 90) * Math.PI) / 180;
        const inner = (((i * 72 + 36) - 90) * Math.PI) / 180;
        if (i === 0) ctx.moveTo(Math.cos(outer) * 20, Math.sin(outer) * 20);
        else ctx.lineTo(Math.cos(outer) * 20, Math.sin(outer) * 20);
        ctx.lineTo(Math.cos(inner) * 9, Math.sin(inner) * 9);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'historia': {
      // Hourglass
      ctx.beginPath();
      ctx.moveTo(-14, -17);
      ctx.lineTo(14, -17);
      ctx.lineTo(0, 0);
      ctx.lineTo(14, 17);
      ctx.lineTo(-14, 17);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.stroke();
      break;
    }
    case 'geografia': {
      // Compass
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(6, 0);
      ctx.lineTo(0, 12);
      ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'arte': {
      // Diamond brush / palette
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-6, -5, 3.5, 0, Math.PI * 2);
      ctx.arc(6, -5, 3.5, 0, Math.PI * 2);
      ctx.arc(0, 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'ciencia': {
      // Atom orbitals
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 8, 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(0, 0, 19, 8, -0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'esportes': {
      // Trophy
      ctx.beginPath();
      ctx.moveTo(-12, -15);
      ctx.lineTo(12, -15);
      ctx.lineTo(9, 2);
      ctx.lineTo(-9, 2);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.lineTo(0, 14);
      ctx.moveTo(-9, 14);
      ctx.lineTo(9, 14);
      ctx.stroke();
      break;
    }
    default: {
      // Crown
      ctx.beginPath();
      ctx.moveTo(-18, 13);
      ctx.lineTo(-18, -8);
      ctx.lineTo(-8, 2);
      ctx.lineTo(0, -14);
      ctx.lineTo(8, 2);
      ctx.lineTo(18, -8);
      ctx.lineTo(18, 13);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

function createSectorLabelTexture(label: string, sectorKey: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 256, 128);
  drawVectorSectorGlyph(ctx, sectorKey, 128, 42);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(20, 18, 41, 0.55)';
  ctx.shadowBlur = 6;
  ctx.fillText(label.toUpperCase(), 128, 96);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function TriviaWheel3D({
  spinId,
  targetSector,
  isSpinning,
  canSpin,
  onSpinClick,
  onSpinComplete,
}: TriviaWheel3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const wheelGroupRef = useRef<THREE.Group | null>(null);
  const animStateRef = useRef<{
    spinning: boolean;
    startTime: number;
    duration: number;
    startAngle: number;
    endAngle: number;
    lastTickSector: number;
    completedSpinId: number;
  }>({
    spinning: false,
    startTime: 0,
    duration: 3400,
    startAngle: 0,
    endAngle: 0,
    lastTickSector: -1,
    completedSpinId: 0,
  });

  const onSpinCompleteRef = useRef(onSpinComplete);

  useEffect(() => {
    onSpinCompleteRef.current = onSpinComplete;
  }, [onSpinComplete]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, -1.0, 5.25);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Toybox studio lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.1));
    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.55);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0xff70a9, 1.1, 15);
    fillLight.position.set(-4, -3, 4);
    scene.add(fillLight);

    const wheelGroup = new THREE.Group();
    wheelGroupRef.current = wheelGroup;
    scene.add(wheelGroup);

    const totalSectors = 7;
    const sectorAngle = (Math.PI * 2) / totalSectors;
    const radius = 1.95;

    // Puffy clay-beveled 3D sectors
    for (let i = 0; i < totalSectors; i++) {
      const startA = i * sectorAngle - sectorAngle / 2 + Math.PI / 2;
      const endA = startA + sectorAngle;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, radius, startA, endA, false);
      shape.lineTo(0, 0);

      const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 0.26,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.04,
        bevelSegments: 4,
      });

      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(SECTOR_COLORS[i]),
        roughness: 0.4,
        metalness: 0.04,
        clearcoat: 0.35,
        clearcoatRoughness: 0.42,
      });

      const mesh = new THREE.Mesh(extrudeGeo, mat);
      mesh.position.z = -0.13;
      wheelGroup.add(mesh);

      // Sector label
      const midA = (startA + endA) / 2;
      const label = i < 6 ? CATEGORIES[i].shortName : 'COROA';
      const sectorKey = i < 6 ? CATEGORIES[i].id : 'coroa';
      const tex = createSectorLabelTexture(label, sectorKey);
      const planeGeo = new THREE.PlaneGeometry(0.95, 0.48);
      const planeMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
      });
      const labelMesh = new THREE.Mesh(planeGeo, planeMat);
      labelMesh.position.set(Math.cos(midA) * 1.24, Math.sin(midA) * 1.24, 0.21);
      labelMesh.rotation.z = midA - Math.PI / 2;
      wheelGroup.add(labelMesh);

      // Chunky white marshmallow clay peg at boundary
      const pegGeo = new THREE.SphereGeometry(0.095, 16, 16);
      const pegMat = new THREE.MeshPhysicalMaterial({
        color: 0xfff8f0,
        roughness: 0.32,
        clearcoat: 0.4,
      });
      const peg = new THREE.Mesh(pegGeo, pegMat);
      peg.position.set(
        Math.cos(startA) * (radius - 0.03),
        Math.sin(startA) * (radius - 0.03),
        0.18
      );
      wheelGroup.add(peg);
    }

    // Thick creamy clay outer donut ring
    const rimGeo = new THREE.TorusGeometry(radius + 0.07, 0.14, 18, 64);
    const rimMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.36,
      clearcoat: 0.38,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.z = 0.02;
    wheelGroup.add(rim);

    // Center squishy clay hub + golden star/crown gem
    const hubGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.4, 28);
    const hubMat = new THREE.MeshPhysicalMaterial({
      color: 0xfff8f0,
      roughness: 0.34,
      clearcoat: 0.45,
    });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.z = 0.1;
    wheelGroup.add(hub);

    const gemGeo = new THREE.OctahedronGeometry(0.27, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0xffb800,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.2,
      roughness: 0.25,
      clearcoat: 0.7,
    });
    const gem = new THREE.Mesh(gemGeo, gemMat);
    gem.position.z = 0.34;
    wheelGroup.add(gem);

    // Chunky bouncy red clay pointer
    const pointerGeo = new THREE.ConeGeometry(0.22, 0.48, 16);
    const pointerMat = new THREE.MeshPhysicalMaterial({
      color: 0xff3d8b,
      roughness: 0.3,
      clearcoat: 0.5,
    });
    const pointer = new THREE.Mesh(pointerGeo, pointerMat);
    pointer.rotation.z = Math.PI;
    pointer.position.set(0, radius + 0.3, 0.28);
    scene.add(pointer);

    let frameId = 0;

    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      const anim = animStateRef.current;

      gem.rotation.y = now * 0.0022;
      gem.rotation.x = now * 0.0014;

      if (anim.spinning) {
        const elapsed = now - anim.startTime;
        const progress = Math.min(1, elapsed / anim.duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        const currentAngle = anim.startAngle + (anim.endAngle - anim.startAngle) * eased;
        wheelGroup.rotation.z = currentAngle;

        const normalized = ((-currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const currentTickSector = Math.floor(normalized / sectorAngle);
        if (currentTickSector !== anim.lastTickSector) {
          anim.lastTickSector = currentTickSector;
          soundEngine.playTick();
          pointer.rotation.x = -0.32;
        } else {
          pointer.rotation.x *= 0.82;
        }

        if (progress >= 1) {
          anim.spinning = false;
          pointer.rotation.x = 0;
          onSpinCompleteRef.current?.();
        }
      } else {
        wheelGroup.rotation.x = Math.sin(now * 0.0012) * 0.055;
        wheelGroup.rotation.y = Math.cos(now * 0.0009) * 0.065;
      }

      renderer.render(scene, camera);
    };

    frameId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 340;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (spinId <= 0 || !wheelGroupRef.current) return;
    const anim = animStateRef.current;
    if (anim.completedSpinId === spinId) return;

    anim.completedSpinId = spinId;
    const sectorAngle = (Math.PI * 2) / 7;
    const currentZ = wheelGroupRef.current.rotation.z;
    const desiredMod = ((-targetSector * sectorAngle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const currentMod = ((currentZ % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    let delta = desiredMod - currentMod;
    if (delta <= 0) delta += Math.PI * 2;
    const fullSpins = 5 * Math.PI * 2;

    anim.startAngle = currentZ;
    anim.endAngle = currentZ + fullSpins + delta;
    anim.startTime = performance.now();
    anim.duration = 3300;
    anim.lastTickSector = -1;
    anim.spinning = true;
    soundEngine.playSpinStart();
  }, [spinId, targetSector]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        ref={mountRef}
        className="relative h-[290px] w-full max-w-[360px] sm:h-[340px] select-none"
      />
      <button
        type="button"
        disabled={!canSpin || isSpinning}
        onClick={onSpinClick}
        className={`inline-flex items-center gap-2.5 px-9 py-4 font-display text-base sm:text-lg font-bold tracking-wide ${
          canSpin && !isSpinning
            ? 'clay-btn-primary cursor-pointer'
            : 'clay-inset px-9 py-4 text-[var(--fg-muted)] opacity-75 cursor-not-allowed'
        }`}
      >
        <BoltIcon className="h-5 w-5" />
        {isSpinning ? 'Girando a Roleta 3D...' : canSpin ? 'Girar Roleta 3D!' : 'Aguardando turno...'}
      </button>

      {/* Squishy Clay Sector Pills */}
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {CATEGORIES.map((cat) => (
          <span
            key={cat.id}
            className={`clay-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold ${cat.badgeBg}`}
          >
            <CategoryIcon id={cat.id} className="h-3.5 w-3.5" />
            <span>{cat.shortName}</span>
          </span>
        ))}
        <span className="clay-pill inline-flex items-center gap-1.5 rounded-full border-amber-400/50 bg-amber-400/20 px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
          <CrownIcon className="h-3.5 w-3.5 text-[#FFB800]" />
          <span>Coroa</span>
        </span>
      </div>
    </div>
  );
}
