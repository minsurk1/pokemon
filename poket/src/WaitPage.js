import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './WaitPage.css';

function WaitPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);

  const roomCode = location.state?.roomCode || 'UNKNOWN';

  const handleReady = () => {
    setIsReady(!isReady);
  };

  const handleStart = () => {
    if (isReady && opponentReady) {
      alert('게임을 시작합니다!');
    } else {
      alert('양쪽 모두 준비가 완료되어야 게임을 시작할 수 있습니다.');
    }
  };

  const handleReturn = () => {
    navigate('/main');
  };

  return (
    <div className="wait-page">
      <div className="room-info">
        <h2>대기실</h2>
        <p>방 코드: {roomCode}</p>
      </div>
      <div className="players">
        <div className="player">
          <p>나</p>
          <p>{isReady ? '준비 완료' : '준비 중'}</p>
        </div>
        <div className="player">
          <p>상대방</p>
          <p>{opponentReady ? '준비 완료' : '대기 중'}</p>
        </div>
      </div>
      <div className="buttons">
        <button
          className={`ready-button ${isReady ? 'ready' : ''}`}
          onClick={handleReady}
        >
          {isReady ? '준비 완료' : '준비하기'}
        </button>
        <button className="start-button" onClick={handleStart}>
          시작하기
        </button>
        <button className="return-button" onClick={handleReturn}>
          메인으로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default WaitPage;
