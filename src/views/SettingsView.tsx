import React, { useState } from 'react';
import {
  Settings,
  Database,
  RotateCcw,
  CheckCircle2,
  Building,
  Calendar,
  Globe,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';

export const SettingsView: React.FC = () => {
  const {
    academicYear,
    setAcademicYear,
    language,
    setLanguage,
    resetData,
    t
  } = useSchool();

  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await resetData();
    setIsResetting(false);
    setResetSuccess(true);
    setTimeout(() => setResetSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          {language === 'fr' ? 'Configuration & Système de l’Établissement' : 'School Settings & System Config'}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {language === 'fr'
            ? 'Paramètres institutionnels, année scolaire active, barème de notation et synchronisation base de données.'
            : 'Institution configuration, academic period, grading criteria, and Firestore database management.'}
        </p>
      </div>

      <div className="space-y-5">
        {/* School Information Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'fr' ? 'Identité de l’Établissement Scolaire' : 'School Profile & Identification'}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Nom de l’Établissement</label>
              <input
                type="text"
                readOnly
                value="Groupe Scolaire International EduSchool"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Année Scolaire Active</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="2024 - 2025">2024 - 2025</option>
                <option value="2025 - 2026">2025 - 2026</option>
                <option value="2026 - 2027">2026 - 2027</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Cycles Pris en Charge</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium">
                Primaire (CP-CM2) • Collège (6ème-3ème) • Lycée (2nde-Tle)
              </div>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Langue de l’Interface</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage('fr')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                    language === 'fr'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Français (FR)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border ${
                    language === 'en'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  English (EN)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Database & Persistence Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              {language === 'fr' ? 'Base de Données & Synchronisation Cloud' : 'Cloud Database & Persistence'}
            </h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <div>
                  <span className="font-bold text-slate-900 block">Firestore Backend Database</span>
                  <span className="text-[11px] text-slate-500">
                    Collections : teachers, students, staff, finances, exams, grades, attendance, parentMonitoring, subjects, courseModules
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Connecté (Live)
              </span>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">
                  {language === 'fr' ? 'Réinitialiser avec le jeu de données d’exemple' : 'Reset to sample demonstration dataset'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {language === 'fr'
                    ? 'Recharge les effectifs, professeurs, bulletins et écritures comptables d’origine.'
                    : 'Re-populates all levels with clean demo teachers, students, report cards, and ledger.'}
                </span>
              </div>

              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'Réinitialisation...' : t('resetSeed')}</span>
              </button>
            </div>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Données d’exemple réinitialisées avec succès dans Firestore et en cache local !</span>
              </div>
            )}
          </div>
        </div>

        {/* Security & Access Overview */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h4 className="font-bold text-sm">Sécurité & Contrôle d'Accès par Rôles (RBAC)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            EduSchool Manager applique une séparation stricte des privilèges : les enseignants évaluent uniquement leurs classes, les parents n'accèdent qu'aux données de leurs enfants inscrits, l'intendant supervise la trésorerie et la direction dispose d'une vue consolidée d'ensemble.
          </p>
        </div>
      </div>
    </div>
  );
};
