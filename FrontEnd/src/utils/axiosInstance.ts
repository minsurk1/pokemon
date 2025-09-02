// axiosInstance.ts
// 역할: 백엔드 API 호출 시 공통 설정을 적용한 Axios 인스턴스 생성
// 이제 이 axiosInstance를 사용하여 API 호출 시 일관된 설정을 적용할 수 있습니다.

import axios from "axios";

// 환경변수에서 백엔드 URL 가져오기
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api";

// Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ 쿠키 전송 허용
});

// 요청 인터셉터: JWT 토큰이 있으면 헤더에 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // 로그인 시 저장한 JWT
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
