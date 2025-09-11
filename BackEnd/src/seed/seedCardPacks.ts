import mongoose from "mongoose";
import dotenv from "dotenv";
import CardPack from "../models/CardPack";

dotenv.config();

const seedCardPacks = async () => {
  try {
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
        console.log(`ℹ️ ${pack.name} 이미 존재함 → 건너뜀`);
      }
    }

    console.log("🎯 카드팩 seed 완료!");
  } catch (error) {
    console.error("❌ 카드팩 seed 중 오류 발생:", error);
  }
};

// ✅ 여기서 default export 추가
export default seedCardPacks;

// MongoDB 연결 + 실행
(async () => {
  const dbURI = process.env.MONGO_URI;
  if (!dbURI) {
    console.error("❌ MONGO_URI 환경변수가 설정되어 있지 않습니다.");
    process.exit(1);
  }

  try {
    await mongoose.connect(dbURI);
    console.log("✅ MongoDB 연결 성공");
    await seedCardPacks();
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB 연결 해제");
  }
})();
