import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "./SignUpPage.css";
import MessageBox from "../../components/common/MessageBox";
import BackgroundVideo from "../../components/common/global";
import signupVideo from "../../assets/videos/signupvideo.mp4";

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

    const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
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
      .post(
        "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api/auth/signup",
        data
      ) // 정확한 경로
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
      <BackgroundVideo src={signupVideo} opacity={1} zIndex={-1} />
      <h1>회원가입</h1>
      <div className="signup-main">
        <button onClick={() => navigate("/")}>로그인 페이지</button>
      </div>
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

      {showMessage && (
        <MessageBox
          bgColor="#e3f2fd"
          borderColor="#2196f3"
          textColor="#0d47a1"
          onClose={closeMessage}
          closeborderColor="black"
        >
          {message}
        </MessageBox>
      )}
    </div>
  );
}

export default SignUpPage;
