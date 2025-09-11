import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";
import User from "../models/User";
import CardPack from "../models/CardPack"; // 새로 만든 카드팩 모델

const router = Router();

// ✅ 카드팩 구매 라우트
router.post("/buy", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { packType } = req.body; // 프론트에서 보내는 "B" | "A" | "S"

  if (!userId || !packType) return res.status(400).json({ message: "userId 또는 packType 누락" });

  try {
    const user = await User.findById(userId).populate("inventory.pack");
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const cardPack = await CardPack.findOne({ type: packType });
    if (!cardPack) return res.status(404).json({ message: "카드팩을 찾을 수 없습니다." });

    if (user.money < cardPack.price) return res.status(400).json({ message: "잔액 부족" });

    user.money -= cardPack.price;

    // 인벤토리에 추가
    user.inventory.push({
      pack: cardPack._id,
      type: cardPack.type,
      quantity: 1,
      opened: false,
    });

    await user.save();

    const updatedUser = await User.findById(userId).populate("inventory.pack");

    res.status(200).json({
      message: `${cardPack.name} 구매 완료`,
      user: updatedUser, // 최신 유저 정보 반환
    });
  } catch (err) {
    console.error("카드팩 구매 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err });
  }
});

export default router;
