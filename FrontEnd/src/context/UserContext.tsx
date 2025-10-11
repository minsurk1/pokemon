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
  logout: () => void; // ✅ 로그아웃 추가
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ✅ inventory 변환 (pack null 방지 + id string 변환)
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

  // ✅ 공통 유저 정보 불러오기
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

  // ✅ 로그인 유지(새로고침 시 토큰 반영)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
      fetchUser(); // ✅ 토큰이 있으면 자동 로그인 유지
    } else {
      setLoading(false); // 토큰이 없으면 로딩만 해제
    }
  }, []);

  // ✅ 토큰 변경 시 강제로 리로드할 수 있는 함수
  const refreshUser = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common.Authorization;
      setUserInfo(null);
      return null;
    }
    return fetchUser();
  };

  // ✅ 로그아웃 함수 추가
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

  // ✅ 카드팩 개봉
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
    <UserContext.Provider
      value={{ userInfo, setUserInfo, loading, error, refreshUser, buyCardPack, openCardPack, logout }}
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
