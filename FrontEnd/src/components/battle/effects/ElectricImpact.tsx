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
      const s = 1 + t * 4.0;
      coreFlash.current.scale.set(s, s, s);

      const flashOpacity = Math.max(0, 1 - t * 2.0);
      setOpacitySafe(coreFlash.current.material, flashOpacity);
    }

    // ===== 전기 스파크 =====
    sparksRef.current.forEach((mesh, i) => {
      if (!mesh) return;

      const angle = (i / sparkCount) * Math.PI * 2;
      const speed = 3.2;

      mesh.position.x = Math.cos(angle) * speed * t;
      mesh.position.y = Math.sin(angle) * speed * t;
      mesh.position.z = 0.01; // ✔ Shockwave 기준 높이 맞춤

      const scale = Math.max(0, 0.7 - t * 1.5);
      mesh.scale.set(scale, scale * 0.25, 1);

      const opacity = Math.max(0, 1 - t * 2.0);
      setOpacitySafe(mesh.material, opacity);

      mesh.rotation.z = Math.sin(t * 70 + i) * 0.4;
    });

    // ===== 종료 =====
    if (t > 0.45) onFinish?.();
  });

  return (
    <>
      {/* 중앙 플래시 */}
      <mesh ref={coreFlash} position={[0, 0, 0.01]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#fff9a8" transparent blending={THREE.AdditiveBlending} opacity={1} />
      </mesh>

      {/* 전기 스파크 */}
      {Array.from({ length: sparkCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (sparksRef.current[i] = el!)}
          position={[0, 0, 0.01]} // ✔ Shockwave와 동일 높이
        >
          <planeGeometry args={[1.0, 0.22]} />
          <meshBasicMaterial color="#fff200" transparent blending={THREE.AdditiveBlending} opacity={1} />
        </mesh>
      ))}
    </>
  );
}
