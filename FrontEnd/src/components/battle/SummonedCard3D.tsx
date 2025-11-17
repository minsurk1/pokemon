import { useRef, useEffect, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import SmokeParticle from "./SmokeParticle";
import Shockwave from "./Shockwave";
import * as THREE from "three";
import { Card } from "../../types/Card";

import FireImpact from "./effects/FireImpact";
import WaterImpact from "./effects/WaterImpact";
import ElectricImpact from "./effects/ElectricImpact";
import IceImpact from "./effects/IceImpact";
import PoisonImpact from "./effects/PoisonImpact";
import LegendImpact from "./effects/LegendImpact";

import LandImpact from "./effects/LandImpact";
import FlyImpact from "./effects/FlyImpact";
import ForestImpact from "./effects/ForestImpact";
import WormImpact from "./effects/WormImpact";
import EsperImpact from "./effects/EsperImpact";

interface SummonedCard3DProps {
  card: Card;
  getCardRect: () => DOMRect | undefined;
  owner: "me" | "enemy";
  isMyTurn: boolean;
  isHit: boolean;
  isDestroyed: boolean; // 🔥 추가
}

// 🔥 타입 문자열 정규화 (불완전, 대소문자, "_type", "Legendary" 전부 커버)
const normalizeType = (t: string) => {
  if (!t) return "normal";

  t = t.toLowerCase().trim(); // 🔥 trim 추가 — 매우 중요!

  if (t.includes("legend")) return "legend";
  if (t.includes("fire") || t.includes("불")) return "fire";
  if (t.includes("water") || t.includes("물")) return "water";
  if (t.includes("electric") || t.includes("전기")) return "electric";
  if (t.includes("ice") || t.includes("얼음")) return "ice";
  if (t.includes("poison") || t.includes("독")) return "poison";

  if (t.includes("land") || t.includes("땅")) return "land";
  if (t.includes("fly") || t.includes("비행")) return "fly";
  if (t.includes("forest") || t.includes("풀")) return "forest";
  if (t.includes("worm") || t.includes("벌레")) return "worm";
  if (t.includes("esper") || t.includes("에스퍼")) return "esper";

  return "normal";
};

const ImpactByType = (type: string, onFinish: () => void) => {
  switch (type) {
    case "fire":
      return <FireImpact onFinish={onFinish} />;
    case "water":
      return <WaterImpact onFinish={onFinish} />;
    case "electric":
      return <ElectricImpact onFinish={onFinish} />;
    case "ice":
      return <IceImpact onFinish={onFinish} />;
    case "poison":
      return <PoisonImpact onFinish={onFinish} />;
    case "legend":
      return <LegendImpact onFinish={onFinish} />;

    case "land":
      return <LandImpact onFinish={onFinish} />;
    case "fly":
      return <FlyImpact onFinish={onFinish} />;
    case "forest":
      return <ForestImpact onFinish={onFinish} />;
    case "worm":
      return <WormImpact onFinish={onFinish} />;
    case "esper":
      return <EsperImpact onFinish={onFinish} />;

    default:
      return <Shockwave onFinish={onFinish} />; // 기본값
  }
};

export default function SummonedCard3D({ card, owner, isMyTurn, isHit, isDestroyed }: SummonedCard3DProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const loggedImpactRef = useRef(false);

  const impactElementRef = useRef<JSX.Element | null>(null);

  useEffect(() => {
    console.log("🔥 cardType:", card.cardType, "→ normalize:", rawType);
  }, [card.cardType]);

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

  // card.cardType 안전 처리
  const rawType = normalizeType(card.cardType ?? "");
  const isLegend = rawType === "legend";
  console.log("🟡 normalizeType 결과 =", rawType);

  useEffect(() => {
    console.log("💡 Impact Selection Check");
    console.log("    - rawType:", `"${rawType}"`);
    console.log("    - card.cardType:", `"${card.cardType}"`);
    console.log("    - normalize(card.cardType):", `"${normalizeType(card.cardType || "")}"`);

    const selected = ImpactByType(rawType, () => {});
    console.log("    - Selected Component:", selected.type?.name || selected.type);
  }, [rawType]);

  // 🔥 safeTier 계산
  let safeTier = isLegend
    ? legendTierMap[card.name] ?? 1 // 이름 기반 real tier 선택
    : card.tier;

  // 🔥 여기 추가
  console.log("🟡 tier =", safeTier, " typeof =", typeof safeTier);

  // 🔥 typeFolder 설정
  const typeFolder = isLegend ? "legend" : rawType;
  // 🔥 최종 glb 경로
  const glbPath = `/assets/models/${typeFolder}tier${safeTier}.glb`;
  // 🔥 여기 추가
  console.log("🟡 최종 GLB PATH =", glbPath);

  const { scene } = useGLTF(glbPath);

  // 🔥 파괴 후 파티클 띄우기 여부
  const [showSmoke, setShowSmoke] = useState(false);

  // 소환 애니메이션 관련 변수 저장
  const spawnProgressRef = useRef(0); // 0 → 1로 증가
  const baseScaleRef = useRef(1);
  const [showShockwave, setShowShockwave] = useState(false);

  // 🔥 NEW: 이펙트 위치 동기화용 ref
  const effectGroupRef = useRef<THREE.Group>(null!);

  // 기본 자세 (scale 제거)
  useEffect(() => {
    if (!groupRef.current) return;

    // ⭐ 초기 착지 위치 정확히 설정
    groupRef.current.position.set(0, 0, 0.55);

    groupRef.current.rotation.set(THREE.MathUtils.degToRad(20), THREE.MathUtils.degToRad(-25), 0);

    // ⭐ Y 위치는 떨어지는 애니메이션에서 조절할 것이므로 처음엔 0
    groupRef.current.position.y = 0;
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

    // 전체 배율
    const finalScale = scaleFactor * 2.5;

    // ⭐ 원래 크기 저장
    baseScaleRef.current = finalScale;

    // ⭐ 소환 애니메이션 시작점 (뒤쪽)
    groupRef.current.position.z = -0.8;

    // ⭐ scale=0부터 시작 → 팡! 효과 가능
    groupRef.current.scale.set(0, 0, 0);
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

  // 🔥 카드 바닥 높이 저장
  const modelBottomRef = useRef(0);

  useEffect(() => {
    if (!scene) return;

    const box = new THREE.Box3().setFromObject(scene);

    // 🔥 min.y = 카드 모델의 바닥 높이
    const bottomY = box.min.y;

    modelBottomRef.current = bottomY;

    console.log("카드 바닥 높이:", modelBottomRef.current);
  }, [scene]);

  useEffect(() => {
    loggedImpactRef.current = false;
  }, [card.id]);

  // 애니메이션 상태 저장 (프레임마다 리셋되지 않도록)
  const hitPowerRef = useRef(0);
  const lastHitRef = useRef(false);
  const destroyProgressRef = useRef(0);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    // ⭐ 이펙트 위치를 카드와 동기화
    if (effectGroupRef.current && groupRef.current) {
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);

      // 🔥 모델 스케일 적용한 실제 바닥 위치
      const cardScale = groupRef.current.scale.y;
      const bottomOffset = modelBottomRef.current * cardScale;

      effectGroupRef.current.position.set(
        worldPos.x,
        worldPos.y + bottomOffset,
        0.01 // ← Shockwave는 여기 기준
      );

      effectGroupRef.current.rotation.set(0, 0, 0);
    }

    // ===== 위에서 떨어지는 애니메이션 =====
    if (!isDestroyed && spawnProgressRef.current < 1.2) {
      spawnProgressRef.current += delta * 1.4;
      const p = spawnProgressRef.current;

      // ----- ① 떨어지는 구간 (scale 고정) -----
      if (p <= 1.0) {
        const startY = 5.0;
        const endY = 0;

        const fall = p * p; // 중력감
        const posY = THREE.MathUtils.lerp(startY, endY, fall);

        groupRef.current.position.y = posY;
        groupRef.current.position.z = 0.55;

        // ⭐ scale 고정
        const s = baseScaleRef.current;
        groupRef.current.scale.set(s, s, s);

        // 약간의 모션 흔들림만 유지
        groupRef.current.rotation.set(THREE.MathUtils.degToRad(20), THREE.MathUtils.degToRad(-25), Math.sin(p * 20) * 0.03);

        return;
      }

      // 착지 순간
      if (p >= 1.0 && p < 1.02 && !showShockwave) {
        if (!loggedImpactRef.current) {
          console.log("🔥 Shockwave Triggered with type:", rawType);
          loggedImpactRef.current = true;
        }

        // 🔥 타입별 이펙트를 안정적으로 ref에 저장
        impactElementRef.current = <group key={rawType}>{ImpactByType(rawType, () => setShowShockwave(false))}</group>;

        setShowShockwave(true);
      }

      // ----- ② 착지 순간 bounce -----
      if (p > 1.0 && p <= 1.05) {
        groupRef.current.position.y = -0.1;

        // 살짝 커졌다가 줄어드는 bounce
        const bounceScale = THREE.MathUtils.lerp(baseScaleRef.current * 1.15, baseScaleRef.current, (p - 1.0) / 0.05);

        groupRef.current.scale.set(bounceScale, bounceScale, bounceScale);
        return;
      }

      // ----- ③ 안정화 단계 -----
      if (p > 1.05 && p < 1.2) {
        const t = (p - 1.05) / 0.15;

        groupRef.current.position.y = THREE.MathUtils.lerp(-0.1, 0, t);

        const s = THREE.MathUtils.lerp(baseScaleRef.current * 1.05, baseScaleRef.current, t);
        groupRef.current.scale.set(s, s, s);

        return;
      }
    }

    // ===== 소환 완료 후 기존 애니메이션 적용 =====
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
      {/* 🔥 착지 이펙트 (카드 위치 동기화됨) */}
      {showShockwave && (
        <group ref={effectGroupRef}>
          <group position={[0, 0, 0]}>{impactElementRef.current}</group>
        </group>
      )}

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
