import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Inventory.css";
import BackgroundVideo from "../../components/common/global.tsx";
import inventoryVideo from "../../assets/videos/arceus.mp4";

import fireTier1 from "../../assets/images/firetier1.png"
import fireTier2 from "../../assets/images/firetier2.png"
import fireTier3 from "../../assets/images/firetier3.png"
import fireTier4 from "../../assets/images/firetier4.png"
import fireTier5 from "../../assets/images/firetier5.png"
import fireTier6 from "../../assets/images/firetier6.png"
import fireTier7 from "../../assets/images/firetier7.png"

import waterTier1 from "../../assets/images/watertier1.png"
import waterTier2 from "../../assets/images/watertier2.png"
import waterTier3 from "../../assets/images/watertier3.png"
import waterTier4 from "../../assets/images/watertier4.png"
import waterTier5 from "../../assets/images/watertier5.png"
import waterTier6 from "../../assets/images/watertier6.png"
import waterTier7 from "../../assets/images/watertier7.png"

import forestTier1 from "../../assets/images/foresttier1.png"
import forestTier2 from "../../assets/images/foresttier2.png"
import forestTier3 from "../../assets/images/foresttier3.png"
import forestTier4 from "../../assets/images/foresttier4.png"
import forestTier5 from "../../assets/images/foresttier5.png"
import forestTier6 from "../../assets/images/foresttier6.png"
import forestTier7 from "../../assets/images/foresttier7.png"

import electricTier1 from "../../assets/images/electrictier1.png"
import electricTier2 from "../../assets/images/electrictier2.png"
import electricTier3 from "../../assets/images/electrictier3.png"
import electricTier4 from "../../assets/images/electrictier4.png"
import electricTier5 from "../../assets/images/electrictier5.png"
import electricTier6 from "../../assets/images/electrictier6.png"
import electricTier7 from "../../assets/images/electrictier7.png"

import flyTier1 from "../../assets/images/flytier1.png"
import flyTier2 from "../../assets/images/flytier2.png"
import flyTier3 from "../../assets/images/flytier3.png"
import flyTier4 from "../../assets/images/flytier4.png"
import flyTier5 from "../../assets/images/flytier5.png"
import flyTier6 from "../../assets/images/flytier6.png"
import flyTier7 from "../../assets/images/flytier7.png"

import iceTier1 from "../../assets/images/icetier1.png"
import iceTier2 from "../../assets/images/icetier2.png"
import iceTier3 from "../../assets/images/icetier3.png"
import iceTier4 from "../../assets/images/icetier4.png"
import iceTier5 from "../../assets/images/icetier5.png"
import iceTier6 from "../../assets/images/icetier6.png"
import iceTier7 from "../../assets/images/icetier7.png"

import landTier1 from "../../assets/images/landtier1.png"
import landTier2 from "../../assets/images/landtier2.png"
import landTier3 from "../../assets/images/landtier3.png"
import landTier4 from "../../assets/images/landtier4.png"
import landTier5 from "../../assets/images/landtier5.png"
import landTier6 from "../../assets/images/landtier6.png"
import landTier7 from "../../assets/images/landtier7.png"

import normalTier1 from "../../assets/images/normaltier1.png"
import normalTier2 from "../../assets/images/normaltier2.png"
import normalTier3 from "../../assets/images/normaltier3.png"
import normalTier4 from "../../assets/images/normaltier4.png"
import normalTier5 from "../../assets/images/normaltier5.png"
import normalTier6 from "../../assets/images/normaltier6.png"
import normalTier7 from "../../assets/images/normaltier7.png"

import poisonTier1 from "../../assets/images/poisontier1.png"
import poisonTier2 from "../../assets/images/poisontier2.png"
import poisonTier3 from "../../assets/images/poisontier3.png"
import poisonTier4 from "../../assets/images/poisontier4.png"
import poisonTier5 from "../../assets/images/poisontier5.png"
import poisonTier6 from "../../assets/images/poisontier6.png"
import poisonTier7 from "../../assets/images/poisontier7.png"

import wormTier1 from "../../assets/images/wormtier1.png"
import wormTier2 from "../../assets/images/wormtier2.png"
import wormTier3 from "../../assets/images/wormtier3.png"
import wormTier4 from "../../assets/images/wormtier4.png"
import wormTier5 from "../../assets/images/wormtier5.png"
import wormTier6 from "../../assets/images/wormtier6.png"
import wormTier7 from "../../assets/images/wormtier7.png"

