import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import "./RulePage.css";
import backgroundImage from './assets/images/rulebg.png';

function RulePage(){
  const [backgroundStyle, setBackgroundStyle] = useState({});
  const navigate = useNavigate();
  useEffect(() => {
    setBackgroundStyle({
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    });
  }, []);

  const handleMain = () => {
    navigate("/main");
  };

  return(
  <div className="rule-body">
    <div className="rule-page" style={backgroundStyle}>
    <button className="mainbutton" onClick={handleMain}>메인으로</button>
    </div> 
  </div>
  )

}





export default RulePage;
