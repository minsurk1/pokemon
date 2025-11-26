// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "../utils/axiosInstance";

export type CardPackType = "B" | "A" | "S";

interface DeckData {
  cards: { id: string; name: string; image: string }[];
}

export interface CardPack {
  id: string;
  name: string;
  packImage?: string;
  isOpened: boolean;
  type: CardPackType;
  quantity: number;
}

// 🔥 덱에 들어가는 카드 타입
export interface DeckCard {
  id: string;
  name: string;
  cardType?: string;
  attack: number;
  hp: number;
  maxhp: number;
  cost: number;
  tier: number;
  image2D: string;
}

// 🔥 유저가 보유한 카드 타입
export interface OwnedCard {
  cardId: string;
  name: string;
  image2D: string;
  cardType?: string;
  attack: number;
  hp: number;
  maxhp: number;
  cost: number;
  tier: number;
  count: number;
}

interface User {
  id: string;
  nickname: string;
  money: number;
  inventory: CardPack[];
  deck: DeckCard[]; // ✅ 추가
  cards: OwnedCard[]; // ✅ 추가
}

interface UserContextType {
  userInfo: User | null;
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  error: string;
  selectedDeck: string[];
  setSelectedDeck: React.Dispatch<React.SetStateAction<string[]>>;
  refreshUser: () => Promise<User | null>;
  buyCardPack: (packType: CardPackType) => Promise<User>;
  openCardPack: (packId: string) => Promise<{ updatedInventory: CardPack[]; drawnCards: any[] }>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ✅ 인벤토리 변환
const transformInventory = (inventoryData: any[]): CardPack[] => {
  if (!Array.isArray(inventoryData)) return [];

  return inventoryData
    .map((item): Partial<CardPack> | null => {
      const pack = item.pack || {};
      const id = String(item.packId ?? pack._id ?? item._id ?? "");
      if (!id) return null;

      return {
        id,
        name: item.name ?? pack.name ?? "Unknown Pack",
        packImage: item.packImage ?? item.image ?? pack.image ?? undefined,
        type: (item.type ?? pack.type ?? "B") as CardPackType,
        isOpened: Boolean(item.isOpened),
        quantity: Number(item.quantity ?? 1),
      };
    })
    .filter((p): p is CardPack => Boolean(p));
};

// ✅ 덱 변환
const transformDeck = (deckData: any[] | undefined): DeckCard[] => {
  if (!Array.isArray(deckData)) return [];
  return deckData.map((c) => ({
    id: String(c.id),
    name: c.name,
    cardType: c.cardType ?? "normal",
    attack: Number(c.attack ?? 0),
    hp: Number(c.hp ?? 0),
    maxhp: Number(c.maxhp ?? c.hp ?? 0),
    cost: Number(c.cost ?? c.tier ?? 1),
    tier: Number(c.tier ?? 1),
    image2D: c.image2D ?? c.image ?? "default.png",
  }));
};

// ✅ 보유 카드 변환
const transformOwnedCards = (cardsData: any[] | undefined): OwnedCard[] => {
  if (!Array.isArray(cardsData)) return [];
  return cardsData.map((c) => ({
    cardId: String(c.cardId),
    name: c.name,
    image2D: c.image2D ?? "default.png",
    cardType: c.cardType ?? "normal",
    attack: Number(c.attack ?? 0),
    hp: Number(c.hp ?? 0),
    maxhp: Number(c.maxhp ?? c.hp ?? 0),
    cost: Number(c.cost ?? c.tier ?? 1),
    tier: Number(c.tier ?? 1),
    count: Number(c.count ?? 0),
  }));
};

// ✅ /user/me 응답 전체를 User 형태로 변환
const transformUserFromMe = (data: any): User => {
  return {
    id: data.id ?? data._id ?? "",
    nickname: data.nickname,
    money: data.money,
    inventory: transformInventory(data.inventory || []),
    deck: transformDeck(data.deck || []),
    cards: transformOwnedCards(data.cards || []),
  };
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDeck, setSelectedDeck] = useState<string[]>([]);

  // ✅ 공통 유저 정보 불러오기
  const fetchUser = async (): Promise<User | null> => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/user/me");
      const updatedUser = transformUserFromMe(res.data);

      setUserInfo(updatedUser);
      setError("");

      // 덱 카드 id 리스트를 selectedDeck에 저장
      const deckIds = updatedUser.deck.map((c) => c.id);
      setSelectedDeck(deckIds);
      localStorage.setItem("selectedDeck", JSON.stringify(deckIds));

      return updatedUser;
    } catch (err: any) {
      console.error("❌ 유저 정보 불러오기 실패:", err);
      setError(err.response?.data?.message || err.message || "유저 정보 불러오기 실패");
      setUserInfo(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ 로그인 유지 (새로고침 시 토큰 유지)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ 유저 정보 + 덱/카드 동기화
  const refreshUser = async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      const res = await axiosInstance.get("/user/me");

      const updatedUser = transformUserFromMe(res.data);
      setUserInfo(updatedUser);

      const deckIds = updatedUser.deck.map((c) => c.id);
      setSelectedDeck(deckIds);
      localStorage.setItem("selectedDeck", JSON.stringify(deckIds));

      return updatedUser;
    } catch (err) {
      console.error("❌ refreshUser 실패:", err);
      return null;
    }
  };

  // ✅ 로그아웃
  const logout = () => {
    localStorage.removeItem("token");
    delete axiosInstance.defaults.headers.common.Authorization;
    setUserInfo(null);
    setSelectedDeck([]);
    localStorage.removeItem("selectedDeck");
  };

  // ✅ 카드팩 구매
  const buyCardPack = async (packType: CardPackType) => {
    try {
      const res = await axiosInstance.post("/store/buy", { packType });
      const data = res.data;

      // 여기서는 money/inventory만 바뀌는 경우가 대부분이라
      // 기존 userInfo의 deck/cards는 그대로 유지
      const updatedUser: User = {
        id: data.user._id ?? data.user.id ?? userInfo?.id ?? "",
        nickname: data.user.nickname ?? userInfo?.nickname ?? "",
        money: data.user.money,
        inventory: transformInventory(data.user.inventory),
        deck: userInfo?.deck ?? [],
        cards: userInfo?.cards ?? [],
      };

      setUserInfo(updatedUser);
      return updatedUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || "카드팩 구매 실패");
    }
  };

  // ✅ 카드팩 개봉
  const openCardPack = async (packId: string): Promise<{ updatedInventory: CardPack[]; drawnCards: any[] }> => {
    if (!userInfo) throw new Error("유저 정보 없음");
    const pack = userInfo.inventory.find((p) => p.id === packId);
    if (!pack) throw new Error("카드팩을 찾을 수 없습니다.");

    try {
      const res = await axiosInstance.post("/inventory/open-pack", { type: pack.type });
      const data = res.data;

      const updatedInventory = transformInventory(data.userPacks || []);
      setUserInfo((prev) => (prev ? { ...prev, inventory: updatedInventory } : prev));

      const drawnCards = (data.drawnCards || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        damage: c.damage,
        hp: c.hp,
        image: c.image,
      }));

      return { updatedInventory, drawnCards };
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || "카드팩 개봉 실패");
    }
  };

  return (
    <UserContext.Provider
      value={{
        userInfo,
        setUserInfo,
        loading,
        error,
        refreshUser,
        buyCardPack,
        openCardPack,
        logout,
        selectedDeck,
        setSelectedDeck,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser는 UserProvider 안에서만 사용 가능합니다.");
  return context;
};
