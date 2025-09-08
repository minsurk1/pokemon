// routes/inventoryRoutes.ts
// 카드팩 개봉 API 구현
// 1) 유저팩 수량 차감
// 2) 카드 풀에서 확률에 맞춰 5장 뽑기
// 3) 뽑은 카드 UserCard 컬렉션에 저장
// 4) 결과 응답으로 뽑은 카드 데이터 반환

import express, { Response } from "express";
import mongoose from "mongoose";
import UserPack from "../models/UserPack"; // 유저가 가진 카드팩 데이터 모델
import UserCard from "../models/UserCard"; // 유저가 가진 카드 데이터 모델
import Card from "../models/Card"; // 전체 카드 정보 모델
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";

const router = express.Router();

/**
 * packType에 따른 등급별 뽑기 확률을 반환하는 함수
 * 예: B등급 팩이면 { 1: 0.28, 2: 0.24, ... } 형태로 확률 분포 반환
 */
function getProbabilities(packType: string): { [key: number]: number } {
  switch (packType) {
    case "B":
      return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
    case "A":
      return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 };
    case "S":
      return {
        1: 0.18,
        2: 0.16,
        3: 0.15,
        4: 0.14,
        5: 0.12,
        6: 0.1,
        7: 0.08,
        8: 0.07,
      };
    default:
      return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
  }
}

/**
 * 확률 분포(probabilities)에 따라 랜덤 등급(tier)을 뽑는 함수
 * 누적 확률 방식으로 랜덤 값을 매칭
 */
function getRandomTier(probabilities: { [key: number]: number }) {
  const rand = Math.random(); // 0 ~ 1 사이 난수
  let cumulative = 0;
  for (const tier in probabilities) {
    cumulative += probabilities[+tier]; // 누적 확률 더하기
    if (rand <= cumulative) return +tier; // 해당 구간에 걸리면 tier 반환
  }
  // 누락 방지용: 확률합이 1이 안 되는 경우 마지막 tier 반환
  return Math.max(...Object.keys(probabilities).map(Number));
}

/**
 * 카드팩 개봉 API
 * 1) 유저팩 수량 차감
 * 2) 카드 풀에서 확률에 맞춰 5장 뽑기
 * 3) 뽑은 카드 UserCard 컬렉션에 저장
 * 4) 결과 응답으로 뽑은 카드 데이터 반환
 */
router.post(
  "/open-pack",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    const session = await mongoose.startSession(); // 트랜잭션 세션 시작
    try {
      const userId = req.user?.id; // 로그인한 유저 id (isAuthenticated 미들웨어가 넣어줌)
      const { packType } = req.body; // 어떤 종류의 팩을 열지 클라이언트에서 전달
      if (!userId) return res.status(401).json({ message: "인증 실패" });

      let drawnCards: any[] = []; // 뽑은 카드들을 저장할 배열

      await session.withTransaction(async () => {
        // 1) 유저팩 수량 차감 (packType에 맞는 UserPack 찾아서 quantity -1)
        const pack = await UserPack.findOneAndUpdate(
          { user: userId, packType, quantity: { $gt: 0 } },
          { $inc: { quantity: -1 } },
          { new: true, session }
        );
        if (!pack) throw new Error("보유한 카드팩이 없습니다."); // 없는 경우 트랜잭션 롤백

        // 2) 카드 전체 불러오기
        const allCards = await Card.find({}).session(session);
        const probabilities = getProbabilities(packType);

        // 3) 카드 5장 뽑기
        for (let i = 0; i < 5; i++) {
          const tier = getRandomTier(probabilities); // 확률에 따라 등급 선택
          const tierCards = allCards.filter((card) => card.tier === tier); // 해당 등급의 카드들만 필터
          if (tierCards.length === 0) continue; // 등급 카드 없으면 스킵
          const randomCard =
            tierCards[Math.floor(Math.random() * tierCards.length)]; // 랜덤 1장
          drawnCards.push(randomCard);

          // UserCard 컬렉션에 저장 (이미 있으면 count+1, 없으면 새로 생성)
          await UserCard.findOneAndUpdate(
            { user: userId, card: randomCard._id },
            { $inc: { count: 1 }, $set: { owned: true } },
            { upsert: true, session }
          );
        }
      });

      // 4) 클라이언트에 뽑은 카드 정보 응답
      res.status(200).json({
        message: "카드팩 개봉 성공",
        drawnCards: drawnCards.map((c) => ({
          id: c._id,
          name: c.cardName,
          image3D: c.image3DColor,
          image3DGray: c.image3DGray,
          damage: c.attack,
          hp: c.hp,
        })),
      });
    } catch (error: any) {
      // 에러 발생 시 400 응답 + 메시지 전달
      console.error(error);
      res.status(400).json({ message: error.message || "카드팩 개봉 실패" });
    } finally {
      session.endSession(); // 세션 종료
    }
  }
);

export default router;
