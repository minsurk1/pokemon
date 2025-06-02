  import React, { useState, useRef, useEffect, Suspense } from "react";
  import "./Dex.css";
  import { useNavigate } from "react-router-dom";
  import { AiFillHome } from "react-icons/ai";
  import { motion } from "framer-motion";
  import { Canvas } from "@react-three/fiber";
  import { GLTF } from 'three-stdlib';
  import { useGLTF, OrbitControls, Environment, ContactShadows } from "@react-three/drei";
  import dexVideo from "../../assets/videos/dexvideo.mp4" 
  import BackgroundVideo from "../../components/common/global.tsx";
  import {HomeButton} from "../../components/common/button.tsx";

  import fireimage from "../../assets/images/fire.png";
  import waterimage from "../../assets/images/water.png";
  import forestimage from "../../assets/images/forest.png";
  import wormimage from "../../assets/images/worm.png";
  import landimage from "../../assets/images/land.png";
  import poisonimage from "../../assets/images/poison.png";
  import normalimage from "../../assets/images/normal.png";
  import iceimage from "../../assets/images/ice.png";
  import flyimage from "../../assets/images/fly.png";
  import electricimage from "../../assets/images/electric.png";
  import esperimage from "../../assets/images/esper.png";
  import legendimage from "../../assets/images/legend.png";

  // 타입별 모델 경로 정의
  const typeModels = {
    fire: Array.from({ length: 7 }, (_, i) => `/assets/models/firetier${i + 1}.glb`),
    electric: Array.from({ length: 7 }, (_, i) => `/assets/models/electrictier${i + 1}.glb`),
    esper: Array.from({ length: 7 }, (_, i) => `/assets/models/espertier${i + 1}.glb`),
    water: Array.from({length: 7}, (_, i) => `/assets/models/watertier${i + 1}.glb`),
    forest: Array.from({length: 7}, (_, i) => `/assets/models/foresttier${i + 1}.glb`),
    electirc: Array.from({length: 7}, (_, i) => `/assets/models/electrictier${i + 1}.glb`),
    fly: Array.from({length: 7}, (_, i) => `/assets/models/flytier${i + 1}.glb`),
    worm: Array.from({length: 7}, (_, i) => `/assets/models/wormtier${i + 1}.glb`),
    normal: Array.from({length: 7}, (_, i) => `/assets/models/normaltier${i + 1}.glb`),
    poison: Array.from({length: 7}, (_, i) => `/assets/models/poisontier${i + 1}.glb`),
    land: Array.from({length: 7}, (_, i) => `/assets/models/landtier${i + 1}.glb`),
    ice: Array.from({length: 7}, (_, i) => `/assets/models/icetier${i + 1}.glb`),
    legend: Array.from({length: 7}, (_, i) => `/assets/models/legendtier${i + 1}.glb`)
  };

  // 모델 컴포넌트
  function PokemonModel({ modelPath }) {
    const gltf = useGLTF(modelPath) as GLTF;
    
    return (
      <>
        <primitive 
          object={gltf.scene} 
          scale={2.0} 
          position={[-0.6, -0, 0]} 
          rotation={[0, Math.PI / 3, 0]} 
        />
      </>
    );
  }

  function Dex() {
    const navigate = useNavigate();
    const carouselRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [selectedType, setSelectedType] = useState("fire"); 
    const [models, setModels] = useState(typeModels.fire); 

    const handleMain = (): void => {
      navigate("/main");
    };

    // 타입 버튼 정의
    const typeButtons = [
      { type: "fire", src: fireimage, alt: "불" },
      { type: "electric", src: electricimage, alt: "전기" },
      { type: "esper", src: esperimage, alt: "에스퍼" },
      { type: "water", src: waterimage, alt: "물" },
      { type: "forest", src: forestimage, alt: "숲" },
      { type: "worm", src: wormimage, alt: "벌레" },
      { type: "land", src: landimage, alt: "땅" },
      { type: "poison", src: poisonimage, alt: "독" },
      { type: "normal", src: normalimage, alt: "노멀" },
      { type: "fly" , src: flyimage, alt: "비행"},
      { type: "ice", src: iceimage, alt: "얼음" },
      { type: "legend", src: legendimage, alt: "전설" },
    ];

    // 타입 변경 핸들러
    const handleTypeChange = (type) => {
      if (isAnimating) return;
      
      setIsAnimating(true);
      setSelectedType(type);
      
      // 타입에 따라 모델 배열 설정
      if (typeModels[type]) {
        setModels(typeModels[type]);
      } else {
        // GLB가 없는 타입은 기본 이미지 사용 (예시)
        setModels([]);
      }
      
      // 인덱스 초기화
      setCurrentIndex(0);
      setIsAnimating(false);
    };

    const cardWidth = 220;
    const cardGap = 200;
    const totalCardWidth = cardWidth + cardGap;
    const x = -currentIndex * totalCardWidth;

    const handleNext = () => {
      if (currentIndex < models.length - 3 && !isAnimating) {
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
    }, [currentIndex, isAnimating, models.length]);

    // 모델 미리 로드
    useEffect(() => {
      Object.values(typeModels).flat().forEach(path => {
        useGLTF.preload(path);
      });
    }, []);

    return (
      <div className="dex-page">
        <div className="dex-header">
          {typeButtons.map((button) => (
            <button 
              key={button.type}  
              className={`dex-header-button ${selectedType === button.type ? 'active' : ''}`}
              onClick={() => handleTypeChange(button.type)}
            >
              <img src={button.src || "/placeholder.svg"} alt={button.alt} />
            </button>
          ))}
         <HomeButton onClick={handleMain} bgColor="white" marginLeft="auto" 
                      marginRight="20px" hoverOpacity="0.8" transition="all 0.5s ease" transform="scale(1.01)"
                      borderRadius="50%" 
                      ><AiFillHome color="black" size={22}/></HomeButton>
        </div>

        <div className="dex-container">
        <BackgroundVideo src={dexVideo} opacity={1} zIndex={-1} />
          <div className="dex-card-container">
            <button 
              className="card-nav-button" 
              onClick={handlePrev} 
              disabled={currentIndex === 0 || isAnimating || models.length === 0}
            >
              ◀
            </button>

            <div className="cards-viewport">
              {models.length > 0 ? (
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
                  {models.map((modelPath, index) => (
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
                      <div className="glb-card-wrapper">
                        <Canvas className="canvas" style={{ width: "250px", height:"450px" }}>
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[2, 2, 2]} intensity={1} />
                          <Suspense fallback={null}>
                            <PokemonModel modelPath={modelPath} />
                            <Environment preset="city" />
                            <ContactShadows 
                              position={[0, -2.8, 0]} 
                              opacity={0.4} 
                              scale={5} 
                              blur={2.4} 
                            />
                            <OrbitControls 
                              enableZoom={false} 
                              enablePan={false}
                              minPolarAngle={Math.PI / 4}
                              maxPolarAngle={Math.PI / 2}
                            />
                          </Suspense>
                        </Canvas>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="no-models-message">
                  <p>이 타입의 3D 모델은 준비 중입니다.</p>
                </div>
              )}
            </div>

            <button
              className="card-nav-button"
              onClick={handleNext}
              disabled={currentIndex >= models.length - 3 || isAnimating || models.length === 0}
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    );
  }

  export default Dex;
