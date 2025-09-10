// FrontEnd/src/context/UserContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axiosInstance from "../utils/axiosInstance";

// 카드팩 타입
export interface CardPack {
  id: string; // DB UserPack _id
  name: string; // "B급 카드팩" 등
  packImage?: string;
  isOpened: boolean;
  type: "B" | "A" | "S";
  quantity: number;
}

// 유저 정보 타입
interface User {
  id: string;
  nickname: string;
  money: number;
  inventory: CardPack[];
}

// Context 타입
interface UserContextType {
  userInfo: User | null;
  setUserInfo: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  error: string;
  refreshUser: () => Promise<void>;
  buyCardPack: (
    cardType: "B급 카드팩" | "A급 카드팩" | "S급 카드팩"
  ) => Promise<void>;
  addCardsToInventory: (newCards: CardPack[]) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 유저 정보 불러오기
  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("로그인 필요");

      const res = await axiosInstance.get("/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const inventory: CardPack[] =
        res.data.userPacks?.map((pack: any) => ({
          id: pack._id,
          name: pack.packType,
          packImage: pack.packImage,
          isOpened: pack.opened,
          type: pack.packType[0] as "B" | "A" | "S",
          quantity: pack.quantity,
        })) || [];

      setUserInfo({
        id: res.data._id,
        nickname: res.data.nickname,
        money: res.data.money,
        inventory,
      });
      setError("");
    } catch (err: any) {
      console.error(err);
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

  // 카드팩 구매
  const buyCardPack = async (
    cardType: "B급 카드팩" | "A급 카드팩" | "S급 카드팩"
  ) => {
    if (!userInfo) throw new Error("로그인 필요");

    try {
      const res = await axiosInstance.post("/store/buy", { cardType });
      const purchasedPack = res.data;

      addCardsToInventory([
        {
          id: purchasedPack.userPackId,
          name: cardType,
          packImage: purchasedPack.packImage,
          type: cardType[0] as "B" | "A" | "S",
          isOpened: false,
          quantity: 1,
        },
      ]);

      // 서버 반영된 최신 돈으로 업데이트
      setUserInfo((prev) => (prev ? { ...prev, money: res.data.money } : prev));
    } catch (err: any) {
      console.error(
        "카드팩 구매 실패:",
        err.response?.data?.message || err.message
      );
      throw new Error(err.response?.data?.message || "서버 오류");
    }
  };

  // 인벤토리에 카드팩 추가
  const addCardsToInventory = (newCards: CardPack[]) => {
    setUserInfo((prev) => {
      if (!prev) return prev;
      const updatedInventory = [...prev.inventory];

      newCards.forEach((newCard) => {
        const existing = updatedInventory.find((p) => p.id === newCard.id);
        if (existing) {
          existing.quantity += newCard.quantity;
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

// 커스텀 훅
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context)
    throw new Error("useUser는 UserProvider 안에서만 사용 가능합니다.");
  return context;
};
