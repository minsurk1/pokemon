import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface NormalImpactProps {
  onFinish?: () => void;
}

export default function NormalImpact({ onFinish }: NormalImpactProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  const burstRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.Mesh>(null);

  const dustRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    // ===================================
    // ① Shockwave Ring 1 (가장 강한 링)
    // ===================================
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshBasicMaterial;

      ringRef.current.scale.set(1 + t * 4, 1 + t * 4, 1);
      ringRef.current.rotation.z += delta * 4;
      m.opacity = Math.max(0, 1 - t * 2);
    }

    // ===================================
    // ② Shockwave Ring 2 (두 번째 충격파)
    // ===================================
    if (ring2Ref.current) {
      const m = ring2Ref.current.material as THREE.MeshBasicMaterial;

      ring2Ref.current.scale.set(1 + t * 3, 1 + t * 3, 1);
      ring2Ref.current.rotation.z -= delta * 3;
      m.opacity = Math.max(0, 0.8 - t * 2.2);
    }

    // ===================================
    // ③ Burst Air Slice (압력파)
    // ===================================
    if (burstRef.current) {
      const m = burstRef.current.material as THREE.MeshBasicMaterial;

      burstRef.current.scale.set(0.6 + t * 4.5, 0.2 + t * 1.5, 1);
      burstRef.current.rotation.z = Math.sin(t * 30) * 0.2;
      m.opacity = Math.max(0, 0.9 - t * 1.8);
    }

    // ===================================
    // ④ Flash (순간 번쩍임)
    // ===================================
    if (flashRef.current) {
      const m = flashRef.current.material as THREE.MeshBasicMaterial;
      flashRef.current.scale.set(1 + t * 6, 1 + t * 6, 1);
      m.opacity = Math.max(0, 0.6 - t * 3.5);
    }

    // ===================================
    // ⑤ Dust Particles (파편 5개)
    // ===================================
    dustRefs.forEach((ref, i) => {
      const mesh = ref.current;
      if (!mesh) return;

      const m = mesh.material as THREE.MeshBasicMaterial;
      const angle = (i / dustRefs.length) * Math.PI * 2 + t * (2 + i);
      const radius = 0.1 + t * 1.8;

      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius;

      mesh.rotation.z += delta * (4 + i);

      const scale = 0.15 + t * 1.2;
      mesh.scale.set(scale, scale, 1);

      m.opacity = Math.max(0, 1 - t * 3.0);
    });

    // ===================================
    // Finish
    // ===================================
    if (t > 0.55 && onFinish) onFinish();
  });

  return (
    <>
      {/* ① 가장 강한 Shockwave Ring */}
      <mesh ref={ringRef} position={[0, 0, 0.55]}>
        <ringGeometry args={[0.15, 0.55, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ② 두 번째 Shockwave Ring */}
      <mesh ref={ring2Ref} position={[0, 0, 0.56]}>
        <ringGeometry args={[0.18, 0.48, 20]} />
        <meshBasicMaterial color="#dddddd" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ③ 압력파 Burst */}
      <mesh ref={burstRef} position={[0, 0, 0.56]}>
        <planeGeometry args={[0.7, 0.22]} />
        <meshBasicMaterial color="#eeeeee" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ④ 순간 플래시 */}
      <mesh ref={flashRef} position={[0, 0, 0.57]}>
        <circleGeometry args={[0.25, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ⑤ Dust Particles */}
      {dustRefs.map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, 0, 0.58]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshBasicMaterial color="#cccccc" transparent opacity={1} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </>
  );
}
