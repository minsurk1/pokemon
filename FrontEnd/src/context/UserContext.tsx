// UserContext.tsx
// ✅ 이 파일은 JWT 기반으로 로그인한 사용자의 정보(nickname, money, inventory)를 전역 상태로 관리하기 위한 Context입니다.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../utils/axiosInstance";

// 유저 정보 타입
interface User {
  nickname: string;
  money: number;
  inventory: CardPack[]; // 카드 인벤토리 추가
}

// 카드팩 타입
export interface CardPack {
  name: string;
  packImage: string;
  isOpened: boolean;
  type: "B" | "A" | "S";
}

interface UserContextType {
  userInfo: User | null;
  loading: boolean;
  error: string;
  refreshUser: () => Promise<void>;
  addCardsToInventory: (cardPack: CardPack) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 유저 정보 새로고침 함수
  const fetchUser = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/user/me");
      setUserInfo(res.data);
      setError("");
    } catch (err: any) {
      setError("유저 정보 불러오기 실패");
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  const addCardsToInventory = (cardPack: CardPack) => {
    if (!userInfo) return;
    setUserInfo({
      ...userInfo,
      inventory: [...(userInfo.inventory || []), cardPack],
    });
  };

  return (
    <UserContext.Provider
      value={{ userInfo, loading, error, refreshUser, addCardsToInventory }}
    >
      {children}
    </UserContext.Provider>
  );
};

// ✅ 커스텀 훅 - 다른 컴포넌트에서 useUser()로 쉽게 접근 가능
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser는 UserProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
};
