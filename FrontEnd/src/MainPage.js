import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import mainImage from './assets/images/default.png';
import backgroundImage from './assets/images/mainbg.jpg';
import { CardAnimation } from '@lasbe/react-card-animation';


function MainPage({ currency, selectedDeck }) {
  const navigate = useNavigate();
  const [showRoomTab, setShowRoomTab] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [backgroundStyle, setBackgroundStyle] = useState({});

 useEffect(() => {
      setBackgroundStyle({
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      });
    }, []);

  const handleLogout = () => {
    navigate('/');
  };
  
  const handleStore = () => {
    navigate('/store');
  };

  const handleDeck = () => {
    navigate('/deck');
  };

  const handleBattle = () => {
    navigate('/battle');
  };
  
  const handleReadme = () => {
    navigate('/rule');
  };

  const toggleRoomTab = () => {
    setShowRoomTab(!showRoomTab);
  };

  const handleProfile = () => {
    navigate('/profile')
  }

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
  <div className="main-container" style={backgroundStyle}>
      {/* 사이드바 */}
      <div className="sidebar">
        <button className="menu-button" onClick={handleStore}>상점</button>
        <button className="menu-button" onClick={handleDeck}>내카드</button>
        <button className="menu-button" onClick={handleBattle}>배틀테스트</button>
        <button className="menu-button" onClick={handleReadme}>룰 설명</button>
        <button className="menu-button" onClick={toggleRoomTab}>
          {showRoomTab ? '탭 닫기' : '방 만들기/입장'}
        </button>
        <button className="menu-button" onClick={handleProfile}>마이페이지</button>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        <div className="main-header">
          <span className="money">현재 돈: {currency}원</span>
          <button className="logout-button" onClick={handleLogout}>로그아웃</button>
        </div>

        {/* 대표 몬스터 카드 */}
        <CardAnimation angle={35}>
        <div className="monster-card">
          {selectedDeck && selectedDeck.length > 0 ? (
            <img src={selectedDeck[0]} alt="대표 몬스터 카드" className="monster-image" />
          ) : (
            <img src={mainImage} alt="기본 대표 몬스터 카드" className="monster-image" />
          )}
        </div>
        </CardAnimation>

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

