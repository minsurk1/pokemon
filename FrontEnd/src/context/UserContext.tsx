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
  packImage?: string; // ✅ 선택적(optional)
  isOpened: boolean;
  type: CardPackType;
  quantity: number;
}

export interface CardData {
  id: string;
  name: string;
  damage: number;
  hp: number;
  image: string;
}

interface User {
  id: string;
  nickname: string;
  money: number;
  inventory: CardPack[];
}

interface UserContextType {
  userInfo: User | null;
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  error: string;
  selectedDeck: string[]; // ✅ 추가
  setSelectedDeck: React.Dispatch<React.SetStateAction<string[]>>; // ✅ 추가
  refreshUser: () => Promise<User | null>;
  buyCardPack: (packType: CardPackType) => Promise<User>;
  openCardPack: (packId: string) => Promise<{ updatedInventory: CardPack[]; drawnCards: CardData[] }>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ✅ 인벤토리 변환 함수 (타입 안전하게 보강)
const transformInventory = (inventoryData: any[]): CardPack[] => {
  if (!Array.isArray(inventoryData)) return [];

  return (
    inventoryData
      .map((item): Partial<CardPack> | null => {
        const pack = item.pack || {};
        const id = String(item.packId ?? pack._id ?? item._id ?? "");
        if (!id) return null;

        return {
          id,
          name: item.name ?? pack.name ?? "Unknown Pack",
          packImage: item.packImage ?? item.image ?? pack.image ?? undefined, // ✅ optional로 맞춤
          type: (item.type ?? pack.type ?? "B") as CardPackType,
          isOpened: Boolean(item.isOpened),
          quantity: Number(item.quantity ?? 1),
        };
      })
      // ✅ 타입 가드로 null 제거 (CardPack만 남김)
      .filter((p): p is CardPack => Boolean(p))
  );
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
      const data = res.data;

      const updatedUser: User = {
        id: data.id ?? data._id ?? "",
        nickname: data.nickname,
        money: data.money,
        inventory: transformInventory(data.inventory || []),
      };

      setUserInfo(updatedUser);
      setError("");
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

  // ✅ 토큰 변경 시 새로고침
  // ✅ 유저 + 덱 정보 동시 불러오기
  const refreshUser = async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      const userRes = await axiosInstance.get("/user/me");
      const deckRes = await axiosInstance.get("/userdeck/single");

      setUserInfo(userRes.data);
      if (deckRes.data?.deck?.cards) {
        const deckIds = deckRes.data.deck.cards.map((c: any) => c.id);
        setSelectedDeck(deckIds);
        localStorage.setItem("selectedDeck", JSON.stringify(deckIds));
      }

      return userRes.data; // ✅ 반환 타입을 맞춰줌
    } catch (err) {
      console.error("❌ refreshUser 실패:", err);
      return null; // ✅ 오류 시에도 반환
    }
  };

  // ✅ 로그아웃
  const logout = () => {
    localStorage.removeItem("token");
    delete axiosInstance.defaults.headers.common.Authorization;
    setUserInfo(null);
  };

  // ✅ 카드팩 구매
  const buyCardPack = async (packType: CardPackType) => {
    try {
      const res = await axiosInstance.post("/store/buy", { packType });
      const data = res.data;

      const updatedUser: User = {
        id: data.user._id ?? data.user.id ?? "",
        nickname: data.user.nickname,
        money: data.user.money,
        inventory: transformInventory(data.user.inventory),
      };

      setUserInfo(updatedUser);
      return updatedUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || "카드팩 구매 실패");
    }
  };

  // ✅ 카드팩 개봉
  const openCardPack = async (packId: string): Promise<{ updatedInventory: CardPack[]; drawnCards: CardData[] }> => {
    if (!userInfo) throw new Error("유저 정보 없음");
    const pack = userInfo.inventory.find((p) => p.id === packId);
    if (!pack) throw new Error("카드팩을 찾을 수 없습니다.");

    try {
      const res = await axiosInstance.post("/inventory/open-pack", { type: pack.type });
      const data = res.data;

      const updatedInventory = transformInventory(data.userPacks || []);
      setUserInfo((prev) => (prev ? { ...prev, inventory: updatedInventory } : prev));

      const drawnCards: CardData[] = (data.drawnCards || []).map((c: any) => ({
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
        selectedDeck, // ✅ 추가
        setSelectedDeck, // ✅ 추가
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
