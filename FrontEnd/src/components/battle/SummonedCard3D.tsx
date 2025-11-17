import { useRef, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Card } from "../../types/Card";

interface SummonedCard3DProps {
  card: Card;
  getCardRect: () => DOMRect | undefined;
  owner: "me" | "enemy";
}

export default function SummonedCard3D({ card, owner }: SummonedCard3DProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const glbPath = `/assets/models/${card.cardType}tier${card.tier}.glb`;
  const { scene } = useGLTF(glbPath);

  useEffect(() => {
    if (!groupRef.current) return;

    // 카드의 정중앙 위 약간 위쪽
    groupRef.current.position.set(0, 0, 0.55);

    // 크기 유지
    groupRef.current.scale.set(1.9, 1.9, 1.9);

    // 🔥 오른쪽 위 → 왼쪽 아래 방향으로 내려다보는 시점
    groupRef.current.rotation.set(
      THREE.MathUtils.degToRad(20), // 위에서 아래
      THREE.MathUtils.degToRad(-25), // 오른쪽에서 왼쪽 방향
      0
    );
  }, [owner]);

  return (
    <group ref={groupRef}>
      <primitive object={scene.clone()} />
    </group>
  );
}
