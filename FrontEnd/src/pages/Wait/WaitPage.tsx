import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./WaitPage.css";
import waitVideo from "../../assets/videos/waitvideo.mp4";
import BackgroundVideo from "../../components/common/global";
import MessageBox from "../../components/common/MessageBox";
import { useSocket } from "../../context/SocketContext";

function WaitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { socket, connected } = useSocket();

  // ✅ useLocation으로 isHost 여부 받기
  const initialHost = (location.state && location.state.isHost) || false;
  const [isHost, setIsHost] = useState(initialHost);

  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // ✅ 중복 join 방지용 ref
  const hasJoined = useRef(false);

  // ✅ 메시지 창 닫기
  const closeMessage = () => {
    setShowMessage(false);
    setMessage("");
  };

  // ✅ 메시지 표시 함수
  const showMsg = (msg: string) => {
    setMessage(msg);
    setShowMessage(true);
  };

  // ✅ 소켓 연결 및 방 참여
  useEffect(() => {
    if (!socket || !roomCode) return;
    if (hasJoined.current) return;

    hasJoined.current = true;

    // ✅ useLocation으로 받은 isHost에 따라 분기
    if (isHost) {
      console.log("🟢 호스트이므로 joinRoom emit 생략");
    } else {
      console.log("▶ joinRoom emit:", roomCode);
      socket.emit("joinRoom", roomCode);
    }

    // --- 이벤트 핸들러 등록 ---
    const onRoomJoined = (data: { roomCode: string; isHost: boolean }) => {
      console.log("◀ roomJoined 수신:", data);
      setIsHost(data.isHost);
      showMsg(`방에 입장했습니다. (코드: ${data.roomCode})`);
    };

    const onOpponentJoined = () => {
      console.log("👥 상대방 입장 감지");
      showMsg("상대방이 방에 입장했습니다!");
    };

    const onOpponentReady = (readyState: boolean) => {
      console.log("⚙️ 상대방 준비 상태:", readyState);
      setOpponentReady(readyState);
    };

    const onOpponentLeft = () => {
      console.warn("🚪 상대방 퇴장");
      showMsg("상대방이 방을 나갔습니다.");
      setOpponentReady(false);
    };

    const onGameStart = (data: { roomCode: string; currentTurn: string }) => {
      console.log("🎮 gameStart 수신:", data);
      navigate(`/battle/${data.roomCode}`, {
        state: { roomCode: data.roomCode, isHost },
      });
    };

    // ✅ 재연결 시 방 재입장 처리
    const onReconnect = () => {
      console.log("🔄 재연결 발생 — 다시 방 참여:", roomCode);
      socket.emit("joinRoom", roomCode);
    };

    // --- 리스너 등록 ---
    socket.on("roomJoined", onRoomJoined);
    socket.on("opponentJoined", onOpponentJoined);
    socket.on("opponentReady", onOpponentReady);
    socket.on("opponentLeft", onOpponentLeft);
    socket.on("gameStart", onGameStart);
    socket.io.on("reconnect", onReconnect);

    // --- cleanup ---
    return () => {
      socket.off("roomJoined", onRoomJoined);
      socket.off("opponentJoined", onOpponentJoined);
      socket.off("opponentReady", onOpponentReady);
      socket.off("opponentLeft", onOpponentLeft);
      socket.off("gameStart", onGameStart);
      socket.io.off("reconnect", onReconnect);
      hasJoined.current = false;
    };
  }, [socket, roomCode, navigate, isHost]);

  // ✅ 준비 버튼
  const handleReady = () => {
    if (!socket || !roomCode) return;
    setIsReady((prev) => {
      const newReady = !prev;
      console.log("▶ playerReady emit:", { roomCode, isReady: newReady });
      socket.emit("playerReady", { roomCode, isReady: newReady });
      return newReady;
    });
  };

  // ✅ 게임 시작 버튼
  const handleStart = () => {
    if (!isHost) {
      showMsg("방장만 시작할 수 있습니다.");
      return;
    }
    if (!isReady || !opponentReady) {
      showMsg("양쪽 모두 준비 완료해야 합니다.");
      return;
    }
    if (socket && roomCode) {
      console.log("▶ startGame emit:", roomCode);
      socket.emit("startGame", { roomCode });
    }
  };

  // ✅ 메인으로 복귀
  const handleReturn = () => {
    navigate("/main");
  };

  // ✅ 연결 안 되어 있을 때
  if (!connected) {
    return (
      <div className="wait-body">
        <div className="wait-page">
          <BackgroundVideo src={waitVideo} opacity={1} zIndex={-1} />
          <div className="room-info">
            <h2>대기실</h2>
            <p>소켓 서버에 연결 중입니다...</p>
          </div>
        </div>
      </div>
    );
  }

  // ✅ 기본 UI
  return (
    <div className="wait-body">
      <div className="wait-page">
        <BackgroundVideo src={waitVideo} opacity={1} zIndex={-1} />

        {showMessage && (
          <MessageBox
            bgColor="#e3f2fd"
            borderColor="#2196f3"
            textColor="#0d47a1"
            onClose={closeMessage}
            closeborderColor="black"
          >
            {message}
          </MessageBox>
        )}

        <div className="room-info">
          <h2>대기실</h2>
          <p>방 코드: {roomCode}</p>
          {isHost && <p>✅ 당신은 방장입니다.</p>}
        </div>

        <div className="players">
          <div className="player">
            <p>나</p>
            <p>{isReady ? "준비 완료" : "준비 중"}</p>
          </div>
          <div className="player">
            <p>상대방</p>
            <p>{opponentReady ? "준비 완료" : "대기 중"}</p>
          </div>
        </div>

        <div className="buttons">
          <button
            className={`ready-button ${isReady ? "ready" : ""}`}
            onClick={handleReady}
          >
            {isReady ? "준비 완료" : "준비하기"}
          </button>

          <button
            className="start-button"
            onClick={handleStart}
            disabled={!isHost}
            title={!isHost ? "방장만 게임을 시작할 수 있습니다." : ""}
          >
            시작하기
          </button>

          <button className="return-button" onClick={handleReturn}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default WaitPage;
