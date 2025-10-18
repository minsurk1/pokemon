// src/routes/storeRoutes.ts
import { Router, Response } from "express";
import mongoose from "mongoose";
import CardPack from "../models/CardPack";
import User from "../models/User";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";

const router = Router();

/**
 * ✅ 1) 카드팩 전체 조회
 * GET /api/store/card-packs
 */
router.get("/card-packs", async (req, res: Response) => {
  try {
    const packs = await CardPack.find({});
    const result = packs.map((p) => ({
      id: p._id,
      name: p.name,
      type: p.type,
      image: p.image,
      price: p.price,
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("❌ 카드팩 조회 실패:", err);
    res.status(500).json({ message: "카드팩 조회 실패" });
  }
});

/**
 * ✅ 2) 카드팩 구매
 * POST /api/store/buy
 */
router.post("/buy", isAuthenticated, async (req, res: Response) => {
  try {
    // ✅ 안전한 접근 (undefined 방지)
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) {
      return res.status(401).json({ message: "인증 실패: 유효하지 않은 사용자 정보입니다." });
    }

    const userId = user._id;
    const { packType } = req.body as { packType: string };

    if (!packType) {
      return res.status(400).json({ message: "packType 누락" });
    }

    // ✅ ObjectId 유효성 검증
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
    }

    // ✅ 사용자 조회
    const userData = await User.findById(userId).populate("inventory.pack");
    if (!userData) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // ✅ 카드팩 조회
    const cardPack = await CardPack.findOne({ type: packType });
    if (!cardPack) {
      return res.status(404).json({ message: "해당 카드팩을 찾을 수 없습니다." });
    }

    // ✅ 잔액 확인
    if (userData.money < cardPack.price) {
      return res.status(400).json({ message: "잔액이 부족합니다." });
    }

    // ✅ 금액 차감
    userData.money -= cardPack.price;

    // ✅ 기존 팩 존재 여부 확인 (populate 이후 비교)
    const existingPack = userData.inventory?.find((i) => i.pack && i.pack._id && i.pack._id.equals(cardPack._id));

    if (existingPack) {
      existingPack.quantity += 1;
      console.log(`🟢 기존 팩(${existingPack.type}) 수량 +1`);
    } else {
      userData.inventory.push({
        pack: cardPack._id,
        type: cardPack.type,
        quantity: 1,
        opened: false,
      });
      console.log(`🟢 새 팩(${cardPack.type}) 추가`);
    }

    await userData.save();

    // ✅ 갱신된 유저 데이터 재조회
    const updatedUser = await User.findById(userId).populate("inventory.pack");

    res.status(200).json({
      message: `${cardPack.name} 구매 완료`,
      updatedMoney: updatedUser?.money ?? 0,
      user: updatedUser,
    });
  } catch (err: any) {
    console.error("❌ 카드팩 구매 실패:", err);
    res.status(500).json({ message: err.message || "서버 오류" });
  }
});

export default router;