import esperTier1 from "../../assets/images/espertier1.png"
import esperTier2 from "../../assets/images/espertier2.png"
import esperTier3 from "../../assets/images/espertier3.png"
import esperTier4 from "../../assets/images/espertier4.png"
import esperTier5 from "../../assets/images/espertier5.png"
import esperTier6 from "../../assets/images/espertier6.png"
import esperTier7 from "../../assets/images/espertier7.png"

import legendTier1 from "../../assets/images/legendtier1.png"
import legendTier2 from "../../assets/images/legendtier2.png"
import legendTier3 from "../../assets/images/legendtier3.png"
import legendTier4 from "../../assets/images/legendtier4.png"
import legendTier5 from "../../assets/images/legendtier5.png"
import legendTier6 from "../../assets/images/legendtier6.png"
import legendTier7 from "../../assets/images/legendtier7.png"

export interface CardData {
  name: string;
  tier: number;
  image: string;
  attack: number;
  hp: number;
  cost: number;
}

export interface CardPack {
  name: string;
  packImage: string;
  isOpened: boolean;
  type: "B" | "A" | "S";
}

interface InventoryProps {
  inventory: CardPack[];
  setInventory: React.Dispatch<React.SetStateAction<CardPack[]>>;
}

// UserCard 타입 (보유 정보)
interface UserCard {
  name: string;
  tier: number;
  owned: boolean;
}
function getCardImageByNameAndTier(name: string, tier: number, owned: boolean): string {
  // 흑백 이미지 기본 경로
  const grayImage = "/images/default_gray.png";

  if (!owned) return grayImage;

  // 각 속성별 tier별 이미지 맵
  const fireImages = {
    1: fireTier1,
    2: fireTier2,
    3: fireTier3,
    4: fireTier4,
    5: fireTier5,
    6: fireTier6,
    7: fireTier7,
  }
  const waterImages = {
    1: waterTier1,
    2: waterTier2,
    3: waterTier3,
    4: waterTier4,
    5: waterTier5,
    6: waterTier6,
    7: waterTier7,
  }
  const forestImages = {
    1: forestTier1,
    2: forestTier2,
    3: forestTier3,
    4: forestTier4,
    5: forestTier5,
    6: forestTier6,
    7: forestTier7,
  }
  const electricImages = {
    1: electricTier1,
    2: electricTier2,
    3: electricTier3,
    4: electricTier4,
    5: electricTier5,
    6: electricTier6,
    7: electricTier7,
  }
  const flyImages = {
    1: flyTier1,
    2: flyTier2,
    3: flyTier3,
    4: flyTier4,
    5: flyTier5,
    6: flyTier6,
    7: flyTier7,
  }
  const iceImages = {
    1: iceTier1,
    2: iceTier2,
    3: iceTier3,
    4: iceTier4,
    5: iceTier5,
    6: iceTier6,
    7: iceTier7,
  }
  const landImages = {
    1: landTier1,
    2: landTier2,
    3: landTier3,
    4: landTier4,
    5: landTier5,
    6: landTier6,
    7: landTier7,
  }
  const normalImages = {
    1: normalTier1,
    2: normalTier2,
    3: normalTier3,
    4: normalTier4,
    5: normalTier5,
    6: normalTier6,
    7: normalTier7,
  }
  const poisonImages = {
    1: poisonTier1,
    2: poisonTier2,
    3: poisonTier3,
    4: poisonTier4,
    5: poisonTier5,
    6: poisonTier6,
    7: poisonTier7,
  }
  const wormImages = {
    1: wormTier1,
    2: wormTier2,
    3: wormTier3,
    4: wormTier4,
    5: wormTier5,
    6: wormTier6,
    7: wormTier7,
  }
  const esperImages = {
    1: esperTier1,
    2: esperTier2,
    3: esperTier3,
    4: esperTier4,
    5: esperTier5,
    6: esperTier6,
    7: esperTier7,
  }
  const legendImages = {
    1: legendTier1,
    2: legendTier2,
    3: legendTier3,
    4: legendTier4,
    5: legendTier5,
    6: legendTier6,
    7: legendTier7,
    8: legendTier7,
  }

  // 포켓몬 이름과 tier로 이미지 찾기 위한 매핑 (예시, 실제 속성별로 분류한 매핑 추가 가능)
  // 여기서는 예시로 파이리 시리즈 → fireImages, 꼬부기 시리즈 → waterImages 등
  // 각 포켓몬 이름에 맞는 속성별 이미지 맵 넣기
  const nameToTypeImageMap: { [name: string]: { [tier: number]: string } } = {
    // fire 속성 포켓몬들
    파이리: fireImages,
    포니타: fireImages,
    부스터: fireImages,
    윈디: fireImages,
    초염몽: fireImages,
    리자몽: fireImages,
    레시라무: fireImages,

    // water 속성 포켓몬들
    꼬부기: waterImages,
    고라파덕: waterImages,
    샤미드: waterImages,
    라프라스: waterImages,
    갸라도스: waterImages,
    거북왕: waterImages,
    가이오가: waterImages,

    // forest 속성 포켓몬들
    이상해씨: forestImages,
    모다피: forestImages,
    리피아: forestImages,
    나시: forestImages,
    토대부기: forestImages,
    이상해꽃: forestImages,
    세레비: forestImages,

    // electric 속성 포켓몬들
    플러쉬: electricImages,
    라이츄: electricImages,
    전룡: electricImages,
    자포코일: electricImages,
    볼트로스: electricImages,
    피카츄: electricImages,
    썬더: electricImages,

    // fly 속성 포켓몬들
    찌르꼬: flyImages,
    깨비참: flyImages,
    구구: flyImages,
    깨비드릴조: flyImages,
    무장조: flyImages,
    토네로스: flyImages,
    루기아: flyImages,

    // ice 속성 포켓몬들
    꾸꾸리: iceImages,
    메꾸리: iceImages,
    빙큐보: iceImages,
    얼음귀신: iceImages,
    크레베이이스: iceImages,
    레지아이스: iceImages,
    프리져: iceImages,

    // land 속성 포켓몬들
    톱치: landImages,
    코코리: landImages,
    히포포타스: landImages,
    대코파스: landImages,
    맘모꾸리: landImages,
    한카리아스: landImages,
    그란돈: landImages,

    // normal 속성 포켓몬들
    부우부: normalImages,
    하데리어: normalImages,
    다부니: normalImages,
    해피너스: normalImages,
    링곰: normalImages,
    켄타로스: normalImages,
    레지기가스: normalImages,

    // poison 속성 포켓몬들
    아보: poisonImages,
    니드리나: poisonImages,
    독개굴: poisonImages,
    펜드라: poisonImages,
    니드킹: poisonImages,
    독침붕: poisonImages,
    무한다이노: poisonImages,

    // worm 속성 포켓몬들
    과사삭벌레: wormImages,
    두루지벌레: wormImages,
    케터피: wormImages,
    실쿤: wormImages,
    파라섹트: wormImages,
    핫삼: wormImages,
    게노세크트: wormImages,

    // esper 속성 포켓몬들
    요가랑: esperImages,
    랄토스: esperImages,
    에브이: esperImages,
    고디모아젤: esperImages,
    가디안: esperImages,
    뮤: esperImages,
    뮤츠: esperImages,

    // legend 속성 포켓몬들 (tier 8)
    디아루가: legendImages,
    펄기아: legendImages,
    기라티나: legendImages,
    제크로무: legendImages,
    큐레무: legendImages,
    레쿠자: legendImages,
    아르세우스: legendImages,
  };

  const tierImageMap = nameToTypeImageMap[name];
  if (tierImageMap && tierImageMap[tier]) {
    return tierImageMap[tier];
  }
  return grayImage; // 못 찾으면 흑백 이미지
}

