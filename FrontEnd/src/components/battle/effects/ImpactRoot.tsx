// ImpactRoot.tsx
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

import { EffectComposer, Bloom, ChromaticAberration } from "@react-three/postprocessing";

interface ImpactRootProps {
  color?: string;
  particleColor?: string;
  onFinish?: () => void;
}

export default function ImpactRoot({ color = "#ffffff", particleColor = "#ffffff", onFinish }: ImpactRootProps) {
  const shockRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const crackRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.InstancedMesh>(null);

  const tRef = useRef(0);

  // particle 개수
  const COUNT = 60;

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // 각 particle 방향/속도
  const dirs = useMemo(() => {
    return [...Array(COUNT)].map(() => {
      const a = Math.random() * Math.PI * 2;
      const s = 1 + Math.random() * 1.7;
      return { a, s };
    });
  }, []);

  useFrame((_, delta) => {
    tRef.current += delta;
    const t = tRef.current;

    /* -------------------------------------------------
     * 1) SHOCKWAVE
     * ------------------------------------------------- */
    if (shockRef.current) {
      const mat = shockRef.current.material as THREE.MeshBasicMaterial;

      shockRef.current.scale.set(1 + t * 5, 1 + t * 5, 1);
      mat.opacity = Math.max(0, 0.95 - t * 2.4);
    }

    /* -------------------------------------------------
     * 2) CRACK (noise ring 느낌)
     * ------------------------------------------------- */
    if (crackRef.current) {
      const mat = crackRef.current.material as THREE.MeshBasicMaterial;
      crackRef.current.scale.set(1 + t * 3, 1 + t * 3, 1);
      crackRef.current.rotation.z += delta * 0.8;
      mat.opacity = Math.max(0, 0.8 - t * 2.0);
    }

    /* -------------------------------------------------
     * 3) AURA
     * ------------------------------------------------- */
    if (auraRef.current) {
      const mat = auraRef.current.material as THREE.MeshBasicMaterial;

      const pulsate = 1 + Math.sin(t * 18) * 0.15;

      const s = (1 + t * 3) * pulsate;
      auraRef.current.scale.set(s, s, 1);

      mat.opacity = Math.max(0, 0.7 - t * 1.4);
    }

    /* -------------------------------------------------
     * 4) PARTICLES (잔광 형태)
     * ------------------------------------------------- */
    if (particlesRef.current) {
      dirs.forEach((d, i) => {
        const dx = Math.cos(d.a) * d.s * t;
        const dy = Math.sin(d.a) * d.s * t;

        dummy.position.set(dx, dy, 0.55 + t * 0.18);

        // 잔광처럼 찌그러뜨림
        const sc = Math.max(0, 1 - t * 2.2);
        dummy.scale.set(0.12, 0.35 * sc, 1);

        dummy.rotation.z = d.a + t * 4;

        dummy.updateMatrix();
        particlesRef.current!.setMatrixAt(i, dummy.matrix);
      });

      particlesRef.current.instanceMatrix.needsUpdate = true;
    }

    /* -------------------------------------------------
     * 5) 종료
     * ------------------------------------------------- */
    if (t > 0.55) onFinish?.();
  });

  return (
    <>
      {/* POSTPROCESSING */}
      <EffectComposer>
        <Bloom intensity={1.3} luminanceThreshold={0.25} />
        <ChromaticAberration offset={[0.0012, 0.0012]} />
      </EffectComposer>

      {/* Shockwave */}
      <mesh ref={shockRef} position={[0, 0, 0.54]}>
        <ringGeometry args={[0.08, 0.42, 40]} />
        <meshBasicMaterial color={color} transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Crack / Noise ring */}
      <mesh ref={crackRef} position={[0, 0, 0.53]}>
        <ringGeometry args={[0.12, 0.47, 20]} />
        <meshBasicMaterial color={"#222"} transparent />
      </mesh>

      {/* Aura */}
      <mesh ref={auraRef} position={[0, 0, 0.56]}>
        <circleGeometry args={[0.19, 24]} />
        <meshBasicMaterial color={color} transparent blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Particles */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, COUNT]}>
        <planeGeometry args={[0.06, 0.16]} /> {/* 잔광 느낌 */}
        <meshBasicMaterial color={particleColor} transparent blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </>
  );
}
