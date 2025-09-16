"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/seed/seedCardPacks.ts
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const CardPack_1 = __importDefault(require("../models/CardPack"));
dotenv_1.default.config();
const seedCardPacks = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB 연결 성공 (seed)");
        const packs = [
            { name: "B급 카드팩", type: "B", price: 100, image: "/image/b_card.png" },
            { name: "A급 카드팩", type: "A", price: 300, image: "/image/a_card.png" },
            { name: "S급 카드팩", type: "S", price: 500, image: "/image/s_card.png" },
        ];
        for (const pack of packs) {
            const exists = await CardPack_1.default.findOne({ type: pack.type });
            if (!exists) {
                await CardPack_1.default.create(pack);
                console.log(`✅ ${pack.name} 생성됨`);
            }
            else {
                console.log(`ℹ️ ${pack.name} 이미 존재함`);
            }
        }
        console.log("🎉 시드 완료!");
    }
    catch (err) {
        console.error("❌ 시드 실패:", err);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log("🔌 MongoDB 연결 종료");
    }
};
seedCardPacks();
