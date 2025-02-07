"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./SignUpPage.css"

function SignUpPage() {
  const navigate = useNavigate()

  const [message, setMessage] = useState("")
  const [showMessage, setShowMessage] = useState(false)

  const closeMessage = () => {
    setShowMessage(false)
    setMessage("")
  }

  const handleSignUp = (e) => {
    e.preventDefault()
    // 여기에 실제 회원가입 로직을 추가할 수 있습니다.
    setMessage("회원가입 완료")
    setShowMessage(true)

    // 메시지를 시간설정
    setTimeout(() => {
      navigate("/")
    }, 2000) // 
  }

  return (
    <div className="signup-page">
      <h1>회원가입</h1>
      <form onSubmit={handleSignUp}>
        <input type="text" placeholder="아이디" required />
        <input type="password" placeholder="비밀번호" required />
        <input type="password" placeholder="비밀번호 확인" required />
        <input type="email" placeholder="이메일" required />
        <button type="submit">가입하기</button>
      </form>
      <button onClick={() => navigate("/")}>로그인 페이지로 돌아가기</button>

      {showMessage && (
        <div className="message-box">
          <p>{message}</p>
          <button className="close-button" onClick={closeMessage}>
            확인
          </button>
        </div>
      )}
    </div>
  )
}

export default SignUpPage

