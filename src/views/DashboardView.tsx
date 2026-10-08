import React from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  Wallet,
  TrendingUp,
  Award,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CalendarCheck,
  Plus
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { NavTab } from '../components/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenAddStudent: () => void;
  onOpenAddPayment: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAddStudent,
  onOpenAddPayment
}) => {
  const {
    schoolLevel,
    language,
    students,
    teachers,
    staff,
    finances,
    exams,
    parentMonitoring,
    t
  } = useSchool();
  const { currentUser } = useAuth();

  // Filter items by schoolLevel
  const filteredStudents = schoolLevel === 'all'
    ? students
    : students.filter((s) => s.schoolLevel === schoolLevel);

  const filteredTeachers = schoolLevel === 'all'
    ? teachers
    : teachers.filter((t) => t.schoolLevel === 'all' || t.schoolLevel === schoolLevel);

  const filteredExams = schoolLevel === 'all'
    ? exams
    : exams.filter((e) => e.schoolLevel === schoolLevel);

  // Financial metrics
  const totalTuitionDue = filteredStudents.reduce((acc, s) => acc + (s.totalTuition || 0), 0);
  const totalTuitionPaid = filteredStudents.reduce((acc, s) => acc + (s.paidTuition || 0), 0);
  const recoveryRate = totalTuitionDue > 0 ? Math.round((totalTuitionPaid / totalTuitionDue) * 100) : 85;

  // Level breakdowns
  const primaryCount = students.filter(s => s.schoolLevel === 'primary').length;
  const middleCount = students.filter(s => s.schoolLevel === 'middle').length;
  const highCount = students.filter(s => s.schoolLevel === 'high').length;

  const avgAttendance = filteredStudents.length > 0
    ? Math.round(filteredStudents.reduce((acc, s) => acc + (s.attendanceRate || 95), 0) / filteredStudents.length)
    : 95;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white border border-slate-800 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {schoolLevel === 'all'
                ? (language === 'fr' ? 'Vue Globale Établissement' : 'Global Institution View')
                : (language === 'fr' ? `Niveau Actif : ${schoolLevel.toUpperCase()}` : `Active Level: ${schoolLevel.toUpperCase()}`)}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {language === 'fr' ? `Bonjour, ${currentUser.name}` : `Welcome back, ${currentUser.name}`}
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {language === 'fr'
                ? 'Supervision en temps réel des effectifs, corps professoral, flux financiers, examens et communication parents.'
                : 'Real-time overview of student enrollments, faculty workload, tuition cash flow, exam evaluations, and parent relations.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddStudent}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addStudent')}</span>
            </button>
            <button
              onClick={onOpenAddPayment}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>{t('recordPayment')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {t('totalStudents')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {filteredStudents.length}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span className="text-emerald-600 font-semibold">100%</span>
            <span>{language === 'fr' ? 'inscriptions actives' : 'active enrollments'}</span>
          </div>
        </div>

        {/* Teachers */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {t('teachersCount')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {filteredTeachers.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {language === 'fr' ? 'Spécialistes & Polyvalents' : 'Subject Specialists'}
          </div>
        </div>

        {/* Tuition Recovery Rate */}
        <div
          onClick={() => onNavigate('finances')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {t('collectedTuition')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {recoveryRate}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalTuitionPaid.toLocaleString()} € / {totalTuitionDue.toLocaleString()} €
          </div>
        </div>

        {/* Attendance Rate */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              {t('avgAttendance')}
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {avgAttendance}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {language === 'fr' ? 'Taux de présence régulier' : 'Average student presence'}
          </div>
        </div>
      </div>

      {/* School Level Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Primary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎒</span>
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'fr' ? 'École Primaire' : 'Primary School'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {primaryCount} élèves
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {language === 'fr'
              ? 'Classes : CP, CE1, CE2, CM1, CM2. Pédagogie active, éveil scientifique et lecture.'
              : 'Grades 1 to 5. Foundational literacy, mathematics and experiential discovery.'}
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full"
              style={{ width: `${(primaryCount / students.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Middle School */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📐</span>
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'fr' ? 'Collège' : 'Middle School'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {middleCount} élèves
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {language === 'fr'
              ? 'Classes : 6ème, 5ème, 4ème, 3ème. Préparation au Brevet des Collèges et langues vivantes.'
              : 'Grades 6 to 9. Brevet preparation, science laboratories, and foreign languages.'}
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${(middleCount / students.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* High School */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎓</span>
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'fr' ? 'Lycée' : 'High School'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              {highCount} élèves
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {language === 'fr'
              ? 'Classes : 2nde, 1ère, Terminale. Filières Scientifique, Littéraire, Économique & Baccalauréat.'
              : 'Grades 10 to 12. Baccalaureate excellence, scientific and humanities specializations.'}
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full"
              style={{ width: `${(highCount / students.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Parent Alerts & Quick Action Launcher */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parent Alerts & Communications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'fr' ? 'Dernières Notifications & Suivi Parental' : 'Recent Parental Alerts & Notes'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('parentMonitoring')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {language === 'fr' ? 'Tout voir →' : 'View all →'}
            </button>
          </div>

          <div className="space-y-3">
            {parentMonitoring.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-xs text-slate-900">
                    {item.title}
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{item.date}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500">Élève : <strong className="text-slate-700">{item.studentName}</strong></span>
                  <span className="text-indigo-600 font-medium">{item.author}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Exams & Trimester Highlights */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'fr' ? 'Examens & Compositions Prévus' : 'Scheduled Exams & Assessments'}
              </h3>
            </div>
            <button
              onClick={() => onNavigate('exams')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              {language === 'fr' ? 'Gérer les notes →' : 'Manage grades →'}
            </button>
          </div>

          <div className="space-y-3">
            {filteredExams.map((exam) => (
              <div
                key={exam.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-xs text-slate-900">
                    {exam.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Classe : <strong className="text-slate-700">{exam.gradeClass}</strong> • Coeff: {exam.coefficient} • Date : {exam.examDate}
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    exam.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {exam.status === 'published' ? 'Publié' : 'En correction'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
