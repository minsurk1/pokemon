  import React from "react";
  import "./ProfilePage.css";

  function ProfilePage(){

  return(
    <div className="profile-page">
      <div className="field-container">
      <div className="enemy-field"></div>
      <div className="horizontal-line"></div> 
      <div className="player-field"></div>
      </div>
      <div className="right-container">
        <div className="enemy-info"></div>
        <div className="event-zone"></div>
        <div className="player-info"></div>
      </div>
    </div>
  );
  }
  export default ProfilePage;
