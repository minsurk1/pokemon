import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './StorePage.css';
import bCard from './assets/images/b_card.png';
import aCard from './assets/images/a_card.png';
import sCard from './assets/images/s_card.png';

function StorePage({ buyCardPack, currency, addCardsToInventory, setCurrency }) {
    const navigate = useNavigate();
    const [message, setMessage] = useState(''); // 메시지 상태 추가
    const [showMessage, setShowMessage] = useState(false); // 메시지 박스 표시 여부

    const [cards] = useState([
        { image: bCard, name: "카드 B", price: 10, packImage: bCard },
        { image: sCard, name: "카드 S", price: 30, packImage: sCard },
        { image: aCard, name: "카드 A", price: 20, packImage: aCard },
    ]);

    const handleBuyCard = (index) => {
        const selectedCard = cards[index];
        if (buyCardPack(selectedCard)) {
            setCurrency(prevCurrency => prevCurrency - selectedCard.price);
            addCardsToInventory({
                name: selectedCard.name,
                packImage: selectedCard.packImage,
                isOpened: false
            });
            // alert 대신 메시지 박스 사용
            setMessage(`${selectedCard.name} 카드팩을 구매했습니다!`);
            setShowMessage(true);
        } else {
            setMessage('재화가 부족합니다.');
            setShowMessage(true);
        }
    };

    // 메시지 박스 닫기 함수
    const closeMessage = () => {
        setShowMessage(false);
        setMessage('');
    };

    return (
        <div className="store-container">
            {showMessage && (
                <div className="message-box">
                    <p>{message}</p>
                    <button className="close-button" onClick={closeMessage}>
                        확인
                    </button>
                </div>
            )}
            
            <div className="store-header">
                <div className="store-currency">보유 재화: {currency} G</div>
                <div>
                    <button className="inventory-button" onClick={() => navigate('/inventory')}>인벤토리</button>
                    <button className="main-button" onClick={() => navigate('/main')}>메인으로 돌아가기</button>
                </div>
            </div>
            <br /><br /><br /><br /><br />

            <div className="store-card-container">
                {cards.map((card, index) => (
                    <div key={index} className="store-card">
                        <img src={card.image} alt={`Card ${index + 1}`} className="store-card-image" />
                        <p>{card.name} - {card.price} G</p>
                        <button className="buy-button" onClick={() => handleBuyCard(index)}>구매하기</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StorePage;