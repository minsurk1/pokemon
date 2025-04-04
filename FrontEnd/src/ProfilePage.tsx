"use client"

import React from "react"
import { useState, useEffect } from "react"
import axios from "axios"
import "./ProfilePage.css"

// 사용자 인터페이스 정의
interface User {
  _id: string
  username: string
  nickname: string
  email: string
  money: number
}

const ProfilePage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // 토큰 가져오기
        const token = localStorage.getItem("token")

        const response = await axios.get<User[]>("http://localhost:5000/api/auth/user", {
          headers: {
            Authorization: `Bearer ${token}`, // 인증 토큰 추가
          },
        })
        console.log("Response:", response.data) // 응답 로그 추가
        setUsers(response.data)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setError("사용자 정보를 가져오는 데 실패했습니다: " + (error as Error).message)
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  if (loading) return <div className="profile-page">로딩 중...</div>
  if (error) return <div className="profile-page">에러: {error}</div>
  if (users.length === 0) return <div className="profile-page">사용자 정보가 없습니다.</div>

  return (
    <div className="profile-page">
      <h1>사용자 프로필</h1>
      {users.map((user) => (
        <div key={user._id} className="profile-info">
          <p>
            <strong>사용자명:</strong> {user.username}
          </p>
          <p>
            <strong>닉네임:</strong> {user.nickname}
          </p>
          <p>
            <strong>이메일:</strong> {user.email}
          </p>
          <p>
            <strong>보유 금액:</strong> {user.money}
          </p>
        </div>
      ))}
    </div>
  )
}

export default ProfilePage

