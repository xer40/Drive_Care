



import { useEffect, useState } from "react"
import { authFetch } from "../Components/auth.js"
import "../Styles/community.css"

function Community() {

  // ==========================================
  // PAGE STATE
  // ==========================================

  const [activeTab, setActiveTab] = useState("for-you")

  const [posts, setPosts] = useState([])
  const [vehicles, setVehicles] = useState([])

  const [postText, setPostText] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")

  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState("")


  // ==========================================
  // LOAD COMMUNITY DATA
  // ==========================================

  useEffect(() => {

    const loadCommunity = async () => {

      try {

        /*
          These endpoint response shapes may need to be
          adjusted to match your backend routes.
        */

        const postData = await authFetch("/api/posts")
        const vehicleData = await authFetch("/api/vehicles")

        setPosts(postData.posts || [])
        setVehicles(vehicleData.vehicles || [])

      } catch (error) {

        console.error(
          "Could not load community:",
          error.message
        )

        setStatusMessage(
          "Unable to load community posts."
        )

      } finally {

        setLoading(false)

      }
    }

    loadCommunity()

  }, [])


  // ==========================================
  // CREATE POST
  // ==========================================

  const handleCreatePost = async (event) => {

    event.preventDefault()

    if (!postText.trim()) return

    try {

      const data = await authFetch(
        "/api/posts",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            content: postText,
            vehicle_id:
              selectedVehicleId || null,
            topic:
              selectedTopic || null
          })
        }
      )

      /*
        Add the new post to the top of the feed
        without refreshing the whole page.
      */

      if (data.post) {

        setPosts((previousPosts) => [
          data.post,
          ...previousPosts
        ])

      }

      setPostText("")
      setSelectedVehicleId("")
      setSelectedTopic("")

    } catch (error) {

      console.error(
        "Could not create post:",
        error.message
      )

      setStatusMessage(
        "Unable to create post."
      )
    }
  }


  // ==========================================
  // LIKE POST
  // ==========================================

  const handleLike = async (postId) => {

    try {

      await authFetch(
        `/api/posts/${postId}/like`,
        {
          method: "POST"
        }
      )

      /*
        Temporary frontend update.
        Adjust property names to match backend.
      */

      setPosts((previousPosts) =>
        previousPosts.map((post) => {

          if (post.id === postId) {

            return {
              ...post,
              likes:
                Number(post.likes || 0) + 1
            }

          }

          return post

        })
      )

    } catch (error) {

      console.error(
        "Could not like post:",
        error.message
      )
    }
  }


  // ==========================================
  // PAGE
  // ==========================================

  return (

    <div className="community-page">


      {/* ===================================
          COMMUNITY HEADER
      =================================== */}

      <section className="community-banner">

        <div className="community-banner-content">

          <h1>Community</h1>

          <p>
            A place for car enthusiasts to
            share experiences, ask questions,
            and help each other.
          </p>

        </div>

      </section>


      {/* ===================================
          COMMUNITY NAVIGATION
      =================================== */}

      <div className="community-tabs">

        <button
          type="button"
          className={
            activeTab === "for-you"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("for-you")
          }
        >
          For You
        </button>


        <button
          type="button"
          className={
            activeTab === "following"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("following")
          }
        >
          Following
        </button>


        <button
          type="button"
          className={
            activeTab === "my-posts"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("my-posts")
          }
        >
          My Posts
        </button>


        <button
          type="button"
          className={
            activeTab === "trending"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("trending")
          }
        >
          Trending
        </button>

      </div>


      {/* ===================================
          COMMUNITY GRID
      =================================== */}

      <div className="community-grid">


        {/* ===================================
            LEFT COLUMN
        =================================== */}

        <aside className="community-left">

          <div className="community-card">

            <h2>Explore</h2>

            <button>
              All Posts
            </button>

            <button>
              Maintenance
            </button>

            <button>
              Troubleshooting
            </button>

            <button>
              Modifications
            </button>

            <button>
              Reviews
            </button>

            <button>
              General Discussion
            </button>

          </div>


          <div className="community-card">

            <h2>Popular Topics</h2>

            <div className="community-topics">

              <span>#OilChange</span>
              <span>#Tires</span>
              <span>#Brakes</span>
              <span>#Reliability</span>
              <span>#DIY</span>
              <span>#CarCare</span>

            </div>

          </div>

        </aside>


        {/* ===================================
            CENTER FEED
        =================================== */}

        <main className="community-feed">


          {/* CREATE POST */}

          <form
            className="community-create-post"
            onSubmit={handleCreatePost}
          >

            <textarea
              placeholder=
                "Share your experience, ask a question, or post an update..."
              value={postText}
              onChange={(event) =>
                setPostText(
                  event.target.value
                )
              }
            />


            <div className="community-post-options">

              <select
                value={selectedVehicleId}
                onChange={(event) =>
                  setSelectedVehicleId(
                    event.target.value
                  )
                }
              >

                <option value="">
                  No Vehicle
                </option>

                {vehicles.map((vehicle) => (

                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.year}{" "}
                    {vehicle.make}{" "}
                    {vehicle.model}
                  </option>

                ))}

              </select>


              <select
                value={selectedTopic}
                onChange={(event) =>
                  setSelectedTopic(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Select Topic
                </option>

                <option value="maintenance">
                  Maintenance
                </option>

                <option value="repairs">
                  Repairs
                </option>

                <option value="tires">
                  Tires
                </option>

                <option value="brakes">
                  Brakes
                </option>

                <option value="general">
                  General
                </option>

              </select>


              <button
                type="submit"
                className="community-post-button"
              >
                Post
              </button>

            </div>

          </form>


          {/* STATUS */}

          {statusMessage && (

            <p className="community-status">
              {statusMessage}
            </p>

          )}


          {/* POSTS */}

          {loading ? (

            <div className="community-card">
              Loading posts...
            </div>

          ) : posts.length === 0 ? (

            <div className="community-empty">

              <h3>No posts yet</h3>

              <p>
                Be the first person to start
                a discussion.
              </p>

            </div>

          ) : (

            posts.map((post) => (

              <article
                key={post.id}
                className="community-post-card"
              >

                <div className="community-post-header">

                  <div className="community-avatar">

                    {post.username
                      ?.charAt(0)
                      ?.toUpperCase() || "U"}

                  </div>


                  <div className="community-post-user">

                    <strong>
                      {post.username ||
                        "DriveCare User"}
                    </strong>

                    <span>
                      {post.created_at ||
                        "Recently"}
                    </span>

                  </div>


                  {post.vehicle && (

                    <span className="community-vehicle-tag">

                      {post.vehicle.year}{" "}
                      {post.vehicle.make}{" "}
                      {post.vehicle.model}

                    </span>

                  )}

                </div>


                <p className="community-post-text">

                  {post.content}

                </p>


                {post.image_url && (

                  <img
                    src={post.image_url}
                    alt="Community post"
                    className="community-post-image"
                  />

                )}


                <div className="community-post-actions">

                  <button
                    type="button"
                    onClick={() =>
                      handleLike(post.id)
                    }
                  >
                    ♡ {post.likes || 0}
                  </button>


                  <button type="button">

                    💬 {post.comments || 0}

                  </button>

                </div>

              </article>

            ))

          )}

        </main>


        {/* ===================================
            RIGHT COLUMN
        =================================== */}

        <aside className="community-right">


          {/* MY VEHICLES */}

          <div className="community-card">

            <h2>My Vehicles</h2>

            {vehicles.length === 0 ? (

              <p>
                No vehicles added yet.
              </p>

            ) : (

              vehicles
                .slice(0, 2)
                .map((vehicle) => (

                  <div
                    key={vehicle.id}
                    className="community-vehicle"
                  >

                    <div>

                      <strong>
                        {vehicle.year}{" "}
                        {vehicle.make}{" "}
                        {vehicle.model}
                      </strong>

                      <span>
                        {vehicle.trim ||
                          "Vehicle"}
                      </span>

                    </div>

                  </div>

                ))

            )}

          </div>


          {/* TRENDING */}

          <div className="community-card">

            <h2>Trending Posts</h2>

            <p>
              Popular discussions will appear
              here.
            </p>

          </div>


          {/* GUIDELINES */}

          <div className="community-card">

            <h2>
              Community Guidelines
            </h2>

            <ul>

              <li>
                Be respectful and helpful.
              </li>

              <li>
                Keep discussions relevant.
              </li>

              <li>
                Avoid spam.
              </li>

              <li>
                Share useful experiences.
              </li>

            </ul>

          </div>

        </aside>

      </div>

    </div>

  )
}

export default Community