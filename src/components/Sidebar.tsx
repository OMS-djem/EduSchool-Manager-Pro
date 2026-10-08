import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  WalletCards,
  FileCheck2,
  HeartHandshake,
  BookOpenCheck,
  Settings,
  ShieldAlert,
  HelpCircle,
  Library,
  MessageSquareQuote
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'teachers'
  | 'students'
  | 'staff'
  | 'finances'
  | 'exams'
  | 'parentMonitoring'
  | 'curriculum'
  | 'library'
  | 'feedback'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab }) => {
  const { language, t, teachers, students, staff, finances, exams, libraryMaterials, teacherFeedback } = useSchool();
  const { currentRole } = useAuth();

  const navItems: {
    id: NavTab;
    labelFr: string;
    labelEn: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      labelFr: 'Tableau de Bord',
      labelEn: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'teachers',
      labelFr: 'Enseignants',
      labelEn: 'Teachers',
      icon: <Users className="w-5 h-5" />,
      badge: teachers.length,
      badgeColor: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
    },
    {
      id: 'students',
      labelFr: 'Élèves & Classes',
      labelEn: 'Students & Classes',
      icon: <GraduationCap className="w-5 h-5" />,
      badge: students.length,
      badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
    },
    {
      id: 'staff',
      labelFr: 'Personnel & Admin',
      labelEn: 'Staff & Personnel',
      icon: <Briefcase className="w-5 h-5" />,
      badge: staff.length,
      badgeColor: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 'finances',
      labelFr: 'Finances & Écolage',
      labelEn: 'Finances & Tuition',
      icon: <WalletCards className="w-5 h-5" />,
      badge: '€',
      badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
    },
    {
      id: 'exams',
      labelFr: 'Examens & Bulletins',
      labelEn: 'Exams & Reports',
      icon: <FileCheck2 className="w-5 h-5" />,
      badge: exams.length,
      badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
    },
    {
      id: 'parentMonitoring',
      labelFr: 'Suivi Parental',
      labelEn: 'Parent Portal',
      icon: <HeartHandshake className="w-5 h-5" />,
      badge: currentRole === 'parent' ? '★ VIP' : undefined,
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
    },
    {
      id: 'curriculum',
      labelFr: 'Matières & Modules',
      labelEn: 'Subjects & Modules',
      icon: <BookOpenCheck className="w-5 h-5" />,
    },
    {
      id: 'library',
      labelFr: 'Bibliothèque Numérique',
      labelEn: 'Digital Library',
      icon: <Library className="w-5 h-5" />,
      badge: libraryMaterials.length,
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300',
    },
    {
      id: 'feedback',
      labelFr: 'Avis & Retours Élèves',
      labelEn: 'Student Feedback',
      icon: <MessageSquareQuote className="w-5 h-5" />,
      badge: teacherFeedback.length,
      badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300',
    },
    {
      id: 'settings',
      labelFr: 'Configuration & Info',
      labelEn: 'Settings & Data',
      icon: <Settings className="w-5 h-5" />,
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/95 text-slate-300 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language === 'fr' ? 'Navigation Principale' : 'Main Navigation'}
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={isActive ? 'text-white' : 'text-indigo-400'}>
                  {item.icon}
                </span>
                <span className="truncate">
                  {language === 'fr' ? item.labelFr : item.labelEn}
                </span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Institutional Info Card */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-semibold text-white">
            {language === 'fr' ? 'Système Opérationnel' : 'System Operational'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {language === 'fr'
            ? 'Primaire, Collège et Lycée synchronisés en temps réel via Firestore.'
            : 'Primary, Middle & High school live-synced via Firestore.'}
        </p>
      </div>
    </aside>
  );
};
