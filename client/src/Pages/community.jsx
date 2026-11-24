import { useEffect, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { authFetch, getTokenPayload } from "../auth.js"
import { checkPhotoFile, limitedPhoto, uploadPostPhoto } from "../cloudinary.js"
import { VehiclePhoto } from "../VehiclePhoto.jsx"
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

const TOPIC_ICONS = {
  Maintenance: "🔧",
  Repairs: "🛠️",
  Troubleshooting: "🔍",
  Tires: "🛞",
  Brakes: "🛑",
  Modifications: "⚙️",
  Reviews: "⭐",
  General: "💬",
}

const formatRelativeAge = (timestamp, now) => {
  const postedAt = Date.parse(timestamp)
  if (!Number.isFinite(postedAt)) return "Recently"

  const hours = Math.max(0, Math.floor((now - postedAt) / 3_600_000))
  if (hours === 0) return "<1h ago"
  if (hours < 24) return hours + "h ago"
  return Math.floor(hours / 24) + "d ago"
}

const engagementCount = (post) => Number(post.like_count ?? 0) + Number(post.comment_count ?? 0)

function PostComments({ postId, now, onCountChange }) {

  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const [edit, setEdit] = useState(null)
  const [updating, setUpdating] = useState(false)
  const myId = getTokenPayload()?.id


  useEffect(() => {

    authFetch(`/api/posts/${postId}/comments`)
      .then((data) => setComments(data.comments || []))
      .catch((err) => setError(`Could not load comments: ${err.message}`))
      .finally(() => setLoading(false))

  }, [postId])


  const addComment = async (event) => {

    event.preventDefault()
    if (!text.trim() || sending) return

    setSending(true)
    setError("")

    try {

      const data = await authFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        body: { body: text.trim() },
      })

      setComments((previous) => [...previous, data.comment])
      setText("")
      onCountChange?.(1)

    } catch (err) {

      setError(`Could not post comment: ${err.message}`)

    } finally {

      setSending(false)
    }
  }


  const saveComment = async (event) => {
    event.preventDefault()
    const body = edit.text.trim()
    if (!body || updating) return

    setUpdating(true)
    setError("")

    try {
      const data = await authFetch(`/api/comments/${edit.id}`, {
        method: "PATCH",
        body: { body },
      })
      setComments((previous) => previous.map((comment) =>
        comment.id === edit.id ? { ...comment, ...data.comment } : comment
      ))
      setEdit(null)
    } catch (err) {
      setError(`Could not edit comment: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }

  const deleteComment = async (commentId) => {

    if (updating || !window.confirm("Delete this comment?")) return

    setUpdating(true)
    setError("")

    try {

      await authFetch(`/api/comments/${commentId}`, { method: "DELETE" })
      setComments((previous) => previous.filter((comment) => comment.id !== commentId))
      onCountChange?.(-1)

    } catch (err) {

      setError(`Could not delete comment: ${err.message}`)
    } finally {
      setUpdating(false)
    }
  }


  return (

    <div className="community-comments">

      {loading ? (

        <p className="community-comments-note">Loading comments...</p>

      ) : comments.length === 0 ? (

        <p className="community-comments-note">No comments yet. Be the first to reply.</p>

      ) : (

        comments.map((comment) => (

          <div key={comment.id} className="community-comment">

            <div className="community-comment-avatar">
              {comment.username?.charAt(0)?.toUpperCase() || "U"}
            </div>

            <div className="community-comment-body">

              <div className="community-comment-meta">
                <strong>{comment.username || "DriveCare User"}</strong>
                <time className="community-timestamp" dateTime={comment.created_at || undefined}>{formatRelativeAge(comment.created_at, now)}</time>

                {myId != null && String(comment.user_id) === String(myId) && edit?.id !== comment.id && (
                  <div className="community-comment-actions">
                    <button type="button" disabled={updating} onClick={() => {
                      setEdit({ id: comment.id, text: comment.body })
                      setError("")
                    }}>
                      Edit
                    </button>
                    <button type="button" disabled={updating} onClick={() => deleteComment(comment.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {edit?.id === comment.id ? (
                <form className="community-comment-form community-comment-edit" onSubmit={saveComment}>
                  <input
                    type="text"
                    aria-label="Edit comment"
                    value={edit.text}
                    onChange={(event) => setEdit({ ...edit, text: event.target.value })}
                    maxLength={2000}
                    disabled={updating}
                    autoFocus
                  />
                  <button type="button" disabled={updating} onClick={() => {
                    setEdit(null)
                    setError("")
                  }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={updating || !edit.text.trim()}>
                    {updating ? "Saving..." : "Save"}
                  </button>
                </form>
              ) : (
                <p>{comment.body}</p>
              )}

            </div>

          </div>

        ))

      )}


      {error && <p className="community-comments-error" role="alert">{error}</p>}


      <form className="community-comment-form" onSubmit={addComment}>

        <input
          type="text"
          placeholder="Write a comment..."
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={2000}
          disabled={sending}
        />

        <button type="submit" disabled={sending || !text.trim()}>
          {sending ? "Posting..." : "Reply"}
        </button>

      </form>

    </div>

  )
}

function Community() {

  const { state } = useLocation()
  const [activeTab, setActiveTab] = useState(state?.tab === "trending" ? "trending" : "for-you")

  const [posts, setPosts] = useState([])
  const [trendingPreview, setTrendingPreview] = useState(null)
  const [trendingRevision, setTrendingRevision] = useState(0)
  const feedRef = useRef(null)

  const refreshTrending = () => setTrendingRevision((revision) => revision + 1)
  const [vehicles, setVehicles] = useState([])
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

  // Ids of posts whose comments are open
  const [openComments, setOpenComments] = useState([])

  const toggleComments = (postId) =>
    setOpenComments((open) =>
      open.includes(postId) ? open.filter((id) => id !== postId) : [...open, postId]
    )

  // Keep a post's 💬 count in step when a comment is added (+1) or deleted (-1)
  const changeCommentCount = (postId, change) => {
    setPosts((previousPosts) =>
      previousPosts.map((p) =>
        p.id === postId ? { ...p, comment_count: Number(p.comment_count || 0) + change } : p
      )
    )
    refreshTrending()
  }

  const [loading, setLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState("")
  const [postEdit, setPostEdit] = useState(null)
  const editPhotoInputRef = useRef(null)
  const editPhotoPreview = postEdit?.photoPreview
  useEffect(() => {
    return () => {
      if (editPhotoPreview) URL.revokeObjectURL(editPhotoPreview)
    }
  }, [editPhotoPreview])
  const [pendingPostId, setPendingPostId] = useState(null)
  const [postActionError, setPostActionError] = useState(null)
  const viewerId = getTokenPayload()?.id
  const showMyPosts = activeTab === "my-posts"
  const showTrending = activeTab === "trending"
  let visiblePosts = posts
  if (showMyPosts) {
    visiblePosts = posts.filter((post) => viewerId != null && String(post.user_id) === String(viewerId))
  } else if (showTrending) {
    visiblePosts = [...posts].sort((a, b) =>
      engagementCount(b) - engagementCount(a) || Date.parse(b.created_at) - Date.parse(a.created_at)
    )
  }
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])


  // Load the user's vehicles for tagging posts

  useEffect(() => {

    authFetch("/api/vehicles")
      .then((data) => setVehicles(data.vehicles || []))
      .catch((error) => console.error("Could not load vehicles:", error.message))


  }, [])


  useEffect(() => {
    let ignore = false
    const params = new URLSearchParams()
    if (activeTopic) params.set("topic", activeTopic)
    if (showTrending) params.set("sort", "trending")
    if (showMyPosts && viewerId != null) params.set("user_id", String(viewerId))
    const query = params.toString()

    setLoading(true)
    authFetch(query ? "/api/posts?" + query : "/api/posts")
      .then((data) => {
        if (ignore) return
        setPosts(data.posts || [])
        setStatusMessage("")
      })
      .catch((error) => {
        if (ignore) return
        console.error("Could not load community:", error.message)
        setStatusMessage("Unable to load community posts.")
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => { ignore = true }
  }, [activeTopic, showMyPosts, showTrending, viewerId])


  useEffect(() => {
    let ignore = false

    authFetch("/api/posts?sort=trending&limit=3")
      .then((data) => {
        if (!ignore) setTrendingPreview({ posts: data.posts || [], error: "" })
      })
      .catch(() => {
        if (!ignore) setTrendingPreview({ posts: [], error: "Unable to load trending posts." })
      })

    return () => { ignore = true }
  }, [trendingRevision])

  const openTrendingFeed = () => {
    setActiveTopic("")
    setActiveTab("trending")
    feedRef.current?.scrollIntoView({ block: "start" })
  }

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
      refreshTrending()

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
      refreshTrending()

    } catch (error) {

      console.error(
        "Could not like post:",
        error.message
      )
    }
  }


  const startPostEdit = (event, post) => {
    event.currentTarget.closest("details").open = false
    setPostActionError(null)
    setPostEdit({
      id: post.id,
      body: post.body || "",
      photoFile: null,
      photoPreview: "",
      removePhoto: false,
    })
  }

  const chooseEditPhoto = (event, postId) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    const problem = checkPhotoFile(file)
    if (problem) {
      setPostActionError({ id: postId, message: problem })
      return
    }

    setPostActionError(null)
    setPostEdit({
      ...postEdit,
      photoFile: file,
      photoPreview: URL.createObjectURL(file),
      removePhoto: false,
    })
  }

  const removeEditPhoto = () => {
    setPostActionError(null)
    setPostEdit({ ...postEdit, photoFile: null, photoPreview: "", removePhoto: true })
  }

  const updatePost = async (post, method, body, replacementPhoto) => {
    setPendingPostId(post.id)
    setPostActionError(null)

    try {
      const payload = replacementPhoto
        ? { ...body, image_url: await uploadPostPhoto(replacementPhoto) }
        : body
      const data = await authFetch("/api/posts/" + post.id, { method, body: payload })

      if (method === "DELETE") {
        setPosts((previous) => previous.filter((item) => item.id !== post.id))
        setOpenComments((previous) => previous.filter((id) => id !== post.id))
      } else {
        setPosts((previous) => previous.map((item) =>
          item.id === post.id ? { ...item, body: data.post.body, image_url: data.post.image_url } : item
        ))
      }

      refreshTrending()
      setPostEdit((edit) => edit?.id === post.id ? null : edit)
    } catch (error) {
      setPostActionError({ id: post.id, message: error.message })
    } finally {
      setPendingPostId(null)
    }
  }

  const postEditImage = (post) =>
    postEdit.photoPreview || (!postEdit.removePhoto && limitedPhoto(post.image_url, 900))

  const savePostEdit = (event, post) => {
    event.preventDefault()
    const body = postEdit.body.trim()
    if (pendingPostId !== null || (!body && !postEditImage(post))) return
    updatePost(post, "PATCH", {
      body: body || null,
      image_url: postEdit.removePhoto ? null : undefined,
    }, postEdit.photoFile)
  }

  const deletePost = (event, post) => {
    event.currentTarget.closest("details").open = false
    if (pendingPostId !== null || !window.confirm("Delete this post and its comments?")) return
    updatePost(post, "DELETE")
  }

  //Page

  return (

    <div className="community-page">


      {/*\Community Header*/}

      <section className="community-banner">

        <div className="community-banner-content">

          <h1>DriveCare Community</h1>

          <p>
            A place for car enthusiasts to
            share experiences, ask questions,
            and help each other.
          </p>

        </div>

      </section>


      {/* Community Navigation*/}

      <div className="community-tabs" ref={feedRef}>

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
              <span className="community-explore-icon" aria-hidden="true">📋</span>
              All Posts
            </button>

            {TOPICS.map((topic) => (
              <button
                type="button"
                key={topic}
                className={activeTopic === topic ? "active" : ""}
                onClick={() => setActiveTopic(topic)}
              >
                <span className="community-explore-icon" aria-hidden="true">{TOPIC_ICONS[topic]}</span>
                {topic}
              </button>
            ))}

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

          ) : visiblePosts.length === 0 ? (

            <div className="community-empty">

              <h3>{showMyPosts ? "You have no posts here yet" : activeTopic ? `No ${activeTopic} posts yet` : "No posts yet"}</h3>

              <p>
                {showMyPosts ? "Your posts will appear here." : "Be the first person to start a discussion."}
              </p>

            </div>

          ) : (

            visiblePosts.map((post) => (

              <article
                key={post.id}
                className="community-post-card"
              >

                <div className="community-post-header">

                  <div className="community-post-author">
                    <div className="community-avatar" aria-hidden="true">{post.username?.charAt(0)?.toUpperCase() || "U"}</div>
                    <div className="community-post-byline">
                      <strong>{post.username || "DriveCare User"}</strong>
                      <time className="community-timestamp" dateTime={post.created_at || undefined}>
                        {formatRelativeAge(post.created_at, now)}
                      </time>
                    </div>
                  </div>


                  {post.vehicle_make && (

                    <span className="community-vehicle-tag">

                      {post.vehicle_year}{" "}
                      {post.vehicle_make}{" "}
                      {post.vehicle_model}

                    </span>

                  )}

                  {post.topic && <span className="community-post-topic">#{post.topic}</span>}

                  {viewerId != null && String(post.user_id) === String(viewerId) && (
                    <details className="community-post-menu">
                      <summary aria-label="Post options">⋯</summary>
                      <div className="community-post-menu-items">
                        <button type="button" disabled={pendingPostId !== null} onClick={(event) => startPostEdit(event, post)}>
                          Edit
                        </button>
                        <button type="button" disabled={pendingPostId !== null} onClick={(event) => deletePost(event, post)}>
                          Delete
                        </button>
                      </div>
                    </details>
                  )}

                </div>

                {postEdit?.id === post.id ? (
                  <form className="community-post-editor" onSubmit={(event) => savePostEdit(event, post)}>
                    <textarea
                      aria-label="Edit post text"
                      value={postEdit.body}
                      disabled={pendingPostId === post.id}
                      onChange={(event) => setPostEdit({ ...postEdit, body: event.target.value })}
                      rows={4}
                    />
                    {postEditImage(post) && (
                      <img src={postEditImage(post)} alt="Post photo preview" className="community-post-image" />
                    )}
                    <input
                      ref={editPhotoInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(event) => chooseEditPhoto(event, post.id)}
                    />
                    <div className="community-post-editor-photo-actions">
                      <button type="button" disabled={pendingPostId !== null} onClick={() => editPhotoInputRef.current?.click()}>
                        {postEditImage(post) ? "Replace Photo" : "Add Photo"}
                      </button>
                      {postEditImage(post) && (
                        <button type="button" disabled={pendingPostId !== null} onClick={removeEditPhoto} className="community-post-editor-remove-photo">
                          Remove Photo
                        </button>
                      )}
                    </div>
                    <div className="community-post-editor-actions">
                      <button type="button" disabled={pendingPostId === post.id} onClick={() => {
                        setPostEdit(null)
                        setPostActionError(null)
                      }}>
                        Cancel
                      </button>
                      <button type="submit" disabled={pendingPostId !== null || (!postEdit.body.trim() && !postEditImage(post))}>
                        {pendingPostId === post.id ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="community-post-text">{post.body}</p>
                )}

                {postActionError?.id === post.id && (
                  <p className="community-post-error" role="alert">{postActionError.message}</p>
                )}


                {postEdit?.id !== post.id && post.image_url && (

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


                  <button
                    type="button"
                    className={openComments.includes(post.id) ? "active" : ""}
                    onClick={() => toggleComments(post.id)}
                    aria-expanded={openComments.includes(post.id)}
                  >

                    💬 {post.comment_count || 0}

                  </button>

                </div>


                {/* Comments open under the post when the 💬 button is clicked */}
                {openComments.includes(post.id) && (
                  <PostComments
                    postId={post.id}
                    now={now}
                    onCountChange={(change) => changeCommentCount(post.id, change)}
                  />
                )}

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
                    <VehiclePhoto vehicle={vehicle} width={120} height={88} className="community-vehicle-photo" />
                    <div className="community-vehicle-details">

                      <strong>
                        {vehicle.year}{" "}
                        {vehicle.make}{" "}
                        {vehicle.model}
                      </strong>

                      {vehicle.trim && <span>{vehicle.trim}</span>}

                    </div>

                  </div>

                ))

            )}

          </div>


          {/*Trending Post*/}

          <div className="community-card">

            <h2>Trending Posts</h2>

            {trendingPreview?.posts.length > 0 ? (
              <>
                <ul className="community-trending-list">
                  {trendingPreview.posts.map((post) => (
                    <li key={post.id}>
                      <div className="community-trending-author">
                        {post.avatar_url ? (
                          <img className="community-avatar" src={post.avatar_url} alt="" loading="lazy" />
                        ) : (
                          <span className="community-avatar" aria-hidden="true">
                            {post.username?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        )}
                        <strong>{post.username || "DriveCare User"}</strong>
                      </div>
                      {post.body?.trim() && <p>{post.body.trim()}</p>}
                      {post.image_url && (
                        <img
                          className="community-trending-photo"
                          src={limitedPhoto(post.image_url, 480)}
                          alt={post.topic ? `Community post photo in ${post.topic}` : "Community post photo"}
                          loading="lazy"
                        />
                      )}
                      <small>{Number(post.like_count ?? 0)} likes · {Number(post.comment_count ?? 0)} comments</small>
                    </li>
                  ))}
                </ul>
                <button type="button" className="community-trending-link" onClick={openTrendingFeed}>
                  View trending feed
                </button>
              </>
            ) : (
              <p>{trendingPreview ? trendingPreview.error || "No posts yet." : "Loading trending posts…"}</p>
            )}

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