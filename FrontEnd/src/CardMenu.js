import React from 'react';
import './CardMenu.css';
import './BattlePage.js';
const CardMenu = ({ x, y, onClose }) => {
  return (
    <div 
      className="card-menu" 
      style={{ 
        left: `${x}px`, 
        top: `${y}px`,
      }}
    >
      <button onClick={() => { console.log('동작 1'); onClose(); }}>동작 1</button>
      <button onClick={() => { console.log('동작 2'); onClose(); }}>동작 2</button>
      <button onClick={onClose}>닫기</button>
    </div>
  );
};

export default CardMenu;