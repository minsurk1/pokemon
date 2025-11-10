"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { motion } from "framer-motion";
import "./MainPage.css";
import RoomLobbyModal from "../../components/room/RoomLobbyModal";

import { FaBook } from "react-icons/fa6";
import { GiBattleGear } from "react-icons/gi";
import { MdCatchingPokemon, MdMeetingRoom } from "react-icons/md";
import { FaStore } from "react-icons/fa";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { SiPokemon } from "react-icons/si";

import BackgroundVideo from "../../components/common/global";
import { MenuButton } from "../../components/common/button";
import { CardAnimation } from "@lasbe/react-card-animation";
import { useSocket } from "../../context/SocketContext";
import { useUser } from "../../context/UserContext";

// ✅ 영상 및 테마
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

const videoFiles = [phantomVideo, gaiogaVideo, grandonVideo, thunderVideo, darkraiVideo, lekuzaVideo, lugiaVideo];

const videoThemes = {
  [phantomVideo]: { name: "팬텀", color: "phantom", image: phantomImage },
  [gaiogaVideo]: { name: "가이오가", color: "gaioga", image: gaiogaImage },
  [grandonVideo]: { name: "그란돈", color: "grandon", image: grandonImage },
  [thunderVideo]: { name: "썬더", color: "thunder", image: thunderImage },
  [lekuzaVideo]: { name: "레쿠자", color: "lekuza", image: rekuzaImage },
  [lugiaVideo]: { name: "루기아", color: "lugia", image: ligiaImage },
  [darkraiVideo]: { name: "다크라이", color: "darkrai", image: darkraiImage },
};

function MainPage() {
  const navigate = useNavigate();
  const socket = useSocket();
  const { userInfo, loading, refreshUser, logout, selectedDeck } = useUser();

  const [showCardTab, setShowCardTab] = useState(false);

  const [showRoomLobbyModal, setShowRoomLobbyModal] = useState(false);

  // ✅ 랜덤 배경
  const [randomVideo] = useState(() => {
    const randomIndex = Math.floor(Math.random() * videoFiles.length);
    return videoFiles[randomIndex];
  });

  const themeColorClass = (videoThemes as any)[randomVideo].color;
  const themeName = (videoThemes as any)[randomVideo].name;
  const themeImage = (videoThemes as any)[randomVideo].image;

  // ✅ CSS 변수로 테마 색상 주입
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", `var(--${themeColorClass}-color)`);
    document.documentElement.style.setProperty("--theme-hover-color", `var(--${themeColorClass}-hover-color)`);
    document.documentElement.style.setProperty("--theme-accent-color", `var(--${themeColorClass}-accent-color)`);
  }, [themeColorClass]);

  // ✅ axios 헤더에 토큰 반영
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete axiosInstance.defaults.headers.common.Authorization;
    }
  }, []);

  // ✅ 새로고침 후 유저 정보 자동 불러오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!loading && token && !userInfo) {
      refreshUser().then((data) => {
        console.log("🎯 User + Deck loaded:", data);
      });
    }
  }, [loading, userInfo, refreshUser]);

  // ✅ 핸들러들
  const handleLogout = useCallback(() => {
    logout(); // Context 내부 상태 초기화
    navigate("/");
  }, [logout, navigate]);

  const handleStore = useCallback(() => navigate("/store"), [navigate]);
  const handleDeck = useCallback(() => navigate("/deck"), [navigate]);
  const handleDex = useCallback(() => navigate("/dex"), [navigate]);
  const handleInventory = useCallback(() => navigate("/inventory"), [navigate]);
  const handleBattle = useCallback(() => {
    if (!selectedDeck || selectedDeck.length === 0) {
      alert("⚠️ 덱이 비어 있습니다. 먼저 덱을 구성해주세요!");
      return;
    }
    navigate("/battle", { state: { selectedDeck } }); // ✅ 덱 데이터를 함께 전달
  }, [navigate, selectedDeck]);

  const handleRule = useCallback(() => navigate("/rule"), [navigate]);
  const handleProfile = useCallback(() => navigate("/profile"), [navigate]);

  const toggleCardTab = useCallback(() => setShowCardTab((prev) => !prev), []);

  // ✅ 애니메이션 설정
  const list = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { when: "beforeChildren", staggerChildren: 0.2 } },
  };

  const item = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="main-container">
      <BackgroundVideo src={randomVideo} opacity={1} zIndex={1} />

      {/* 사이드바 */}
      <div className="sidebar-fixed">
        <motion.ul variants={list} initial="hidden" animate="visible">
          <motion.li variants={item}>
            <MenuButton onClick={handleStore} marginBottom="3.3rem">
              상점 <FaStore />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleDeck} marginBottom="3.3rem">
              카드 <SiPokemon />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleDex} marginBottom="3.3rem">
              도감 <MdCatchingPokemon />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleInventory} marginBottom="3.3rem">
              인벤토리 <GiBattleGear />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleRule} marginBottom="3.3rem" cursor="help">
              규칙 <FaBook />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={() => setShowRoomLobbyModal(true)} marginBottom="3.3rem" disabled={loading || !userInfo}>
              방 만들기/입장
              <MdMeetingRoom />
            </MenuButton>
          </motion.li>
          <motion.li variants={item}>
            <MenuButton onClick={handleProfile} marginBottom="3.3rem">
              마이페이지 <IoIosInformationCircleOutline />
            </MenuButton>
          </motion.li>
        </motion.ul>
      </div>

      {/* 카드 탭 */}
      {showCardTab && (
        <div className="card-tab">
          <div className="theme-card-container">
            <div className="theme-main-card">
              <CardAnimation>
                <img src={themeImage} alt="대표 카드" className="theme-card-image" />
              </CardAnimation>
              <div className="theme-card-name">{themeName}</div>
            </div>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 */}
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
              {loading ? (
                <span className="user-nickname">로딩 중...</span>
              ) : userInfo ? (
                <>
                  <span className="user-nickname">환영합니다, {userInfo.nickname}님</span>
                  <span className="money-display">💰 {userInfo.money?.toLocaleString() ?? 0} G</span>
                </>
              ) : (
                <span className="user-nickname">로그인 해주세요</span>
              )}
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      {/* ✅ 여기! RoomLobbyModal은 반드시 return 내부에 있어야 렌더링됨 */}
      {showRoomLobbyModal && <RoomLobbyModal onClose={() => setShowRoomLobbyModal(false)} />}
    </div>
  );
}

export default MainPage;
