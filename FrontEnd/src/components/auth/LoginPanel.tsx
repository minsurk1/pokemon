import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./LoginPanel.css"

import logo from "../../assets/images/logo.png"
import loginVideo from "../../assets/videos/loginvideo.mp4"

interface LoginResponse {
  token: string
  user: {
    username: string
    id: string
  }
}

function LoginPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const togglePanel = () => setIsOpen(!isOpen)

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
    } catch {
      alert("로그인 실패! 아이디 또는 비밀번호를 확인해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = () => navigate("/signup")

  return (
    <div className="login-main">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src={loginVideo} type="video/mp4" />
        브라우저가 비디오를 지원하지 않습니다.
      </video>

      <img src={logo} alt="Logo" className="top-right-logo" />
      <div className={`login-panel ${isOpen ? "open" : ""}`}>
        {isOpen && <button className="toggle-button close" onClick={togglePanel}>닫기</button>}
        <div className="login-content">
          <img src={logo} alt="Logo" className="login-logo" />
          <h2>로그인</h2>
          <input type="text" placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="login-button" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? "로그인 중..." : "로그인"}
          </button>
          <button className="signup-button" onClick={handleSignUp}>회원가입</button>
        </div>
      </div>
      {!isOpen && <button className="toggle-button open" onClick={togglePanel}>열기</button>}
    </div>
  )
}

export default LoginPanel
