"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance"; // 공통 설정된 axios 인스턴스
import { motion } from "framer-motion";
import "./MainPage.css";

import { FaBook } from "react-icons/fa6";
import { GiBattleGear } from "react-icons/gi";
import { MdCatchingPokemon } from "react-icons/md";
import { FaStore } from "react-icons/fa";
import { MdMeetingRoom } from "react-icons/md";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { SiPokemon } from "react-icons/si";

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

import { useSocket } from "../../context/SocketContext";
import { useUser } from "../../context/UserContext";

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

function MainPage() {
  const navigate = useNavigate();
  const { socket } = useSocket();

  // ❌ 사용하지 않는 지역 상태 제거 (혼동 방지)
  // const [nickname, setNickname] = useState<string | null>(null);
  // const [money, setMoney] = useState<number | null>(null);

  const { userInfo, loading, error, refreshUser } = useUser();

  const [showRoomTab, setShowRoomTab] = useState(false);
  const [showCardTab, setShowCardTab] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [serverError, setServerError] = useState("");
  const [serverResponse, setServerResponse] = useState("");

  const [randomVideo] = useState(() => {
    const randomIndex = Math.floor(Math.random() * videoFiles.length);
    return videoFiles[randomIndex];
  });

  const themeColorClass = (videoThemes as any)[randomVideo].color;
  const themeName = (videoThemes as any)[randomVideo].name;
  const themeImage = (videoThemes as any)[randomVideo].image;

  // 1) 테마 컬러 CSS 변수 주입
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
  }, [themeColorClass]);

  // 2) 마운트 시 토큰을 axios 전역 헤더에 반영 (중요)
  //    로그인 직후 navigate 된 경우에도 /auth/me 가 바로 성공하도록 보장
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common.Authorization;
    }
  }, []);

  // 3) 토큰이 있고 userInfo 가 비어 있으면 즉시 프로필 갱신 (중요)
  //    => 새로고침 없이 우측 상단에 닉네임/돈 표시
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!loading && token && !userInfo) {
      // 에러로 한번 실패했어도 토큰이 있으면 재시도
      refreshUser().catch((e) => {
        // 필요 시 디버깅 로그
        console.warn("refreshUser 실패:", e);
      });
    }
  }, [loading, userInfo, refreshUser]);

  // 4) 소켓 리스너: 전역 탐색을 유발하는 리스너는 "명시적 액션"에서만 등록
  //    - 여기서는 메시지/에러만 구독하고, create/join 성공에 따른 navigate는
  //      각 버튼 핸들러에서 socket.once 로 처리(중복 네비게이션 방지)
  useEffect(() => {
    if (!socket) return;

    const onMessage = (data: string) => setServerResponse(data);
    const onError = (err: string) => setServerError(err);

    socket.on("message", onMessage);
    socket.on("error", onError);

    return () => {
      socket.off("message", onMessage);
      socket.off("error", onError);
    };
  }, [socket]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    delete axiosInstance.defaults.headers.common.Authorization; // 🔐 헤더 정리
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
    if (!socket) {
      setServerError("서버 연결이 되어있지 않습니다.");
      return;
    }
    setServerError("");

    console.log("▶ createRoom emit 요청");
    socket.emit("createRoom");

    // ✅ 성공 이벤트에 대해 '단 한 번'만 네비게이션
    socket.once("roomCreated", ({ roomCode }) => {
      console.log("◀ roomCreated 수신:", roomCode);
      navigate(`/wait/${roomCode}`, { state: { isHost: true } });
    });

    // 필요 시 에러 once 도 추가 가능
    socket.once("error", (err: string) => setServerError(err));
  }, [socket, navigate]);

  const handleJoinRoom = useCallback(() => {
    if (!socket) {
      setServerError("서버 연결이 되어있지 않습니다.");
      return;
    }

    const trimmedCode = roomCode.trim().toUpperCase();
    if (trimmedCode.length === 6) {
      setServerError("");
      socket.emit("joinRoom", trimmedCode);

      // ✅ 성공 이벤트 '단 한 번'만 네비게이션
      socket.once("roomJoined", (data: { roomCode: string }) => {
        console.log("◀ roomJoined 수신:", data.roomCode);
        navigate(`/wait/${data.roomCode}`, { state: { isHost: false } });
      });

      socket.once("error", (err: string) => setServerError(err));
    } else {
      setServerError("올바른 방 코드를 입력해주세요.");
    }
  }, [roomCode, socket, navigate]);

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

      <div className="sidebar-fixed">
        <motion.ul
          variants={list}
          initial="hidden"
          animate="visible"
          style={{ overflow: "hidden" } as React.CSSProperties}
        >
          <motion.li variants={item}>
            <MenuButton onClick={handleStore} marginBottom="3.3rem">
              상점
              <FaStore />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleDeck} marginBottom="3.3rem">
              카드
              <SiPokemon />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handledex} marginBottom="3.3rem">
              도감
              <MdCatchingPokemon />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleBattle} marginBottom="3.3rem">
              배틀
              <GiBattleGear />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleRule} marginBottom="3.3rem" cursor="help">
              Rule
              <FaBook />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={toggleRoomTab} marginBottom="3.3rem">
              {showRoomTab ? "탭 닫기" : "방 만들기/입장"}
              <MdMeetingRoom />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleProfile} marginBottom="3.3rem">
              마이페이지
              <IoIosInformationCircleOutline />
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
          <div className="main-header-info-group">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="theme-name"
              onClick={toggleCardTab}
            >
              {themeName}
            </motion.button>

            <div className="user-status-box">
              <span className="user-nickname">
                {loading
                  ? "로딩 중..."
                  : userInfo
                  ? `환영합니다, ${userInfo.nickname}님`
                  : "로그인 해주세요"}
              </span>

              <span className="money-display">
                {userInfo ? `💰 ${userInfo.money.toLocaleString()} G` : ""}
              </span>
            </div>
          </div>

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
