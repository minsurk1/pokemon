import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosResponse } from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./LoginPanel.css";

import logo from "../../assets/images/logo.png";
import loginVideo from "../../assets/videos/loginvideo2.mp4";

// ✅ 추가 import
import axiosInstance from "../../utils/axiosInstance";
import { useUser } from "../../context/UserContext";

interface LoginResponse {
  token: string;
  user: {
    username: string;
    id: string;
  };
}

function LoginPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const openButtonRef = useRef<HTMLButtonElement>(null);

  // ✅ UserContext에서 refreshUser 가져오기
  const { refreshUser, setUserInfo } = useUser();

  const togglePanel = () => setIsOpen(!isOpen);
  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response: AxiosResponse<LoginResponse> = await axios.post<LoginResponse>(
        "/api/auth/login",
        { username, password },
        { withCredentials: true }
      );

      if (response.data.token) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(response.data.user)); // ✅ 추가

        // ✅ axiosInstance에 바로 Authorization 헤더 세팅
        axiosInstance.defaults.headers.common.Authorization = `Bearer ${token}`;

        // ✅ Context 초기화 후 새 유저 정보 요청
        setUserInfo(null);
        await refreshUser();

        // ✅ 메인 페이지로 이동
        navigate("/main");
      }
    } catch (error) {
      alert("로그인 실패! 아이디 또는 비밀번호를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => navigate("/signup");

  useEffect(() => {
    if (!isOpen && openButtonRef.current) {
      openButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="login-main">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src={loginVideo} type="video/mp4" />
        브라우저가 비디오를 지원하지 않습니다.
      </video>

      <img src={logo} alt="Logo" className="top-right-logo" />
      <div className={`login-panel ${isOpen ? "open" : ""}`}>
        {isOpen && (
          <button className="toggle-button close" onClick={togglePanel}>
            닫기
          </button>
        )}
        <div className="login-content">
          <img src={logo} alt="Logo" className="login-logo" />
          <h2>로그인</h2>

          <form
            onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <input type="text" placeholder="아이디" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span onClick={togglePasswordVisibility}>{showPassword ? <FaEyeSlash /> : <FaEye />}</span>
            <button className="login-button" type="submit" disabled={isLoading}>
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          <button className="signup-button" onClick={handleSignUp}>
            회원가입
          </button>
        </div>
      </div>

      {!isOpen && (
        <button
          ref={openButtonRef}
          className="toggle-button open"
          onClick={togglePanel}
          onKeyDown={(e) => {
            if (["Enter", " ", "Spacebar", "Tab"].includes(e.key)) {
              e.preventDefault();
              togglePanel();
            }
          }}
        >
          열기
        </button>
      )}
    </div>
  );
}

export default LoginPanel;
