import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaHome } from "react-icons/fa";
import "./ProfilePage.css"; // 방금 만든 CSS 임포트
import MessageBox from "../../components/common/MessageBox";
// import BackgroundVideo from "../../components/common/global"; // 필요하면 사용
// import profileVideo from "../../assets/videos/profileVideo.mp4"; // 필요하면 사용

// API 기본 URL (SignUpPage와 동일하게)
const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api/auth";

function ProfilePage() {
  const navigate = useNavigate();

  // 1. 기존 정보를 담을 State
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState(""); // 닉네임은 수정 가능

  // 2. 새로 변경할 정보를 담을 State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 3. UI/메시지 State
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  
  // 💡 페이지 로드 시 1번만 실행: 서버에서 내 정보 가져오기
  useEffect(() => {
    const fetchProfile = async () => {
      // 로컬 스토리지에서 토큰 가져오기 (로그인 시 저장했다고 가정)
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("로그인이 필요합니다.");
        setShowMessage(true);
        setTimeout(() => navigate("/"), 2000); // 로그인 페이지로 튕기기
        return;
      }

      try {
        // ⭐️ (가정 1) GET /api/auth/profile API 호출
        const response = await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`, // 헤더에 토큰 전송
          },
        });

        // 서버에서 받은 정보로 State 세팅
        const { username, email, nickname } = response.data;
        setUsername(username);
        setEmail(email);
        setNickname(nickname);
        
      } catch (error) {
        console.error("프로필 로딩 실패:", error);
        setMessage("정보를 불러오는데 실패했습니다. 다시 로그인해주세요.");
        setShowMessage(true);
        localStorage.removeItem("token"); // 토큰이 유효하지 않을 수 있으니 삭제
        setTimeout(() => navigate("/"), 2000);
      }
    };

    fetchProfile();
  }, [navigate]); // navigate가 변경될 일은 없지만, lint 규칙상 포함

  const closeMessage = () => {
    setShowMessage(false);
    setMessage("");
  };

  // 💡 폼 제출 시 (수정하기 버튼 클릭)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 새 비밀번호를 입력했다면, 일치하는지 확인
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("새 비밀번호가 일치하지 않습니다.");
      setShowMessage(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        // 이 시점에 토큰이 없으면 안 됨 (useEffect에서 이미 걸렀어야 함)
        setMessage("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        setShowMessage(true);
        setTimeout(() => navigate("/"), 2000);
        return;
    }

    // 서버에 보낼 데이터 (닉네임 + 새 비밀번호가 있다면 비밀번호)
    const updateData: { nickname: string; password?: string } = {
      nickname: nickname, // 현재 state의 닉네임 값
    };

    if (newPassword) {
      updateData.password = newPassword;
    }

    try {
      // ⭐️ (가정 2) PUT /api/auth/profile/update API 호출
      const response = await axios.put(`${API_URL}/profile/update`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(response.data.message || "회원정보가 성공적으로 수정되었습니다.");
      setShowMessage(true);
      
      // 비밀번호 필드 초기화
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      console.error("회원정보 수정 에러:", error);
      const errorMessage =
        error.response?.data?.message || "회원정보 수정에 실패했습니다.";
      setMessage(errorMessage);
      setShowMessage(true);
    }
  };

  return (
    <div className="profile-page">
      {/* <BackgroundVideo src={profileVideo} opacity={0.8} zIndex={-1} /> */}
      
      {/* 홈(메인)으로 돌아가기 버튼 */}
      <button className="home-button" onClick={() => navigate("/main")}> 
        메인으로 <FaHome />
      </button>

      <form onSubmit={handleSubmit}>
        <h1>회원정보 수정</h1>

        <label htmlFor="username">아이디</label>
        <input
          id="username"
          type="text"
          value={username}
          readOnly // 아이디는 수정 불가능
        />

        <label htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly // 이메일은 수정 불가능
        />

        <label htmlFor="nickname">닉네임 (수정 가능)</label>
        <input
          id="nickname"
          type="text"
          placeholder="닉네임"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)} // 닉네임은 수정 가능
        />

        <label htmlFor="newPassword">새 비밀번호 (선택)</label>
        <div className="password-container">
          <input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="새 비밀번호 (변경 시에만 입력)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <span onClick={() => setShowNewPassword(!showNewPassword)}>
            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <label htmlFor="confirmPassword">새 비밀번호 확인</label>
        <div className="password-container">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="새 비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit">수정하기</button>
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

export default ProfilePage;