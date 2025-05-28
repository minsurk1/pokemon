import React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "./MainPage.css"
import mainImage from "../../assets/images/default.png"
import { CardAnimation } from "@lasbe/react-card-animation"
import io, { type Socket } from "socket.io-client" 
import BackgroundVideo from "../../components/common/global.tsx"
import { MenuButton } from "../../components/common/button.tsx"

import phantomVideo from "../../assets/videos/phantom.mp4";
import gaiogaVideo from "../../assets/videos/gaioga.mp4"
import grandonVideo from "../../assets/videos/grandon.mp4"
import thunderVideo from "../../assets/videos/thunder.mp4"

const videoFiles = [phantomVideo, gaiogaVideo, grandonVideo, thunderVideo]

const videoThemes = {
  [phantomVideo]: {
    name: "팬텀",
    color: "phantom",
  },
  [gaiogaVideo]: {
    name: "가이오가",
    color: "gaioga",
  },
  [grandonVideo]: {
    name: "그란돈",
    color: "grandon",
  },
  [thunderVideo]: {
    name: "썬더",
    color: "thunder",
  },
}

// MainPage 컴포넌트의 props 인터페이스 정의
interface MainPageProps {
  currency: number
  selectedDeck: string[]
}

function MainPage({ currency, selectedDeck }: MainPageProps) {
  const navigate = useNavigate()
  const [showRoomTab, setShowRoomTab] = useState<boolean>(false)
  const [roomCode, setRoomCode] = useState<string>("")
  const [socket, setSocket] = useState<Socket | null>(null) // socket 상태에 타입 추가
  const [serverResponse, setServerResponse] = useState<string>("") // 서버 응답을 받을 상태

  const [randomVideo] = useState(() => {
    const randomIndex = Math.floor(Math.random() * videoFiles.length)
    return videoFiles[randomIndex]
  })

  const themeColorClass = videoThemes[randomVideo].color
  const themeName = videoThemes[randomVideo].name

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", `var(--${themeColorClass}-color)`)
    document.documentElement.style.setProperty("--theme-hover-color", `var(--${themeColorClass}-hover-color)`)

    // WebSocket 연결 설정
    const newSocket = io("http://localhost:5001", { withCredentials: true })

    setSocket(newSocket)

    // 서버로부터 "message" 이벤트가 오면 응답 처리
    newSocket.on("message", (data: string) => {
      setServerResponse(data) // 서버 응답을 상태에 저장
    })

    // 방 생성 후 "roomCreated" 이벤트를 수신하여 대기실로 이동
    newSocket.on("roomCreated", (newRoomCode: string) => {
      navigate("/wait", { state: { roomCode: newRoomCode } }) // 방 코드와 함께 대기실로 이동
    })

    // 방 입장 처리
    newSocket.on("roomJoined", (joinedRoomCode: string) => {
      navigate("/wait", { state: { roomCode: joinedRoomCode } }) // 방 코드와 함께 대기실로 이동
    })

    // 방 입장 오류 처리
    newSocket.on("error", (error: string) => {
      alert(error) // 방 입장 실패 시 오류 메시지 표시
    })

    // 컴포넌트가 언마운트될 때 연결 종료
    return () => {
      newSocket.close()
    }
  }, [navigate,themeColorClass])

  const handleLogout = (): void => {
    navigate("/")
  }

  const handleStore = (): void => {
    navigate("/store")
  }

  const handleDeck = (): void => {
    navigate("/deck")
  }
  const handledex = (): void => {
    navigate("/dex")
  }
  const handleBattle = (): void => {
    navigate("/battle")
  }

  const handleRule = (): void => {
    navigate("/rule")
  }

  const toggleRoomTab = (): void => {
    setShowRoomTab(!showRoomTab)
  }

  const handleProfile = (): void => {
    navigate("/profile")
  }

  const handleCreateRoom = (): void => {
    if (socket) {
      socket.emit("createRoom") // 서버에 방 생성 요청
    }
  }

  const handleJoinRoom = (): void => {
    if (roomCode.length === 6 && socket) {
      socket.emit("joinRoom", roomCode) // 서버에 방 입장 요청
    } else {
      alert("올바른 방 코드를 입력해주세요.")
    }
  }
  
  return (
    <div className="main-container">
      <BackgroundVideo src={randomVideo} opacity={1} zIndex={1} />
      {/* 사이드바 */}
      <div className="sidebar">
        <MenuButton onClick={handleStore}>
          상점
        </MenuButton>
        <MenuButton onClick={handleDeck}>
          내카드
        </MenuButton>
        <MenuButton onClick={handledex}>
          도감
        </MenuButton>
        <MenuButton onClick={handleBattle}>
          배틀  
        </MenuButton>
        <MenuButton onClick={handleRule}>
          Rule
        </MenuButton>
        <MenuButton onClick={handleCreateRoom}>
          {showRoomTab ? "탭 닫기" : "방 만들기/입장"}
        </MenuButton>
        <MenuButton onClick={handleProfile}>
          마이페이지
        </MenuButton>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="main-content">
        <div className="main-header">
          <span className="money">현재 돈: {currency}원</span>
          <button className="logout-button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>

        {/* 대표 몬스터 카드 */}
        <CardAnimation angle={35}>
          <div className="monster-card">
            {selectedDeck && selectedDeck.length > 0 ? (
              <img src={selectedDeck[0] || "/placeholder.svg"} alt="대표 몬스터 카드" className="monster-image" />
            ) : (
              <img src={mainImage || "/placeholder.svg"} alt="기본 대표 몬스터 카드" className="monster-image" />
            )}
          </div>
        </CardAnimation>

        {/* 방 만들기/입장 탭 */}
        {showRoomTab && (
          <div className="room-tab">
            <h3>방 만들기/입장</h3>
            <button className="create-room" onClick={handleCreateRoom}>
              방 만들기
            </button>
            <div className="join-room">
              <input
                type="text"
                placeholder="방 코드 입력"
                value={roomCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button onClick={handleJoinRoom}>방 입장</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MainPage