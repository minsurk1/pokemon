import React, { useState, useRef, useEffect, Suspense } from "react";
import "./Dex.css";
import { useNavigate } from "react-router-dom";
import { AiFillHome } from "react-icons/ai";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import { useGLTF, OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import dexVideo from "../../assets/videos/dexvideo.mp4";
import BackgroundVideo from "../../components/common/global";
import { HomeButton } from "../../components/common/button";

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

import * as THREE from "three";

const GrayShader = {
  uniforms: {
    colorTexture: { value: null },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D colorTexture;

    void main() {
      vec4 color = texture2D(colorTexture, vUv);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(vec3(gray), color.a);
    }
  `,
};

// 타입별 모델 경로 정의
const typeModels = {
  fire: Array.from({ length: 7 }, (_, i) => `/assets/models/firetier${i + 1}.glb`),
  electric: Array.from({ length: 7 }, (_, i) => `/assets/models/electrictier${i + 1}.glb`),
  esper: Array.from({ length: 7 }, (_, i) => `/assets/models/espertier${i + 1}.glb`),
  water: Array.from({ length: 7 }, (_, i) => `/assets/models/watertier${i + 1}.glb`),
  forest: Array.from({ length: 7 }, (_, i) => `/assets/models/foresttier${i + 1}.glb`),
  fly: Array.from({ length: 7 }, (_, i) => `/assets/models/flytier${i + 1}.glb`),
  worm: Array.from({ length: 7 }, (_, i) => `/assets/models/wormtier${i + 1}.glb`),
  normal: Array.from({ length: 7 }, (_, i) => `/assets/models/normaltier${i + 1}.glb`),
  poison: Array.from({ length: 7 }, (_, i) => `/assets/models/poisontier${i + 1}.glb`),
  land: Array.from({ length: 7 }, (_, i) => `/assets/models/landtier${i + 1}.glb`),
  ice: Array.from({ length: 7 }, (_, i) => `/assets/models/icetier${i + 1}.glb`),
  legend: Array.from({ length: 7 }, (_, i) => `/assets/models/legendtier${i + 1}.glb`),
};

type PokemonType = keyof typeof typeModels;

interface PokemonModelProps {
  modelPath: string;
  isOwned: boolean;
}

interface OwnedCard {
  cardType: string;
  tier: number;
  cardName: string;
}

function PokemonModel({ modelPath, isOwned }: PokemonModelProps) {
  const gltf = useGLTF(modelPath) as GLTF;
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!ref.current) return;

    ref.current.traverse((obj: any) => {
      if (obj.isMesh) {
        console.log("🔍 mesh:", obj.name, obj.material);
        console.log("🎨 map:", obj.material.map);

        if (isOwned) {
          console.log("✅ 컬러 렌더링됨:", modelPath);
          return;
        }

        const texture = obj.material.map;

        if (texture) {
          console.log("⚫ Shader 흑백 처리됨:", modelPath);
          obj.material = new THREE.ShaderMaterial({
            uniforms: { colorTexture: { value: texture } },
            vertexShader: GrayShader.vertexShader,
            fragmentShader: GrayShader.fragmentShader,
          });
          obj.material.needsUpdate = true;
        } else {
          console.warn(`⚠ map 없음 → color desaturation 적용: ${modelPath}`);
          obj.material = obj.material.clone();
          obj.material.color = new THREE.Color(0.4, 0.4, 0.4); // 회색
          obj.material.needsUpdate = true;
        }
      }
    });
  }, [isOwned, modelPath]);

  return <primitive ref={ref} object={gltf.scene} scale={2.0} position={[-0.6, 0, 0]} rotation={[0, Math.PI / 3, 0]} />;
}

function Dex() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedType, setSelectedType] = useState<PokemonType>("fire");
  const [models, setModels] = useState(typeModels.fire);

  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([]);

  useEffect(() => {
    console.log("✅ 서버에서 받은 ownedCards:", ownedCards);
    ownedCards.forEach((c) => console.log(` • 보유 → type=${c.cardType}, tier=${c.tier}`));
  }, [ownedCards]);

  useEffect(() => {
    async function loadOwned() {
      try {
        const token = localStorage.getItem("token"); // ✅ 로그인 시 저장된 토큰

        if (!token) {
          console.log("❌ Dex: 토큰 없음 → 인증 실패");
          return;
        }

        const res = await fetch("https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api/dex/owned-cards", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          console.log("❌ owned-cards 요청 실패:", res.status);
          return;
        }

        const data = await res.json();
        console.log("🎉 ownedCards 로드됨:", data);
        setOwnedCards(data.ownedCards || []);
      } catch (e) {
        console.error("유저 보유 카드 목록 로딩 실패", e);
      }
    }
    loadOwned();
  }, []);

  const handleMain = (): void => {
    navigate("/main");
  };

  // 타입 버튼 정의
  const typeButtons: { type: PokemonType; src: string; alt: string }[] = [
    { type: "fire", src: fireimage, alt: "불" },
    { type: "electric", src: electricimage, alt: "전기" },
    { type: "esper", src: esperimage, alt: "에스퍼" },
    { type: "water", src: waterimage, alt: "물" },
    { type: "forest", src: forestimage, alt: "숲" },
    { type: "worm", src: wormimage, alt: "벌레" },
    { type: "land", src: landimage, alt: "땅" },
    { type: "poison", src: poisonimage, alt: "독" },
    { type: "normal", src: normalimage, alt: "노멀" },
    { type: "fly", src: flyimage, alt: "비행" },
    { type: "ice", src: iceimage, alt: "얼음" },
    { type: "legend", src: legendimage, alt: "전설" },
  ];

  // 타입 변경 핸들러
  const handleTypeChange = (type: PokemonType) => {
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

  // CSS와 동일한 비율 사용
  const CARD_WIDTH_VW = 22; // .dex-card width: 22vw
  const GAP_VW = 5; // .cards-carousel gap: 5vw

  const totalCardWidth = (window.innerWidth * (CARD_WIDTH_VW + GAP_VW)) / 100;
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

  useEffect(() => {
    Object.values(typeModels)
      .flat()
      .forEach((path) => {
        useGLTF.preload(path);
      });
  }, []);

  const normalize = (s: string) => s.toLowerCase().trim();

  return (
    <div className="dex-page">
      <div className="dex-header">
        {typeButtons.map((button) => (
          <button
            key={button.type}
            className={`dex-header-button ${selectedType === button.type ? "active" : ""}`}
            onClick={() => handleTypeChange(button.type)}
          >
            <img src={button.src || "/placeholder.svg"} alt={button.alt} />
          </button>
        ))}
        <HomeButton
          onClick={handleMain}
          bgColor="white"
          marginLeft="auto"
          marginRight="20px"
          hoverOpacity="0.8"
          transform="scale(1.01)"
          borderRadius="50%"
        >
          <AiFillHome color="black" size={22} />
        </HomeButton>
      </div>

      <div className="dex-container">
        <BackgroundVideo src={dexVideo} opacity={1} zIndex={-1} />
        <div className="dex-card-container">
          <button className="card-nav-button" onClick={handlePrev} disabled={currentIndex === 0 || isAnimating || models.length === 0}>
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
                {models.map((modelPath, index) => {
                  // ✅ glb 파일명 파싱
                  const file = modelPath.split("/").pop() || "";
                  const match = file.match(/^([a-z]+)tier([0-9]+)\.glb$/i);

                  let modelType = "";
                  let modelTier = 1;

                  if (match) {
                    modelType = match[1].toLowerCase();
                    modelTier = Math.min(Number(match[2]), 7);
                  } else {
                    console.warn("❌ GLB 이름 파싱 실패:", file);
                  }

                  const legendNameMap: Record<number, string> = {
                    1: "디아루가",
                    2: "펄기아",
                    3: "기라티나",
                    4: "제크로무",
                    5: "큐레무",
                    6: "레쿠쟈",
                    7: "아르세우스",
                  };

                  // modelTier = legendtierN.glb 의 N값
                  const modelLegendName = modelType === "legend" ? legendNameMap[modelTier] : null;

                  const isOwned = ownedCards.some((c) => {
                    const cardType = normalize(c.cardType);

                    if (modelType === "legend") {
                      const modelLegendName = legendNameMap[modelTier];
                      return cardType === "legend" && c.cardName === modelLegendName;
                    }

                    return cardType === modelType && Math.min(c.tier, 7) === modelTier;
                  });

                  // ✅ ✅ ✅ 디버그 로그 추가
                  console.log(`🎨 모델 렌더링: type=${modelType}, tier=${modelTier}, isOwned=${isOwned}`);

                  return (
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
                        <Canvas className="canvas" style={{ width: "23vw", height: "450px" }}>
                          <ambientLight intensity={0.5} />
                          <directionalLight position={[2, 2, 2]} intensity={1} />
                          <Suspense fallback={null}>
                            {/* ✅ 여기서 isOwned 전달 */}
                            <PokemonModel modelPath={modelPath} isOwned={isOwned} />

                            <Environment preset="city" />
                            <ContactShadows position={[0, -2.8, 0]} opacity={0.4} scale={5} blur={2.4} />
                            <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />
                          </Suspense>
                        </Canvas>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="no-models-message">
                <p>이 타입의 3D 모델은 준비 중입니다.</p>
              </div>
            )}
          </div>

          <button className="card-nav-button" onClick={handleNext} disabled={currentIndex >= models.length - 3 || isAnimating || models.length === 0}>
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dex;
