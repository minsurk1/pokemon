// 회원가입 API 요청 기능 추가
// 추후에 유효성 검사 기능 추가해야 함

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./SignUpPage.css";

function SignUpPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const closeMessage = () => {
    setShowMessage(false);
    setMessage("");
  };

  const handleSignUp = (e) => {
    e.preventDefault();

    // 비밀번호 일치 체크
    if (password !== confirmPassword) {
      setMessage("비밀번호가 일치하지 않습니다.");
      setShowMessage(true);
      return;
    }

    const data = {
      username,
      password,
      email,
      nickname,
    };

    // 상대 경로로 수정: "/api/auth/signup" 사용
    axios
      .post("http://localhost:5000/api/auth/signup", data) // 정확한 경로
      .then((response) => {
        setMessage(response.data.message);
        setShowMessage(true);

        setTimeout(() => {
          navigate("/"); // 로그인 페이지로 리디렉션
        }, 2000);
      })
      .catch((error) => {
        console.error("회원가입 에러:", error);
        const errorMessage =
          error.response && error.response.data.message
            ? error.response.data.message
            : "회원가입에 실패했습니다."; // 메시지 처리
        setMessage(errorMessage);
        setShowMessage(true);
      });
  };

  return (
    <div className="signup-page">
      <h1>회원가입</h1>
      <form onSubmit={handleSignUp}>
        <input
          type="text"
          placeholder="아이디"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div className="password-container">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="비밀번호"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={togglePasswordVisibility}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <div className="password-container">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="비밀번호 확인"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span onClick={toggleConfirmPasswordVisibility}>
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <input
          type="text"
          placeholder="닉네임"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <input
          type="email"
          placeholder="이메일"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">가입하기</button>
      </form>
      <button onClick={() => navigate("/")}>로그인 페이지로 돌아가기</button>

      {showMessage && (
        <div className="message-box">
          <p>{message}</p>
          <button className="su-close-button" onClick={closeMessage}>
            확인
          </button>
        </div>
      )}
    </div>
  );
}

export default SignUpPage;
