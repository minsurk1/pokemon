// 메인화면에서 새로고침 시 JWt 토큰 기반으로 로그인한 유저의 정보를
// 가져오는 axios 인스턴스 설정 파일
// FrontEnd/src/pages/Main/axiosInstance.ts

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api", // 백엔드 주소에 맞게 수정
  withCredentials: false, // 쿠키 기반이면 true
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
