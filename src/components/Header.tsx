import React, { useState } from 'react';
import {
  GraduationCap,
  Globe,
  UserCheck,
  ChevronDown,
  Sparkles,
  School,
  LogOut,
  Calendar,
  Layers
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth, DEMO_PROFILES } from '../context/AuthContext';
import { SchoolLevel, UserRole } from '../types';
import { GlobalSearch } from './GlobalSearch';
import { NotificationBell } from './NotificationBell';
import { NavTab } from './Sidebar';

interface HeaderProps {
  onNavigate?: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const {
    schoolLevel,
    setSchoolLevel,
    language,
    setLanguage,
    academicYear,
    setAcademicYear,
    selectedTerm,
    setSelectedTerm,
    t
  } = useSchool();

  const { currentUser, switchRole, firebaseUser, loginWithGoogle, logout } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const levels: { id: SchoolLevel; labelFr: string; labelEn: string; icon: string }[] = [
    { id: 'all', labelFr: 'Tous Niveaux', labelEn: 'All Levels', icon: '🏫' },
    { id: 'primary', labelFr: 'Primaire', labelEn: 'Primary', icon: '🎒' },
    { id: 'middle', labelFr: 'Collège', labelEn: 'Middle', icon: '📐' },
    { id: 'high', labelFr: 'Lycée', labelEn: 'High School', icon: '🎓' },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  EduSchool Manager
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'fr'
                  ? 'Gestion Intégrée : Primaire • Collège • Lycée'
                  : 'Integrated Suite: Primary • Middle • High School'}
              </p>
            </div>
          </div>

          {/* Global Search Bar (Students, Teachers, Staff by Name or ID) */}
          <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md">
            <GlobalSearch onNavigate={onNavigate} />
          </div>

          {/* School Level Filter Bar */}
          <div className="hidden xl:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 shadow-inner shrink-0">
            {levels.map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setSchoolLevel(lvl.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  schoolLevel === lvl.id
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>{lvl.icon}</span>
                <span>{language === 'fr' ? lvl.labelFr : lvl.labelEn}</span>
              </button>
            ))}
          </div>

          {/* Controls: Term, Language, Demo Role Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Term selector */}
            <div className="hidden lg:flex items-center gap-1 text-xs bg-slate-800 text-slate-300 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <select
                aria-label={t('termLabel')}
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value as any)}
                className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="Trimestre 1" className="bg-slate-800 text-white">Trimestre 1 (T1)</option>
                <option value="Trimestre 2" className="bg-slate-800 text-white">Trimestre 2 (T2)</option>
                <option value="Trimestre 3" className="bg-slate-800 text-white">Trimestre 3 (T3)</option>
              </select>
            </div>

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Changer de langue / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell onNavigate={onNavigate} />

            {/* Role Switcher Pill & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-all text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-indigo-400/50"
                />
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-white leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 leading-tight">
                    {language === 'fr' ? currentUser.roleLabelFr : currentUser.roleLabelEn}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {language === 'fr' ? 'Simulateur de Rôles' : 'Role Simulator'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {language === 'fr'
                        ? 'Testez la vue adaptée à chaque profil scolaire :'
                        : 'Experience view tailored for each school role:'}
                    </p>
                  </div>

                  <div className="py-1 space-y-1">
                    {DEMO_PROFILES.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => {
                          switchRole(profile.role);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                          currentUser.role === profile.role
                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate text-white">{profile.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {language === 'fr' ? profile.roleLabelFr : profile.roleLabelEn}
                          </p>
                        </div>
                        {currentUser.role === profile.role && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Google Login Option */}
                  <div className="pt-2 border-t border-slate-800">
                    {!firebaseUser ? (
                      <button
                        onClick={async () => {
                          setShowRoleDropdown(false);
                          await loginWithGoogle();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{language === 'fr' ? 'Connexion Google Auth' : 'Sign in with Google'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          setShowRoleDropdown(false);
                          await logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 rounded-lg border border-rose-900/50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{language === 'fr' ? 'Déconnexion' : 'Sign Out'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Level Tabs */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800">
          {levels.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setSchoolLevel(lvl.id)}
              className={`flex items-center gap-1 whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium ${
                schoolLevel === lvl.id
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 bg-slate-800'
              }`}
            >
              <span>{lvl.icon}</span>
              <span>{language === 'fr' ? lvl.labelFr : lvl.labelEn}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
