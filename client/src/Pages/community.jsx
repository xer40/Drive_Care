

import { useState } from 'react'
import './community.css'


function Community(){
    return (
        <div className="community-page">
            
            {/*Banner header add picture*/}
            <section className ="community-hero">
                <div className = "hero-overlay">
                    <h1>Community</h1>

                    <p>
                        A place for Community
                    </p>
                </div>
            </section>

            {/*Community tabs*/}
            <div className ="community-tabs">
                
                <button className ="community-tab active">
                    For You
                </button>
                <button className ="community-tab">
                    Following
                </button>
                <button className= "community-tab">
                    My Posts
                </button>
                <button className ="community-tab">
                    Trending
                </button>
                <button className ="create-post-button">
                    + Create Post
                </button>
            
            </div>

                {/* Main Community Layout*/}
                <div className ="community-grid">

                    {/* Left Column */}
                    <aside className = "Community-left-column">
                        <div className ="community-card">
                            <h3>Explore</h3>
                            <div className ="explote-list">
                                <button className="explore-item-list">
                                    All Posts
                                </button>
                                <button className="explore-item">
                                    Maintnance
                                </button>
                                <button className="explore-item">
                                    Modifications
                                </button>
                                <button className="explore-item">
                                    Troubleshooting
                                </button>
                                <button className="explore-item">
                                    Reviews
                                </button>
                                <button className="explore-item">
                                    Photos
                                </button>
                                <button className="explore-item">
                                    Road Trips
                                </button>
                                <button className="explore-item">
                                    General Discussion
                                </button>
                                
                            </div>
                            
                            <h4 className ="popular-title">
                                Popular Topics
                            </h4>
                            <div className="Topic-list">
                                <span># OilChange</span>
                                <span># Tires</span>
                                <span># Brakes</span>
                                <span># Reliability</span>
                                <span># Mods</span>
                                <span># DIY</span>
                                <span># CarCare</span>
                                <span># RoadTrip</span>
                            </div>
                        </div>
                            <div className="community-card">


                                <div className="card-hedding">
                                    <h3>Suggested Users</h3>
                                    <button>View All</button>
                                </div>

                                <div className="suggested-user">
                                    <div className="user-avatar">
                                        D
                                    </div>

                                    <div className="suggested-user-info">
                                        <strong>Daniel R</strong>
                                        <span>WRX Enthusiast</span>
                                    </div>

                                    <button className="follow-button">
                                        Follow
                                    </button>
                                </div>

                            </div>
                    </aside>

                    {/* Center Column */}
                    <main className = "community-feed">
                        {/* Create post */}
                        <div className ="create-post-card">

                            <div className="create-post-top">
                                <div className="user-avatar">
                                    U
                                </div>
                                <input
                                    type="text"
                                    placeholder="Share your experience,ask a question or post a photo.."
                                />
                            </div>
                            <div className="create-post-actions">
                                <div className ="create-post-options">
                                    <button>
                                        Photo
                                    </button>
                                    <Button>
                                        Select Vehicle
                                    </Button>

                                    <button>
                                        Tag topic
                                    </button>
                                </div>
                                <button ClassName ="submit-post button">
                                    Post
                                </button>
                            </div>
                        </div>

                        {/*Example Post*/}
                        <article className="post-card">
                            <div className ="post-header">
                                <div className="user-avatar">
                                    D
                                </div>
                                <div className ="post-user-info">
                                    <div className ="post-user-line">
                                        <strong>
                                            Daniel R
                                        </strong>
                                        <span className ="vehicle-tag">
                                            WRX
                                        </span>
                                    </div>
                                    <span className ="post-time">
                                        2h Ago
                                    </span>
                                </div>
                                <button className ="post-menu">
                                    :::
                                </button>
                            </div>
                            <p className ="post-text">
                                Just installed new tires Woo!
                            </p>
                            <div className ="post-image-placeholder">
                                Vehicle Photo
                            </div>

                            <div className ="post-actions">
                                <button>
                                    current like placeholder
                                </button>
                                <button>
                                    current comment placeholder
                                </button>
                                <button>
                                    Bookmark
                                </button>
                                <span className="post-topic">
                                    Tires
                                </span>
                            </div>
                        </article>
                        
                    </main>

                        <aside className="community-right-column">
                            <div className="community-card">
                                <div className="card-heading">
                                <h3>
                                    My vehicles
                                </h3>

                                <Button>
                                    View All
                                </Button>
                            </div>
                            <div className="vehicle-item">
                                <div className="vehicle-thumbnail">
                                    car
                                </div>
                                <div>
                                    <strong>
                                        2022 charger
                                    </strong>
                                    <span>
                                        Hellcat Widebody
                                    </span>
                                </div>
                            </div>
                            <div className="vehicle-item">
                                <div className ="vehicle-thumbnail">
                                    Car
                                </div>
                                <div>
                                    <strong>
                                        2020 honda civic
                                    </strong>
                                    <span>
                                        sport
                                    </span>
                                </div>
                            </div>

                            <button className="add-vehicle-button">
                                +Add vehicle
                            </button>
                            </div>

                            <div className ="community-card">
                                <div className ="card-heading">
                                    <h3>
                                        Trending Posts
                                    </h3>
                                    <button>
                                        View All
                                    </button>
                                </div>
                                <div className ="trending-item">
                                    <strong>
                                        Best tires for daily driving?
                                    </strong>
                                    <span>
                                        comment count
                                    </span>
                                </div>
                                <div className="trending-item">
                                    <Strong>
                                        Oil change interval for charger?
                                    </Strong>
                                    <span>
                                        comment count
                                    </span>
                                </div>
                                <div className ="trending-item">
                                    <Strong>
                                        Brake Pad Recommendations
                                    </Strong>
                                    <span>
                                        comment count
                                    </span>
                                </div>
                                <div className="community-card">
                                    <h3>
                                        Community Guidelines
                                    </h3>
                                    <ul className="guidelines-list">
                                        <li>Be Respectful</li>
                                        <li>Keep on topic</li>
                                        <li>No spam</li>
                                        <li>Share responsibily</li>
            
                                    </ul>
                                </div>
                            </div>
                        </aside>
                </div>



            </div>
    )
}
export default Commmunity;







