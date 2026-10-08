import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BookOpen,
  Wallet,
  AlertTriangle,
  Award,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Filter,
  Sparkles,
  Trash2,
  X,
  Volume2
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { NotificationAlert } from '../types';
import { NavTab } from './Sidebar';

interface NotificationBellProps {
  onNavigate?: (tab: NavTab) => void;
}

const STORAGE_KEY = 'eduschool_notifications_v1';

export const NotificationBell: React.FC<NotificationBellProps> = ({ onNavigate }) => {
  const { exams, finances, parentMonitoring, language } = useSchool();
  const { currentUser, currentRole } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'exam' | 'finance' | 'announcement'>('all');
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize or synchronize notifications based on live school data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
        return;
      } catch {
        // Fallback to generating fresh
      }
    }

    // Generate smart contextual alerts from real-time school entities
    const generated: NotificationAlert[] = [
      // 1. Upcoming Exams
      ...exams.slice(0, 3).map((ex, i) => ({
        id: `notif-exam-${ex.id}`,
        type: 'exam' as const,
        title: language === 'fr' ? `Épreuve à venir : ${ex.subject}` : `Upcoming Exam: ${ex.subject}`,
        message: `${ex.title} (${ex.gradeClass}) prévue le ${ex.examDate}. Coefficient ${ex.coefficient}.`,
        timestamp: 'Il y a 10 min',
        targetRole: 'teachers' as const,
        read: i > 0,
        priority: 'high' as const,
        relatedId: ex.id,
        navTab: 'exams' as const,
      })),

      // 2. Overdue or pending payment reminders
      ...finances
        .filter((f) => f.status === 'overdue' || (f.status === 'pending' && f.type === 'income'))
        .slice(0, 2)
        .map((f, i) => ({
          id: `notif-fin-${f.id}`,
          type: 'finance' as const,
          title: language === 'fr' ? `Rappel Écolage : ${f.studentName || 'Facture'}` : `Tuition Reminder: ${f.studentName || 'Invoice'}`,
          message: `Échéance de ${f.amount} € en attente de régularisation (${f.invoiceNumber}).`,
          timestamp: 'Aujourd’hui à 08:30',
          targetRole: 'parents' as const,
          read: false,
          priority: 'urgent' as const,
          relatedId: f.id,
          navTab: 'finances' as const,
        })),

      // 3. Parent Monitoring & School Announcements
      ...parentMonitoring.slice(0, 3).map((pm, i) => ({
        id: `notif-pm-${pm.id}`,
        type: 'announcement' as const,
        title: pm.title,
        message: `${pm.studentName} : ${pm.description.slice(0, 80)}...`,
        timestamp: pm.date,
        targetRole: 'all' as const,
        read: pm.acknowledgedByParent,
        priority: pm.type === 'alert' ? ('urgent' as const) : ('medium' as const),
        relatedId: pm.id,
        navTab: 'parentMonitoring' as const,
      }))
    ];

    setNotifications(generated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(generated));
  }, [exams, finances, parentMonitoring, language]);

  // Save changes to localStorage
  const updateNotifications = (newList: NotificationAlert[]) => {
    setNotifications(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    updateNotifications(updated);
  };

  const toggleReadStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: !n.read } : n
    );
    updateNotifications(updated);
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    updateNotifications(updated);
  };

  const handleNotificationClick = (item: NotificationAlert) => {
    // Mark as read
    const updated = notifications.map((n) =>
      n.id === item.id ? { ...n, read: true } : n
    );
    updateNotifications(updated);
    setIsOpen(false);

    // Navigate to target section if present
    if (item.navTab && onNavigate) {
      onNavigate(item.navTab);
    }
  };

  // Quick simulation trigger for testing
  const triggerSimulatedAlert = () => {
    const simTypes = [
      {
        type: 'exam' as const,
        title: language === 'fr' ? 'Nouveau Devoir Programmé' : 'New Exam Scheduled',
        message: 'Contrôle continu de Mathématiques fixé pour vendredi prochain en 3ème-A.',
        targetRole: 'teachers' as const,
        priority: 'high' as const,
        navTab: 'exams' as const,
      },
      {
        type: 'finance' as const,
        title: language === 'fr' ? 'Reçu de Paiement Émis' : 'Payment Receipt Issued',
        message: 'Paiement de 350 € pour la demi-pension validé et acquitté par l’intendance.',
        targetRole: 'parents' as const,
        priority: 'medium' as const,
        navTab: 'finances' as const,
      },
      {
        type: 'announcement' as const,
        title: language === 'fr' ? 'Avis de la Direction' : 'Principal Announcement',
        message: 'Rappel : Fermeture exceptionnelle du CDI ce jeudi après-midi pour inventaire.',
        targetRole: 'all' as const,
        priority: 'low' as const,
        navTab: 'parentMonitoring' as const,
      }
    ];

    const pick = simTypes[Math.floor(Math.random() * simTypes.length)];
    const newAlert: NotificationAlert = {
      id: `sim-${Date.now()}`,
      ...pick,
      timestamp: 'À l’instant',
      read: false,
    };

    updateNotifications([newAlert, ...notifications]);
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        title={language === 'fr' ? 'Alertes & Notifications' : 'Alerts & Notifications'}
      >
        <Bell className={`w-4 h-4 text-slate-200 transition-transform ${unreadCount > 0 ? 'animate-wiggle' : ''}`} />
        
        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-md border-2 border-slate-900">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-50 pointer-events-none"></span>
          </span>
        )}
      </button>

      {/* Dropdown Notification Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-200">
          {/* Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">
                  {language === 'fr' ? 'Centre de Notifications' : 'Notification Center'}
                </h3>
                <span className="text-[10px] text-slate-400">
                  {unreadCount} {language === 'fr' ? 'non lue(s)' : 'unread'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tout lire</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1 text-[11px] overflow-x-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {language === 'fr' ? 'Toutes' : 'All'} ({notifications.length})
            </button>
            <button
              onClick={() => setFilterType('exam')}
              className={`px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
                filterType === 'exam'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>{language === 'fr' ? 'Examens' : 'Exams'}</span>
            </button>
            <button
              onClick={() => setFilterType('finance')}
              className={`px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
                filterType === 'finance'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wallet className="w-3 h-3" />
              <span>{language === 'fr' ? 'Finances' : 'Payments'}</span>
            </button>
            <button
              onClick={() => setFilterType('announcement')}
              className={`px-2 py-0.5 rounded-lg font-medium flex items-center gap-1 transition-all ${
                filterType === 'announcement'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>{language === 'fr' ? 'Annonces' : 'Alerts'}</span>
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-800/60">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                <p className="font-semibold text-xs text-slate-300">
                  {language === 'fr' ? 'Aucune notification active' : 'No active notifications'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {language === 'fr' ? 'Vous êtes à jour dans vos suivis scolaires.' : 'You are all caught up.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-slate-800/80 transition-all cursor-pointer flex items-start gap-3 ${
                    !item.read ? 'bg-indigo-950/25 border-l-2 border-indigo-500' : 'opacity-85'
                  }`}
                >
                  {/* Category Icon */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                      item.type === 'exam'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : item.type === 'finance'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {item.type === 'exam' && <BookOpen className="w-4 h-4" />}
                    {item.type === 'finance' && <Wallet className="w-4 h-4" />}
                    {item.type === 'announcement' && <AlertTriangle className="w-4 h-4" />}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          !item.read ? 'font-bold text-white' : 'font-medium text-slate-300'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {item.timestamp}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold ${
                            item.priority === 'urgent'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : item.priority === 'high'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.priority === 'urgent' ? 'Urgent' : item.priority === 'high' ? 'Important' : 'Info'}
                        </span>

                        <span className="text-slate-500 capitalize">
                          {item.targetRole === 'parents' ? 'Pour Parents' : item.targetRole === 'teachers' ? 'Pour Enseignants' : 'Général'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => toggleReadStatus(item.id, e)}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700"
                          title={item.read ? 'Marquer comme non lu' : 'Marquer comme lu'}
                        >
                          {item.read ? <Check className="w-3 h-3 text-slate-500" /> : <CheckCheck className="w-3 h-3 text-indigo-400" />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => deleteNotification(item.id, e)}
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={triggerSimulatedAlert}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{language === 'fr' ? 'Simuler une alerte' : 'Simulate alert'}</span>
            </button>
            <button
              onClick={() => updateNotifications([])}
              className="hover:text-rose-400 transition-colors cursor-pointer"
            >
              {language === 'fr' ? 'Tout effacer' : 'Clear all'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
