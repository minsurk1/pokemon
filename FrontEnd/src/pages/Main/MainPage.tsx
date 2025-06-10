import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./MainPage.css";
import mainImage from "../../assets/images/default.png";
import { CardAnimation } from "@lasbe/react-card-animation";
import io, { type Socket } from "socket.io-client";
import BackgroundVideo from "../../components/common/global.tsx";
import { MenuButton } from "../../components/common/button.tsx";

import phantomVideo from "../../assets/videos/phantom.mp4";
import gaiogaVideo from "../../assets/videos/gaioga.mp4";
import grandonVideo from "../../assets/videos/grandon.mp4";
import thunderVideo from "../../assets/videos/thunder.mp4";
import lekuzaVideo from "../../assets/videos/lekuza.mp4";
import lugiaVideo from "../../assets/videos/lugia.mp4";
import darkraiVideo from "../../assets/videos/darkrai.mp4";

const videoFiles = [phantomVideo, gaiogaVideo, grandonVideo, thunderVideo ,darkraiVideo, lekuzaVideo ,lugiaVideo];

const videoThemes = {
  [phantomVideo]: {
    name: "팬텀",
    color: "phantom",
  },
  [gaiogaVideo]: {
    name: "가이오가",
    color: "gaioga",
  },
  [grandonVideo]: {
    name: "그란돈",
    color: "grandon",
  },
  [thunderVideo]: {
    name: "썬더",
    color: "thunder",
  },
  [lekuzaVideo]:{
    name: "레쿠자",
    color: "lekuza",
  },
  [lugiaVideo]:{
    name:"루기아",
    color:"lugia"
  },
  [darkraiVideo]:{
    name:"다크라이",
    color:"darkrai"
  }
};

interface MainPageProps {
  currency: number;
  selectedDeck: string[];
}

function MainPage({ currency, selectedDeck }: MainPageProps) {
  const navigate = useNavigate();
  const [showRoomTab, setShowRoomTab] = useState<boolean>(false);
  const [roomCode, setRoomCode] = useState<string>("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [serverResponse, setServerResponse] = useState<string>("");
  const [serverError, setServerError] = useState<string>("");

  const [randomVideo] = useState(() => {
    const randomIndex = Math.floor(Math.random() * videoFiles.length);
    return videoFiles[randomIndex];
  });

  const themeColorClass = videoThemes[randomVideo].color;
  const themeName = videoThemes[randomVideo].name;

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--theme-color",
      `var(--${themeColorClass}-color)`
    );
    document.documentElement.style.setProperty(
      "--theme-hover-color",
      `var(--${themeColorClass}-hover-color)`
    );

    const newSocket = io(
      "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/",
      { withCredentials: true }
    );
    setSocket(newSocket);

    const onMessage = (data: string) => {
      setServerResponse(data);
      setServerError("");
    };
    const onRoomCreated = (newRoomCode: string) => {
      navigate("/wait", { state: { roomCode: newRoomCode } });
    };
    const onRoomJoined = (joinedRoomCode: string) => {
      navigate("/wait", { state: { roomCode: joinedRoomCode } });
    };
    const onError = (error: string) => {
      setServerError(error);
    };

    newSocket.on("message", onMessage);
    newSocket.on("roomCreated", onRoomCreated);
    newSocket.on("roomJoined", onRoomJoined);
    newSocket.on("error", onError);

    return () => {
      newSocket.off("message", onMessage);
      newSocket.off("roomCreated", onRoomCreated);
      newSocket.off("roomJoined", onRoomJoined);
      newSocket.off("error", onError);
      newSocket.close();
    };
  }, [navigate, themeColorClass]);

  const handleLogout = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleStore = useCallback(() => {
    navigate("/store");
  }, [navigate]);

  const handleDeck = useCallback(() => {
    navigate("/deck");
  }, [navigate]);

  const handledex = useCallback(() => {
    navigate("/dex");
  }, [navigate]);

  const handleBattle = useCallback(() => {
    navigate("/battle");
  }, [navigate]);

  const handleRule = useCallback(() => {
    navigate("/rule");
  }, [navigate]);

  const toggleRoomTab = useCallback(() => {
    setShowRoomTab((prev) => !prev);
    setServerError(""); // 탭 열 때 에러 초기화
  }, []);

  const handleProfile = useCallback(() => {
    navigate("/profile");
  }, [navigate]);

  const handleCreateRoom = useCallback(() => {
    if (socket) {
      socket.emit("createRoom");
      setServerError("");
    }
  }, [socket]);

  const handleJoinRoom = useCallback(() => {
    if (roomCode.length === 6 && socket) {
      socket.emit("joinRoom", roomCode);
      setServerError("");
    } else {
      setServerError("올바른 방 코드를 입력해주세요.");
    }
  }, [roomCode, socket]);

  // Enter 키로 방 입장 처리
  const onRoomCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleJoinRoom();
    }
  };

  return (
    <div className="main-container">
      <BackgroundVideo src={randomVideo} opacity={1} zIndex={1} />
      <div className="sidebar">
        <MenuButton onClick={handleStore}>상점</MenuButton>
        <MenuButton onClick={handleDeck}>내카드</MenuButton>
        <MenuButton onClick={handledex}>도감</MenuButton>
        <MenuButton onClick={handleBattle}>배틀</MenuButton>
        <MenuButton onClick={handleRule}>Rule</MenuButton>
        <MenuButton onClick={toggleRoomTab}>
          {showRoomTab ? "탭 닫기" : "방 만들기/입장"}
        </MenuButton>
        <MenuButton onClick={handleProfile}>마이페이지</MenuButton>
      </div>

      <div className="main-content">
        <div className="main-header">
          <span className="money">현재 돈: {currency}원</span>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>

        <CardAnimation angle={35}>
          <div className="monster-card">
            {selectedDeck && selectedDeck.length > 0 ? (
              <img
                src={selectedDeck[0] || "/placeholder.svg"}
                alt="대표 몬스터 카드"
                className="monster-image"
              />
            ) : (
              <img
                src={mainImage || "/placeholder.svg"}
                alt="기본 대표 몬스터 카드"
                className="monster-image"
              />
            )}
          </div>
        </CardAnimation>

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
                onKeyDown={onRoomCodeKeyDown}
              />
              <button onClick={handleJoinRoom}>방 입장</button>
            </div>
            {serverError && (
              <div
                className="error-message"
                style={{ color: "red", marginTop: "8px" }}
              >
                {serverError}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainPage;
