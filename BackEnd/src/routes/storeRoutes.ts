import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";
import User from "../models/User";
import CardPack from "../models/CardPack";

const router = Router();

// ✅ 카드팩 구매 라우트
router.post("/buy", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { packType } = req.body; // "B" | "A" | "S"

  if (!userId || !packType) {
    return res.status(400).json({ message: "userId 또는 packType 누락" });
  }

  try {
    // 1. 사용자 조회
    const user = await User.findById(userId).populate("inventory.pack");
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    // 2. 카드팩 타입으로 조회
    const cardPack = await CardPack.findOne({ type: packType });
    if (!cardPack) return res.status(404).json({ message: "카드팩을 찾을 수 없습니다." });

    // 3. 잔액 확인
    if (user.money < cardPack.price) {
      return res.status(400).json({ message: "잔액 부족" });
    }

    // 4. 돈 차감
    user.money -= cardPack.price;

    // 5. 인벤토리에 추가 (중복 구매 처리)
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

    // 6. 저장
    await user.save();

    // 7. 최신 유저 정보 조회 및 반환
    const updatedUser = await User.findById(userId).populate("inventory.pack");

    res.status(200).json({
      message: `${cardPack.name} 구매 완료`,
      user: updatedUser, // ✅ 프론트에서 setUserInfo(updatedUser) 가능
    });
  } catch (err) {
    console.error("카드팩 구매 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err });
  }
});

export default router;
