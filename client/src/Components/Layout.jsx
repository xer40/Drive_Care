import NavBar from "./navbar"
import TopBar from "./Topbar"

import "../styles/Layout.css"

function Layout ({ Children}){
    return (
        <div className ="layout">
            <navbar />

            <div className = "main-area">

                <Topbar />
                
                <main className ="page-content">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default Layout
