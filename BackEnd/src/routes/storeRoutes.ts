import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";
import User from "../models/User";
import CardPack from "../models/CardPack"; // 새로 만든 카드팩 모델

const router = Router();

// ✅ 카드팩 구매 라우트
router.post(
  "/buy",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { cardPackId } = req.body; // 프론트에서 어떤 카드팩을 샀는지 ID로 요청

    if (!userId || !cardPackId) {
      return res.status(400).json({ message: "userId 또는 cardPackId 누락" });
    }

    try {
      // 1. 사용자 조회
      const user = await User.findById(userId).populate("inventory.pack");
      if (!user)
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

      // 2. 구매하려는 카드팩 정보 조회
      const cardPack = await CardPack.findById(cardPackId);
      if (!cardPack)
        return res.status(404).json({ message: "카드팩을 찾을 수 없습니다." });

      // 3. 돈 확인
      if (user.money < cardPack.price)
        return res.status(400).json({ message: "잔액 부족" });

      // 4. 돈 차감
      user.money -= cardPack.price;

      // 5. 인벤토리에 추가 (opened = false로 새로 추가)
      user.inventory.push({ pack: cardPack._id, opened: false });

      // 6. 저장
      await user.save();

      // 7. 최신 데이터 응답 (populate 적용)
      const updatedUser = await User.findById(userId).populate("inventory.pack");

      res.status(200).json({
        message: `${cardPack.name} 구매 완료`,
        money: updatedUser?.money,
        inventory: updatedUser?.inventory,
      });
    } catch (err) {
      console.error("카드팩 구매 오류:", err);
      res.status(500).json({ message: "서버 오류", error: err });
    }
  }
);

export default router;
