import { Router, Response, Request } from "express"; // 👈 @types/express 설치 후 이 구문이 오류 없이 작동해야 합니다.
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import User, { IUser } from "../models/User";

const router = Router();

console.log("userRoutes 라우터 로드됨");

// ✅ 유저 돈 추가 (치트용) - 개발 끝나면 삭제
router.post("/add-money", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?._id; 
  // req.body는 기본적으로 Request 타입에 포함되므로, AuthenticatedRequest가 Request를 상속하면 문제 없습니다.
  const { amount } = req.body; 

  if (!userId) return res.status(401).json({ message: "로그인이 필요합니다." });
  if (!amount || typeof amount !== "number") return res.status(400).json({ message: "amount 필요" });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

    user.money += amount;
    await user.save();

    res.status(200).json({ message: `돈 ${amount}G 추가 완료`, money: user.money });
  } catch (err) {
    console.error("돈 추가 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err });
  }
});

// ✅ 로그인한 유저 정보 가져오기 (⭐ 인벤토리 populate 및 오류 7006 해결)
router.get("/me", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?._id; 
  if (!userId) {
    return res.status(401).json({ message: "인증이 필요합니다." });
  }

  try {
    const user = await User.findById(userId)
      .populate("inventory.pack") 
      .lean<IUser>();

    if (!user) return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    
    // 오류 7006 해결: item 매개변수에 명시적으로 'any' 타입을 지정
    const populatedInventory = (user.inventory || []).map((item: any) => ({
        packId: item.pack?._id?.toString() || '',
        type: item.type,
        quantity: item.quantity,
        name: (item.pack as any)?.name || "", 
        packImage: (item.pack as any)?.image || "",
    }));

    res.json({
      nickname: user.nickname,
      money: user.money,
      inventory: populatedInventory, 
    });
  } catch (err) {
    console.error("유저 정보 조회 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err });
  }
});

export default router;