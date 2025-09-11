import mongoose from "mongoose";
import CardPack from "../models/CardPack";

const seedCardPacks = async () => {
  const packs = [
    { name: "B급 카드팩", type: "B", price: 100, image: "b_card.png" },
    { name: "A급 카드팩", type: "A", price: 300, image: "a_card.png" },
    { name: "S급 카드팩", type: "S", price: 500, image: "s_card.png" },
  ];

  for (const pack of packs) {
    const exists = await CardPack.findOne({ type: pack.type });
    if (!exists) {
      await CardPack.create(pack);
      console.log(`${pack.name} 생성됨`);
    }
  }
};

// ✅ default export 추가
export default seedCardPacks;
