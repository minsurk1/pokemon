// src/pages/Profile/ProfilePage.tsx
import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaHome } from "react-icons/fa";
import "./ProfilePage.css"; 
import MessageBox from "../../components/common/MessageBox";
import signupVideo from "../../assets/videos/signupvideo.mp4";
import BackgroundVideo from "../../components/common/global";

// API 기본 URL
const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api/auth";

function ProfilePage() {
  const navigate = useNavigate();

  // 1. 기존 정보를 담을 State (로직 변경 없음)
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");

  // 2. 새로 변경할 정보를 담을 State (로직 변경 없음)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // 3. UI/메시지 State (로직 변경 없음)
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 💡 페이지 로드 시 1번만 실행: 서버에서 내 정보 가져오기 (로직 변경 없음)
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("ACCESS DENIED: RELOG REQUIRED.");
        setShowMessage(true);
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { username, email, nickname } = response.data;
        setUsername(username);
        setEmail(email);
        setNickname(nickname);
        
      } catch (error) {
        console.error("프로필 로딩 실패:", error);
        setMessage("SYSTEM FAIL: RETRY ACCESS PROTOCOL.");
        setShowMessage(true);
        localStorage.removeItem("token");
        setTimeout(() => navigate("/"), 2000);
      }
    };

    fetchProfile();
  }, [navigate]);

  const closeMessage = () => {
    setShowMessage(false);
    setMessage("");
  };

  // 💡 폼 제출 시 (수정하기 버튼 클릭) (로직 변경 없음)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    if (newPassword && newPassword !== confirmPassword) {
      setMessage("ERROR: ACCESS CODES MISMATCH.");
      setShowMessage(true);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        setMessage("SESSION EXPIRED. RE-INITIATE LOGIN.");
        setShowMessage(true);
        setTimeout(() => navigate("/"), 2000);
        return;
    }

    setIsSaving(true);

    const updateData: { nickname: string; password?: string } = {
      nickname: nickname,
    };

    if (newPassword) {
      updateData.password = newPassword;
    }

    try {
      const response = await axios.put(`${API_URL}/profile/update`, updateData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage(response.data.message || "DATA SYNCHRONIZED. PROFILE UPDATED.");
      setShowMessage(true);
      
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      console.error("회원정보 수정 에러:", error);
      const errorMessage =
        error.response?.data?.message || "UPDATE FAILED. SERVER OFFLINE.";
      setMessage(errorMessage);
      setShowMessage(true);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="profile-page">
                  <BackgroundVideo src={signupVideo} opacity={1} zIndex={-1} />
      <button className="home-button" onClick={() => navigate("/main")}> 
        <FaHome size={20} /> [MAIN_PROMPT]
      </button>

      <form onSubmit={handleSubmit}>
        <h1 className="neon-text">USER DATA ACQUISITION</h1> {/* 타이틀 변경 */}
        
        <p className="user-nickname"> USER ID: {nickname} // SYSTEM ACCESS GRANTED</p> {/* 닉네임 프롬프트 변경 */}


        <label htmlFor="username">IDENTIFIER (SYSTEM LOCKED)</label>
        <input
          id="username"
          type="text"
          value={username}
          readOnly 
        />

        <label htmlFor="email">CONTACT ADDRESS (SYSTEM LOCKED)</label>
        <input
          id="email"
          type="email"
          value={email}
          readOnly 
        />

        <label htmlFor="nickname">ALIAS / NICKNAME (MODIFY ACCESS)</label> {/* 레이블 변경 */}
        <input
          id="nickname"
          type="text"
          placeholder="ENTER NEW ALIAS"
          required
          value={nickname}
          onChange={(e) => setNickname(e.target.value)} 
          disabled={isSaving}
        />

        <label htmlFor="newPassword">NEW ACCESS KEY</label> {/* 레이블 변경 */}
        <div className="password-container">
          <input
            id="newPassword"
            type={showNewPassword ? "text" : "password"}
            placeholder="INPUT NEW ACCESS KEY"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSaving}
          />
          <span onClick={() => setShowNewPassword(!showNewPassword)} className="password-toggle">
            {showNewPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <label htmlFor="confirmPassword">CONFIRM NEW ACCESS KEY</label> {/* 레이블 변경 */}
        <div className="password-container">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="VERIFY ACCESS KEY"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSaving}
          />
          <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-toggle">
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'EXECUTING DATA TRANSFER...' : 'EXECUTE: UPDATE DATA'} {/* 버튼 텍스트 변경 */}
        </button>
      </form>

      {showMessage && (
        <MessageBox
          bgColor="#ff00ff" // 마젠타
          borderColor="#0d1117"
          textColor="#0d1117"
          onClose={closeMessage}
        >
          {message}
        </MessageBox>
      )}
    </div>
  );
}

export default ProfilePage;