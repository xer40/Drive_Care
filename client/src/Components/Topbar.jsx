import "../styles/Topbar.css"

function topbar(){
    return(
        <header className = "topbar">
            <div className ="search-box">
                <span className = "search-icon">
                    🔍
                </span>
                <input type= "text" placeholder ="Search.." />
            </div>

        <div className ="topbar-right">

            <button className ="notification-btn">
                🔔
            </button>

        <div className ="profile">
            <div className ="profile-circle">
                U
            </div>

            <span>
                User
            </span>
        </div>

        </div>


        </header>
    )
}

export default topbar