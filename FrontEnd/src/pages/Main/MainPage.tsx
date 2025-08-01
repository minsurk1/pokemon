"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import "./MainPage.css";
import io, { type Socket } from "socket.io-client";
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
  [phantomVideo]: {
    name: "팬텀",
    color: "phantom",
    image: phantomImage,
  },
  [gaiogaVideo]: {
    name: "가이오가",
    color: "gaioga",
    image: gaiogaImage,
  },
  [grandonVideo]: {
    name: "그란돈",
    color: "grandon",
    image: grandonImage,
  },
  [thunderVideo]: {
    name: "썬더",
    color: "thunder",
    image: thunderImage,
  },
  [lekuzaVideo]: {
    name: "레쿠자",
    color: "lekuza",
    image: rekuzaImage,
  },
  [lugiaVideo]: {
    name: "루기아",
    color: "lugia",
    image: ligiaImage,
  },
  [darkraiVideo]: {
    name: "다크라이",
    color: "darkrai",
    image: darkraiImage,
  },
};

interface MainPageProps {
  currency: number;
  selectedDeck: string[];
}

function MainPage({ currency, selectedDeck }: MainPageProps) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState<string>("");
  const [money, setMoney] = useState<number>(0);
  const [showRoomTab, setShowRoomTab] = useState<boolean>(false);
  const [showCardTab, setShowCardTab] = useState<boolean>(false);
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
  const themeImage = videoThemes[randomVideo].image;

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

  useEffect(() => {
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

    const newSocket = io(
      "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/",
      { withCredentials: true }
    );
    setSocket(newSocket);

    newSocket.on("message", (data: string) => setServerResponse(data));
    newSocket.on("roomCreated", (code: string) =>
      navigate("/wait", { state: { roomCode: code } })
    );
    newSocket.on("roomJoined", (code: string) =>
      navigate("/wait", { state: { roomCode: code } })
    );
    newSocket.on("error", (error: string) => setServerError(error));

    return () => {
      newSocket.close();
    };
  }, [navigate, themeColorClass]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.get(
          "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api/user/me",
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        setNickname(res.data.nickname);
        setMoney(res.data.money);
      } catch (err) {
        console.error("유저 정보 로딩 실패:", err);
      }
    };

    fetchUserInfo();
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

  const onRoomCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleJoinRoom();
  };

  return (
    <div className="main-container">
      <BackgroundVideo src={randomVideo} opacity={1} zIndex={1} />
      <div className="sidebar">
        <motion.ul variants={list} initial="hidden" animate="visible">
          <motion.li variants={item}>
            <MenuButton onClick={handleStore}>상점</MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleDeck}>카드</MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handledex}>도감</MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleBattle}>배틀</MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleRule}>Rule</MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={toggleRoomTab}>
              {showRoomTab ? "탭 닫기" : "방 만들기/입장"}
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleProfile}>마이페이지</MenuButton>
          </motion.li>
        </motion.ul>
      </div>

      {showCardTab && (
        <div className="card-tab">
          <div className="theme-card-container">
            <div className="theme-main-card">
              <CardAnimation>
                <img
                  src={themeImage || "/placeholder.svg"}
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
            안녕하세요, {nickname || "로그인 해주세요"}님
          </span>

          <span className="money" style={{ marginLeft: "1rem" }}>
            현재 돈: {money.toLocaleString()}원
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
          </div>
        )}
      </div>
    </div>
  );
}

export default MainPage;
