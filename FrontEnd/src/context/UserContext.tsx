// src/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "../utils/axiosInstance";

export type CardPackType = "B" | "A" | "S";

export interface CardPack {
  id: string;
  name: string;
  packImage?: string;
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
  refreshUser: () => Promise<User | null>;
  buyCardPack: (packType: CardPackType) => Promise<User>;
  openCardPack: (packId: string) => Promise<{ updatedInventory: CardPack[]; drawnCards: CardData[] }>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// inventory 변환 (pack null 방지 + id string 변환)
const transformInventory = (inventoryData: any[]): CardPack[] =>
  inventoryData
    ?.map((item: any) => {
      const packId = item.packId || item.pack?._id;
      if (!packId) return null;
      return {
        id: packId.toString(),
        name: item.name || item.pack?.name || "Unknown Pack",
        packImage: item.image || item.pack?.image,
        type: item.type,
        isOpened: item.isOpened ?? false,
        quantity: item.quantity ?? 1,
      };
    })
    .filter(Boolean) as CardPack[];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUser = async (): Promise<User | null> => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/user/me");
      const data = res.data;

      const updatedUser: User = {
        id: data._id,
        nickname: data.nickname,
        money: data.money,
        inventory: transformInventory(data.inventory || []),
      };

      setUserInfo(updatedUser);
      setError("");
      return updatedUser;
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "유저 정보 불러오기 실패");
      setUserInfo(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async () => fetchUser();

  const buyCardPack = async (packType: CardPackType) => {
    try {
      const res = await axiosInstance.post("/store/buy", { packType });
      console.log("📦 buy response:", res.data); // ✅ 응답 구조 확인
      const data = res.data;

      const updatedUser: User = {
        id: data.user._id || data.user.id,
        nickname: data.user.nickname,
        money: data.user.money,
        inventory: transformInventory(data.user.inventory),
      };

      setUserInfo(updatedUser);
      return updatedUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || err.message || "구매 실패");
    }
  };

  const openCardPack = async (packId: string): Promise<{ updatedInventory: CardPack[]; drawnCards: CardData[] }> => {
    if (!userInfo) throw new Error("유저 정보 없음");
    const pack = userInfo.inventory.find((p) => p.id === packId);
    if (!pack) throw new Error("카드팩을 찾을 수 없습니다.");

    try {
      const res = await axiosInstance.post("/inventory/open-pack", { type: pack.type });
      const data = res.data;

      const updatedInventory = transformInventory(data.userPacks);
      setUserInfo((prev) => (prev ? { ...prev, inventory: updatedInventory } : prev));

      const drawnCards: CardData[] = data.drawnCards.map((c: any) => ({
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
    <UserContext.Provider value={{ userInfo, setUserInfo, loading, error, refreshUser, buyCardPack, openCardPack }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser는 UserProvider 안에서만 사용 가능합니다.");
  return context;
};
