'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CATEGORIES } from '@/lib/categories';

function createClayMaterial(hex: string | number, clearcoat = 0.32) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    roughness: 0.42,
    metalness: 0.04,
    clearcoat,
    clearcoatRoughness: 0.42,
  });
}

export function HeroPolyhedron3D() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 350;
    const height = container.clientHeight || 350;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0.25, 5.8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Warm toy-studio lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.15));

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.55);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const bounceLight = new THREE.PointLight(0x38bdf8, 1.3, 14);
    bounceLight.position.set(-4, -2, 3);
    scene.add(bounceLight);

    // Central Fall-Guys-style Clay Bean Mascot with Golden Crown
    const mascotGroup = new THREE.Group();
    scene.add(mascotGroup);

    // Chubby bean body
    const bodyGeo = new THREE.CapsuleGeometry(0.95, 0.92, 16, 32);
    const bodyMat = createClayMaterial('#FF3D8B', 0.35);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    mascotGroup.add(bodyMesh);

    // Soft cream face visor plate
    const faceGeo = new THREE.SphereGeometry(0.66, 24, 24);
    faceGeo.scale(1.05, 0.78, 0.45);
    const faceMat = createClayMaterial('#FFF5EC', 0.25);
    const faceMesh = new THREE.Mesh(faceGeo, faceMat);
    faceMesh.position.set(0, 0.34, 0.74);
    mascotGroup.add(faceMesh);

    // Cute glossy pill eyes
    const eyeGeo = new THREE.CapsuleGeometry(0.085, 0.14, 8, 16);
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e1b4b,
      roughness: 0.12,
      clearcoat: 0.9,
    });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.22, 0.38, 1.03);
    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.22, 0.38, 1.03);
    mascotGroup.add(leftEye, rightEye);

    // Cute rosy clay cheeks
    const cheekGeo = new THREE.SphereGeometry(0.11, 16, 16);
    cheekGeo.scale(1.2, 0.7, 0.5);
    const cheekMat = createClayMaterial('#FF8FB8', 0.2);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.4, 0.22, 0.97);
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.4, 0.22, 0.97);
    mascotGroup.add(leftCheek, rightCheek);

    // Stubby clay arms
    const armGeo = new THREE.CapsuleGeometry(0.22, 0.45, 10, 16);
    const armMat = createClayMaterial('#FF5DA2', 0.3);
    const leftArm = new THREE.Mesh(armGeo, armMat);
    leftArm.position.set(-1.05, -0.08, 0.1);
    leftArm.rotation.z = 0.65;
    const rightArm = new THREE.Mesh(armGeo, armMat);
    rightArm.position.set(1.05, -0.08, 0.1);
    rightArm.rotation.z = -0.65;
    mascotGroup.add(leftArm, rightArm);

    // Chubby clay feet
    const footGeo = new THREE.CapsuleGeometry(0.24, 0.22, 10, 16);
    const footMat = createClayMaterial('#1CB0F6', 0.35);
    const leftFoot = new THREE.Mesh(footGeo, footMat);
    leftFoot.position.set(-0.42, -1.28, 0.18);
    leftFoot.rotation.x = Math.PI / 2;
    const rightFoot = new THREE.Mesh(footGeo, footMat);
    rightFoot.position.set(0.42, -1.28, 0.18);
    rightFoot.rotation.x = Math.PI / 2;
    mascotGroup.add(leftFoot, rightFoot);

    // Floating 3D Golden Clay Crown on top
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 1.56, 0);
    mascotGroup.add(crownGroup);

    const crownMat = createClayMaterial('#FFB800', 0.55);
    const crownBase = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.12, 14, 28),
      crownMat
    );
    crownBase.rotation.x = Math.PI / 2;
    crownGroup.add(crownBase);

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.36, 12), crownMat);
      tip.position.set(Math.cos(a) * 0.35, 0.2, Math.sin(a) * 0.35);
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), crownMat);
      ball.position.set(Math.cos(a) * 0.35, 0.39, Math.sin(a) * 0.35);
      crownGroup.add(tip, ball);
    }

    // Orbiting Clay Toys (representing the 6 categories)
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    const toyShapes: THREE.BufferGeometry[] = [
      new THREE.TorusGeometry(0.24, 0.11, 14, 24), // Donut
      new THREE.SphereGeometry(0.26, 20, 20), // Ball
      new THREE.CapsuleGeometry(0.16, 0.26, 10, 16), // Pill
      new THREE.BoxGeometry(0.38, 0.38, 0.38), // Toy block
      new THREE.OctahedronGeometry(0.28, 0), // Gem
      new THREE.ConeGeometry(0.25, 0.44, 16), // Party cone
    ];

    const toyMeshes: THREE.Mesh[] = [];
    CATEGORIES.forEach((cat, idx) => {
      const angle = (idx / CATEGORIES.length) * Math.PI * 2;
      const toy = new THREE.Mesh(toyShapes[idx], createClayMaterial(cat.color, 0.4));
      toy.position.set(
        Math.cos(angle) * 2.25,
        Math.sin(angle * 2) * 0.48,
        Math.sin(angle) * 2.25
      );
      orbitGroup.add(toy);
      toyMeshes.push(toy);
    });

    let targetRotX = 0.08;
    let targetRotY = 0;

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetRotY = nx * 0.55;
      targetRotX = ny * 0.32;
    };

    container.addEventListener('pointermove', handlePointerMove);

    let frameId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      mascotGroup.rotation.y += (targetRotY + Math.sin(t * 0.9) * 0.25 - mascotGroup.rotation.y) * 0.06;
      mascotGroup.rotation.x += (targetRotX - mascotGroup.rotation.x) * 0.06;
      // Squish & bounce idle animation
      const bounce = Math.abs(Math.sin(t * 2.1));
      mascotGroup.position.y = bounce * 0.14 - 0.06;
      mascotGroup.scale.set(
        1 + (1 - bounce) * 0.03,
        1 - (1 - bounce) * 0.03,
        1 + (1 - bounce) * 0.03
      );

      crownGroup.rotation.y = t * 1.1;
      crownGroup.position.y = 1.54 + Math.sin(t * 2.6) * 0.06;

      orbitGroup.rotation.y = -t * 0.42;
      orbitGroup.rotation.z = Math.sin(t * 0.5) * 0.1;
      toyMeshes.forEach((toy, idx) => {
        toy.rotation.x = t * 1.1 + idx;
        toy.rotation.y = t * 0.8 + idx;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 350;
      const h = container.clientHeight || 350;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      container.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-[340px] w-full sm:h-[420px] cursor-grab active:cursor-grabbing select-none overflow-visible"
      aria-label="Boneco 3D estilo massinha com coroa e brinquedos das 6 categorias"
    />
  );
}
