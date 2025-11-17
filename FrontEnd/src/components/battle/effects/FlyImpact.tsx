import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface FlyImpactProps {
  onFinish?: () => void;
}

// 🔧 Material opacity 안전 처리
function setOpacitySafe(mat: THREE.Material | THREE.Material[], value: number) {
  if (Array.isArray(mat)) {
    mat.forEach((m) => {
      if ("opacity" in m) {
        (m as THREE.MeshBasicMaterial).transparent = true;
        (m as THREE.MeshBasicMaterial).opacity = value;
      }
    });
  } else {
    if ("opacity" in mat) {
      (mat as THREE.MeshBasicMaterial).transparent = true;
      (mat as THREE.MeshBasicMaterial).opacity = value;
    }
  }
}

export default function FlyImpact({ onFinish }: FlyImpactProps) {
  const windRingRef = useRef<THREE.Mesh>(null);
  const updraftRef = useRef<THREE.Mesh>(null);

  const featherRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    // ================================
    // ① 바람 링 (Wind Ring)
    // ================================
    if (windRingRef.current) {
      const mesh = windRingRef.current;

      mesh.scale.set(1 + t * 3.5, 1 + t * 3.5, 1);
      mesh.rotation.z += delta * 4;

      setOpacitySafe(mesh.material, Math.max(0, 1 - t * 2.2));
    }

    // ================================
    // ② 상승 기류 Updraft (Air Pulse)
    // ================================
    if (updraftRef.current) {
      const mesh = updraftRef.current;

      mesh.position.y = t * 0.3;
      mesh.scale.set(1 + t * 2.5, 1 + t * 4, 1);

      setOpacitySafe(mesh.material, Math.max(0, 0.7 - t * 2.0));
    }

    // ================================
    // ③ 깃털 파편 4개 (Feathers)
    // ================================
    featherRefs.forEach((ref, i) => {
      if (!ref.current) return;

      const mesh = ref.current;
      const angle = t * 4 + i * 1.5;

      const radius = 0.15 + t * 1.4;

      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius + t * 0.25;

      mesh.rotation.z += delta * (3 + i);

      const scale = Math.max(0, 0.2 + t * 0.3);
      mesh.scale.set(scale, scale * 0.6, 1);

      setOpacitySafe(mesh.material, Math.max(0, 1 - t * 3));
    });

    // ================================
    // 종료
    // ================================
    if (t > 0.55) onFinish && onFinish();
  });

  return (
    <>
      {/* 🌀 ① 바람의 회오리 링 */}
      <mesh ref={windRingRef} position={[0, 0, 0.56]}>
        <ringGeometry args={[0.12, 0.35, 32]} />
        <meshBasicMaterial color="#c8f1ff" transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 🪽 ② 상승 기류 (기둥 형태) */}
      <mesh ref={updraftRef} position={[0, 0, 0.55]}>
        <planeGeometry args={[0.45, 1.0]} />
        <meshBasicMaterial color="#e6fcff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 🪶 ③ 깃털 파편 4개 */}
      {featherRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0, 0.58]}>
          <planeGeometry args={[0.22, 0.12]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </>
  );
}
