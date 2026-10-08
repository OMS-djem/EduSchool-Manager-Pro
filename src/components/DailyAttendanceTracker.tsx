import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  UserX,
  Users,
  Search,
  Save,
  CheckCheck,
  RefreshCw,
  Send,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  FileText
} from 'lucide-react';
import { Student, AttendanceRecord, ParentMonitoringItem } from '../types';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { MonthlyAttendanceReportModal } from './MonthlyAttendanceReportModal';

interface DailyAttendanceTrackerProps {
  initialClass?: string;
  onSelectStudent?: (student: Student) => void;
}

export const DailyAttendanceTracker: React.FC<DailyAttendanceTrackerProps> = ({
  initialClass = 'Terminale S1',
  onSelectStudent,
}) => {
  const {
    students,
    attendance,
    saveAttendance,
    saveStudent,
    saveParentMonitoring,
    academicYear,
    language
  } = useSchool();
  const { currentUser } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedClass, setSelectedClass] = useState<string>(initialClass);
  const [sessionPeriod, setSessionPeriod] = useState<'full_day' | 'morning' | 'afternoon'>('full_day');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);

  // Available classes
  const uniqueClasses = Array.from(new Set(students.map((s) => s.gradeClass)));

  // Target class students
  const classStudents = students.filter(
    (s) => selectedClass === 'all' || s.gradeClass === selectedClass
  );

  const filteredStudents = classStudents.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matricule.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Local attendance state for current date & class
  // key: studentId -> { status, reason }
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceRecord['status']; reason: string }>
  >({});

  // Sync attendanceMap from saved attendance records for this date
  useEffect(() => {
    const map: Record<string, { status: AttendanceRecord['status']; reason: string }> = {};
    const dateRecords = attendance.filter((a) => a.date === selectedDate);

    classStudents.forEach((stu) => {
      const found = dateRecords.find((r) => r.studentId === stu.id);
      if (found) {
        map[stu.id] = {
          status: found.status,
          reason: found.reason || '',
        };
      } else {
        // Default to present for smooth teacher roll-call
        map[stu.id] = {
          status: 'present',
          reason: '',
        };
      }
    });

    setAttendanceMap(map);
    setIsSaved(false);
  }, [selectedDate, selectedClass, attendance]);

  // Handle single student status change
  const handleStatusChange = (
    studentId: string,
    newStatus: AttendanceRecord['status']
  ) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
      },
    }));
    setIsSaved(false);
  };

  // Handle single student reason change
  const handleReasonChange = (studentId: string, newReason: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason: newReason,
      },
    }));
    setIsSaved(false);
  };

  // Bulk: Mark all present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceRecord['status']; reason: string }> = {};
    classStudents.forEach((s) => {
      updated[s.id] = {
        status: 'present',
        reason: '',
      };
    });
    setAttendanceMap(updated);
    setIsSaved(false);
  };

  // Date navigation
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Sound chime
  const playSaveChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio fallback
    }
  };

  // Save the entire roll call sheet
  const handleSaveSheet = async () => {
    setIsSaving(true);

    for (const stu of classStudents) {
      const item = attendanceMap[stu.id] || { status: 'present', reason: '' };
      const existing = attendance.find(
        (a) => a.studentId === stu.id && a.date === selectedDate
      );

      const record: AttendanceRecord = {
        id: existing?.id || `att-${stu.id}-${selectedDate}`,
        studentId: stu.id,
        studentName: stu.name,
        gradeClass: stu.gradeClass,
        schoolLevel: stu.schoolLevel,
        date: selectedDate,
        status: item.status,
        reason: item.reason,
        recordedBy: currentUser?.name || 'Professeur Principal',
      };

      await saveAttendance(record);

      // If absent or late, auto-notify parent monitoring note
      if (item.status.includes('absent') || item.status === 'late') {
        const title =
          item.status === 'late'
            ? `Retard signalé : ${selectedDate}`
            : item.status === 'absent_justified'
            ? `Absence justifiée enregistrée : ${selectedDate}`
            : `Absence non justifiée constatée : ${selectedDate}`;

        const desc = item.reason
          ? `Motif consigné : ${item.reason}.`
          : `Pointage effectué par la vie scolaire. Merci de contacter l'établissement.`;

        await saveParentMonitoring({
          id: `mon-att-${stu.id}-${selectedDate}`,
          studentId: stu.id,
          studentName: stu.name,
          parentId: stu.parentEmail || 'parent@eduschool.org',
          date: selectedDate,
          type: item.status === 'late' ? 'conduct' : 'alert',
          title,
          description: desc,
          author: currentUser?.name || 'Vie Scolaire & Enseignants',
          acknowledgedByParent: false,
        });
      }
    }

    setIsSaving(false);
    setIsSaved(true);
    playSaveChime();
  };

  // Statistics calculation for the day
  const totalInClass = classStudents.length;
  const countPresent = Object.values(attendanceMap).filter((v) => v.status === 'present').length;
  const countLate = Object.values(attendanceMap).filter((v) => v.status === 'late').length;
  const countAbsentJustified = Object.values(attendanceMap).filter(
    (v) => v.status === 'absent_justified'
  ).length;
  const countAbsentUnjustified = Object.values(attendanceMap).filter(
    (v) => v.status === 'absent_unjustified'
  ).length;
  const countAbsents = countAbsentJustified + countAbsentUnjustified;

  const pctPresent = totalInClass > 0 ? Math.round((countPresent / totalInClass) * 100) : 100;
  const pctLate = totalInClass > 0 ? Math.round((countLate / totalInClass) * 100) : 0;
  const pctAbsent = totalInClass > 0 ? Math.round((countAbsents / totalInClass) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Top Controls Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Class & Date Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Classe de Référence :
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
            >
              {uniqueClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls} ({students.filter((s) => s.gradeClass === cls).length} élèves)
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker with Prev / Next Buttons */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date d'Appel :
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleShiftDate(-1)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="Jour précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              />

              <button
                onClick={() => handleShiftDate(1)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="Jour suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSelectedDate(todayStr)}
                className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[11px] font-bold transition-colors ml-1"
              >
                Aujourd'hui
              </button>
            </div>
          </div>

          {/* Period selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Période :
            </label>
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setSessionPeriod('full_day')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  sessionPeriod === 'full_day'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Journée
              </button>
              <button
                onClick={() => setSessionPeriod('morning')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  sessionPeriod === 'morning'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Matin
              </button>
              <button
                onClick={() => setSessionPeriod('afternoon')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  sessionPeriod === 'afternoon'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Après-midi
              </button>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Passer tous les élèves de la classe en statut Présent"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Tous Présents</span>
          </button>

          <button
            onClick={() => setIsMonthlyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Générer les synthèses et rapports mensuels imprimables"
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Bilan Mensuel (A4)</span>
          </button>

          <button
            onClick={handleSaveSheet}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Enregistrement...' : isSaved ? 'Appel Enregistré ✓' : 'Valider l\'Appel'}</span>
          </button>
        </div>
      </div>

      {/* Real-Time Daily Attendance KPI Barometer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Effectif Classe</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalInClass}</div>
            <span className="text-[10px] text-slate-500">Élèves inscrits</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Présents</span>
            <div className="text-2xl font-black text-emerald-950 mt-0.5">
              {countPresent} <span className="text-xs font-bold text-emerald-700">({pctPresent}%)</span>
            </div>
            <span className="text-[10px] text-emerald-700">En classe aujourd'hui</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Retards</span>
            <div className="text-2xl font-black text-amber-950 mt-0.5">
              {countLate} <span className="text-xs font-bold text-amber-700">({pctLate}%)</span>
            </div>
            <span className="text-[10px] text-amber-700">Signalés en vie scolaire</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Absences</span>
            <div className="text-2xl font-black text-rose-950 mt-0.5">
              {countAbsents} <span className="text-xs font-bold text-rose-700">({pctAbsent}%)</span>
            </div>
            <span className="text-[10px] text-rose-700">
              {countAbsentJustified} justifiées • {countAbsentUnjustified} injustifiées
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Roll Call Student Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filter Subheader */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrer par nom ou matricule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 w-52 sm:w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <span>Pointage réglementaire :</span>
            <span className="font-bold text-slate-800">{classStudents.length} élèves appelés</span>
            {isSaved && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Synchronisé
              </span>
            )}
          </div>
        </div>

        {/* Attendance Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Élève & Matricule</th>
                <th className="py-3 px-3 text-center">Statut du Jour</th>
                <th className="py-3 px-4">Motif / Précision du Retard ou Absence</th>
                <th className="py-3 px-3 text-center">Assiduité Globale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((stu) => {
                const currentAtt = attendanceMap[stu.id] || { status: 'present', reason: '' };

                return (
                  <tr
                    key={stu.id}
                    className={`transition-colors ${
                      currentAtt.status === 'absent_unjustified'
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : currentAtt.status === 'absent_justified'
                        ? 'bg-blue-50/30 hover:bg-blue-50/60'
                        : currentAtt.status === 'late'
                        ? 'bg-amber-50/30 hover:bg-amber-50/60'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    {/* Student Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                          {stu.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <button
                            onClick={() => onSelectStudent && onSelectStudent(stu)}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left block"
                          >
                            {stu.name}
                          </button>
                          <span className="text-[11px] text-slate-400 font-mono">{stu.matricule}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status Toggle Buttons */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Present */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'present')}
                          className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                            currentAtt.status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          Présent
                        </button>

                        {/* Late / Tardy */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'late')}
                          className={`px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                            currentAtt.status === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          Retard
                        </button>

                        {/* Absent Justified */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'absent_justified')}
                          className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                            currentAtt.status === 'absent_justified'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          Abs. Justifiée
                        </button>

                        {/* Absent Unjustified */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(stu.id, 'absent_unjustified')}
                          className={`px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                            currentAtt.status === 'absent_unjustified'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          Abs. Injustifiée
                        </button>
                      </div>
                    </td>

                    {/* Reason input */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={currentAtt.reason}
                        onChange={(e) => handleReasonChange(stu.id, e.target.value)}
                        placeholder={
                          currentAtt.status === 'late'
                            ? 'ex: Retard 15 min (problème transport)'
                            : currentAtt.status === 'absent_justified'
                            ? 'ex: Certificat médical transmis'
                            : currentAtt.status === 'absent_unjustified'
                            ? 'ex: Sans nouvelle des parents'
                            : 'Remarque facultative...'
                        }
                        className={`w-full px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                          currentAtt.status !== 'present'
                            ? 'border-indigo-300 bg-white font-medium'
                            : 'border-slate-200 bg-slate-50/50 text-slate-500'
                        }`}
                      />
                    </td>

                    {/* Overall Student Attendance Rate */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-mono font-bold text-xs ${
                          stu.attendanceRate >= 95
                            ? 'text-emerald-700'
                            : stu.attendanceRate >= 85
                            ? 'text-indigo-700'
                            : 'text-amber-700'
                        }`}
                      >
                        {stu.attendanceRate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Attendance Report Modal */}
      {isMonthlyModalOpen && (
        <MonthlyAttendanceReportModal
          selectedClass={selectedClass}
          onClose={() => setIsMonthlyModalOpen(false)}
        />
      )}
    </div>
  );
};
