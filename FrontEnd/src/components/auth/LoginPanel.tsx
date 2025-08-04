import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosResponse } from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./LoginPanel.css";

import logo from "../../assets/images/logo.png";
import loginVideo from "../../assets/videos/loginvideo2.mp4";

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const openButtonRef = useRef<HTMLButtonElement>(null);

  const togglePanel = () => setIsOpen(!isOpen);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response: AxiosResponse<LoginResponse> =
        await axios.post<LoginResponse>(
          "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api/auth/login",
          {
            username,
            password,
          },
          {
            withCredentials: true, // 이 부분 추가
          }
        );
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/main");
      }
    } catch {
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
            <input
              type="text"
              placeholder="아이디"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
            />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
            />
            <span onClick={togglePasswordVisibility}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
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
            if (
              e.key === "Enter" ||
              e.key === " " ||
              e.key === "Spacebar" ||
              e.key === "Tab"
            ) {
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
