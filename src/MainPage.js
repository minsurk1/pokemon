import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import legendTestImage from './assets/images/legendtier6.png';

function MainPage({ currency }) {
  const navigate = useNavigate();
  const [showRoomTab, setShowRoomTab] = useState(false);
  const [roomCode, setRoomCode] = useState('');

  const handleLogout = () => {
    navigate('/');
  };

  const handleStore = () => {
    navigate('/store');
  };

  const handleDeck = () => {
    navigate('/deck');
  };

  const toggleRoomTab = () => {
    setShowRoomTab(!showRoomTab);
  };

  const handleCreateRoom = () => {
    const newRoomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
    navigate('/wait', { state: { roomCode: newRoomCode } });
  };

  const handleJoinRoom = () => {
    if (roomCode.length === 6) {
      navigate('/wait', { state: { roomCode: roomCode } });
    } else {
      alert('올바른 방 코드를 입력해주세요.');
    }
  };

  return (
    <div className="main-container">
      {/* 사이드바 */}
      <div className="sidebar">
        <button className="menu-button" onClick={handleStore}>상점</button>
        <button className="menu-button" onClick={handleDeck}>내카드</button>
        <button className="menu-button" onClick={toggleRoomTab}>
          {showRoomTab ? '탭 닫기' : '방 만들기/입장'}
        </button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        <div className="main-header">
          <span className="money">현재 돈: {currency}원</span>
          <button className="logout-button" onClick={handleLogout}>로그아웃</button>
        </div>

        {/* 대표 몬스터 카드 */}
        <div className="monster-card">
          <img src={legendTestImage} alt="대표 몬스터 카드" className="monster-image" />
        </div>

        {/* 방 만들기/입장 탭 */}
        {showRoomTab && (
          <div className="room-tab">
            <h3>방 만들기/입장</h3>
            <button className="create-room" onClick={handleCreateRoom}>방 만들기</button>
            <div className="join-room">
              <input
                type="text"
                placeholder="방 코드 입력"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button onClick={handleJoinRoom}>방 입장</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainPage;

