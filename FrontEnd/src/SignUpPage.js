import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";  // axios 추가
import "./SignUpPage.css";

function SignUpPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

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
      username: username,
      password: password,
      email: email,
    };

    // 회원가입 API 호출
    axios.post("http://localhost:5000/api/signup", data)
      .then(response => {
        setMessage(response.data.message);  // 백엔드에서 보내준 메시지
        setShowMessage(true);

        // 2초 뒤에 로그인 화면으로 이동
        setTimeout(() => {
          navigate("/");  // 로그인 페이지로 이동
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
        <input
          type="password"
          placeholder="비밀번호"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