const cardsData: CardData[] = [
  { name: "파이리", tier: 1, image: fireTier1, attack: 10, hp: 25, cost: 1 },
  { name: "포니타", tier: 2, image: fireTier2, attack: 40, hp: 100, cost: 2 },
  { name: "부스터", tier: 3, image: fireTier3, attack: 70, hp: 175, cost: 3 },
  { name: "윈디", tier: 4, image: fireTier4, attack: 110, hp: 275, cost: 4 },
  { name: "초염몽", tier: 5, image: fireTier5, attack: 150, hp: 375, cost: 5 },
  { name: "리자몽", tier: 6, image: fireTier6, attack: 200, hp: 500, cost: 6 },
  { name: "레시라무", tier: 7, image: fireTier7, attack: 300, hp: 750, cost: 7 },

  { name: "꼬부기", tier: 1, image: waterTier1, attack: 10, hp: 25, cost: 1 },
  { name: "고라파덕", tier: 2, image: waterTier2, attack: 40, hp: 100, cost: 2 },
  { name: "샤미드", tier: 3, image: waterTier3, attack: 70, hp: 175, cost: 3 },
  { name: "라프라스", tier: 4, image: waterTier4, attack: 110, hp: 275, cost: 4 },
  { name: "갸라도스", tier: 5, image: waterTier5, attack: 150, hp: 375, cost: 5 },
  { name: "거북왕", tier: 6, image: waterTier6, attack: 200, hp: 500, cost: 6 },
  { name: "가이오가", tier: 7, image: waterTier7, attack: 300, hp: 750, cost: 7 },

  { name: "이상해씨", tier: 1, image: forestTier1, attack: 10, hp: 25, cost: 1 },
  { name: "모다피", tier: 2, image: forestTier2, attack: 40, hp: 100, cost: 2 },
  { name: "리피아", tier: 3, image: forestTier3, attack: 70, hp: 175, cost: 3 },
  { name: "나시", tier: 4, image: forestTier4, attack: 110, hp: 275, cost: 4 },
  { name: "토대부기", tier: 5, image: forestTier5, attack: 150, hp: 375, cost: 5 },
  { name: "이상해꽃", tier: 6, image: forestTier6, attack: 200, hp: 500, cost: 6 },
  { name: "세레비", tier: 7, image: forestTier7, attack: 300, hp: 750, cost: 7 },

  { name: "플러쉬", tier: 1, image: electricTier1, attack: 10, hp: 25, cost: 1 },
  { name: "라이츄", tier: 2, image: electricTier2, attack: 40, hp: 100, cost: 2 },
  { name: "전룡", tier: 3, image: electricTier3, attack: 70, hp: 175, cost: 3 },
  { name: "자포코일", tier: 4, image: electricTier4, attack: 110, hp: 275, cost: 4 },
  { name: "볼트로스", tier: 5, image: electricTier5, attack: 150, hp: 375, cost: 5 },
  { name: "피카츄", tier: 6, image: electricTier6, attack: 200, hp: 500, cost: 6 },
  { name: "썬더", tier: 7, image: electricTier7, attack: 300, hp: 750, cost: 7 },

  { name: "찌르꼬", tier: 1, image: flyTier1, attack: 10, hp: 25, cost: 1 },
  { name: "깨비참", tier: 2, image: flyTier2, attack: 40, hp: 100, cost: 2 },
  { name: "구구", tier: 3, image: flyTier3, attack: 70, hp: 175, cost: 3 },
  { name: "깨비드릴조", tier: 4, image: flyTier4, attack: 110, hp: 275, cost: 4 },
  { name: "무장조", tier: 5, image: flyTier5, attack: 150, hp: 375, cost: 5 },
  { name: "토네로스", tier: 6, image: flyTier6, attack: 200, hp: 500, cost: 6 },
  { name: "루기아", tier: 7, image: flyTier7, attack: 300, hp: 750, cost: 7 },

  { name: "꾸꾸리", tier: 1, image: iceTier1, attack: 10, hp: 25, cost: 1 },
  { name: "메꾸리", tier: 2, image: iceTier2, attack: 40, hp: 100, cost: 2 },
  { name: "빙큐보", tier: 3, image: iceTier3, attack: 70, hp: 175, cost: 3 },
  { name: "얼음귀신", tier: 4, image: iceTier4, attack: 110, hp: 275, cost: 4 },
  { name: "크레베이이스", tier: 5, image: iceTier5, attack: 150, hp: 375, cost: 5 },
  { name: "레지아이스", tier: 6, image: iceTier6, attack: 200, hp: 500, cost: 6 },
  { name: "프리져", tier: 7, image: iceTier7, attack: 300, hp: 750, cost: 7 },

  { name: "톱치", tier: 1, image: landTier1, attack: 10, hp: 25, cost: 1 },
  { name: "코코리", tier: 2, image: landTier2, attack: 40, hp: 100, cost: 2 },
  { name: "히포포타스", tier: 3, image: landTier3, attack: 70, hp: 175, cost: 3 },
  { name: "대코파스", tier: 4, image: landTier4, attack: 110, hp: 275, cost: 4 },
  { name: "맘모꾸리", tier: 5, image: landTier5, attack: 150, hp: 375, cost: 5 },
  { name: "한카리아스", tier: 6, image: landTier6, attack: 200, hp: 500, cost: 6 },
  { name: "그란돈", tier: 7, image: landTier7, attack: 300, hp: 750, cost: 7 },

  { name: "부우부", tier: 1, image: normalTier1, attack: 10, hp: 25, cost: 1 },
  { name: "하데리어", tier: 2, image: normalTier2, attack: 40, hp: 100, cost: 2 },
  { name: "다부니", tier: 3, image: normalTier3, attack: 70, hp: 175, cost: 3 },
  { name: "해피너스", tier: 4, image: normalTier4, attack: 110, hp: 275, cost: 4 },
  { name: "링곰", tier: 5, image: normalTier5, attack: 150, hp: 375, cost: 5 },
  { name: "켄타로스", tier: 6, image: normalTier6, attack: 200, hp: 500, cost: 6 },
  { name: "레지기가스", tier: 7, image: normalTier7, attack: 300, hp: 750, cost: 7 },

  { name: "아보", tier: 1, image: poisonTier1, attack: 10, hp: 25, cost: 1 },
  { name: "니드리나", tier: 2, image: poisonTier2, attack: 40, hp: 100, cost: 2 },
  { name: "독개굴", tier: 3, image: poisonTier3, attack: 70, hp: 175, cost: 3 },
  { name: "펜드라", tier: 4, image: poisonTier4, attack: 110, hp: 275, cost: 4 },
  { name: "니드킹", tier: 5, image: poisonTier5, attack: 150, hp: 375, cost: 5 },
  { name: "독침붕", tier: 6, image: poisonTier6, attack: 200, hp: 500, cost: 6 },
  { name: "무한다이노", tier: 7, image: poisonTier7, attack: 300, hp: 750, cost: 7 },

  { name: "과사삭벌레", tier: 1, image: wormTier1, attack: 10, hp: 25, cost: 1 },
  { name: "두루지벌레", tier: 2, image: wormTier2, attack: 40, hp: 100, cost: 2 },
  { name: "케터피", tier: 3, image: wormTier3, attack: 70, hp: 175, cost: 3 },
  { name: "실쿤", tier: 4, image: wormTier4, attack: 110, hp: 275, cost: 4 },
  { name: "파라섹트", tier: 5, image: wormTier5, attack: 150, hp: 375, cost: 5 },
  { name: "핫삼", tier: 6, image: wormTier6, attack: 200, hp: 500, cost: 6 },
  { name: "게노세크트", tier: 7, image: wormTier7, attack: 300, hp: 750, cost: 7 },

  { name: "요가랑", tier: 1, image: esperTier1, attack: 10, hp: 25, cost: 1 },
  { name: "랄토스", tier: 2, image: esperTier2, attack: 40, hp: 100, cost: 2 },
  { name: "에브이", tier: 3, image: esperTier3, attack: 70, hp: 175, cost: 3 },
  { name: "고디모아젤", tier: 4, image: esperTier4, attack: 110, hp: 275, cost: 4 },
  { name: "가디안", tier: 5, image: esperTier5, attack: 150, hp: 375, cost: 5 },
  { name: "뮤", tier: 6, image: esperTier6, attack: 200, hp: 500, cost: 6 },
  { name: "뮤츠", tier: 7, image: esperTier7, attack: 300, hp: 750, cost: 7 },

  { name: "디아루가", tier: 8, image: legendTier1, attack: 400, hp: 1000, cost: 8 },
  { name: "펄기아", tier: 8, image: legendTier2, attack: 400, hp: 1000, cost: 8 },
  { name: "기라티나", tier: 8, image: legendTier3, attack: 400, hp: 1000, cost: 8 },
  { name: "제크로무", tier: 8, image: legendTier4, attack: 400, hp: 1000, cost: 8 },
  { name: "큐레무", tier: 8, image: legendTier5, attack: 400, hp: 1000, cost: 8 },
  { name: "레쿠자", tier: 8, image: legendTier6, attack: 400, hp: 1000, cost: 8 },
  { name: "아르세우스", tier: 8, image: legendTier7, attack: 400, hp: 1000, cost: 8 },
]

