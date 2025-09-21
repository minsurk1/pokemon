import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axiosInstance from "../utils/axiosInstance";

export type CardPackType = "B" | "A" | "S";

export interface CardPack {
  id: string; // CardPack _id
  name: string;
  packImage?: string;
  isOpened: boolean;
  type: CardPackType;
  quantity: number;
}

interface User {
  id: string;
  nickname: string;
  money: number;
  inventory: CardPack[]; // ✅ UserPack과 동일 구조
}

interface UserContextType {
  userInfo: User | null;
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  error: string;
  refreshUser: () => Promise<User | null>;
  buyCardPack: (packType: CardPackType) => Promise<User>;
  addCardsToInventory: (newCards: CardPack[]) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// ✅ 서버 inventory -> CardPack[] 변환
const transformInventory = (inventoryData: any[]): CardPack[] =>
  inventoryData?.map((item: any) => ({
    id: item.pack._id,          // 서버 _id
    name: item.pack.name,
    packImage: item.pack.image,
    type: item.pack.type,
    isOpened: item.opened,
    quantity: item.quantity ?? 1,
  })) || [];

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUser = async (): Promise<User | null> => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("로그인 필요");

      const res = await axiosInstance.get("/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUser: User = {
        id: res.data._id,
        nickname: res.data.nickname,
        money: res.data.money,
        inventory: transformInventory(res.data.inventory || []),
      };

      setUserInfo(updatedUser);
      setError("");
      return updatedUser;
    } catch (err: any) {
      console.error("[UserContext] 유저 정보 불러오기 실패:", err.message);
      setError("유저 정보 불러오기 실패");
      setUserInfo(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async (): Promise<User | null> => {
    return await fetchUser();
  };

  const buyCardPack = async (packType: CardPackType): Promise<User> => {
    try {
      const res = await axiosInstance.post("/store/buy", { packType });

      if (!res.data || !res.data.user) {
        throw new Error("서버에서 유저 정보를 반환하지 않았습니다.");
      }

      const updatedUser: User = {
        id: res.data.user._id,
        nickname: res.data.user.nickname,
        money: res.data.user.money,
        inventory: transformInventory(res.data.user.inventory || []),
      };

      setUserInfo(updatedUser);
      return updatedUser;
    } catch (err: any) {
      console.error(
        "[UserContext] 카드팩 구매 실패:",
        err.response?.data?.message || err.message
      );
      throw new Error(err.response?.data?.message || "서버 오류");
    }
  };

  const addCardsToInventory = (newCards: CardPack[]) => {
    setUserInfo((prev) => {
      if (!prev) return prev;
      const updatedInventory = [...prev.inventory];

      newCards.forEach((newCard) => {
        const existing = updatedInventory.find((p) => p.id === newCard.id);
        if (existing) {
          existing.quantity += newCard.quantity;
          if (newCard.isOpened) existing.isOpened = true;
        } else {
          updatedInventory.push(newCard);
        }
      });

      return { ...prev, inventory: updatedInventory };
    });
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
        addCardsToInventory,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUser는 UserProvider 안에서만 사용 가능합니다.");
  return context;
};
