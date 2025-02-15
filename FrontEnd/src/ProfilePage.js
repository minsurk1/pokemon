import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/user');
        console.log('Response:', response.data); // 응답 로그 추가
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('사용자 정보를 가져오는 데 실패했습니다: ' + error.message);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <div className="profile-page">로딩 중...</div>;
  if (error) return <div className="profile-page">에러: {error}</div>;
  if (users.length === 0) return <div className="profile-page">사용자 정보가 없습니다.</div>;

  return (
    <div className="profile-page">
      <h1>사용자 프로필</h1>
      {users.map((user) => (
        <div key={user._id} className="profile-info">
          <p><strong>사용자명:</strong> {user.username}</p>
          <p><strong>닉네임:</strong> {user.nickname}</p>
          <p><strong>이메일:</strong> {user.email}</p>
          <p><strong>보유 금액:</strong> {user.money}</p>
        </div>
      ))}
    </div>
  );
};

export default ProfilePage;