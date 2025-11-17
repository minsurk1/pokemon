import ImpactRoot from "./ImpactRoot";
import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface FireImpactProps {
  onFinish?: () => void;
}

// 🔥 material opacity 안전 적용 함수 (모든 이펙트에서 재사용)
function setOpacitySafe(material: THREE.Material | THREE.Material[], value: number) {
  if (Array.isArray(material)) {
    material.forEach((m) => {
      if ("opacity" in m) {
        (m as THREE.MeshBasicMaterial).transparent = true;
        (m as THREE.MeshBasicMaterial).opacity = value;
      }
    });
  } else {
    if ("opacity" in material) {
      (material as THREE.MeshBasicMaterial).transparent = true;
      (material as THREE.MeshBasicMaterial).opacity = value;
    }
  }
}

export default function FireImpact({ onFinish }: FireImpactProps) {
  const mainFlame = useRef<THREE.Mesh>(null);
  const midFlame = useRef<THREE.Mesh>(null);
  const coreFlame = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    // ===== 메인 큰 불기둥 =====
    if (mainFlame.current) {
      mainFlame.current.scale.set(1 + t * 1.8, 1 + t * 1.8, 1);
      setOpacitySafe(mainFlame.current.material, Math.max(0, 0.8 - t * 1.4));
      mainFlame.current.position.y = Math.sin(t * 18) * 0.05;
    }

    // ===== 중간층 불기둥 =====
    if (midFlame.current) {
      midFlame.current.scale.set(1 + t * 1.4, 1 + t * 1.4, 1);
      setOpacitySafe(midFlame.current.material, Math.max(0, 0.7 - t * 1.8));
      midFlame.current.position.y = Math.sin(t * 22) * 0.06;
    }

    // ===== 코어 불꽃 (뜨거운 중심) =====
    if (coreFlame.current) {
      coreFlame.current.scale.set(1 + t * 2.2, 1 + t * 2.2, 1);
      setOpacitySafe(coreFlame.current.material, Math.max(0, 1 - t * 2.8));
      coreFlame.current.position.y = Math.sin(t * 26) * 0.03;
      coreFlame.current.rotation.z = Math.sin(t * 40) * 0.15;
    }

    // ===== 빛 플래시 =====
    if (flashRef.current) {
      flashRef.current.scale.set(1 + t * 6, 1 + t * 6, 1);
      setOpacitySafe(flashRef.current.material, Math.max(0, 0.55 - t * 2.8));
    }
  });

  return (
    <>
      {/* 공통 기반 이펙트 */}
      <ImpactRoot color="#ff5522" particleColor="#ffaa66" onFinish={onFinish} />

      {/* 🔥 1) 메인 불기둥 */}
      <mesh ref={mainFlame} position={[0, 0, 0.7]}>
        <coneGeometry args={[0.45, 1.4, 32]} />
        <meshBasicMaterial color="#ff7033" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 🔥 2) 중간 불기둥 */}
      <mesh ref={midFlame} position={[0, 0, 0.7]}>
        <coneGeometry args={[0.3, 1.0, 32]} />
        <meshBasicMaterial color="#ffbb55" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 🔥 3) 불꽃 중심 */}
      <mesh ref={coreFlame} position={[0, 0, 0.7]}>
        <coneGeometry args={[0.2, 0.8, 32]} />
        <meshBasicMaterial color="#ffffff" transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ⚡ 4) 플래시 빛 */}
      <mesh ref={flashRef} position={[0, 0, 0.6]}>
        <circleGeometry args={[0.25, 20]} />
        <meshBasicMaterial color="#ffddaa" transparent blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}
