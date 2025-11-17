import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";

interface LegendImpactProps {
  onFinish?: () => void;
}

export default function LegendImpact({ onFinish }: LegendImpactProps) {
  /* ----------------------------------
   * Refs
   * ---------------------------------- */
  const coreRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const innerHaloRef = useRef<THREE.Mesh>(null);
  const glyphRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);

  // Light Streaks – Hook 규칙 준수 버전
  const streakRef1 = useRef<THREE.Mesh>(null);
  const streakRef2 = useRef<THREE.Mesh>(null);
  const streakRef3 = useRef<THREE.Mesh>(null);
  const streakRef4 = useRef<THREE.Mesh>(null);
  const streakRef5 = useRef<THREE.Mesh>(null);
  const streakRef6 = useRef<THREE.Mesh>(null);

  const streakRefs = [streakRef1, streakRef2, streakRef3, streakRef4, streakRef5, streakRef6];

  const tRef = useRef(0);

  /* ----------------------------------
   * Animated Glyph Noise
   * ---------------------------------- */
  const glyphNoise = useMemo(() => [...Array(16)].map(() => 0.9 + Math.random() * 0.25), []);

  /* ----------------------------------
   * FRAME UPDATE
   * ---------------------------------- */
  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    /* ---------- 1) Light Beam Core ---------- */
    if (coreRef.current) {
      const mesh = coreRef.current;
      const mat = mesh.material as THREE.MeshBasicMaterial;

      mesh.scale.set(1 + t * 1.1, 2.5 + t * 8.5, 1);
      mat.opacity = Math.max(0, 1 - t * 0.8);

      mesh.position.x = Math.sin(t * 50) * 0.02;
      mesh.position.y = Math.cos(t * 40) * 0.015;
    }

    /* ---------- 2) Inner Pulse Beam ---------- */
    if (pulseRef.current) {
      const mesh = pulseRef.current;
      const mat = mesh.material as THREE.MeshBasicMaterial;

      mesh.scale.set(1 + t * 2.8, 0.3 + Math.sin(t * 15) * 0.12, 1);
      mesh.rotation.z += delta * 1.2;
      mat.opacity = Math.max(0, 0.9 - t * 1.3);
    }

    /* ---------- 3) Halo + Inner Halo ---------- */
    if (haloRef.current) {
      haloRef.current.rotation.z += delta * 1.3;
      haloRef.current.scale.set(1.5 + t * 3, 1.2 + t * 2.1, 1);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.85 - t * 1.4);
    }

    if (innerHaloRef.current) {
      innerHaloRef.current.rotation.z -= delta * 1.8;
      innerHaloRef.current.scale.set(1 + t * 2.2, 1 + t * 2.2, 1);
      const mat = innerHaloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.95 - t * 1.6);
    }

    /* ---------- 4) Animated Glyph (Magic Circle) ---------- */
    if (glyphRef.current) {
      const mesh = glyphRef.current;
      mesh.rotation.z += delta * 1.2;

      // radius 노이즈 적용
      const geo = mesh.geometry as THREE.RingGeometry;
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < 16; i++) {
        const r = 0.35 * glyphNoise[i];
        const angle = (i / 16) * Math.PI * 2;
        pos.setXY(i, Math.cos(angle) * r, Math.sin(angle) * r);
      }
      pos.needsUpdate = true;

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - t * 2.2);
    }

    /* ---------- 5) Light Streaks ---------- */
    streakRefs.forEach((ref, i) => {
      const mesh = ref.current;
      if (!mesh) return;

      const mat = mesh.material as THREE.MeshBasicMaterial;

      const angle = (i / streakRefs.length) * Math.PI * 2 + t * 4;
      const radius = 0.4 + t * 1.8;

      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius;

      mesh.rotation.z += delta * (4 + i);
      mesh.scale.set(0.2 + t * 1.2, 0.05 + t * 0.5, 1);

      mat.opacity = Math.max(0, 1 - t * 3.4);
    });

    /* ---------- 6) Flash Burst ---------- */
    if (flashRef.current) {
      const mesh = flashRef.current;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mesh.scale.set(1 + t * 7, 1 + t * 7, 1);
      mat.opacity = Math.max(0, 0.6 - t * 3.5);
    }

    /* ---------- END ---------- */
    if (t > 0.9) onFinish?.();
  });

  /* ----------------------------------
   * RENDER
   * ---------------------------------- */
  return (
    <>
      {/* Flash Burst */}
      <mesh ref={flashRef} position={[0, 0, 0.59]}>
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="#fff9cc" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Core Beam */}
      <mesh ref={coreRef} position={[0, 0, 0.58]}>
        <planeGeometry args={[0.7, 3]} />
        <meshBasicMaterial color="#fff6aa" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Pulse Beam */}
      <mesh ref={pulseRef} position={[0, 0, 0.571]}>
        <planeGeometry args={[0.4, 1]} />
        <meshBasicMaterial color="#ffffff" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Outer Halo */}
      <mesh ref={haloRef} position={[0, 0, 0.56]}>
        <circleGeometry args={[0.7, 40]} />
        <meshBasicMaterial color="#fff1cc" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Inner Halo */}
      <mesh ref={innerHaloRef} position={[0, 0, 0.55]}>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color="#ffeaa0" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Animated Magic Glyph */}
      <mesh ref={glyphRef} position={[0, 0, 0.53]}>
        <ringGeometry args={[0.15, 0.35, 16]} />
        <meshBasicMaterial color="#fff7d1" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Light Streaks */}
      {streakRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0, 0.59]}>
          <planeGeometry args={[0.18, 0.06]} />
          <meshBasicMaterial color="#ffffff" transparent blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </>
  );
}
