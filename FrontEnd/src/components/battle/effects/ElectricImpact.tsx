import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

interface ElectricImpactProps {
  onFinish?: () => void;
}

// 재사용 가능한 opacity 안전 적용 함수
function setOpacitySafe(mat: THREE.Material | THREE.Material[], opacity: number) {
  if (Array.isArray(mat)) {
    mat.forEach((m) => {
      if ("opacity" in m) {
        (m as THREE.MeshBasicMaterial).transparent = true;
        (m as THREE.MeshBasicMaterial).opacity = opacity;
      }
    });
  } else {
    if ("opacity" in mat) {
      (mat as THREE.MeshBasicMaterial).transparent = true;
      (mat as THREE.MeshBasicMaterial).opacity = opacity;
    }
  }
}

export default function ElectricImpact({ onFinish }: ElectricImpactProps) {
  const coreFlash = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.Mesh[]>([]);
  const sparkCount = 6;

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    // ===== ⚡ 중앙 번개 플래시 (강한 빛) =====
    if (coreFlash.current) {
      coreFlash.current.scale.set(1 + t * 4, 1 + t * 4, 1);

      const flashOpacity = Math.max(0, 0.9 - t * 3.5);
      setOpacitySafe(coreFlash.current.material, flashOpacity);
    }

    // ===== ⚡ 튀는 전기 스파크 =====
    sparksRef.current.forEach((mesh, i) => {
      if (!mesh) return;

      const angle = (i / sparkCount) * Math.PI * 2;
      const speed = 2.8; // 빠르게 흩어짐

      const dx = Math.cos(angle) * speed * t;
      const dy = Math.sin(angle) * speed * t;

      mesh.position.set(dx, dy, 0.57);

      const scale = Math.max(0, 0.4 - t * 0.4);
      mesh.scale.set(scale, scale * 0.4, 1); // 전기라 가늘고 길게

      // 스파크 깜박임
      const opacity = Math.max(0, 1 - t * 3);
      setOpacitySafe(mesh.material, opacity);

      // 전기 흔들림 jitter
      mesh.rotation.z = Math.sin(t * 80 + i) * 0.6;
    });

    // ===== 제거 =====
    if (t > 0.35) onFinish && onFinish();
  });

  return (
    <>
      {/* ⚡ 중앙 번개 플래시 */}
      <mesh ref={coreFlash} position={[0, 0, 0.57]}>
        <circleGeometry args={[0.3, 20]} />
        <meshBasicMaterial color="#ffffff" transparent blending={THREE.AdditiveBlending} opacity={1} />
      </mesh>

      {/* ⚡ 튀는 전기 스파크들 */}
      {Array.from({ length: sparkCount }).map((_, i) => (
        <mesh key={i} ref={(el) => (sparksRef.current[i] = el!)} position={[0, 0, 0.57]}>
          <planeGeometry args={[0.5, 0.15]} />
          <meshBasicMaterial color="#88ccff" transparent blending={THREE.AdditiveBlending} opacity={1} />
        </mesh>
      ))}
    </>
  );
}
