import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { formatSmartDate } from '../lib/dateUtils'

/* eslint-disable react-refresh/only-export-components */

export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    // Use recipient_id and is_read per new schema
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (!error && data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchNotifications()
    // Realtime subscription on notifications for this user
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, fetchNotifications])

  const markAsRead = async (notificationId) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchNotifications }
}

// NOTE: createNotification removed - DB triggers handle notification creation



export function NotificationCenter({ userId }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(userId)
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#4a4a58] hover:text-[#9898a8] hover:bg-[rgba(255,255,255,0.06)] rounded-xl transition-all duration-200"
      >
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[9px] font-semibold rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(99,102,241,0.5)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-[rgba(12,12,18,0.95)] backdrop-blur-2xl rounded-2xl border border-[rgba(255,255,255,0.08)] z-50 overflow-hidden shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366f1]/40 to-transparent" />

            <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-[#f0f0f5]">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-[11px] text-[#818cf8] hover:text-[#a78bfa] font-medium transition-colors">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-gradient-to-br from-[rgba(99,102,241,0.15)] to-[rgba(139,92,246,0.15)] flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#4a4a58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <p className="text-[12px] text-[#4a4a58]">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => {
                  // Link to bug if entity_type is 'bug'
                  const linkTo = notification.entity_type === 'bug' && notification.entity_id
                    ? `/bug/${notification.entity_id}`
                    : '#'
                  // Generate title from notification_type and metadata
                  const title = notification.metadata?.title || notification.notification_type?.replace(/_/g, ' ') || 'Notification'
                  const message = notification.metadata?.message || ''

                  return (
                    <Link
                      key={notification.id}
                      to={linkTo}
                      onClick={() => { markAsRead(notification.id); setIsOpen(false) }}
                      className={`flex gap-3 px-4 py-3 hover:bg-[rgba(99,102,241,0.05)] transition-all duration-200 ${!notification.is_read ? 'bg-[rgba(99,102,241,0.08)]' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!notification.is_read ? 'bg-[#6366f1] shadow-[0_0_6px_rgba(99,102,241,0.5)]' : 'bg-[#35354a]'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] truncate ${!notification.is_read ? 'text-[#f0f0f5] font-medium' : 'text-[#9898a8]'}`}>
                          {title}
                        </p>
                        {message && <p className="text-[11px] text-[#4a4a58] truncate mt-0.5">{message}</p>}
                        <p className="text-[10px] text-[#35354a] mt-1">{formatSmartDate(notification.created_at)}</p>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
