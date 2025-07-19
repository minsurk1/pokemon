import { Router } from "express";
import Card from "../models/Card";

const router = Router();

router.get("/cards", async (req, res) => {
  try {
    const allCards = await Card.find({});
    res.json(allCards);
  } catch (error) {
    res.status(500).json({ message: "카드 정보를 불러올 수 없습니다." });
  }
});

export default router;
