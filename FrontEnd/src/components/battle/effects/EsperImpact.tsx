import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

interface EsperImpactProps {
  onFinish?: () => void;
}

// 🔧 Material opacity 안전 처리
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

export default function EsperImpact({ onFinish }: EsperImpactProps) {
  const rippleRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const resonance1Ref = useRef<THREE.Mesh>(null);
  const resonance2Ref = useRef<THREE.Mesh>(null);

  const fragRefs = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];

  const dustRef = useRef<THREE.Mesh>(null);

  const tRef = useRef(0);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    // =============================
    // ① 공간 왜곡 Shockwave
    // =============================
    if (rippleRef.current) {
      rippleRef.current.scale.set(1 + t * 4.5, 1 + t * 4.5, 1);
      setOpacitySafe(rippleRef.current.material, Math.max(0, 1 - t * 1.8));
      rippleRef.current.rotation.z += delta * 3;
    }

    // =============================
    // ② 에너지 Pulse
    // =============================
    if (pulseRef.current) {
      pulseRef.current.scale.set(1 + t * 6, 1 + t * 6, 1);
      setOpacitySafe(pulseRef.current.material, Math.max(0, 0.7 - t * 2));
      pulseRef.current.rotation.z -= delta * 2;
    }

    // =============================
    // ③ 공명 링 1
    // =============================
    if (resonance1Ref.current) {
      const s = 0.8 + t * 3;
      resonance1Ref.current.scale.set(s, s * 1.05, 1);
      setOpacitySafe(resonance1Ref.current.material, Math.max(0, 0.9 - t * 2.2));
      resonance1Ref.current.rotation.z += delta * 5;
    }

    // =============================
    // ④ 공명 링 2
    // =============================
    if (resonance2Ref.current) {
      const s = 0.9 + t * 3.5;
      resonance2Ref.current.scale.set(s * 1.1, s * 0.9, 1);
      setOpacitySafe(resonance2Ref.current.material, Math.max(0, 0.7 - t * 2.3));
      resonance2Ref.current.rotation.z -= delta * 4;
    }

    // =============================
    // ⑤ 에너지 파편
    // =============================
    fragRefs.forEach((ref, idx) => {
      if (!ref.current) return;

      const mesh = ref.current;
      const spread = 0.15 + t * 1.5;

      mesh.position.x = Math.cos(t * 7 + idx) * spread;
      mesh.position.y = Math.sin(t * 9 + idx) * spread;

      mesh.rotation.z += delta * (4 + idx);

      const scale = 0.18 + t * 0.9;
      mesh.scale.set(scale, scale, 1);

      setOpacitySafe(mesh.material, Math.max(0, 1 - t * 3.2));
    });

    // =============================
    // ⑥ Psy-dust (부유하는 가루)
    // =============================
    if (dustRef.current) {
      dustRef.current.scale.set(1 + t * 4, 1 + t * 4, 1);
      setOpacitySafe(dustRef.current.material, Math.max(0, 0.5 - t * 1.4));
      dustRef.current.position.y = t * 0.15;
    }

    // =============================
    // 종료
    // =============================
    if (t > 0.55) onFinish && onFinish();
  });

  return (
    <>
      {/* ① 공간 왜곡 Shockwave */}
      <mesh ref={rippleRef} position={[0, 0, 0.55]}>
        <ringGeometry args={[0.15, 0.42, 40]} />
        <meshBasicMaterial color="#d69fff" transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ② 에너지 Pulse */}
      <mesh ref={pulseRef} position={[0, 0, 0.54]}>
        <circleGeometry args={[0.22, 28]} />
        <meshBasicMaterial color="#b366ff" transparent opacity={1} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ③ 공명 링 1 */}
      <mesh ref={resonance1Ref} position={[0, 0, 0.56]}>
        <ringGeometry args={[0.12, 0.28, 32]} />
        <meshBasicMaterial color="#e7c2ff" transparent opacity={0.9} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ④ 공명 링 2 */}
      <mesh ref={resonance2Ref} position={[0, 0, 0.56]}>
        <ringGeometry args={[0.1, 0.25, 20]} />
        <meshBasicMaterial color="#c48aff" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* ⑤ 에너지 파편 */}
      {fragRefs.map((ref, idx) => (
        <mesh key={idx} ref={ref} position={[0, 0, 0.6]}>
          <planeGeometry args={[0.22, 0.12]} />
          <meshBasicMaterial color="#e4b9ff" transparent opacity={1} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}

      {/* ⑥ Psy-dust */}
      <mesh ref={dustRef} position={[0, 0, 0.58]}>
        <circleGeometry args={[0.18, 18]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
    </>
  );
}
