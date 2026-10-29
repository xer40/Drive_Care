import { useEffect, useRef, useState } from "react"
import { authFetch } from "../auth.js"
import { checkPhotoFile, limitedPhoto, uploadPostPhoto } from "../cloudinary.js"
import "../Styles/community.css"

// Topics a post can have. Used for the post form and the Explore filter, so every post's topic
// is one people can filter by. The API matches topics ignoring capitals
const TOPICS = [
  "Maintenance",
  "Repairs",
  "Troubleshooting",
  "Tires",
  "Brakes",
  "Modifications",
  "Reviews",
  "General",
]

// "Oct 28, 2026" from the API's timestamp
const formatDate = (timestamp) =>
  timestamp
    ? new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Recently"

function Community() {

  const [activeTab, setActiveTab] = useState("for-you")

  const [posts, setPosts] = useState([])
  const [vehicles, setVehicles] = useState([])
  // Topics in use with their post counts, for "Popular Topics"
  const [popularTopics, setPopularTopics] = useState([])
  // Topic the feed is filtered to ("" = all posts)
  const [activeTopic, setActiveTopic] = useState("")

  const [postText, setPostText] = useState("")
  const [selectedVehicleId, setSelectedVehicleId] = useState("")
  const [selectedTopic, setSelectedTopic] = useState("")

  // Optional photo for the new post: the chosen file and a preview of it
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState("")
  const [posting, setPosting] = useState(false)
  const photoInputRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState("")


  const loadPopularTopics = () =>
    authFetch("/api/posts/topics")
      .then((data) => setPopularTopics(data.topics || []))
      .catch((error) => console.error("Could not load topics:", error.message))


  // The user's vehicles (for tagging a post) and the popular topics only need loading once

  useEffect(() => {

    authFetch("/api/vehicles")
      .then((data) => setVehicles(data.vehicles || []))
      .catch((error) => console.error("Could not load vehicles:", error.message))

    loadPopularTopics()

  }, [])


  // The feed, reloaded whenever the topic filter changes

  useEffect(() => {

    const query = activeTopic ? `?topic=${encodeURIComponent(activeTopic)}` : ""

    authFetch(`/api/posts${query}`)
      .then((data) => {
        setPosts(data.posts || [])
        setStatusMessage("")
      })
      .catch((error) => {
        console.error("Could not load community:", error.message)
        setStatusMessage("Unable to load community posts.")
      })
      .finally(() => setLoading(false))

  }, [activeTopic])


  //Choosing or removing the post's photo

  const handleChoosePhoto = (event) => {

    const file = event.target.files?.[0]
    event.target.value = "" // so picking the same file again still works
    if (!file) return

    const problem = checkPhotoFile(file)
    if (problem) {
      setStatusMessage(problem)
      return
    }

    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setStatusMessage("")
  }

  const removePhoto = () => {

    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhotoFile(null)
    setPhotoPreview("")
  }


  //Creating a post

  const handleCreatePost = async (event) => {

    event.preventDefault()

    if (!postText.trim()) return

    // Every post needs a topic so it shows up under the right filter
    if (!selectedTopic) {
      setStatusMessage("Pick a topic for your post.")
      return
    }

    setPosting(true)

    try {

      // Upload the photo first (if there is one), so the post is only created once it has its image
      const imageUrl = photoFile ? await uploadPostPhoto(photoFile) : null

      // authFetch turns the body into JSON itself, so pass a plain object
      const data = await authFetch("/api/posts", {
        method: "POST",
        body: {
          body: postText.trim(),
          topic: selectedTopic,
          vehicle_id: selectedVehicleId || null,
          image_url: imageUrl,
        },
      })

      /*
        Add the new post to the top of the feed without refreshing the whole page,
        unless the feed is filtered to a different topic.
      */

      if (data.post && (!activeTopic || activeTopic.toLowerCase() === data.post.topic.toLowerCase())) {

        setPosts((previousPosts) => [
          data.post,
          ...previousPosts
        ])

      }

      setPostText("")
      setSelectedVehicleId("")
      setSelectedTopic("")
      removePhoto()
      setStatusMessage("")
      loadPopularTopics()

    } catch (error) {

      console.error(
        "Could not create post:",
        error.message
      )

      setStatusMessage(`Unable to create post: ${error.message}`)

    } finally {

      setPosting(false)
    }
  }


 //Liking and unliking a post (PUT likes it, DELETE removes the like)

  const handleLike = async (post) => {

    try {

      const data = await authFetch(`/api/posts/${post.id}/like`, {
        method: post.liked_by_me ? "DELETE" : "PUT",
      })

      // Use the server's numbers so the count is always right
      setPosts((previousPosts) =>
        previousPosts.map((p) =>
          p.id === post.id
            ? { ...p, liked_by_me: data.liked_by_me, like_count: data.like_count }
            : p
        )
      )

    } catch (error) {

      console.error(
        "Could not like post:",
        error.message
      )
    }
  }


  //Page

  return (

    <div className="community-page">


      {/*\Community Header*/}

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


      {/* Community Navigation*/}

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


      {/* Community Grid */}

      <div className="community-grid">


        {/* Left Column */}

        <aside className="community-left">

          <div className="community-card">

            <h2>Explore</h2>

            <button
              type="button"
              className={activeTopic === "" ? "active" : ""}
              onClick={() => setActiveTopic("")}
            >
              All Posts
            </button>

            {TOPICS.map((topic) => (
              <button
                type="button"
                key={topic}
                className={activeTopic === topic ? "active" : ""}
                onClick={() => setActiveTopic(topic)}
              >
                {topic}
              </button>
            ))}

          </div>


          <div className="community-card">

            <h2>Popular Topics</h2>

            <div className="community-topics">

              {popularTopics.length === 0 ? (
                <p>No topics yet. Start a discussion!</p>
              ) : (
                popularTopics.map(({ topic, post_count }) => (
                  <span
                    key={topic}
                    role="button"
                    tabIndex={0}
                    className={activeTopic.toLowerCase() === topic.toLowerCase() ? "active" : ""}
                    onClick={() => setActiveTopic(topic)}
                    onKeyDown={(event) => event.key === "Enter" && setActiveTopic(topic)}
                    title={`${post_count} post${post_count === 1 ? "" : "s"}`}
                  >
                    #{topic} ({post_count})
                  </span>
                ))
              )}

            </div>

          </div>

        </aside>


        {/* Center Feed */}

        <main className="community-feed">


          {/* Create Post*/}

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


            {/* Preview of the photo that will be attached, with a button to take it off */}
            {photoPreview && (
              <div className="community-photo-preview">
                <img src={photoPreview} alt="Photo to attach" />
                <button type="button" onClick={removePhoto} aria-label="Remove photo">
                  ✕
                </button>
              </div>
            )}


            <div className="community-post-options">

              {/* Optional photo. The real file input is hidden; this button opens it */}
              <button
                type="button"
                className="community-photo-button"
                onClick={() => photoInputRef.current?.click()}
                disabled={posting}
              >
                📷 {photoFile ? "Change Photo" : "Add Photo"}
              </button>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleChoosePhoto}
              />

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

                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}

              </select>


              <button
                type="submit"
                className="community-post-button"
                disabled={posting}
              >
                {posting ? "Posting..." : "Post"}
              </button>

            </div>

          </form>


          {/* Status*/}

          {statusMessage && (

            <p className="community-status">
              {statusMessage}
            </p>

          )}


          {/* Posts */}

          {loading ? (

            <div className="community-card">
              Loading posts...
            </div>

          ) : posts.length === 0 ? (

            <div className="community-empty">

              <h3>{activeTopic ? `No ${activeTopic} posts yet` : "No posts yet"}</h3>

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
                      {formatDate(post.created_at)}
                      {post.topic && <> · #{post.topic}</>}
                    </span>

                  </div>


                  {post.vehicle_make && (

                    <span className="community-vehicle-tag">

                      {post.vehicle_year}{" "}
                      {post.vehicle_make}{" "}
                      {post.vehicle_model}

                    </span>

                  )}

                </div>


                <p className="community-post-text">

                  {post.body}

                </p>


                {post.image_url && (

                  <img
                    src={limitedPhoto(post.image_url, 900)}
                    alt="Community post"
                    className="community-post-image"
                    loading="lazy"
                  />

                )}


                <div className="community-post-actions">

                  <button
                    type="button"
                    className={post.liked_by_me ? "liked" : ""}
                    onClick={() =>
                      handleLike(post)
                    }
                    aria-pressed={post.liked_by_me}
                  >
                    {post.liked_by_me ? "♥" : "♡"} {post.like_count || 0}
                  </button>


                  <button type="button">

                    💬 {post.comment_count || 0}

                  </button>

                </div>

              </article>

            ))

          )}

        </main>


        {/*Right Column*/}

        <aside className="community-right">


          {/* My Vehicles */}

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


          {/*Trending Post*/}

          <div className="community-card">

            <h2>Trending Posts</h2>

            <p>
              Popular discussions will appear
              here.
            </p>

          </div>


          {/*Guidelines*/}

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