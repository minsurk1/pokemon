import React from "react";
import { useNavigate } from "react-router-dom";
import "./RulePage.css";

const Readme = () => {
  const navigate = useNavigate();

  const handleMain = () => {
    navigate("/main");
  };

  return (
    <button className="mainbutton" onClick={handleMain}>메인으로</button>
  );
};

export default Readme;
