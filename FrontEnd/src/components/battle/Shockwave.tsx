import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Shockwave({ onFinish }: { onFinish: () => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const pRef = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    pRef.current += delta * 2.5; // 속도

    const p = pRef.current;

    // scale: 0 → 2.2
    const scale = THREE.MathUtils.lerp(0, 4.0, p);
    meshRef.current.scale.set(scale, scale, scale);

    // alpha: 0.8 → 0
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = THREE.MathUtils.lerp(0.8, 0, p);

    if (p >= 1) {
      onFinish();
    }
  });

  return (
    <mesh ref={meshRef} rotation-x={-Math.PI / 2} position={[0, 0, 0.01]}>
      <circleGeometry args={[9.0, 40]} />
      <meshBasicMaterial color="white" transparent opacity={0.8} />
    </mesh>
  );
}
