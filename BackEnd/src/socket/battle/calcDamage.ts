import { typeChart } from "./typeChart";

export function calcDamage(attacker: any, defender: any) {
  const atkType = attacker.cardType ?? "normal";
  const defType = defender.cardType ?? "normal";

  const multiplier = typeChart[atkType]?.[defType] ?? 1;
  const base = Number(attacker.attack ?? 0);

  const damage = Math.floor(base * multiplier);

  return { damage, multiplier };
}
