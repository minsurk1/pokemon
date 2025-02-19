// 메인 페이지에서 서버와 클라이언트간의 연결 상태 확인 기능 추가
// 메인 페이지 접속 시 터미널에서 접속과 종료 상태 확인 가능
// 로그인을 했지만 세션 관련한 기능은 아직 추가하지 않았음
// 대표 카드 밑에 있는 서버로 메세지 보내는 기능은 테스트 하고 냅뒀음. 삭제해도 됨

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";
import mainImage from "./assets/images/default.png";
import backgroundImage from "./assets/images/mainbg.jpg";
import { CardAnimation } from "@lasbe/react-card-animation";
import io from "socket.io-client"; // socket.io-client 임포트

function MainPage({ currency, selectedDeck }) {
  const navigate = useNavigate();
  const [showRoomTab, setShowRoomTab] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const [socket, setSocket] = useState(null); // socket 상태 추가
  const [serverResponse, setServerResponse] = useState(""); // 서버 응답을 받을 상태

  useEffect(() => {
    // 배경 스타일 설정
    setBackgroundStyle({
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    });

    // WebSocket 연결 설정
    const newSocket = io("http://localhost:5000", { withCredentials: true });

    setSocket(newSocket);

    // 서버로부터 "message" 이벤트가 오면 응답 처리
    newSocket.on("message", (data) => {
      setServerResponse(data); // 서버 응답을 상태에 저장
    });

    // 방 생성 후 "roomCreated" 이벤트를 수신하여 대기실로 이동
    newSocket.on("roomCreated", (newRoomCode) => {
      navigate("/wait", { state: { roomCode: newRoomCode } }); // 방 코드와 함께 대기실로 이동
    });

    // 방 입장 처리
    newSocket.on("roomJoined", (joinedRoomCode) => {
      navigate("/wait", { state: { roomCode: joinedRoomCode } }); // 방 코드와 함께 대기실로 이동
    });

    // 방 입장 오류 처리
    newSocket.on("roomError", (error) => {
      alert(error); // 방 입장 실패 시 오류 메시지 표시
    });

    // 컴포넌트가 언마운트될 때 연결 종료
    return () => newSocket.close();
  }, [navigate]);

  const handleLogout = () => {
    navigate("/");
  };

  const handleStore = () => {
    navigate("/store");
  };

  const handleDeck = () => {
    navigate("/deck");
  };

  const handleBattle = () => {
    navigate("/battle");
  };

  const handleReadme = () => {
    navigate("/rule");
  };

  const toggleRoomTab = () => {
    setShowRoomTab(!showRoomTab);
  };

  const handleProfile = () => {
    navigate("/profile");
  };

  const handleCreateRoom = () => {
    if (socket) {
      socket.emit("createRoom"); // 서버에 방 생성 요청
    }
  };

  const handleJoinRoom = () => {
    if (roomCode.length === 6 && socket) {
      socket.emit("joinRoom", roomCode); // 서버에 방 입장 요청
    } else {
      alert("올바른 방 코드를 입력해주세요.");
    }
  };

  // 서버로 메시지 보내는 함수
  const sendMessageToServer = () => {
    if (socket) {
      socket.emit("message", "클라이언트에서 보낸 메시지");
    }
  };

  return (
    <div className="main-container" style={backgroundStyle}>
      {/* 사이드바 */}
      <div className="sidebar">
        <button className="menu-button" onClick={handleStore}>
          상점
        </button>
        <button className="menu-button" onClick={handleDeck}>
          내카드
        </button>
        <button className="menu-button" onClick={handleBattle}>
          배틀테스트
        </button>
        <button className="menu-button" onClick={handleReadme}>
          룰 설명
        </button>
        <button className="menu-button" onClick={toggleRoomTab}>
          {showRoomTab ? "탭 닫기" : "방 만들기/입장"}
        </button>
        <button className="menu-button" onClick={handleProfile}>
          마이페이지
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        <div className="main-header">
          <span className="money">현재 돈: {currency}원</span>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>

        {/* 대표 몬스터 카드 */}
        <CardAnimation angle={35}>
          <div className="monster-card">
            {selectedDeck && selectedDeck.length > 0 ? (
              <img
                src={selectedDeck[0]}
                alt="대표 몬스터 카드"
                className="monster-image"
              />
            ) : (
              <img
                src={mainImage}
                alt="기본 대표 몬스터 카드"
                className="monster-image"
              />
            )}
          </div>
        </CardAnimation>

        {/* 방 만들기/입장 탭 */}
        {showRoomTab && (
          <div className="room-tab">
            <h3>방 만들기/입장</h3>
            <button className="create-room" onClick={handleCreateRoom}>
              방 만들기
            </button>
            <div className="join-room">
              <input
                type="text"
                placeholder="방 코드 입력"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button onClick={handleJoinRoom}>방 입장</button>
            </div>
          </div>
        )}

        {/* 서버와의 통신 상태 */}
        <div className="server-response">
          <p>서버 응답: {serverResponse}</p>
        </div>

        {/* 서버로 메시지 보내기 */}
        <button onClick={sendMessageToServer}>서버로 메시지 보내기</button>
      </div>
    </div>
  );
}

export default MainPage;
