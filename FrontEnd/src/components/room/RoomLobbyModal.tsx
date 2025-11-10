import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RoomLobbyModal.css";
import { useSocket } from "../../context/SocketContext";

interface RoomListItem {
  roomCode: string;
  players: number;
  inGame: boolean;
}

interface Props {
  onClose: () => void;
}

export default function RoomLobbyModal({ onClose }: Props) {
  const socket = useSocket();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [roomCode, setRoomCode] = useState("");

  // ✅ 방 목록 불러오기
  useEffect(() => {
    const loadRooms = () => {
      fetch("/api/rooms/list")
        .then((res) => res.json())
        .then((data) => setRooms(data.rooms || []))
        .catch(() => setRooms([]));
    };

    loadRooms(); // 최초 1회 실행
    const interval = setInterval(loadRooms, 3000);

    // ✅ 방 생성 완료 이벤트 받기
    socket.on("roomCreated", ({ roomCode }) => {
      navigate(`/wait/${roomCode}`);
    });

    return () => {
      clearInterval(interval);
      socket.off("roomCreated");
    };
  }, []);

  // ✅ 코드로 입장
  const joinByCode = () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length !== 6) return;
    navigate(`/wait/${code}`);
  };

  // ✅ 엔터키로도 입장
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") joinByCode();
  };

  // ✅ 리스트 선택 입장
  const joinRoom = (code: string) => {
    navigate(`/wait/${code}`);
  };

  return (
    <div className="lobby-overlay">
      <div className="lobby-modal">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        <h2 className="modal-title">배틀 대기실</h2>

        <button className="create-btn" onClick={() => socket.emit("createRoom")}>
          방 만들기
        </button>

        <div className="join-box">
          <input
            type="text"
            placeholder="방 코드 입력"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button onClick={joinByCode}>입장</button>
        </div>

        <h3 className="sub-title">대기중인 방 목록</h3>

        <div className="room-list">
          {rooms.length === 0 && <p className="empty-text">현재 대기중인 방이 없습니다.</p>}

          {rooms.map((r) => (
            <div key={r.roomCode} className="room-item">
              <div className="room-info">
                <span className="room-code">{r.roomCode}</span>
                <span className="room-players">{r.players}/2</span>
              </div>

              {r.inGame ? (
                <span className="room-status ingame">게임중</span>
              ) : (
                <button className="join-btn" onClick={() => joinRoom(r.roomCode)}>
                  입장
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
