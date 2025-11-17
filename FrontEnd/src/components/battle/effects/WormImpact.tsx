import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface WormImpactProps {
  onFinish?: () => void;
}

export default function WormImpact({ onFinish }: WormImpactProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const fogRef = useRef<THREE.Mesh>(null);

  const spurtRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  const shardRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  const dripRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    /* ==================================================
     * ① 독 Shockwave (초록→보라)
     * ================================================== */
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;

      ringRef.current.scale.set(1 + t * 3.8, 1 + t * 3.8, 1);
      ringRef.current.rotation.z += delta * 2.2;

      // 초록 → 보라 변색
      mat.color.setHSL(0.28 - t * 0.18, 1, 0.55);
      mat.opacity = Math.max(0, 1 - t * 1.7);
    }

    /* ==================================================
     * ② 독 Fog (지독한 보라 구름)
     * ================================================== */
    if (fogRef.current) {
      const mat = fogRef.current.material as THREE.MeshBasicMaterial;

      fogRef.current.scale.set(1 + t * 3.5, 1 + t * 3.5, 1);
      fogRef.current.rotation.z += delta * 0.8;
      fogRef.current.position.y = t * 0.12;

      mat.opacity = Math.max(0, 0.55 - t * 0.85);
    }

    /* ==================================================
     * ③ 끈적한 점액 Spurts (3개)
     * ================================================== */
    spurtRefs.forEach((ref, idx) => {
      if (!ref.current) return;
      const mat = ref.current.material as THREE.MeshBasicMaterial;

      const w = ref.current;

      w.scale.set(0.3 + t * 2.2, 0.12 + t * 1.5, 1);
      w.rotation.z = Math.sin(t * 20 + idx * 1.5) * 0.45;
      w.position.x = Math.sin(t * 8 + idx * 0.8) * 0.16;
      w.position.y = Math.cos(t * 6 + idx * 0.5) * 0.1;

      mat.opacity = Math.max(0, 1 - t * 2.4);
    });

    /* ==================================================
     * ④ 벌레 껍질 Shards (4개)
     * ================================================== */
    shardRefs.forEach((ref, idx) => {
      if (!ref.current) return;
      const mat = ref.current.material as THREE.MeshBasicMaterial;

      const w = ref.current;
      const radius = 0.22 + t * 1.6;

      w.position.x = Math.cos(t * 5 + idx) * radius;
      w.position.y = Math.sin(t * 7 + idx) * radius;

      w.rotation.z += delta * (2.5 + idx * 0.6);
      w.scale.set(0.18 + t * 0.9, 0.18 + t * 0.9, 1);

      // 점점 회색으로 → 부패 느낌
      mat.color.setHSL(0.22 + t * 0.4, 0.7 - t * 0.6, 0.6 - t * 0.4);

      mat.opacity = Math.max(0, 1 - t * 3.1);
    });

    /* ==================================================
     * ⑤ Acid Drip (점액 방울 3개)
     * ================================================== */
    dripRefs.forEach((ref, i) => {
      if (!ref.current) return;
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      const w = ref.current;

      const angle = i * 2.1 + t * 6;
      const radius = 0.08 + t * 0.9;

      w.position.x = Math.cos(angle) * radius;
      w.position.y = Math.sin(angle) * radius - t * 0.1; // 약간 떨어짐

      w.scale.set(0.15 + t * 0.7, 0.15 + t * 0.7, 1);
      w.rotation.z += delta * 4;

      mat.opacity = Math.max(0, 0.9 - t * 2.8);
    });

    /* ==================================================
     * END
     * ================================================== */
    if (t > 0.65 && onFinish) onFinish();
  });

  return (
    <>
      {/* Shockwave */}
      <mesh ref={ringRef} position={[0, 0, 0.55]}>
        <ringGeometry args={[0.12, 0.45, 32]} />
        <meshBasicMaterial color={"#82ff5e"} transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 독 Fog */}
      <mesh ref={fogRef} position={[0, 0, 0.52]}>
        <circleGeometry args={[0.32, 30]} />
        <meshBasicMaterial color={"#b56cff"} transparent opacity={0.55} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 점액 Spurts */}
      {spurtRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0, 0.58]}>
          <planeGeometry args={[0.35, 0.15]} />
          <meshBasicMaterial color={"#9bff73"} transparent opacity={1} blending={THREE.NormalBlending} />
        </mesh>
      ))}

      {/* 벌레 껍데기 파편 */}
      {shardRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0, 0.6]}>
          <planeGeometry args={[0.22, 0.26]} />
          <meshBasicMaterial color={"#c6ffac"} transparent opacity={1} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}

      {/* Acid Drip (추가) */}
      {dripRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0, 0.56]}>
          <circleGeometry args={[0.12, 12]} />
          <meshBasicMaterial color={"#b8ff90"} transparent opacity={1} />
        </mesh>
      ))}
    </>
  );
}
