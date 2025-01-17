import React, { useState , useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './Login.css';
import logo from './assets/images/logo.png';
import backgroundImage from './assets/images/loginbg.png';
import MainPage from './MainPage';
import SignUpPage from './SignUpPage';
import Inventory from './Inventory';
import StorePage from './StorePage';
import DeckPage from './DeckPage';
import WaitPage from './WaitPage';  
import BattlePage from './BattlePage';

function LoginPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [backgroundStyle, setBackgroundStyle] = useState({});

 useEffect(() => {
      setBackgroundStyle({
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      });
    }, []);


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
    
      <div className="login-main" style={backgroundStyle}>
      <img src={logo || "/placeholder.svg"} alt="Logo" className="top-right-logo" />

      <div className={`login-panel ${isOpen ? 'open' : ''}`}>
        {isOpen && (
          <button className="toggle-button close" onClick={togglePanel}>닫기</button>
        )}

        <div className="login-content">
          <img src={logo || "/placeholder.svg"} alt="Logo" className="login-logo" />
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
  const [selectedDeck, setSelectedDeck] = useState(() => {
    const savedDeck = localStorage.getItem('selectedDeck');
    return savedDeck ? JSON.parse(savedDeck) : [];
  });

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

  const handleDeckChange = (newDeck) => {
    setSelectedDeck(newDeck);
    localStorage.setItem('selectedDeck', JSON.stringify(newDeck));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPanel />} />
        <Route
          path="/main"
          element={<MainPage currency={currency} selectedDeck={selectedDeck} />}
        />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/store"
          element={
            <StorePage
              buyCardPack={buyCardPack}
              currency={currency}
              addCardsToInventory={addCardsToInventory}
              setCurrency={setCurrency}
            />
          }
        />
        <Route
          path="/inventory"
          element={<Inventory inventory={inventory} setInventory={setInventory} />}
        />
        <Route
          path="/deck"
          element={<DeckPage onDeckChange={handleDeckChange} selectedDeck={selectedDeck} />}
        />
        <Route
          path="/battle"
          element={<BattlePage selectedDeck={selectedDeck} />}
        />
        <Route path="/wait" element={<WaitPage />} />
      </Routes>
    </Router>
  );
}

export default Login;

