// axiosInstance.ts
// 역할: 백엔드 API 호출 시 공통 설정을 적용한 Axios 인스턴스 생성

import axios from "axios";

// 환경변수에서 백엔드 URL 가져오기 (CRA에서는 REACT_APP_XXX 형태)
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 쿠키 포함 요청
});

// 요청 인터셉터: JWT 토큰이 있으면 헤더에 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
