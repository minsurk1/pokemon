import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";  
import "./SignUpPage.css";

function SignUpPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
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
    navigate("/");
  };

  const handleSignUp = (e) => {
    e.preventDefault();

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

    axios.post("http://localhost:5000/api/signup", data)
      .then(response => {
        setMessage(response.data.message);
        setShowMessage(true);

        setTimeout(() => {
          navigate("/");
        }, 2000);
      })
      .catch(error => {
        console.error("회원가입 에러:", error);
        setMessage("회원가입에 실패했습니다.");
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
