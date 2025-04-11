import React, { useState, useRef, useEffect, Suspense } from "react";
import "./Dex.css";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { Card } from "./Inventory";
import { Canvas } from "@react-three/fiber";
import { useGLTF, OrbitControls } from "@react-three/drei";

import fireimage from "./assets/images/fire.png";
import waterimage from "./assets/images/water.png";
import forestimage from "./assets/images/forest.png";
import wormimage from "./assets/images/worm.png";
import landimage from "./assets/images/land.png";
import poisonimage from "./assets/images/poison.png";
import normalimage from "./assets/images/normal.png";
import iceimage from "./assets/images/ice.png";
import electricimage from "./assets/images/electric.png";
import esperimage from "./assets/images/esper.png";
import legendimage from "./assets/images/legend.png";
import sCard from "./assets/images/s_card.png";
import aCard from "./assets/images/a_card.png";
import bCard from "./assets/images/b_card.png";

function ArceusModel() {
  const gltf = useGLTF("/assets/models/Arceus.glb");
  return <primitive object={gltf.scene} scale={2.7} position={[0, -2.5, 0]} />;
}

function Dex() {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMain = (): void => {
    navigate("/main");
  };

  const icons = [
    { src: fireimage, alt: "불" },
    { src: waterimage, alt: "물" },
    { src: forestimage, alt: "숲" },
    { src: wormimage, alt: "벌레" },
    { src: landimage, alt: "땅" },
    { src: poisonimage, alt: "독" },
    { src: normalimage, alt: "노멀" },
    { src: iceimage, alt: "얼음" },
    { src: electricimage, alt: "전기" },
    { src: esperimage, alt: "에스퍼" },
    { src: legendimage, alt: "전설" },
  ];

  const [cards] = useState<Card[]>([
    { image: bCard, name: "B급 카드팩", price: 100, packImage: bCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard }, // 여기만 glb
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
  ]);

  const cardWidth = 220;
  const cardGap = 200;
  const totalCardWidth = cardWidth + cardGap;
  const x = -currentIndex * totalCardWidth;

  const handleNext = () => {
    if (currentIndex < cards.length - 3 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleAnimationComplete = () => {
    setIsAnimating(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, isAnimating]);

  return (
    <div className="dex-page">
      <div className="dex-header">
        {icons.map((icon, index) => (
          <img key={index} src={icon.src} alt={icon.alt} className="header-icon" />
        ))}
        <button onClick={handleMain}>메인페이지</button>
      </div>

      <div className="dex-container">
        <div className="dex-card-container">
          <button className="card-nav-button" onClick={handlePrev} disabled={currentIndex === 0 || isAnimating}>
            ◀
          </button>

          <div className="cards-viewport">
            <motion.div
              ref={carouselRef}
              className="cards-carousel"
              animate={{ x }}
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                duration: 0.5,
              }}
              onAnimationComplete={handleAnimationComplete}
            >
              {cards.map((card, index) => (
                <motion.div
                  key={index}
                  className={`dex-card ${index >= currentIndex && index < currentIndex + 3 ? "visible" : "hidden"}`}
                  initial={false}
                  animate={{
                    scale: index >= currentIndex && index < currentIndex + 3 ? 1 : 0.8,
                    opacity: index >= currentIndex && index < currentIndex + 3 ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {index === 1 ? (
                    <Canvas style={{ width: "220px", height: "350px" }}>
                      <ambientLight intensity={0.5} />
                      <directionalLight position={[2, 2, 2]} intensity={1} />
                      <Suspense fallback={null}>
                        <ArceusModel />
                        <OrbitControls enableZoom={false} />
                      </Suspense>
                    </Canvas>
                  ) : (
                    <img src={card.image} alt={`Card ${index + 1}`} className="dex-card-image" loading="eager" />
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>

          <button className="card-nav-button" onClick={handleNext} disabled={currentIndex >= cards.length - 3 || isAnimating}>
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dex;
