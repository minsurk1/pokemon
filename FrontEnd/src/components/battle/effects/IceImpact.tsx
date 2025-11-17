import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface IceImpactProps {
  onFinish?: () => void;
}

// 🔧 안전한 material opacity 처리 함수
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

export default function IceImpact({ onFinish }: IceImpactProps) {
  const coreRef = useRef<THREE.Mesh>(null);
  const shardRef = useRef<THREE.Mesh>(null);
  const mistRef = useRef<THREE.Mesh>(null);

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    // ===========================
    // ① 중앙 Core (얼음 폭발의 중심)
    // ===========================
    if (coreRef.current) {
      const mesh = coreRef.current;

      // 중심 확산
      mesh.scale.set(0.6 + t * 2.6, 0.6 + t * 2.6, 1);

      // 색감 변화 — 차가운 푸른빛 → 밝은 얼음빛
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHSL(0.55, 1, 0.5 + t * 0.25);

      // 자연스러운 fade-out
      setOpacitySafe(mat, Math.max(0, 1 - t * 1.5));

      // 얼음 특유의 진동
      mesh.position.x = Math.sin(t * 40) * 0.015;
      mesh.position.y = Math.cos(t * 32) * 0.015;
    }

    // ===========================
    // ② 얼음 Shards (날카로운 파편)
    // ===========================
    if (shardRef.current) {
      const mesh = shardRef.current;

      const radius = 0.25 + t * 1.5;

      // 사방으로 빠르게 흩날림
      mesh.position.x = Math.cos(t * 8) * radius;
      mesh.position.y = Math.sin(t * 10) * radius;

      mesh.rotation.z += delta * 7;

      const scale = 0.3 + t * 2.0;
      mesh.scale.set(scale, scale, 1);

      setOpacitySafe(mesh.material, Math.max(0, 0.9 - t * 1.8));
    }

    // ===========================
    // ③ 냉기 Mist (차갑게 퍼지는 서리)
    // ===========================
    if (mistRef.current) {
      const mesh = mistRef.current;

      const ms = 1 + t * 3.5;
      mesh.scale.set(ms, ms, 1);

      mesh.position.x = Math.sin(t * 12) * 0.02;
      mesh.position.y = Math.cos(t * 10) * 0.02;

      setOpacitySafe(mesh.material, Math.max(0, 0.7 - t * 1.1));
    }

    // ===========================
    // 종료
    // ===========================
    if (t > 0.6) onFinish && onFinish();
  });

  return (
    <>
      {/* ① 얼음 폭발 Core */}
      <mesh ref={coreRef} position={[0, 0, 0.56]}>
        <circleGeometry args={[0.35, 24]} />
        <meshBasicMaterial color={"#88ccff"} transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ② 날카로운 얼음 파편 */}
      <mesh ref={shardRef} position={[0, 0, 0.57]}>
        <coneGeometry args={[0.15, 0.35, 10]} />
        <meshBasicMaterial color={"#cceeff"} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ③ 퍼져나가는 냉기 Mist */}
      <mesh ref={mistRef} position={[0, 0, 0.55]}>
        <circleGeometry args={[0.45, 20]} />
        <meshBasicMaterial color={"#e6f7ff"} transparent opacity={0.7} blending={THREE.AdditiveBlending} />
      </mesh>
    </>
  );
}
