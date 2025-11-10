import { Router } from "express";
import { rooms } from "../socket/room"; // ✅ 기존 rooms 사용

const router = Router();

/**
 * ✅ 방 리스트 가져오기
 * GET /api/rooms/list
 */
router.get("/list", (req, res) => {
  try {
    const roomList = Object.entries(rooms).map(([roomCode, room]) => ({
      roomCode,
      players: room.players?.length ?? 0,
      inGame: room.inGame, // ✅ room.ts 구조에 맞게 수정됨
      lastActivity: room.lastActivity, // ✅ 프론트에서 유령방 표시할 때 유용 (선택)
    }));

    return res.json({ rooms: roomList });
  } catch (err) {
    console.error("❌ 방 리스트 조회 오류:", err);
    return res.status(500).json({ rooms: [] });
  }
});

export default router;
