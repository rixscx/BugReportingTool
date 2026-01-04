import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function CommentSection({ bugId, session, bugReporterId, bugReporterName, bugReporterEmail }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editText, setEditText] = useState('')
  const [commentActionId, setCommentActionId] = useState(null)

  const fetchComments = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select(`*`)
        .eq('bug_id', bugId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      const commentsData = data || []

      const userIds = Array.from(new Set(commentsData.map(c => c.user_id).filter(Boolean)))
      let profilesMap = {}
      const tasks = []

      if (userIds.length > 0) {
        tasks.push(supabase
          .from('profiles')
          .select('id, username, email, full_name')
          .in('id', userIds)
          .then(({ data }) => ({ type: 'profiles', data }))
        )
      }

      tasks.push(supabase
        .from('bug_activity')
        .select('user_id, actor_email, actor_id')
        .eq('bug_id', bugId)
        .eq('action', 'comment_created')
        .then(({ data }) => ({ type: 'activity', data }))
      )

      const results = await Promise.all(tasks)
      const profilesData = results.find(r => r.type === 'profiles')?.data || []
      const activityData = results.find(r => r.type === 'activity')?.data || []

      profilesMap = profilesData.reduce((acc, p) => {
        acc[p.id] = p
        return acc
      }, {})

      const activityMap = activityData.reduce((acc, a) => {
        const uid = a.user_id || a.actor_id
        if (uid && a.actor_email) {
          acc[uid] = { email: a.actor_email, username: a.actor_email.split('@')[0] }
        }
        return acc
      }, {})

      const enriched = commentsData.map(c => {
        let user = profilesMap[c.user_id]
        if (!user && c.user_id === bugReporterId && bugReporterName) {
          user = { id: c.user_id, username: bugReporterName, email: bugReporterEmail, full_name: bugReporterName }
        }
        if (!user && activityMap[c.user_id]) {
          user = { id: c.user_id, username: activityMap[c.user_id].username, email: activityMap[c.user_id].email }
        }
        return { ...c, user }
      })

      setComments(enriched)
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `bug_id=eq.${bugId}` }, async () => {
        await fetchComments()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [bugId, fetchComments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    setError(null)

    try {
      const { data: inserted, error: insertError } = await supabase
        .from('comments')
        .insert({ bug_id: bugId, user_id: session.user.id, content: newComment.trim() })
        .select(`*`)
        .single()

      if (insertError) throw insertError

      if (inserted) {
        const { data: [profile] = [] } = await supabase.from('profiles').select('id, username, email, full_name').eq('id', session.user.id)
        const enriched = { ...inserted, user: profile || null }
        setComments((prev) => [...prev, enriched])
        setNewComment('')
        await supabase.from('bug_activity').insert({
          bug_id: bugId, user_id: session.user.id, actor_id: session.user.id, actor_email: session.user.email, action: 'comment_created', metadata: { comment_id: inserted.id }
        })
      }
    } catch (err) {
      setError('Failed to post comment: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (comment) => {
    if (comment.user_id !== session.user.id) return
    if (!window.confirm('Delete this comment?')) return
    setCommentActionId(comment.id)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('comments').delete().eq('id', comment.id)
      if (deleteError) throw deleteError
      setComments((prev) => prev.filter((c) => c.id !== comment.id))
      await supabase.from('bug_activity').insert({
        bug_id: bugId, user_id: session.user.id, actor_id: session.user.id, actor_email: session.user.email, action: 'comment_deleted', metadata: { comment_id: comment.id }
      })
    } catch (err) {
      setError('Failed to delete comment: ' + err.message)
    } finally {
      setCommentActionId(null)
    }
  }

  const startEditing = (comment) => { setEditingCommentId(comment.id); setEditText(comment.content) }
  const cancelEditing = () => { setEditingCommentId(null); setEditText('') }

  const handleUpdate = async (comment) => {
    if (!editText.trim()) return
    setCommentActionId(comment.id)
    setError(null)
    try {
      const { error: updateError } = await supabase.from('comments').update({ content: editText.trim() }).eq('id', comment.id)
      if (updateError) throw updateError
      setComments((prev) => prev.map((c) => (c.id === comment.id ? { ...c, content: editText.trim() } : c)))
      setEditingCommentId(null)
      setEditText('')
      await supabase.from('bug_activity').insert({
        bug_id: bugId, user_id: session.user.id, actor_id: session.user.id, actor_email: session.user.email, action: 'comment_updated', metadata: { comment_id: comment.id }
      })
    } catch (err) {
      setError('Failed to update comment: ' + err.message)
    } finally {
      setCommentActionId(null)
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="relative bg-[rgba(12,12,18,0.7)] rounded-2xl border border-[rgba(255,255,255,0.06)] p-6 backdrop-blur-xl">
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent" />
      
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm font-medium text-[#f0f0f5]">Comments</span>
        {comments.length > 0 && (
          <span className="text-[10px] text-[#4a4a58] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </div>

      {error && (
        <div className="text-[12px] text-[#f87171] mb-4 px-3 py-2 bg-[rgba(239,68,68,0.1)] rounded-xl border border-[rgba(239,68,68,0.2)]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-[12px] text-[#4a4a58] py-8 text-center">Loading...</div>
      ) : comments.length === 0 ? (
        <div className="text-[12px] text-[#4a4a58] py-8 text-center mb-4">No comments yet</div>
      ) : (
        <div className="space-y-4 mb-5">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[rgba(99,102,241,0.15)] to-[rgba(139,92,246,0.15)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center text-[10px] text-[#818cf8] font-medium flex-shrink-0">
                {(comment.user?.username || comment.user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-[12px] font-medium text-[#f0f0f5]">
                    {comment.user?.username || comment.user?.email?.split('@')[0] || 'Unknown'}
                  </span>
                  <span className="text-[10px] text-[#4a4a58]">{formatTime(comment.created_at)}</span>
                  {comment.user_id === session?.user?.id && (
                    <div className="ml-auto flex items-center gap-3">
                      <button onClick={() => startEditing(comment)} disabled={commentActionId === comment.id} className="text-[10px] text-[#4a4a58] hover:text-[#9898a8] disabled:opacity-50 transition-colors">
                        edit
                      </button>
                      <button onClick={() => handleDelete(comment)} disabled={commentActionId === comment.id} className="text-[10px] text-[#4a4a58] hover:text-[#f87171] disabled:opacity-50 transition-colors">
                        delete
                      </button>
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div className="space-y-2.5">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2.5 bg-[#0a0a0f] border border-[rgba(255,255,255,0.06)] rounded-xl text-[12px] text-[#f0f0f5] focus:outline-none focus:border-[rgba(99,102,241,0.5)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] resize-none transition-all duration-200"
                      disabled={commentActionId === comment.id}
                    />
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleUpdate(comment)} disabled={commentActionId === comment.id || !editText.trim()} className="text-[11px] text-[#6366f1] hover:text-[#818cf8] disabled:opacity-50 font-medium transition-colors">
                        Save
                      </button>
                      <button onClick={cancelEditing} disabled={commentActionId === comment.id} className="text-[11px] text-[#4a4a58] hover:text-[#6b6b7b] transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-[#9898a8] whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-[rgba(255,255,255,0.06)] pt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          disabled={submitting}
          className="w-full px-4 py-3 bg-[#0a0a0f] border border-[rgba(255,255,255,0.06)] rounded-xl text-[12px] text-[#f0f0f5] placeholder-[#4a4a58] focus:outline-none focus:border-[rgba(99,102,241,0.5)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] mb-3 disabled:opacity-50 resize-none transition-all duration-200"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="relative bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white px-4 py-2 rounded-xl text-[11px] font-medium hover:shadow-[0_4px_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#818cf8] to-[#a78bfa] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative">{submitting ? 'Posting...' : 'Comment'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
