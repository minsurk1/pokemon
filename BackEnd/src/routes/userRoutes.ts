// src/routes/userRoutes.ts
import { Router, Response } from "express";
import mongoose from "mongoose";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import User, { IUser } from "../models/User";
import UserDeck from "../models/UserDeck";
import UserCard from "../models/UserCard";

const router = Router();

console.log("✅ userRoutes 라우터 로드됨");

/**
 * ✅ 1) 로그인한 유저 정보 조회
 * GET /api/user/me
 */
router.get("/me", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!mongoose.isValidObjectId(user._id)) {
      return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
    }

    // 1) 기본 유저 + 인벤토리
    const foundUser = await User.findById(user._id).populate("inventory.pack").lean();

    if (!foundUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    const populatedInventory = (foundUser.inventory || []).map((item: any) => ({
      packId: item.pack?._id?.toString() ?? "",
      type: item.type ?? "",
      quantity: item.quantity ?? 0,
      name: item.pack?.name ?? "",
      packImage: item.pack?.image ?? "",
    }));

    // 2) 유저 덱 (UserDeck)
    const userDeck = await UserDeck.findOne({ user: user._id }).lean();

    const deck = userDeck
      ? userDeck.cards.map((c: any) => ({
          id: String(c.card ?? c._id ?? c.id), // 프론트에서 쓸 카드 ID
          name: c.name,
          cardType: c.cardType ?? "normal",
          attack: c.attack ?? 0,
          hp: c.hp ?? 0,
          maxhp: c.maxhp ?? c.hp ?? 0,
          cost: Number(c.cost ?? c.tier ?? 1),
          tier: c.tier ?? 1,
          image2D: c.image2D ?? "default.png",
        }))
      : [];

    // 3) 유저가 가진 카드(UserCard)
    const userCards = await UserCard.find({ user: user._id }).populate("card").lean();

    const cards = userCards.map((uc: any) => ({
      cardId: uc.card._id.toString(),
      name: uc.card.cardName ?? uc.card.name,
      image2D: uc.card.image2D ?? "default.png",
      cardType: uc.card.cardType ?? "normal",
      attack: uc.card.attack ?? 0,
      hp: uc.card.hp ?? 0,
      maxhp: uc.card.hp ?? 0,
      cost: uc.card.cost ?? uc.card.tier ?? 1,
      tier: uc.card.tier ?? 1,
      count: uc.count ?? 0,
    }));

    res.status(200).json({
      id: foundUser._id.toString(),
      nickname: foundUser.nickname,
      money: foundUser.money,
      inventory: populatedInventory,

      // 🔥 배틀/덱 편집에서 쓸 수 있는 정보들
      deck,
      cards,
    });
  } catch (err: any) {
    console.error("❌ 유저 정보 조회 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

export default router;
