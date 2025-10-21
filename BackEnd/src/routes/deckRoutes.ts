// src/routes/deckRoutes.ts
import express from "express";
import mongoose from "mongoose";
import Deck from "../models/Deck";
import UserCard from "../models/UserCard";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";

const router = express.Router();

/**
 * ✅ 덱 생성
 */
router.post("/create", isAuthenticated, async (req, res) => {
  const { name } = (req as AuthenticatedRequest).body;
  const userId = (req as AuthenticatedRequest).user?._id;

  if (!userId) return res.status(401).json({ message: "인증 실패" });
  if (!name) return res.status(400).json({ message: "덱 이름이 필요합니다." });

  const existing = await Deck.findOne({ user: userId, name });
  if (existing) {
    return res.status(400).json({ message: "같은 이름의 덱이 이미 존재합니다." });
  }

  const deck = new Deck({ user: userId, name, cards: [] });
  await deck.save();

  res.status(201).json({ message: "덱 생성 완료", deck });
});

/**
 * ✅ 카드 추가
 */
router.post("/add-card", isAuthenticated, async (req, res) => {
  const { deckId, cardId } = (req as AuthenticatedRequest).body;
  const userId = (req as AuthenticatedRequest).user?._id;

  if (!userId) return res.status(401).json({ message: "인증 실패" });

  const deck = await Deck.findOne({ _id: deckId, user: userId });
  if (!deck) return res.status(404).json({ message: "덱을 찾을 수 없습니다." });

  // ✅ 덱 최대 30장 제한
  if (deck.cards.length >= 30) {
    return res.status(400).json({ message: "덱은 최대 30장입니다." });
  }

  // ✅ 보유 수량 초과 방지
  const userCard = await UserCard.findOne({ user: userId, card: cardId });
  const countInDeck = deck.cards.filter((c) => c.toString() === cardId).length;

  if (!userCard || countInDeck >= userCard.count) {
    return res.status(400).json({ message: "보유한 카드 수량을 초과했습니다." });
  }

  deck.cards.push(new mongoose.Types.ObjectId(cardId));
  await deck.save();

  res.status(200).json({ message: "카드 추가 완료", deck });
});

/**
 * ✅ 카드 제거
 */
router.post("/remove-card", isAuthenticated, async (req, res) => {
  const { deckId, cardId } = (req as AuthenticatedRequest).body;
  const userId = (req as AuthenticatedRequest).user?._id;

  if (!userId) return res.status(401).json({ message: "인증 실패" });

  const deck = await Deck.findOne({ _id: deckId, user: userId });
  if (!deck) return res.status(404).json({ message: "덱을 찾을 수 없습니다." });

  const index = deck.cards.findIndex((c) => c.toString() === cardId);
  if (index === -1) return res.status(400).json({ message: "덱에 해당 카드가 없습니다." });

  deck.cards.splice(index, 1);
  await deck.save();

  res.status(200).json({ message: "카드 제거 완료", deck });
});

/**
 * ✅ 덱 목록 조회
 */
router.get("/my-decks", isAuthenticated, async (req, res) => {
  const userId = (req as AuthenticatedRequest).user?._id;
  if (!userId) return res.status(401).json({ message: "인증 실패" });

  const decks = await Deck.find({ user: userId }).populate("cards");
  res.status(200).json({ decks });
});

export default router;
