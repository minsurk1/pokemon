import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SignUpPage.css';

function SignUpPage() {
  const navigate = useNavigate();

  const handleSignUp = (e) => {
    e.preventDefault();
    // 여기에 실제 회원가입 로직을 추가할 수 있습니다.
    console.log('회원가입 시도');
    // 회원가입 후 로그인 페이지로 이동
    navigate('/');
  };

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
      <button onClick={() => navigate('/')}>로그인 페이지로 돌아가기</button>
    </div>
  );
}

export default SignUpPage;