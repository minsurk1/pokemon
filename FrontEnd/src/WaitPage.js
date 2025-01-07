import React, { useState } from 'react';
import './WaitPage.css';

function WaitPage() {
  const [isReady, setIsReady] = useState(false);

  return (
    <div className="wait-body">
      <div className="wait-page">
        <div className="room-info">
          <h2>방 이름</h2>
          <p>방 코드: ABC123</p>
        </div>
        <div className="players">
          <div className="player">
            <p>플레이어 1</p>
            <p>준비 완료</p>
          </div>
          <div className="player">
            <p>플레이어 2</p>
            <p>준비 중</p>
          </div>
        </div>
        <div className="buttons">
          <button 
            className={`ready-button ${isReady ? 'ready' : ''}`}
            onClick={() => setIsReady(!isReady)}
          >
            {isReady ? '준비 취소' : '준비 완료'}
          </button>
          <button className="start-button">게임 시작</button>
          <button className="return-button">로비로 돌아가기</button>
        </div>
      </div>
    </div>
  );
}

export default WaitPage;

