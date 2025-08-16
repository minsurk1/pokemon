"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./axiosInstance";
import { motion } from "framer-motion";
import "./MainPage.css";

import BackgroundVideo from "../../components/common/global";
import { MenuButton } from "../../components/common/button";

import phantomVideo from "../../assets/videos/phantom.mp4";
import gaiogaVideo from "../../assets/videos/gaioga.mp4";
import grandonVideo from "../../assets/videos/grandon.mp4";
import thunderVideo from "../../assets/videos/thunder.mp4";
import lekuzaVideo from "../../assets/videos/lekuza.mp4";
import lugiaVideo from "../../assets/videos/lugia.mp4";
import darkraiVideo from "../../assets/videos/darkrai.mp4";

import darkraiImage from "../../assets/images/darkrai.png";
import grandonImage from "../../assets/images/landtier7.png";
import gaiogaImage from "../../assets/images/watertier7.png";
import thunderImage from "../../assets/images/electrictier7.png";
import rekuzaImage from "../../assets/images/legendtier6.png";
import phantomImage from "../../assets/images/poisontier6.png";
import ligiaImage from "../../assets/images/flytier7.png";
import { CardAnimation } from "@lasbe/react-card-animation";

import { useSocket } from "../../context/SocketContext"; // context에서 소켓 가져오기

const videoFiles = [
  phantomVideo,
  gaiogaVideo,
  grandonVideo,
  thunderVideo,
  darkraiVideo,
  lekuzaVideo,
  lugiaVideo,
];

const videoThemes = {
  [phantomVideo]: { name: "팬텀", color: "phantom", image: phantomImage },
  [gaiogaVideo]: { name: "가이오가", color: "gaioga", image: gaiogaImage },
  [grandonVideo]: { name: "그란돈", color: "grandon", image: grandonImage },
  [thunderVideo]: { name: "썬더", color: "thunder", image: thunderImage },
  [lekuzaVideo]: { name: "레쿠자", color: "lekuza", image: rekuzaImage },
  [lugiaVideo]: { name: "루기아", color: "lugia", image: ligiaImage },
  [darkraiVideo]: { name: "다크라이", color: "darkrai", image: darkraiImage },
};

interface MainPageProps {
  currency: number;
  selectedDeck: string[];
}

