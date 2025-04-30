import  React from "react"
import { useState } from "react"
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import "./Login.css"
import logo from "./assets/images/logo.png"
import loginVideo from "./assets/videos/loginvideo.mp4" 
import MainPage from "./MainPage.tsx"
import SignUpPage from "./SignUpPage.tsx"
import Inventory, { type Card, type CardPack } from "./Inventory.tsx"
import StorePage from "./StorePage.tsx"
import DeckPage from "./DeckPage.tsx"
import WaitPage from "./WaitPage.tsx"
import BattlePage from "./BattlePage.tsx"
import RulePage from "./RulePage.tsx"
import ProfilePage from "./ProfilePage.tsx"
import Dex from "./Dex.tsx"
import axios from "axios"

// 사용자 정보 인터페이스
interface User {
  username: string
  id: string
}

// API 응답 인터페이스
interface LoginResponse {
  token: string
  user: User
}

// 로그인 패널
function LoginPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const togglePanel = () => {
    setIsOpen(!isOpen)
  }

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      const response = await axios.post<LoginResponse>("http://localhost:5001/api/auth/login", {
        username,
        password,
      })

      if (response.data.token) {
        localStorage.setItem("token", response.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.user))
        navigate("/main")
      }
    } catch (error) {
      alert("로그인 실패! 아이디 또는 비밀번호를 확인해주세요.")
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = () => {
    navigate("/signup")
  }

  return (
    <div className="login-main">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src={loginVideo} type="video/mp4" />
        브라우저가 비디오를 지원하지 않습니다.
      </video>

      <img src={logo || "/placeholder.svg"} alt="Logo" className="top-right-logo" />
      <div className={`login-panel ${isOpen ? "open" : ""}`}>
        {isOpen && (
          <button className="toggle-button close" onClick={togglePanel}>
            닫기
          </button>
        )}
        <div className="login-content">
          <img src={logo || "/placeholder.svg"} alt="Logo" className="login-logo" />
          <h2>로그인</h2>
          <input type="text" placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="login-button" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
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
  )
}

// 전체 라우터 포함하는 메인 컴포넌트
function Login() {
  const [inventory, setInventory] = useState<CardPack[]>([])
  const [currency, setCurrency] = useState<number>(10000)
  const [selectedDeck, setSelectedDeck] = useState<string[]>(() => {
    const savedDeck = localStorage.getItem("selectedDeck")
    return savedDeck ? JSON.parse(savedDeck) : []
  })

  const buyCardPack = (card: Card): boolean => {
    if (currency >= card.price) {
      setCurrency((prev) => prev - card.price)
      return true
    }
    return false
  }

  const addCardsToInventory = (newCardPack: CardPack) => {
    setInventory((prev) => [...prev, newCardPack])
  }

  const handleDeckChange = (newDeck: string[]) => {
    setSelectedDeck(newDeck)
    localStorage.setItem("selectedDeck", JSON.stringify(newDeck))
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPanel />} />
        <Route path="/main" element={<MainPage currency={currency} selectedDeck={selectedDeck} />} />
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
        <Route path="/inventory" element={<Inventory inventory={inventory} setInventory={setInventory} />} />
        <Route path="/deck" element={<DeckPage onDeckChange={handleDeckChange} selectedDeck={selectedDeck} />} />
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
        <Route path="/Dex" element={<Dex />} />
      </Routes>
    </Router>
  )
}

export default Login
