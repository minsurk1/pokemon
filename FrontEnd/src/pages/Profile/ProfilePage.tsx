  import React from "react";
  import "./ProfilePage.css";

  function ProfilePage(){

  return(
    <div className="profile-page">
      <div className="field-container">
      <div className="enemy-field"></div>
      <div className="horizontal-line"></div> 
      <div className="player-field"></div>
      <div className="deck-card"></div>
      <div className="enemy-cost-zone"></div>
      <div className="player-cost-zone"></div>
      </div>
      <div className="right-container">
        <div className="enemy-info"></div>
        <div className="event-zone1"></div>
        <div className="player-info1"></div>
      </div>
    </div>
  );
  }
  export default ProfilePage;
