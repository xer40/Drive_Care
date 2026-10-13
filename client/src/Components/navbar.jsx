import { useState } from 'react'
import "./NavBar.css"

function NavBar(){
    return(
        <aside classname ="navbar">
            <div classname = "navbar-title">
                Car Maitnance Checker
            </div>

            <nav> 
                <a href = "/" classname ="nav-item">
                    Home
                </a>

                <a href = "/garage" classname ="nav-item">
                    My Garage
                </a>

                <a href ="Maintenance" classname = "nav-item">
                    Maintenance
                </a>

                <a href ="/reminders" classname ="nav-item">
                    Reminders
                </a>

                <a href ="/ai-assistant" classname ="nav-item">
                    AI assistant
                </a>

                <a href ="/reports" clasaname="nav-item">
                    Reports
                </a>

            </nav>

            <div classname="navbar-bottom">
                <a heref="/settings" classname ="nav-item">
                    Settings
                </a>

                <a href = "/help" classname ="nav-item">
                    Help
                </a>
            </div>
        </aside>
         

        
    )
}

export default NavBar;