import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface PoisonImpactProps {
  onFinish?: () => void;
}

export default function PoisonImpact({ onFinish }: PoisonImpactProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const gasRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  const dropRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    /* ===============================
     * ① Toxic Core (중앙 독 구슬)
     * =============================== */
    if (coreRef.current) {
      const m = coreRef.current.material as THREE.MeshBasicMaterial;

      coreRef.current.scale.set(0.55 + t * 2.5, 0.55 + t * 2.5, 1);
      m.opacity = Math.max(0, 1 - t * 1.3);

      // 초록 → 독보라 → 흰색
      const hue = 0.33 + t * 0.2;
      m.color.setHSL(hue, 1, 0.5);

      // 독 구슬 진동
      coreRef.current.position.x = Math.sin(t * 25) * 0.03;
      coreRef.current.position.y = Math.cos(t * 18) * 0.03;
    }

    /* ===============================
     * ② Gas Cloud (휘몰아치는 독안개)
     * =============================== */
    if (gasRef.current) {
      const m = gasRef.current.material as THREE.MeshBasicMaterial;

      gasRef.current.scale.set(1 + t * 4.5, 1 + t * 4.5, 1);
      m.opacity = Math.max(0, 0.75 - t * 1.1);

      gasRef.current.rotation.z = Math.sin(t * 8) * 0.25; // 더 흐름 느낌
    }

    /* ===============================
     * ③ Poison Pulse Ring (충격파)
     * =============================== */
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshBasicMaterial;

      ringRef.current.scale.set(1 + t * 3.8, 1 + t * 3.8, 1);
      m.opacity = Math.max(0, 0.9 - t * 2.5);

      ringRef.current.rotation.z += delta * 2;
    }

    /* ===============================
     * ④ Toxic Droplets (3방향 독 방울)
     * =============================== */
    dropRefs.forEach((ref, i) => {
      const mesh = ref.current;
      if (!mesh) return;

      const m = mesh.material as THREE.MeshBasicMaterial;

      // 각기 다른 방향으로 튀기기
      const angle = (i / dropRefs.length) * Math.PI * 2 + t * 3;
      const dist = 0.15 + t * 1.4;

      mesh.position.x = Math.cos(angle) * dist;
      mesh.position.y = Math.sin(angle) * dist;

      mesh.rotation.z += delta * (5 + i);
      mesh.scale.set(0.2 + t * 1.8, 0.2 + t * 1.8, 1);

      m.opacity = Math.max(0, 1 - t * 2.2);
    });

    /* ===============================
     * 종료
     * =============================== */
    if (t > 0.65 && onFinish) onFinish();
  });

  return (
    <>
      {/* Poison Pulse Ring */}
      <mesh ref={ringRef} position={[0, 0, 0.55]}>
        <ringGeometry args={[0.15, 0.48, 32]} />
        <meshBasicMaterial color={"#bb66ff"} transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Toxic Core */}
      <mesh ref={coreRef} position={[0, 0, 0.56]}>
        <circleGeometry args={[0.32, 24]} />
        <meshBasicMaterial color={"#55ff99"} transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Gas Cloud */}
      <mesh ref={gasRef} position={[0, 0, 0.54]}>
        <circleGeometry args={[0.45, 28]} />
        <meshBasicMaterial color={"#9955ff"} transparent opacity={0.75} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Toxic Droplets (3개) */}
      {dropRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0, 0.58]}>
          <coneGeometry args={[0.14, 0.32, 10]} />
          <meshBasicMaterial color={"#88ffcc"} transparent opacity={1} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </>
  );
}
