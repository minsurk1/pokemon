// BackEnd/src/socket/battle/calcDamage.ts
import { typeChart } from "./typeChart";

export function calcDamage(attacker: any, defender: any) {
  const atkType = attacker.cardType ?? "normal";
  const defType = defender.cardType ?? "normal";

  // 🧩 [1] 이벤트 몬스터나 플레이어 공격이면 상성 무시
  const isEvent = defender.isEvent || defender.type === "event";
  const isPlayer = defender.type === "player" || defender.isPlayer;

  let multiplier = 1; // 기본 1배로 시작

  if (!isEvent && !isPlayer) {
    // 🧩 [2] 일반 카드끼리만 상성 적용
    multiplier = typeChart[atkType]?.[defType] ?? 1;
  }

  const base = Number(attacker.attack ?? 0);
  const damage = Math.floor(base * multiplier);

  // ✅ 메시지 생성
  let message = "";
  if (multiplier > 1) message = "효과가 굉장하다!";
  else if (multiplier < 1 && multiplier > 0) message = "효과가 별로인 듯 하다...";
  else if (multiplier === 0) message = "효과가 없다...";
  else message = "보통의 공격이다.";

  return { damage, multiplier, message };
}
