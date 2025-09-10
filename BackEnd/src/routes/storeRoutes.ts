import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";
import User from "../models/User";
import UserPack from "../models/UserPack"; // 추가
// import UserCard, Card 삭제 (이제 store에서 카드 뽑기 X)

const router = Router();

// 카드팩 가격 설정
const cardPrices: { [key: string]: number } = {
  "B급 카드팩": 100,
  "A급 카드팩": 300,
  "S급 카드팩": 500,
};

// ✅ 카드팩 구매 라우트
router.post(
  "/buy",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { cardType } = req.body;

    // 1. 요청 데이터 유효성 검사
    if (!userId || !cardType) {
      return res.status(400).json({ message: "userId 또는 cardType 누락" });
    }

    try {
      // 2. 사용자 조회
      const user = await User.findById(userId);
      if (!user)
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

      // 3. 카드팩 가격 확인
      const price = cardPrices[cardType];
      if (!price)
        return res.status(400).json({ message: "잘못된 카드팩 타입" });

      // 4. 잔액 확인
      if (user.money < price)
        return res.status(400).json({ message: "잔액 부족" });

      // 5. 돈 차감
      user.money -= price;
      await user.save();

      // 6. UserPack 생성 (구매한 카드팩 DB 저장)
      const newPack = await UserPack.create({
        user: userId,
        packType: cardType,
        opened: false, // 아직 열지 않음
      });

      // 7. 구매 완료 응답
      res.status(200).json({
        message: `${cardType} 구매 완료`,
        money: user.money, // 최신 잔액
        drawnCards: [
          {
            userPackId: newPack._id, // 👈 프론트에서 기대하는 userPackId 형태
          },
        ],
      });
    } catch (err) {
      console.error("카드팩 구매 오류:", err);
      res.status(500).json({ message: "서버 오류", error: err });
    }
  }
);

export default router;
