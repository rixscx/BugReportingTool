import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CommentSection({ bugId, session }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const fetchComments = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`
          *,
          user:profiles!user_id(username, email)
        `)
        .eq('bug_id', bugId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setComments(data || [])
    } catch {
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [bugId])

  useEffect(() => {
    fetchComments()
    const channel = supabase
      .channel(`comments-bug-${bugId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `bug_id=eq.${bugId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from('comments')
            .select(`
              *,
              user:profiles!user_id(username, email)
            `)
            .eq('id', payload.new.id)
            .single()

          if (data) {
            setComments((prev) => {
              if (prev.some((c) => c.id === data.id)) return prev
              return [...prev, data]
            })
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [bugId, fetchComments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({
          bug_id: bugId,
          user_id: session.user.id,
          content: newComment.trim(),
        })
        .select(`
          *,
          user:profiles!user_id(username, email)
        `)
        .single()

      if (insertError) throw insertError

      if (data) {
        setComments([...comments, data])
        setNewComment('')
        await supabase.from('bug_activity').insert({
          bug_id: bugId,
          user_id: session.user.id,
          action: 'comment_added',
        })
      }
    } catch (err) {
      setError('Failed to post comment: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">
        Comments {comments.length > 0 && <span className="text-slate-400 font-normal">({comments.length})</span>}
      </h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400 text-sm py-4">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-slate-400 text-sm py-4 mb-4">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="space-y-4 mb-6">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {(comment.user?.username || comment.user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-slate-800 text-sm">
                    {comment.user?.username || comment.user?.email || 'Unknown'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          disabled={submitting}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3 disabled:opacity-50 disabled:bg-slate-100 resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  )
}