async function openCardPackApiCall(userId: string, packType: string): Promise<CardData[]> {
  const response = await fetch("/api/cards/draw-cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, packType }),
  });

  if (!response.ok) throw new Error("카드 뽑기 실패");

  const data = await response.json();
  return data.drawnCards;
}

// 유저 카드 보유 상태 가져오는 API 호출 함수
async function fetchUserCardsApiCall(userId: string): Promise<UserCard[]> {
  const response = await fetch(`/api/user-cards/${userId}`);
  if (!response.ok) throw new Error("유저 카드 정보 불러오기 실패");
  const data = await response.json();
  return data.userCards;
}

function Inventory({ inventory, setInventory }: InventoryProps) {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [openedCards, setOpenedCards] = useState<CardData[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);

  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;
  const userId = parsedUser?.id;

  // 유저 카드 상태 불러오기 (인벤토리 초기 렌더 시 & 카드팩 개봉 후 갱신용)
  const loadUserCards = async () => {
    if (!userId) return;
    try {
      const cards = await fetchUserCardsApiCall(userId);
      setUserCards(cards);
    } catch (error) {
      console.error("유저 카드 상태 로드 실패:", error);
    }
  };

  // 첫 렌더 시 카드 상태 불러오기
  useEffect(() => {
    loadUserCards();
  }, [userId]);

  const openCardPack = async (index: number) => {
    const cardPack = inventory[index];
    if (!cardPack) return;

    try {
      const drawnCardsFromServer = await openCardPackApiCall(userId, cardPack.type);
      console.log("뽑힌 카드들:", drawnCardsFromServer);
      setOpenedCards(drawnCardsFromServer);
      setShowModal(true);
      setInventory((prev) => {
        const newInventory = [...prev];
        newInventory.splice(index, 1);
        return newInventory;
        
      });

      // 카드팩 개봉 후 최신 유저 카드 상태 다시 불러오기
      await loadUserCards();
    } catch (error) {
      console.error(error);
      alert("카드팩 개봉 실패");
    }
  };

  const closeModal = (): void => {
    setShowModal(false);
    setOpenedCards([]);
  };

  return (
    <div className="inventory-page">
      <BackgroundVideo src={inventoryVideo} opacity={1} zIndex={-1} objectPosition="center top" />
      <h2>내 인벤토리</h2>

      {/* 카드팩 리스트 */}
      {inventory && inventory.length === 0 ? (
        <div className="inventory-empty">구매한 카드팩이 없습니다.</div>
      ) : (
        <div className="pack-zone">
          <div className="inventory-list">
            {inventory.map((cardPack, index) => (
              <div key={index} className="inventory-item">
                <div className="card-pack">
                  {cardPack.packImage ? (
                    <img
                      src={cardPack.packImage}
                      alt={cardPack.name}
                      className="card-pack-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                  <p>{cardPack.name}</p>
                  <button className="open-button" onClick={() => openCardPack(index)}>
                    카드팩 개봉
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-card-message">새로운 카드가 나왔습니다!</div>
            <div className="modal-cards">
              {openedCards.map((card, index) => (
                <div key={index} className="modal-card">
                  <img
                    src={getCardImageByNameAndTier(card.name, card.tier, true)} 
                    alt={card.name}
                    className="modal-card-image"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/placeholder.svg";
                    }}
                  />
                  <p>
                    {card.name} (Tier {card.tier})
                  </p>
                </div>
              ))}
            </div>
            <button className="close-modal" onClick={closeModal}>
              X
            </button>
          </div>
        </div>
      )}
      <Link to="/store" className="back-button">
        상점페이지
      </Link>
    </div>
  );
}

export default Inventory;
export { Inventory, cardsData, getCardImageByNameAndTier, openCardPackApiCall, fetchUserCardsApiCall };