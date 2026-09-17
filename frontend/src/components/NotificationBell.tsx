import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, AlertCircle, CheckCircle2, Clock, Info } from 'lucide-react';
import { api, InAppNotification } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    if (type.includes('COMPLETED') || type.includes('CONFIRMED') || type.includes('APPROVED')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
    }
    if (type.includes('REWORK') || type.includes('FLAGGED') || type.includes('FAILED')) {
      return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
    }
    if (type.includes('PROGRESS') || type.includes('STARTED') || type.includes('VERIFIED')) {
      return <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
    }
    return <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow flex items-center justify-center"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4 text-amber-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0b1f33] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden text-xs">
          {/* Header */}
          <div className="px-4 py-3 bg-[#081726] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Body */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                <p>No notifications at this time.</p>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={(e) => !item.is_read && handleMarkAsRead(item.id, e)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                    item.is_read ? 'bg-transparent hover:bg-white/5 opacity-80' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {getNotificationIcon(item.notification_type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h4 className={`font-semibold truncate ${item.is_read ? 'text-slate-300' : 'text-white'}`}>
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Unread" />
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5 break-words">
                      {item.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{formatTimestamp(item.created_at)}</span>
                      {item.reference_id && (
                        <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-slate-300">
                          {item.reference_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
