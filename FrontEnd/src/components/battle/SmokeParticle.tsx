import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export default function SmokeParticle() {
  const ref = useRef<THREE.Mesh>(null!);

  const material = new THREE.MeshBasicMaterial({
    color: new THREE.Color(0.55, 0.55, 0.55),
    transparent: true,
    opacity: 0.9,
  });

  const geometry = new THREE.PlaneGeometry(0.35, 0.35);

  let t = 0;

  useFrame((_, delta) => {
    if (!ref.current) return;

    t += delta;

    // 연기가 위로 흩어지는 모션
    ref.current.position.y += delta * 0.15;
    ref.current.position.x += Math.sin(t * 3) * 0.008;

    // 🔥 material이 배열인지 아닌지 체크 후 opacity 감소
    const m = ref.current.material;
    if (Array.isArray(m)) {
      m.forEach((mat) => {
        if ("opacity" in mat) mat.opacity -= delta * 0.4;
      });
    } else {
      if ("opacity" in m) m.opacity -= delta * 0.4;
    }

    // 점점 커짐
    ref.current.scale.x += delta * 0.2;
    ref.current.scale.y += delta * 0.2;
  });

  return <mesh ref={ref} geometry={geometry} material={material} rotation={[0, 0, 0]} />;
}
