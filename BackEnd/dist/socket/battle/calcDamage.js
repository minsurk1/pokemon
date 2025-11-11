"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcDamage = calcDamage;
const typeChart_1 = require("./typeChart");
function calcDamage(attacker, defender) {
    const atkType = attacker.cardType ?? "normal";
    const defType = defender.cardType ?? "normal";
    const multiplier = typeChart_1.typeChart[atkType]?.[defType] ?? 1;
    const base = Number(attacker.attack ?? 0);
    const damage = Math.floor(base * multiplier);
    return { damage, multiplier };
}
