import { Router, Request, Response } from "express";
import CardPack from "../models/CardPack";
import User from "../models/User";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";

const router = Router();

// ✅ 카드팩 전체 조회
router.get("/card-packs", async (req: Request, res: Response) => {
  try {
    const packs = await CardPack.find({});
    const result = packs.map((p) => ({
      id: p._id,
      name: p.name,
      type: p.type,
      image: p.image,
      price: p.price,
    }));
    res.json(result);
  } catch (err) {
    console.error("카드팩 조회 실패:", err);
    res.status(500).json({ message: "카드팩 조회 실패" });
  }
});

// ✅ 카드팩 구매
router.post("/buy", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { packType } = req.body;

  if (!userId || !packType) return res.status(400).json({ message: "userId 또는 packType 누락" });

  try {
    const user = await User.findById(userId).populate("inventory.pack");
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    const cardPack = await CardPack.findOne({ type: packType });
    if (!cardPack) return res.status(404).json({ message: "카드팩을 찾을 수 없습니다." });

    if (user.money < cardPack.price) return res.status(400).json({ message: "잔액 부족" });

    user.money -= cardPack.price;

    const existingPack = user.inventory.find((i) => i.pack.equals(cardPack._id));
    if (existingPack) {
      existingPack.quantity += 1;
    } else {
      user.inventory.push({
        pack: cardPack._id,
        type: cardPack.type,
        quantity: 1,
        opened: false,
      });
    }

    await user.save();
    const updatedUser = await User.findById(userId).populate("inventory.pack");

    res.json({ message: `${cardPack.name} 구매 완료`, user: updatedUser });
  } catch (err) {
    console.error("카드팩 구매 실패:", err);
    res.status(500).json({ message: "서버 오류" });
  }
});

export default router;
