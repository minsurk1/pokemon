import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";

interface WaterImpactProps {
  onFinish?: () => void;
}

export default function WaterImpact({ onFinish }: WaterImpactProps) {
  const shockwaveRef = useRef<THREE.Mesh>(null);
  const burstRef = useRef<THREE.Mesh>(null);
  const mistRef = useRef<THREE.Mesh>(null);

  const dropletRefs = useRef<THREE.Mesh[]>([]);
  const [drops] = useState(() => Array.from({ length: 6 }));

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    /* ===============================
     * ① Shockwave (표면 물결 파동)
     * =============================== */
    if (shockwaveRef.current) {
      const mat = shockwaveRef.current.material as THREE.MeshBasicMaterial;

      shockwaveRef.current.scale.set(1 + t * 3.8, 1 + t * 3.8, 1);
      mat.opacity = Math.max(0, 0.9 - t * 1.7);

      shockwaveRef.current.rotation.z += delta * 2;
    }

    /* ===============================
     * ② Central Water Burst
     * =============================== */
    if (burstRef.current) {
      const mat = burstRef.current.material as THREE.MeshBasicMaterial;

      const scale = 0.6 + t * 4.0;
      burstRef.current.scale.set(scale, scale, 1);

      // 물결 흔들림
      burstRef.current.position.y = Math.sin(t * 20) * 0.05;

      mat.opacity = Math.max(0, 1 - t * 1.4);
    }

    /* ===============================
     * ③ Droplet Shards (물방울 파편)
     * =============================== */
    dropletRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;

      const angle = (i / drops.length) * Math.PI * 2;
      const dist = t * 1.8 + 0.2;

      mesh.position.x = Math.cos(angle) * dist;
      mesh.position.y = Math.sin(angle) * dist;

      mesh.scale.set(0.2 + t * 1.2, 0.2 + t * 1.2, 1);
      mesh.rotation.z += delta * 6;

      mat.opacity = Math.max(0, 1 - t * 2.7);
    });

    /* ===============================
     * ④ Mist Cloud (흰 물안개)
     * =============================== */
    if (mistRef.current) {
      const mat = mistRef.current.material as THREE.MeshBasicMaterial;

      mistRef.current.scale.set(1 + t * 3, 1 + t * 3, 1);

      mat.opacity = Math.max(0, 0.5 - t * 1.0);
      mistRef.current.position.x = Math.sin(t * 15) * 0.04;
    }

    /* ===============================
     * END
     * =============================== */
    if (t > 0.6 && onFinish) onFinish();
  });

  return (
    <>
      {/* Shockwave */}
      <mesh ref={shockwaveRef} position={[0, 0, 0.55]}>
        <ringGeometry args={[0.15, 0.5, 32]} />
        <meshBasicMaterial color={"#99ddff"} transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Central Water Burst */}
      <mesh ref={burstRef} position={[0, 0, 0.57]}>
        <circleGeometry args={[0.28, 24]} />
        <meshBasicMaterial color={"#66ccff"} transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Water Mist */}
      <mesh ref={mistRef} position={[0, 0, 0.54]}>
        <circleGeometry args={[0.4, 20]} />
        <meshBasicMaterial color={"#ffffff"} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Droplet Shards (6개) */}
      {drops.map((_, i) => (
        <mesh key={i} ref={(el) => (dropletRefs.current[i] = el!)} position={[0, 0, 0.58]}>
          <circleGeometry args={[0.12, 10]} />
          <meshBasicMaterial color={"#aeeaff"} transparent opacity={1} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </>
  );
}
