// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB 연결
mongoose.connect('mongodb://127.0.0.1:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err));

// 📌 JSON 파싱 미들웨어 추가
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // 3001도 추가!
  credentials: true
}));

// User 모델 정의 (스키마 설정)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// 회원가입 API
app.post('/api/signup', async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: '모든 필드를 입력해주세요' });
    }

    // 새 사용자 생성 및 저장
    const newUser = new User({ username, password, email });
    await newUser.save();

    res.json({ message: '회원가입 성공!' });
  } catch (err) {
    console.error("회원가입 중 오류 발생:", err.message); // 터미널에서 오류 확인
    res.status(500).json({ message: '회원가입 실패', error: err.message });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
