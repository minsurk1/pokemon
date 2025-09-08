// UserContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";

// ✅ 카드팩 타입 정의 (id 추가)
export interface CardPack {
  id: string; // 서버에서 받은 UserPack ID
  name: string;
  packImage: string;
  isOpened: boolean;
  type: "B" | "A" | "S";
}

// ✅ 유저 정보 타입
interface User {
  id: string;
  nickname: string;
  money: number;
  inventory: CardPack[];
}

// ✅ Context 타입
interface UserContextType {
  userInfo: User | null;
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  error: string;
  refreshUser: () => Promise<void>;
  addCardsToInventory: (cardPack: CardPack) => void;
  buyCardPack: (
    cardType: "B급 카드팩" | "A급 카드팩" | "S급 카드팩"
  ) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ 유저 정보 불러오기
  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("로그인 필요");

      const res = await axios.get("/api/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  // ✅ 인벤토리에 카드팩 추가
  const addCardsToInventory = (cardPack: CardPack) => {
    if (!userInfo) return;
    setUserInfo({
      ...userInfo,
      inventory: [...(userInfo.inventory || []), cardPack],
    });
  };

  // ✅ 카드팩 구매 함수
  const buyCardPack = async (
    cardType: "B급 카드팩" | "A급 카드팩" | "S급 카드팩"
  ) => {
    if (!userInfo) throw new Error("로그인 필요");
    const token = localStorage.getItem("token");
    if (!token) throw new Error("로그인 필요");

    try {
      const res = await axios.post(
        "/api/store/buy",
        { cardType },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 💰 잔액 업데이트
      setUserInfo((prev) => (prev ? { ...prev, money: res.data.money } : prev));

      // 🃏 뽑은 카드 인벤토리에 추가
      res.data.drawnCards.forEach((card: any) => {
        // 서버에서 받아온 카드 타입을 "B" | "A" | "S"로 변환
        const type: "B" | "A" | "S" =
          card.cardType === "S급 카드팩"
            ? "S"
            : card.cardType === "A급 카드팩"
            ? "A"
            : "B";

        const cardPack: CardPack = {
          id: card.userPackId, // 서버에서 생성된 UserPack ID
          name: card.name,
          packImage: card.image3D,
          isOpened: false,
          type: type,
        };
        addCardsToInventory(cardPack);
      });
    } catch (err: any) {
      console.error(
        "카드팩 구매 실패:",
        err.response?.data?.message || err.message
      );
      throw new Error(err.response?.data?.message || "서버 오류");
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
        addCardsToInventory,
        buyCardPack,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// ✅ 커스텀 훅
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser는 UserProvider 안에서만 사용 가능");
  return context;
};
