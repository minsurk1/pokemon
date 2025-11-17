import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface ElectricImpactProps {
  onFinish?: () => void;
}

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

    // ===== 중앙 번개 플래시 =====
    if (coreFlash.current) {
      const s = 1 + t * 6;
      coreFlash.current.scale.set(s, s, s);

      const flashOpacity = Math.max(0, 1 - t * 2.0);
      setOpacitySafe(coreFlash.current.material, flashOpacity);
    }

    // ===== 전기 스파크 =====
    sparksRef.current.forEach((mesh, i) => {
      if (!mesh) return;

      const angle = (i / sparkCount) * Math.PI * 2;
      const speed = 3.5; // 더 빠르게 확산

      mesh.position.x = Math.cos(angle) * speed * t;
      mesh.position.y = Math.sin(angle) * speed * t;
      mesh.position.z = 0.55;

      // 가늘고 긴 번개 모양
      const scale = Math.max(0, 1.0 - t * 1.5);
      mesh.scale.set(scale, scale * 0.25, 1);

      // 깜박임
      const opacity = Math.max(0, 1 - t * 2.0);
      setOpacitySafe(mesh.material, opacity);

      // jitter (진동)
      mesh.rotation.z = Math.sin(t * 70 + i) * 0.5;
    });

    // ===== 끝 =====
    if (t > 0.55) onFinish?.();
  });

  return (
    <>
      {/* 중앙 플래시 */}
      <mesh
        ref={coreFlash}
        position={[0, 0, 0.55]}
        rotation-x={-Math.PI / 2} // 바닥면 보이도록
      >
        <circleGeometry args={[0.35, 32]} />
        <meshBasicMaterial color="#ffffff" transparent blending={THREE.AdditiveBlending} opacity={1} />
      </mesh>

      {/* 전기 스파크 */}
      {Array.from({ length: sparkCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (sparksRef.current[i] = el!)}
          position={[0, 0, 0.55]}
          rotation-x={-Math.PI / 2} // 바닥에서 튀는 느낌
        >
          <planeGeometry args={[1.2, 0.25]} /> {/* 더 크고 잘 보이게 */}
          <meshBasicMaterial color="#88ccff" transparent blending={THREE.AdditiveBlending} opacity={1} />
        </mesh>
      ))}
    </>
  );
}
