import React from 'react'
import { useState, useRef } from 'react'
import './profile.css';
import { getTokenPayload } from "./auth.js";



export default function Profile() {

  const[accOpen, setAccOpen] = useState(false)
  const userPayload = getTokenPayload()
  
  const username = userPayload?.username || "User"
  const email = userPayload?.email || "No email set"


  function arrowDir(isOpen) {

    if (isOpen) {

      return 'arrow open'
    }
    
    return 'arrow closed'
  }

 
return (
    <div>

      <h1 className="header">Profile</h1>
      <p className = "subheader">Manage your account and personal information</p>
      
    {/*Section 1*/}

  <div className = "profile-section">


    <div className = "pfp-section">
      
    </div>
    

  <div className = "top-part">
    <button className = "edit-profile-btn">
      <svg
        className="edit-profile-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    
      </svg>
      <span>Edit Profile</span>
      
    </button>

     <div className = "username">

      <p>@{username}</p>
      <p>{email}</p>
    </div>

    </div>

    <div className = "bottom-part">
       <svg className="email-icon"
          fill="none"
          stroke="currentColor" >
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>

    <svg className="location-icon"
          fill="none"
          stroke="currentColor" >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
   <circle cx="12" cy="10" r="3" />
    </svg>
  
  </div>


    </div>


   

    
    <div className="account-info">
    <svg className="profile-icon"
     fill="none"
     stroke="currentColor"
     viewBox="0 0 24 24" >
    
  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
  <circle cx="12" cy="7" r="4" />
</svg>





    <div>
      <p className="account-info-header">Account Information</p>
      <p className="account-info-subheader">Update your name, email, and password</p>

      </div>
      </div>
      


    <div className="notifications">

      <svg className = "notifications-icon"
     fill="none"
     stroke="currentColor" >
    
  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
</svg>
    

      <p className="notif-header">Notifications</p>
      <p className="notif-subheader">Manage your notification preferences</p>


      </div>


      <div className="privacy">

        <svg className = "shield-icon"
          fill="none"
          stroke="currentColor" >

            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />

        </svg>

        <p className="privacy-header">Privacy</p>
        <p className="privacy-subheader">Control your account visibility</p>


      </div>


    </div>

    
  )
}