function MainPage({ currency, selectedDeck }: MainPageProps) {
  const navigate = useNavigate();
  const { socket } = useSocket(); // context에서 소켓 받아옴

  const [nickname, setNickname] = useState<string | null>(null);
  const [money, setMoney] = useState<number | null>(null);
  const [showRoomTab, setShowRoomTab] = useState(false);
  const [showCardTab, setShowCardTab] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [serverResponse, setServerResponse] = useState("");

  // 랜덤 비디오 및 테마 선택
  const [randomVideo] = useState(() => {
    const randomIndex = Math.floor(Math.random() * videoFiles.length);
    return videoFiles[randomIndex];
  });

  const themeColorClass = videoThemes[randomVideo].color;
  const themeName = videoThemes[randomVideo].name;
  const themeImage = videoThemes[randomVideo].image;

  useEffect(() => {
    // CSS 변수 세팅
    document.documentElement.style.setProperty(
      "--theme-color",
      `var(--${themeColorClass}-color)`
    );
    document.documentElement.style.setProperty(
      "--theme-hover-color",
      `var(--${themeColorClass}-hover-color)`
    );
    document.documentElement.style.setProperty(
      "--theme-accent-color",
      `var(--${themeColorClass}-accent-color)`
    );
  }, [themeColorClass]);

  useEffect(() => {
    if (!socket) return; // 소켓 없으면 실행 중단

    // socket 이벤트 핸들러 등록
    const onMessage = (data: string) => setServerResponse(data);
    const onRoomCreated = (data: { roomCode: string }) => {
      console.log("방 생성됨:", data.roomCode);
      navigate(`/wait/${data.roomCode}`);
    };

    const onRoomJoined = (data: { roomCode: string }) => {
      console.log("방 참가 성공:", data.roomCode);
      navigate(`/wait/${data.roomCode}`);
    };
    const onError = (error: string) => {
      setServerError(error);
    };

    socket.on("message", onMessage);
    socket.on("roomCreated", onRoomCreated);
    socket.on("roomJoined", onRoomJoined);
    socket.on("error", onError);

    // 클린업 함수로 이벤트 해제
    return () => {
      socket.off("message", onMessage);
      socket.off("roomCreated", onRoomCreated);
      socket.off("roomJoined", onRoomJoined);
      socket.off("error", onError);
    };
  }, [socket, navigate]);

  useEffect(() => {
    // 사용자 정보 API 호출
    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/user/me");
        setNickname(res.data.nickname);
        setMoney(res.data.money);
      } catch (err) {
        console.error("유저 정보 가져오기 실패:", err);
        setNickname(null);
        setMoney(null);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/");
  }, [navigate]);

  const handleStore = useCallback(() => navigate("/store"), [navigate]);
  const handleDeck = useCallback(() => navigate("/deck"), [navigate]);
  const handledex = useCallback(() => navigate("/dex"), [navigate]);
  const handleBattle = useCallback(() => navigate("/battle"), [navigate]);
  const handleRule = useCallback(() => navigate("/rule"), [navigate]);
  const handleProfile = useCallback(() => navigate("/profile"), [navigate]);

  const toggleRoomTab = useCallback(() => {
    setShowRoomTab((prev) => !prev);
    setServerError("");
  }, []);

  const toggleCardTab = useCallback(() => {
    setShowCardTab((prev) => !prev);
  }, []);

  // 방 생성 이벤트 핸들러
  const handleCreateRoom = useCallback(() => {
    if (!socket) {
      setServerError("서버 연결이 되어있지 않습니다.");
      return;
    }
    setServerError("");
    socket.emit("createRoom");
  }, [socket]);

  // 방 입장 이벤트 핸들러
  const handleJoinRoom = useCallback(() => {
    if (!socket) {
      setServerError("서버 연결이 되어있지 않습니다.");
      return;
    }
    if (roomCode.length === 6) {
      setServerError("");
      socket.emit("joinRoom", roomCode.trim().toUpperCase());
    } else {
      setServerError("올바른 방 코드를 입력해주세요.");
    }
  }, [roomCode, socket]);

  // 입력 엔터키 처리
  const onRoomCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleJoinRoom();
  };

  const list = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { when: "beforeChildren", staggerChildren: 0.2 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="main-container">
      <BackgroundVideo src={randomVideo} opacity={1} zIndex={1} />
      <div className="sidebar">
        <motion.ul
          variants={list}
          initial="hidden"
          animate="visible"
          style={{ overflow: "hidden" } as React.CSSProperties }
        >
          <motion.li variants={item}>
            <MenuButton
              onClick={handleStore}
              marginBottom="2.7rem"
              marginTop="0.4rem"
            >
              상점
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleDeck} marginBottom="2.7rem">
              카드
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handledex} marginBottom="2.7rem">
              도감
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleBattle} marginBottom="2.7rem">
              배틀
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleRule} marginBottom="2.7rem">
              Rule
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={toggleRoomTab} marginBottom="2.7rem">
              {showRoomTab ? "탭 닫기" : "방 만들기/입장"}
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleProfile} marginBottom="2.7rem">
              마이페이지
            </MenuButton>
          </motion.li>
        </motion.ul>
      </div>

      {showCardTab && (
        <div className="card-tab">
          <div className="theme-card-container">
            <div className="theme-main-card">
              <CardAnimation>
                <img
                  src={themeImage}
                  alt="대표 카드"
                  className="theme-card-image"
                />
              </CardAnimation>
              <div className="theme-card-name">{themeName}</div>
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        <div className="main-header">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="theme-name"
            onClick={toggleCardTab}
          >
            {themeName}
          </motion.button>

          <span className="user-nickname" style={{ marginLeft: "1rem" }}>
            {nickname ? `환영합니다, ${nickname}님` : "로그인 해주세요"}
          </span>

          <span className="money" style={{ marginLeft: "1rem" }}>
            {money !== null ? `현재 돈: ${money.toLocaleString()}원` : ""}
          </span>

          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>

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
            {serverResponse && (
              <div
                className="server-response"
                style={{ color: "green", marginTop: "8px" }}
              >
                {serverResponse}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MainPage;
