import { useEffect, useState } from "react"
import { authFetch, getTokenPayload } from "../auth.js"

// Comments under one community post: loads them when opened, lets the user add a comment and delete their own.
// onCountChange(+1 / -1) lets the post card keep its 💬 count in step

const formatDate = (timestamp) =>
  new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

function PostComments({ postId, onCountChange }) {

  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  // Who is logged in, so their own comments get a Delete button
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


  const deleteComment = async (commentId) => {

    if (!window.confirm("Delete this comment?")) return

    try {

      await authFetch(`/api/comments/${commentId}`, { method: "DELETE" })
      setComments((previous) => previous.filter((comment) => comment.id !== commentId))
      onCountChange?.(-1)

    } catch (err) {

      setError(`Could not delete comment: ${err.message}`)
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
                <span>{formatDate(comment.created_at)}</span>

                {comment.user_id === myId && (
                  <button type="button" onClick={() => deleteComment(comment.id)}>
                    Delete
                  </button>
                )}
              </div>

              <p>{comment.body}</p>

            </div>

          </div>

        ))

      )}


      {error && <p className="community-comments-error">{error}</p>}


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

export default PostComments
