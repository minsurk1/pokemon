import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "./Login.css";
import logo from "./assets/images/logo.png";
import backgroundImage from "./assets/images/loginbg.png";
import MainPage from "./MainPage";
import SignUpPage from "./SignUpPage";
import Inventory from "./Inventory";
import StorePage from "./StorePage";
import DeckPage from "./DeckPage";
import WaitPage from "./WaitPage";
import BattlePage from "./BattlePage";
import RulePage from "./RulePage";
import ProfilePage from "./ProfilePage";
import axios from "axios"; // axios 추가

// LoginPanel 컴포넌트: 로그인 폼
function LoginPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(""); // 아이디 상태
  const [password, setPassword] = useState(""); // 비밀번호 상태
  const navigate = useNavigate();
  const [backgroundStyle, setBackgroundStyle] = useState({});

  useEffect(() => {
    setBackgroundStyle({
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    });
  }, []);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  // 로그인 요청 처리
  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        {
          username,
          password,
        }
      );

      if (response.data.token) {
        // 로그인 성공 시: JWT 토큰을 localStorage에 저장
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user)); // 사용자 정보 저장
        navigate("/main"); // 메인 페이지로 이동
      }
    } catch (error) {
      alert("로그인 실패! 아이디 또는 비밀번호를 확인해주세요.");
        //navigate("/main");//알아서 지우셈
    }
  };

  // 회원가입 페이지로 이동
  const handleSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="login-main" style={backgroundStyle}>
      <img
        src={logo || "/placeholder.svg"}
        alt="Logo"
        className="top-right-logo"
      />

      <div className={`login-panel ${isOpen ? "open" : ""}`}>
        {isOpen && (
          <button className="toggle-button close" onClick={togglePanel}>
            닫기
          </button>
        )}

        <div className="login-content">
          <img
            src={logo || "/placeholder.svg"}
            alt="Logo"
            className="login-logo"
          />
          <h2>로그인</h2>
          <input
            type="text"
            placeholder="아이디"
            value={username} // 상태값 연결
            onChange={(e) => setUsername(e.target.value)} // 상태 변경
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password} // 상태값 연결
            onChange={(e) => setPassword(e.target.value)} // 상태 변경
          />
          <button className="login-button" onClick={handleLogin}>
            로그인
          </button>
          <button className="signup-button" onClick={handleSignUp}>
            회원가입
          </button>
        </div>
      </div>

      {!isOpen && (
        <button className="toggle-button open" onClick={togglePanel}>
          열기
        </button>
      )}
    </div>
  );
}

// 전체 로그인 및 라우팅 처리 컴포넌트
function Login() {
  const [inventory, setInventory] = useState([]);
  const [currency, setCurrency] = useState(10000);
  const [selectedDeck, setSelectedDeck] = useState(() => {
    const savedDeck = localStorage.getItem("selectedDeck");
    return savedDeck ? JSON.parse(savedDeck) : [];
  });

  const buyCardPack = (card) => {
    if (currency >= card.price) {
      setCurrency(currency - card.price);
      return true;
    }
    return false;
  };

  const addCardsToInventory = (newCardPack) => {
    setInventory((prevInventory) => [...prevInventory, newCardPack]);
  };

  const handleDeckChange = (newDeck) => {
    setSelectedDeck(newDeck);
    localStorage.setItem("selectedDeck", JSON.stringify(newDeck));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPanel />} />
        <Route
          path="/main"
          element={<MainPage currency={currency} selectedDeck={selectedDeck} />}
        />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/store"
          element={
            <StorePage
              buyCardPack={buyCardPack}
              currency={currency}
              addCardsToInventory={addCardsToInventory}
              setCurrency={setCurrency}
            />
          }
        />
        <Route
          path="/inventory"
          element={
            <Inventory inventory={inventory} setInventory={setInventory} />
          }
        />
        <Route
          path="/deck"
          element={
            <DeckPage
              onDeckChange={handleDeckChange}
              selectedDeck={selectedDeck}
            />
          }
        />
        <Route
          path="/battle"
          element={
            <DndProvider backend={HTML5Backend}>
              <BattlePage selectedDeck={selectedDeck} />
            </DndProvider>
          }
        />
        <Route path="/wait" element={<WaitPage />} />
        <Route path="/rule" element={<RulePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default Login;
