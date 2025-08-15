import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./WaitPage.css";
import waitVideo from "../../assets/videos/waitvideo.mp4";
import BackgroundVideo from "../../components/common/global";
import MessageBox from "../../components/common/MessageBox";
import { useSocket } from "../../context/SocketContext";

function WaitPage() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();
  const { socket } = useSocket();

  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!roomCode || typeof roomCode !== "string") {
      setMessage("잘못된 방 코드입니다.");
      setShowMessage(true);
      return;
    }
    if (!socket) return;

    socket.emit("joinRoom", roomCode);

    const onRoomJoined = (data: { roomCode: string; isHost: boolean }) => {
      setIsHost(data.isHost);
      setMessage(`방에 입장하였습니다. (코드: ${data.roomCode})`);
      setShowMessage(true);
    };

    const onOpponentJoined = () => {
      setMessage("상대방이 방에 입장했습니다.");
      setShowMessage(true);
    };

    const onOpponentReady = (readyState: boolean) => {
      setOpponentReady(readyState);
    };

    const onOpponentLeft = () => {
      setMessage("상대방이 방을 나갔습니다.");
      setShowMessage(true);
      setOpponentReady(false);
    };

    const onGameStart = (data: { roomCode: string }) => {
      navigate(`/battle/${data.roomCode}`);
    };

    socket.on("roomJoined", onRoomJoined);
    socket.on("opponentJoined", onOpponentJoined);
    socket.on("opponentReady", onOpponentReady);
    socket.on("opponentLeft", onOpponentLeft);
    socket.on("gameStart", onGameStart);

    return () => {
      socket.off("roomJoined", onRoomJoined);
      socket.off("opponentJoined", onOpponentJoined);
      socket.off("opponentReady", onOpponentReady);
      socket.off("opponentLeft", onOpponentLeft);
      socket.off("gameStart", onGameStart);
    };
  }, [socket, roomCode, navigate]);

  const closeMessage = () => {
    setShowMessage(false);
    setMessage("");
  };

  const handleReady = () => {
    setIsReady(prev => {
      const newReady = !prev;
      if (socket && roomCode) {
        socket.emit("playerReady", { roomCode, isReady: newReady });
      }
      return newReady;
    });
  };

  const handleStart = () => {
    if (!isHost) {
      setMessage("방장만 시작할 수 있습니다.");
      setShowMessage(true);
      return;
    }
    if (isReady && opponentReady) {
      if (socket && roomCode) {
        socket.emit("startGame", roomCode);
      }
    } else {
      setMessage("양쪽 모두 준비 완료해야 합니다.");
      setShowMessage(true);
    }
  };

  const handleReturn = () => {
    navigate("/main");
  };

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
