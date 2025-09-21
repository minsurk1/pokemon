// routes/inventoryRoutes.ts
import express, { Response } from "express";
import User from "../models/User";
import UserCard from "../models/UserCard";
import Card from "../models/Card";
import CardPack from "../models/CardPack";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";

const router = express.Router();

// ===============================
// ✅ 카드팩 구매 API
// ===============================
router.post("/buy", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { packType } = req.body; // "B" | "A" | "S"

  if (!userId || !packType) {
    return res.status(400).json({ message: "userId 또는 packType 누락" });
  }

  try {
    // 1) 유저 조회
    const user = await User.findById(userId).populate("inventory.pack");
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    // 2) 카드팩 조회
    const cardPack = await CardPack.findOne({ type: packType });
    if (!cardPack) return res.status(404).json({ message: "카드팩을 찾을 수 없습니다." });

    // 3) 잔액 확인
    if (user.money < cardPack.price) {
      return res.status(400).json({ message: "잔액 부족" });
    }

    // 4) 돈 차감
    user.money -= cardPack.price;

    // 5) 인벤토리 추가 (중복 구매 처리)
    const existingPack = user.inventory.find(i => i.pack.equals(cardPack._id));

    if (existingPack) {
      existingPack.quantity += 1; // 이미 존재하면 quantity 증가
    } else {
      user.inventory.push({
        pack: cardPack._id,
        type: cardPack.type,
        quantity: 1,
        opened: false,
      });
    }

    // 6) 저장
    await user.save();

    // 7) 최신 유저 정보 조회 및 반환
    const updatedUser = await User.findById(userId).populate("inventory.pack");

    res.status(200).json({
      message: `${cardPack.name} 구매 완료`,
      user: {
        money: updatedUser?.money,
        inventory: updatedUser?.inventory.map((p) => ({
          packId: p.pack._id,
          type: p.type,
          quantity: p.quantity,
          image: (p.pack as any).image,
          name: (p.pack as any).name,
        })),
      },
    });
  } catch (err) {
    console.error("카드팩 구매 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err });
  }
});

// ===============================
// ✅ 카드팩 개봉 API
// ===============================

// packType별 확률 설정
function getProbabilities(packType: string): { [key: number]: number } {
  switch (packType) {
    case "B":
      return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
    case "A":
      return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 };
    case "S":
      return { 1: 0.18, 2: 0.16, 3: 0.15, 4: 0.14, 5: 0.12, 6: 0.1, 7: 0.08, 8: 0.07 };
    default:
      return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
  }
}

// 확률 기반 랜덤 등급 선택
function getRandomTier(probabilities: { [key: number]: number }) {
  const rand = Math.random();
  let cumulative = 0;
  for (const tier in probabilities) {
    cumulative += probabilities[+tier];
    if (rand <= cumulative) return +tier;
  }
  return Math.max(...Object.keys(probabilities).map(Number));
}

// ✅ 카드팩 개봉
router.post("/open-pack", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { type } = req.body; // packType 대신 type 사용
    if (!userId) return res.status(401).json({ message: "인증 실패" });

    // 1) 유저 불러오기
    const user = await User.findById(userId).populate("inventory.pack");
    if (!user) return res.status(404).json({ message: "유저를 찾을 수 없음" });

    // 2) inventory에서 해당 type 찾기
    const inventoryIndex = user.inventory.findIndex((p) => p.type === type);
    if (inventoryIndex === -1 || user.inventory[inventoryIndex].quantity <= 0) {
      return res.status(400).json({ message: "보유한 카드팩이 없습니다." });
    }

    // 3) 수량 차감 및 0이면 제거
    user.inventory[inventoryIndex].quantity -= 1;
    if (user.inventory[inventoryIndex].quantity <= 0) {
      user.inventory.splice(inventoryIndex, 1);
    }
    await user.save();

    // 4) 카드 전체 불러오기 + 확률 적용
    const allCards = await Card.find({});
    const probabilities = getProbabilities(type);

    // 5) 5장 뽑기
    const drawnCards: any[] = [];
    for (let i = 0; i < 5; i++) {
      const tier = getRandomTier(probabilities);
      const tierCards = allCards.filter((card) => card.tier === tier);
      if (tierCards.length === 0) continue;
      const randomCard = tierCards[Math.floor(Math.random() * tierCards.length)];
      drawnCards.push(randomCard);

      // UserCard 컬렉션에 저장
      await UserCard.findOneAndUpdate(
        { user: userId, card: randomCard._id },
        { $inc: { count: 1 }, $set: { owned: true } },
        { upsert: true }
      );
    }

    // 6) 프론트 반환
    res.status(200).json({
      message: "카드팩 개봉 성공",
      drawnCards: drawnCards.map((c) => ({
        id: c._id,
        name: c.cardName,
        damage: c.attack,
        hp: c.hp,
        image: c.image2D, // 카드 이미지 포함
      })),
      userPacks: user.inventory.map((p) => ({
        packId: p.pack._id, // pack ObjectId
        type: p.type,        // "B" | "A" | "S"
        quantity: p.quantity,
        image: (p.pack as any).image, // 카드팩 이미지 포함
        name: (p.pack as any).name,
      })),
    });
  } catch (error: any) {
    console.error("카드팩 개봉 오류:", error);
    res.status(400).json({ message: error.message || "카드팩 개봉 실패" });
  }
});

export default router;
