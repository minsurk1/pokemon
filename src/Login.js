import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './Login.css';
import logo from './assets/images/logo.png';
import MainPage from './MainPage';
import SignUpPage from './SignUpPage';
import Inventory from './Inventory';
import StorePage from './StorePage';
import DeckPage from './DeckPage';
import WaitPage from './WaitPage';  

function LoginPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handleLogin = () => {
    navigate('/main');
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

  return (
    <div>
      <div className="fullscreen-background"></div>
      <img src={logo} alt="Logo" className="top-right-logo" />

      <div className={`login-panel ${isOpen ? 'open' : ''}`}>
        {isOpen && (
          <button className="toggle-button close" onClick={togglePanel}>닫기</button>
        )}

        <div className="login-content">
          <img src={logo} alt="Logo" className="login-logo" />
          <h2>로그인</h2>
          <input type="text" placeholder="아이디" />
          <input type="password" placeholder="비밀번호" />
          <button className="login-button" onClick={handleLogin}>로그인</button>
          <button className="signup-button" onClick={handleSignUp}>회원가입</button>
        </div>
      </div>

      {!isOpen && (
        <button className="toggle-button open" onClick={togglePanel}>열기</button>
      )}
    </div>
  );
}
function Login() {
  const [inventory, setInventory] = useState([]);
  const [currency, setCurrency] = useState(10000);

  const buyCardPack = (card) => {
    if (currency >= card.price) {
      setCurrency(currency - card.price);
      return true;
    }
    return false;
  };

  const addCardsToInventory = (newCardPack) => {
    setInventory((prevInventory) => [...prevInventory, newCardPack]);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPanel />} />
        <Route path="/main" element={<MainPage currency={currency} />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/store"
          element={<StorePage buyCardPack={buyCardPack} currency={currency} addCardsToInventory={addCardsToInventory} setCurrency={setCurrency} />}
        />
        <Route
          path="/inventory"
          element={<Inventory inventory={inventory} setInventory={setInventory} />}
        />
        <Route
          path="/deck"
          element={<DeckPage DeckPage={DeckPage} setDeckPage={DeckPage} />}
        />
        <Route path="/wait" element={<WaitPage />} />  {/* 새로 추가 */}
      </Routes>
    </Router>
  );
}

export default Login;