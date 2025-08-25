"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserCard_1 = __importDefault(require("../models/UserCard"));
const Card_1 = __importDefault(require("../models/Card"));
const isAuthenticated_1 = require("../middleware/isAuthenticated");
const router = express_1.default.Router();
// 카드 뽑기 API
// 인증 미들웨어 적용: 요청에 유효한 JWT가 있어야 하고, req.user.id로 사용자 ID 사용 가능
router.post(
  "/draw-cards",
  isAuthenticated_1.isAuthenticated,
  async (req, res) => {
    try {
      // 인증 미들웨어가 넣어준 req.user.id를 userId로 사용
      const userId = req.user?.id;
      if (!userId) {
        // userId 없으면 401 에러 반환
        return res.status(401).json({ message: "유효하지 않은 사용자입니다." });
      }
      // 클라이언트에서 카드팩 종류 전달 받음
      const { packType } = req.body;
      // 모든 카드 정보를 DB에서 조회
      const allCards = await Card_1.default.find({}).exec();
      // 카드팩 종류에 따른 등급별 확률 반환 함수
      const getProbabilities = (packType) => {
        switch (packType) {
          case "B":
            return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 };
          case "A":
            return {
              1: 0.23,
              2: 0.2,
              3: 0.18,
              4: 0.15,
              5: 0.12,
              6: 0.08,
              7: 0.04,
            };
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
      };
      const probabilities = getProbabilities(packType);
      // 확률 분포에 따라 등급을 랜덤 추출하는 함수
      function getRandomTier(probabilities) {
        const rand = Math.random();
        let cumulative = 0;
        for (const tier in probabilities) {
          cumulative += probabilities[+tier] || 0;
          if (rand <= cumulative) return +tier;
        }
        // 확률 합산 오류 대비 가장 높은 등급 반환
        return Math.max(...Object.keys(probabilities).map(Number));
      }
      // tier(등급)에 맞는 카드 중 랜덤으로 한 장 선택
      // ★ 수정: 공격력(attack) 또는 체력(hp)으로 필터링하지 말고 카드 모델에 tier 필드가 있다면 tier로 필터해야 함
      function getRandomCardFromTier(tier) {
        const tierCards = allCards.filter((card) => card.tier === tier);
        if (tierCards.length === 0) return null;
        return tierCards[Math.floor(Math.random() * tierCards.length)];
      }
      const drawnCards = [];
      for (let i = 0; i < 5; i++) {
        const tier = getRandomTier(probabilities);
        const card = getRandomCardFromTier(tier);
        if (card) drawnCards.push(card);
      }
      // 뽑은 카드들을 유저의 카드 컬렉션에 저장 또는 수량 증가 처리
      for (const card of drawnCards) {
        const existingUserCard = await UserCard_1.default.findOne({
          user: userId,
          card: card._id,
        });
        if (existingUserCard) {
          existingUserCard.count += 1;
          existingUserCard.owned = true;
          await existingUserCard.save();
        } else {
          const newUserCard = new UserCard_1.default({
            user: userId,
            card: card._id,
            count: 1,
            owned: true,
          });
          await newUserCard.save();
        }
      }
      // 성공 응답과 함께 뽑은 카드 데이터 반환
      res.status(200).json({
        message: "카드 뽑기 성공",
        drawnCards: drawnCards.map((c) => ({
          id: c._id,
          name: c.cardName,
          image3D: c.image3DColor,
          image3DGray: c.image3DGray,
          damage: c.attack,
          hp: c.hp,
        })),
      });
    } catch (error) {
      // 에러 로그 출력 및 500 에러 반환
      console.error(error);
      res.status(500).json({ message: "카드 뽑기 실패", error });
    }
  }
);
exports.default = router;
