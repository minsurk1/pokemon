import React from "react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io, { type Socket } from "socket.io-client";
import "./WaitPage.css";
import waitVideo from "../../assets/videos/waitvideo.mp4";
import BackgroundVideo from "../../components/common/global";
import MessageBox from "../../components/common/MessageBox";

function WaitPage() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();

  const [isReady, setIsReady] = useState<boolean>(false);
  const [opponentReady, setOpponentReady] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isHost, setIsHost] = useState<boolean>(false); // 호스트 여부 상태 추가

  useEffect(() => {
    if (!roomCode) {
      setMessage("잘못된 방 코드입니다.");
      setShowMessage(true);
      return;
    }

    // 서버와 WebSocket 연결
    const newSocket = io(
      "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/",
      { withCredentials: true }
    );
    setSocket(newSocket);

    // 방 입장 요청
    newSocket.emit("joinRoom", roomCode);

    // 서버에서 참가 성공 시 호스트 여부 함께 전달받음
    newSocket.on("roomJoined", (data: { isHost: boolean }) => {
      setIsHost(data.isHost);
      setMessage("방에 입장하였습니다.");
      setShowMessage(true);
    });

    // 상대방 접속 알림
    newSocket.on("opponentJoined", () => {
      setMessage("상대방이 방에 입장했습니다.");
      setShowMessage(true);
    });

    // 상대방 준비 상태 업데이트
    newSocket.on("opponentReady", (readyState: boolean) => {
      setOpponentReady(readyState);
    });

    // 상대방 퇴장 알림
    newSocket.on("opponentLeft", () => {
      setMessage("상대방이 방을 나갔습니다.");
      setShowMessage(true);
      setOpponentReady(false);
    });

    // 게임 시작 이벤트 처리
    newSocket.on("gameStart", () => {
      navigate("/battle");
    });

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {
      newSocket.close();
    };
  }, [navigate, roomCode]);

  // 메시지 박스 닫기
  const closeMessage = (): void => {
    setShowMessage(false);
    setMessage("");
  };

  // 준비 상태 토글 및 서버에 알림
  const handleReady = (): void => {
    setIsReady((prevReady) => {
      const newReady = !prevReady;
      if (socket && roomCode) {
        socket.emit("playerReady", { roomCode, isReady: newReady });
      }
      return newReady;
    });
  };

  // 게임 시작 (호스트만 가능)
  const handleStart = (): void => {
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
      setMessage("양쪽 모두 준비가 완료되어야 게임을 시작할 수 있습니다.");
      setShowMessage(true);
    }
  };

  // 메인으로 돌아가기
  const handleReturn = (): void => {
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
