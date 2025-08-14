import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./WaitPage.css";
import waitVideo from "../../assets/videos/waitvideo.mp4";
import BackgroundVideo from "../../components/common/global";
import MessageBox from "../../components/common/MessageBox";
import { useSocket } from "../../context/SocketContext"; // context에서 소켓 가져오기

function WaitPage() {
  const navigate = useNavigate();
  const { roomCode } = useParams<{ roomCode: string }>();

  const { socket } = useSocket(); // context에서 소켓 받아옴

  const [isReady, setIsReady] = useState<boolean>(false);
  const [opponentReady, setOpponentReady] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false); // 호스트 여부 상태 추가

  useEffect(() => {
    if (!roomCode) {
      setMessage("잘못된 방 코드입니다.");
      setShowMessage(true);
      return;
    }
    if (!socket) return;

    // 방 입장 요청
    socket.emit("joinRoom", roomCode);

    // 서버에서 참가 성공 시 호스트 여부 함께 전달받음
    const onRoomJoined = (data: { isHost: boolean }) => {
      setIsHost(data.isHost);
      setMessage("방에 입장하였습니다.");
      setShowMessage(true);
    };

    // 상대방 접속 알림
    const onOpponentJoined = () => {
      setMessage("상대방이 방에 입장했습니다.");
      setShowMessage(true);
    };

    // 상대방 준비 상태 업데이트
    const onOpponentReady = (readyState: boolean) => {
      setOpponentReady(readyState);
    };

    // 상대방 퇴장 알림
    const onOpponentLeft = () => {
      setMessage("상대방이 방을 나갔습니다.");
      setShowMessage(true);
      setOpponentReady(false);
    };

    // 게임 시작 이벤트 처리
    const onGameStart = () => {
      navigate("/battle");
    };

    socket.on("roomJoined", onRoomJoined);
    socket.on("opponentJoined", onOpponentJoined);
    socket.on("opponentReady", onOpponentReady);
    socket.on("opponentLeft", onOpponentLeft);
    socket.on("gameStart", onGameStart);

    // 클린업: 컴포넌트 언마운트 시 이벤트 해제
    return () => {
      socket.off("roomJoined", onRoomJoined);
      socket.off("opponentJoined", onOpponentJoined);
      socket.off("opponentReady", onOpponentReady);
      socket.off("opponentLeft", onOpponentLeft);
      socket.off("gameStart", onGameStart);
    };
  }, [socket, roomCode, navigate]);

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
