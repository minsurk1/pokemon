import { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import SmokeParticle from "./SmokeParticle";
import * as THREE from "three";
import { Card } from "../../types/Card";

interface SummonedCard3DProps {
  card: Card;
  getCardRect: () => DOMRect | undefined;
  owner: "me" | "enemy";
  isMyTurn: boolean;
  isHit: boolean;
  isDestroyed: boolean; // 🔥 추가
}

export default function SummonedCard3D({ card, owner, isMyTurn, isHit, isDestroyed }: SummonedCard3DProps) {
  const groupRef = useRef<THREE.Group>(null!);

  // ⚡ legend 타입 전용 tier 매핑
  const legendTierMap: Record<string, number> = {
    디아루가: 1,
    펄기아: 2,
    기라티나: 3,
    제크로무: 4,
    큐레무: 5,
    레쿠쟈: 6,
    아르세우스: 7,
    // 필요한 만큼 계속 추가
  };

  // ─────────────────────────────

  // card.cardType 안전 처리
  const rawType = (card.cardType ?? "").toLowerCase();
  const isLegend = rawType.includes("legend");

  // 🔥 safeTier 계산
  let safeTier = isLegend
    ? legendTierMap[card.name] ?? 1 // 이름 기반 real tier 선택
    : card.tier;

  // 🔥 typeFolder 설정
  const typeFolder = isLegend ? "legend" : rawType;
  // 🔥 최종 glb 경로
  const glbPath = `/assets/models/${typeFolder}tier${safeTier}.glb`;
  const { scene } = useGLTF(glbPath);

  // 🔥 파괴 후 파티클 띄우기 여부
  const [showSmoke, setShowSmoke] = useState(false);

  // 기본 자세 (scale 제거)
  useEffect(() => {
    if (!groupRef.current) return;

    groupRef.current.position.set(0, 0, 0.55);
    groupRef.current.rotation.set(THREE.MathUtils.degToRad(20), THREE.MathUtils.degToRad(-25), 0);
  }, []);

  // 3D 모델 크기 자동 정규화 + 추가 배율
  useEffect(() => {
    if (!scene || !groupRef.current) return;

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);

    const desiredSize = 1.4;
    const maxAxis = Math.max(size.x, size.y, size.z);

    const scaleFactor = desiredSize / maxAxis;

    // 🔥 추가 배율(전체적으로 약간 크게) ★★크기 조정은 여기서★★
    const finalScale = scaleFactor * 2.8;

    groupRef.current.scale.set(finalScale, finalScale, finalScale);
  }, [scene]);

  // 회색 필터 적용 (owner + isMyTurn 조건 기반)
  useEffect(() => {
    const shouldGray = owner === "me" && !isMyTurn;

    scene.traverse((child: any) => {
      if (!child.isMesh) return;

      const mats = Array.isArray(child.material) ? child.material : [child.material];

      mats.forEach((mat: THREE.Material) => {
        // 색상 처리
        if ("color" in mat) {
          (mat as any).color.setRGB(shouldGray ? 0.4 : 1, shouldGray ? 0.4 : 1, shouldGray ? 0.4 : 1);
        }

        // 투명도 처리
        if ("opacity" in mat) {
          (mat as any).transparent = true;
          (mat as any).opacity = shouldGray ? 0.7 : 1;
        }
      });
    });
  }, [isMyTurn, owner, scene]);

  // 애니메이션 상태 저장 (프레임마다 리셋되지 않도록)
  const hitPowerRef = useRef(0);
  const lastHitRef = useRef(false);
  const destroyProgressRef = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime();

    // ===== 피격 애니메이션 =====
    if (isHit && !lastHitRef.current) {
      hitPowerRef.current = 0.35;
      lastHitRef.current = true;
    }
    if (!isHit) lastHitRef.current = false;

    if (hitPowerRef.current > 0) {
      groupRef.current.position.z = 0.55 + hitPowerRef.current;
      hitPowerRef.current *= 0.75;
    } else {
      groupRef.current.position.z = 0.55;
    }

    // ===== 내 턴 애니메이션 =====
    if (isMyTurn) {
      groupRef.current.position.y = Math.sin(t * 2.4) * 0.05;
      groupRef.current.rotation.z = Math.sin(t * 1.8) * 0.04;
    } else {
      groupRef.current.position.y *= 0.8;
      groupRef.current.rotation.z *= 0.8;
    }

    // ===== 파괴 애니메이션 =====
    if (isDestroyed) {
      destroyProgressRef.current += delta * 1.5;

      const scale = THREE.MathUtils.lerp(1.9, 0, destroyProgressRef.current);
      groupRef.current.scale.set(scale, scale, scale);

      groupRef.current.position.z = 0.55 + destroyProgressRef.current * 0.6;

      if (destroyProgressRef.current > 0.2 && !showSmoke) {
        setShowSmoke(true);
      }
    }
  });

  return (
    <>
      <group ref={groupRef}>{!isDestroyed && <primitive object={scene.clone()} />}</group>

      {/* 🔥 3D 모델이 사라져도 연기가 독립적으로 남도록 group 밖에서 렌더링 */}
      {showSmoke &&
        [...Array(6)].map((_, i) => (
          <group key={i} position={[0, 0, 0.55]}>
            <SmokeParticle />
          </group>
        ))}
    </>
  );
}
