// src/utils/axiosInstance.ts
// 역할: 백엔드 API 호출 시 공통 설정을 적용한 Axios 인스턴스 생성
// JWT 인증, 자동 로그아웃(401 응답 시), 공통 baseURL 포함

import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api";

// ✅ Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // JWT는 헤더로 주고받으므로 false로 설정 (쿠키 미사용)
});

// ✅ 요청 인터셉터: JWT 토큰 자동 추가
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

// ✅ 응답 인터셉터: 토큰 만료(401) 시 자동 로그아웃 처리
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      console.warn("⚠️ 토큰 만료 또는 인증 오류, 자동 로그아웃 실행");

      // 🔥 모든 로그인 관련 정보 제거
      ["token", "selectedDeck", "userDeck"].forEach((key) => localStorage.removeItem(key));
      delete axiosInstance.defaults.headers.common.Authorization;

      // 로그인 페이지로 리다이렉트
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
