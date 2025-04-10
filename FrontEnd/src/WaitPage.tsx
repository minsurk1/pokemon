"use client"

// 방 접속 시 상대방 입장했는 지 확인하는 기능(API) 추가
// 현재 PowerShell에서 npm start를 2번 하면 3000번, 3001번 포트로 접속됨
// 각 포트에서 방 입장 시 실시간 접속 상태 확인 가능
// 서로 '준비완료' 버튼을 누르면 배틀페이지로 이동
// 새로 고침 시 오류
// socket.io, socket.io-client 패키지 사용

import React from "react"
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import io, { type Socket } from "socket.io-client" // Socket 타입 추가
import "./WaitPage.css"
import backgroundImage from "./assets/images/waitbg.jpg"
import waitVideo from "./assets/videos/waitvideo.mp4"

// location.state의 타입 정의
interface LocationState {
  roomCode?: string
}

function WaitPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isReady, setIsReady] = useState<boolean>(false)
  const [opponentReady, setOpponentReady] = useState<boolean>(false)
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({})
  const [message, setMessage] = useState<string>("")
  const [showMessage, setShowMessage] = useState<boolean>(false)
  const [socket, setSocket] = useState<Socket | null>(null) // WebSocket 연결 상태에 타입 추가

  // location.state 타입 안전하게 접근
  const state = location.state as LocationState
  const roomCode = state?.roomCode || "UNKNOWN" // 방 코드

  useEffect(() => {


    // 서버와 WebSocket 연결
    const newSocket = io("http://localhost:5000", { withCredentials: true })
    setSocket(newSocket)

    // 방 입장 요청 보내기
    newSocket.emit("joinRoom", roomCode)

    // 서버에서 참가 성공 메시지 수신
    newSocket.on("roomJoined", () => {
      setMessage("방에 입장하였습니다.")
      setShowMessage(true)
    })

    // 상대방이 접속하면 알림 받기
    newSocket.on("opponentJoined", () => {
      setMessage("상대방이 방에 입장했습니다.")
      setShowMessage(true)
    })

    // 상대방이 준비 상태 변경 감지
    newSocket.on("opponentReady", (readyState: boolean) => {
      setOpponentReady(readyState)
    })

    // 상대방이 나갔을 때 알림
    newSocket.on("opponentLeft", () => {
      setMessage("상대방이 방을 나갔습니다.")
      setShowMessage(true)
      setOpponentReady(false)
    })

    // 게임 시작 이벤트 감지
    newSocket.on("gameStart", () => {
      navigate("/battle")
    })

    // 컴포넌트 언마운트 시 WebSocket 연결 해제
    return () => {
      newSocket.close()
    }
  }, [navigate, roomCode])

  const closeMessage = (): void => {
    setShowMessage(false)
    setMessage("")
  }

  const handleReady = (): void => {
    setIsReady(!isReady)
    if (socket) {
      socket.emit("playerReady", { roomCode, isReady: !isReady })
    }
  }

  const handleStart = (): void => {
    if (isReady && opponentReady) {
      if (socket) {
        socket.emit("startGame", roomCode)
      }
    } else {
      setMessage("양쪽 모두 준비가 완료되어야 게임을 시작할 수 있습니다.")
      setShowMessage(true)
    }
  }

  const handleReturn = (): void => {
    navigate("/main")
  }

  return (
    <div className="wait-body">
      <div className="wait-page">
      <video className="background-video" autoPlay loop muted playsInline>
        <source src={waitVideo} type="video/mp4" />
        브라우저가 비디오를 지원하지 않습니다.
      </video>
        {showMessage && (
          <div className="message-box">
            <p>{message}</p>
            <button className="close-button" onClick={closeMessage}>
              확인
            </button>
          </div>
        )}
        <div className="room-info">
          <h2>대기실</h2>
          <p>방 코드: {roomCode}</p>
        </div>
        <div className="players">
          <div className="player">
            <p>나</p>
            <p>{isReady ? "준비 완료" : "준비 중"}</p>
          </div>
          <div className="player">
            <p>상대방</p>
            <p>{opponentReady ? "준비 완료" : "대기 중"}</p>
          </div>
        </div>
        <div className="buttons">
          <button className={`ready-button ${isReady ? "ready" : ""}`} onClick={handleReady}>
            {isReady ? "준비 완료" : "준비하기"}
          </button>
          <button className="start-button" onClick={handleStart}>
            시작하기
          </button>
          <button className="return-button" onClick={handleReturn}>
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}

export default WaitPage

