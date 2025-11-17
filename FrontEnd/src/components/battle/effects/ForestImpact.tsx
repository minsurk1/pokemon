import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface ForestImpactProps {
  onFinish?: () => void;
}

// 🔧 안전한 material opacity 처리
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

export default function ForestImpact({ onFinish }: ForestImpactProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);

  const leaf1Ref = useRef<THREE.Mesh>(null);
  const leaf2Ref = useRef<THREE.Mesh>(null);
  const leaf3Ref = useRef<THREE.Mesh>(null);

  const pollenRef = useRef<THREE.Mesh>(null);

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    // ================================
    // ① 초록 Shockwave
    // ================================
    if (ringRef.current) {
      ringRef.current.scale.set(1 + t * 4.5, 1 + t * 4.5, 1);
      ringRef.current.rotation.z += delta * 1.5;
      setOpacitySafe(ringRef.current.material, Math.max(0, 1 - t * 2));
    }

    // ================================
    // ② Aura Pulse
    // ================================
    if (pulseRef.current) {
      pulseRef.current.scale.set(1 + t * 6, 1 + t * 6, 1);
      setOpacitySafe(pulseRef.current.material, Math.max(0, 0.6 - t * 1.8));
    }

    // ================================
    // ③ 잎사귀 3개
    // ================================
    const leafs = [
      { ref: leaf1Ref, baseX: 0.12, baseY: 0.05, rot: 12 },
      { ref: leaf2Ref, baseX: -0.1, baseY: 0.07, rot: -15 },
      { ref: leaf3Ref, baseX: 0.05, baseY: -0.08, rot: 18 },
    ];

    leafs.forEach((leaf, i) => {
      const mesh = leaf.ref.current;
      if (!mesh) return;

      mesh.position.x = Math.cos(t * 4 + i) * 0.18 + leaf.baseX;
      mesh.position.y = Math.sin(t * 5 + i) * 0.18 + leaf.baseY;

      mesh.rotation.z += delta * leaf.rot;

      mesh.scale.set(0.3 + t * 1.2, 0.3 + t * 1.2, 1);

      setOpacitySafe(mesh.material, Math.max(0, 1 - t * 3));
    });

    // ================================
    // ④ 꽃가루(Pollen)
    // ================================
    if (pollenRef.current) {
      pollenRef.current.scale.set(1 + t * 4, 1 + t * 4, 1);

      setOpacitySafe(pollenRef.current.material, Math.max(0, 0.45 - t * 1.5));

      // 더 자연스러운 수평 풍동
      pollenRef.current.position.x = Math.sin(t * 7) * 0.06;
      pollenRef.current.position.y = Math.cos(t * 5) * 0.06;
    }

    // ================================
    // 종료
    // ================================
    if (t > 0.55) onFinish && onFinish();
  });

  return (
    <>
      {/* 🌿 ① 초록 Shockwave */}
      <mesh ref={ringRef} position={[0, 0, 0.55]}>
        <ringGeometry args={[0.15, 0.45, 32]} />
        <meshBasicMaterial color={"#7cf27f"} transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 🌱 ② Aura Pulse */}
      <mesh ref={pulseRef} position={[0, 0, 0.54]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color={"#6de16a"} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* 🍃 ③ 잎사귀 3개 */}
      <mesh ref={leaf1Ref} position={[0, 0, 0.58]}>
        <planeGeometry args={[0.18, 0.28]} />
        <meshBasicMaterial color={"#4bec5a"} transparent opacity={1} />
      </mesh>

      <mesh ref={leaf2Ref} position={[0, 0, 0.58]}>
        <planeGeometry args={[0.18, 0.28]} />
        <meshBasicMaterial color={"#56dd65"} transparent opacity={1} />
      </mesh>

      <mesh ref={leaf3Ref} position={[0, 0, 0.58]}>
        <planeGeometry args={[0.18, 0.28]} />
        <meshBasicMaterial color={"#52e95c"} transparent opacity={1} />
      </mesh>

      {/* 🌼 ④ 꽃가루 */}
      <mesh ref={pollenRef} position={[0, 0, 0.57]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color={"#f7f3a5"} transparent opacity={0.45} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}
