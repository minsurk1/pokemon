import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface LandImpactProps {
  onFinish?: () => void;
}

// 🔧 안전 opacity
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

export default function LandImpact({ onFinish }: LandImpactProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const crackRef = useRef<THREE.Mesh>(null);
  const dustRef = useRef<THREE.Mesh>(null);

  const debrisRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    // ======================================================
    // ① Shockwave Ring (묵직한 진동)
    // ======================================================
    if (ringRef.current) {
      const mesh = ringRef.current;
      mesh.scale.set(1 + t * 4.2, 1 + t * 4.2, 1);
      mesh.rotation.z += delta * 1.2;

      setOpacitySafe(mesh.material, Math.max(0, 1 - t * 1.3));
    }

    // ======================================================
    // ② 지면 균열(흙색 각진 링)
    // ======================================================
    if (crackRef.current) {
      const mesh = crackRef.current;
      mesh.scale.set(0.7 + t * 3.8, 0.7 + t * 3.8, 1);

      // 지면이 벌어지듯 회전
      mesh.rotation.z -= delta * 1.8;

      setOpacitySafe(mesh.material, Math.max(0, 0.95 - t * 2.2));
    }

    // ======================================================
    // ③ 흙 먼지 Mist
    // ======================================================
    if (dustRef.current) {
      const mesh = dustRef.current;
      const s = 1 + t * 5.5;

      mesh.scale.set(s, s, 1);
      mesh.position.x = Math.sin(t * 15) * 0.07;
      mesh.position.y = Math.cos(t * 10) * 0.05;

      setOpacitySafe(mesh.material, Math.max(0, 0.6 - t * 0.9));
    }

    // ======================================================
    // ④ 흙 파편 3개 튀기기 (Debris)
    // ======================================================
    debrisRefs.forEach((ref, i) => {
      const mesh = ref.current;
      if (!mesh) return;

      const angle = t * (4 + i * 0.4);
      const radius = 0.15 + t * 1.6;

      mesh.position.x = Math.cos(angle + i) * radius;
      mesh.position.y = Math.sin(angle * 1.3 + i) * radius;

      mesh.rotation.z += delta * (3 + i);
      mesh.scale.set(0.18 + t * 1.6, 0.18 + t * 1.6, 1);

      setOpacitySafe(mesh.material, Math.max(0, 1 - t * 3.2));
    });

    // ======================================================
    // 종료 타이밍
    // ======================================================
    if (t > 0.55 && onFinish) onFinish();
  });

  return (
    <>
      {/* ① 묵직한 충격 파동 링 */}
      <mesh ref={ringRef} position={[0, 0, 0.56]}>
        <ringGeometry args={[0.18, 0.55, 32]} />
        <meshBasicMaterial color="#e7d9a3" transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ② 땅 균열 */}
      <mesh ref={crackRef} position={[0, 0, 0.54]}>
        <ringGeometry args={[0.22, 0.63, 10]} />
        <meshBasicMaterial color="#8a6a39" transparent opacity={1} blending={THREE.NormalBlending} />
      </mesh>

      {/* ③ 큰 먼지 */}
      <mesh ref={dustRef} position={[0, 0, 0.53]}>
        <circleGeometry args={[0.32, 18]} />
        <meshBasicMaterial color="#a98c64" transparent opacity={0.45} blending={THREE.NormalBlending} />
      </mesh>

      {/* ④ 흙 파편 Debris 3개 */}
      {debrisRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0, 0.57]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshBasicMaterial color="#c2ab7d" transparent opacity={1} />
        </mesh>
      ))}
    </>
  );
}
