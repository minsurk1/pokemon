// src/seed/seedCardPacks.ts
import mongoose from "mongoose";
import dotenv from "dotenv";
import CardPack from "../models/CardPack";

dotenv.config();

const seedCardPacks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("✅ MongoDB 연결 성공 (seed)");

    const packs = [
      { name: "B급 카드팩", type: "B", price: 100, image: "b_card.png" },
      { name: "A급 카드팩", type: "A", price: 300, image: "a_card.png" },
      { name: "S급 카드팩", type: "S", price: 500, image: "s_card.png" },
    ];

    for (const pack of packs) {
      const exists = await CardPack.findOne({ type: pack.type });
      if (!exists) {
        await CardPack.create(pack);
        console.log(`✅ ${pack.name} 생성됨`);
      } else {
        console.log(`ℹ️ ${pack.name} 이미 존재함`);
      }
    }

    console.log("🎉 시드 완료!");
  } catch (err) {
    console.error("❌ 시드 실패:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB 연결 종료");
  }
};

seedCardPacks();
