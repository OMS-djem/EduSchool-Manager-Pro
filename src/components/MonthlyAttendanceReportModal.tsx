import React, { useState } from 'react';
import {
  Printer,
  Download,
  X,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserX,
  FileText,
  Building,
  School,
  TrendingUp,
  Award,
  Filter
} from 'lucide-react';
import { Student, AttendanceRecord } from '../types';
import { useSchool } from '../context/SchoolContext';

interface MonthlyAttendanceReportModalProps {
  selectedClass?: string;
  onClose: () => void;
}

export const MonthlyAttendanceReportModal: React.FC<MonthlyAttendanceReportModalProps> = ({
  selectedClass = 'all',
  onClose,
}) => {
  const { students, attendance, academicYear, language } = useSchool();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-11
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [filterClass, setFilterClass] = useState<string>(selectedClass);

  const monthsList = [
    { value: 0, label: 'Janvier' },
    { value: 1, label: 'Février' },
    { value: 2, label: 'Mars' },
    { value: 3, label: 'Avril' },
    { value: 4, label: 'Mai' },
    { value: 5, label: 'Juin' },
    { value: 6, label: 'Juillet' },
    { value: 7, label: 'Août' },
    { value: 8, label: 'Septembre' },
    { value: 9, label: 'Octobre' },
    { value: 10, label: 'Novembre' },
    { value: 11, label: 'Décembre' },
  ];

  const uniqueClasses = Array.from(new Set(students.map((s) => s.gradeClass)));

  // Target students
  const filteredStudents = students.filter(
    (s) => filterClass === 'all' || s.gradeClass === filterClass
  );

  // Month label
  const monthName = monthsList.find((m) => m.value === selectedMonth)?.label || 'Mois';

  // Compute stats for each student in the given month/year
  // Month string prefix: YYYY-MM
  const monthPrefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

  // Count total school days recorded or default to 22 working days in a standard school month
  const monthAttendanceRecords = attendance.filter((a) => a.date.startsWith(monthPrefix));
  const distinctDaysInRecords = Array.from(new Set(monthAttendanceRecords.map((a) => a.date))).length;
  const workingDaysCount = Math.max(18, distinctDaysInRecords || 20);

  const studentsMonthlyMetrics = filteredStudents.map((stu) => {
    const stuRecords = monthAttendanceRecords.filter((a) => a.studentId === stu.id);
    const presents = stuRecords.filter((a) => a.status === 'present').length;
    const lates = stuRecords.filter((a) => a.status === 'late').length;
    const absentJustified = stuRecords.filter((a) => a.status === 'absent_justified').length;
    const absentUnjustified = stuRecords.filter((a) => a.status === 'absent_unjustified').length;
    const totalAbsents = absentJustified + absentUnjustified;

    // Computed monthly attendance rate: (presents + (workingDays - stuRecords.length) - absences)
    // If not all days recorded, factor the overall student base attendance rate
    const estimatedPresents = stuRecords.length > 0
      ? Math.max(0, workingDaysCount - totalAbsents)
      : Math.round((stu.attendanceRate / 100) * workingDaysCount);

    const monthlyRate = Math.min(
      100,
      Math.max(
        0,
        Math.round(((workingDaysCount - totalAbsents - lates * 0.25) / workingDaysCount) * 100)
      )
    );

    let statusLabel = 'Exemplaire';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (monthlyRate < 75) {
      statusLabel = 'Alerte Décrochage';
      statusColor = 'text-rose-700 bg-rose-50 border-rose-200';
    } else if (monthlyRate < 85) {
      statusLabel = 'Vigilance Absences';
      statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (monthlyRate < 95) {
      statusLabel = 'Assiduité Régulière';
      statusColor = 'text-blue-700 bg-blue-50 border-blue-200';
    }

    return {
      student: stu,
      presents: estimatedPresents,
      lates,
      absentJustified,
      absentUnjustified,
      totalAbsents,
      monthlyRate,
      statusLabel,
      statusColor,
    };
  });

  // Global class stats
  const totalStudents = studentsMonthlyMetrics.length;
  const avgClassRate =
    totalStudents > 0
      ? Math.round(
          studentsMonthlyMetrics.reduce((acc, s) => acc + s.monthlyRate, 0) / totalStudents
        )
      : 95;
  const totalClassAbsences = studentsMonthlyMetrics.reduce(
    (acc, s) => acc + s.totalAbsents,
    0
  );
  const totalClassLates = studentsMonthlyMetrics.reduce((acc, s) => acc + s.lates, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Matricule',
      'Nom de l Élève',
      'Classe',
      'Jours Présents',
      'Retards',
      'Absences Justifiées',
      'Absences Injustifiées',
      'Total Absences',
      'Taux Assiduité (%)',
      'Statut Mensuel'
    ];

    const rows = studentsMonthlyMetrics.map((item) => [
      `"${item.student.matricule}"`,
      `"${item.student.name}"`,
      `"${item.student.gradeClass}"`,
      item.presents,
      item.lates,
      item.absentJustified,
      item.absentUnjustified,
      item.totalAbsents,
      `${item.monthlyRate}%`,
      `"${item.statusLabel}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bilan_assiduite_${filterClass}_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print-modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col my-4 max-h-[92vh] print-document-container">
        {/* Modal Top Control Bar (hidden during print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 no-print border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Calendar className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white">
                Rapport Mensuel d'Assiduité & Fréquentation Scolaire
              </h3>
              <p className="text-[11px] text-slate-400">
                Synthèse statistique officielle des présences, retards et motifs d'absence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              title="Exporter les données au format CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Rapport (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls (Month, Year, Class) - hidden in print */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600">Mois :</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
              >
                {monthsList.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600">Année :</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-600">Classe :</span>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
              >
                <option value="all">Toutes les Classes ({students.length} élèves)</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Jours ouvrés comptabilisés : <strong className="text-slate-800">{workingDaysCount} jours</strong>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 font-sans text-slate-900 bg-white overflow-y-auto flex-1 space-y-6">
          {/* Official School Header */}
          <div className="pb-4 border-b-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <School className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  EduSchool International
                </h1>
                <p className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">
                  Service de la Vie Scolaire & Direction des Études
                </p>
                <p className="text-[10px] text-slate-500">
                  Relevé d'Assiduité Mensuelle • Année Académique {academicYear}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800 border border-slate-300">
                {monthName.toUpperCase()} {selectedYear}
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                Division : <strong>{filterClass === 'all' ? 'Toutes Divisions' : filterClass}</strong>
              </span>
            </div>
          </div>

          {/* Monthly KPI Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 page-break-avoid">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Effectif Contrôlé</span>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{totalStudents}</div>
              <span className="text-[10px] text-slate-500">Élèves enregistrés</span>
            </div>

            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Assiduité Moyenne</span>
              <div className="text-2xl font-black text-emerald-900 mt-0.5">{avgClassRate}%</div>
              <span className="text-[10px] text-emerald-700">Taux de présence global</span>
            </div>

            <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Retards Cumulés</span>
              <div className="text-2xl font-black text-amber-900 mt-0.5">{totalClassLates}</div>
              <span className="text-[10px] text-amber-700">Incidents de ponctualité</span>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Absences Totales</span>
              <div className="text-2xl font-black text-rose-900 mt-0.5">{totalClassAbsences}</div>
              <span className="text-[10px] text-rose-700">Journées / demi-journées</span>
            </div>
          </div>

          {/* Detailed Monthly Roster Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden page-break-avoid">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Registre Nominatif d'Assiduité ({monthName} {selectedYear})</span>
              </h3>
              <span className="text-[10px] font-semibold text-slate-500">
                Base réglementaire : {workingDaysCount} journées d'enseignement
              </span>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Matricule</th>
                  <th className="py-2.5 px-3">Nom & Prénom de l'Élève</th>
                  <th className="py-2.5 px-2 text-center">Classe</th>
                  <th className="py-2.5 px-2 text-center text-emerald-700">Présences</th>
                  <th className="py-2.5 px-2 text-center text-amber-700">Retards</th>
                  <th className="py-2.5 px-2 text-center text-blue-700">Abs. Justifiées</th>
                  <th className="py-2.5 px-2 text-center text-rose-700">Abs. Injustifiées</th>
                  <th className="py-2.5 px-3 text-center font-bold">Taux Mensuel</th>
                  <th className="py-2.5 px-3">Statut Vie Scolaire</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentsMonthlyMetrics.map((item) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {item.student.matricule}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.student.name}</td>
                    <td className="py-2.5 px-2 text-center font-medium text-slate-600">
                      {item.student.gradeClass}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-emerald-700">
                      {item.presents} j
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-amber-700">
                      {item.lates > 0 ? item.lates : '-'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-blue-700">
                      {item.absentJustified > 0 ? item.absentJustified : '-'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono font-bold text-rose-700">
                      {item.absentUnjustified > 0 ? item.absentUnjustified : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {item.monthlyRate}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.statusColor}`}
                      >
                        {item.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legal Certification and Signatures */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs page-break-avoid">
            <div>
              <p className="font-bold text-slate-800 mb-12">Le Conseiller Principal d'Éducation</p>
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">Visa de contrôle</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-12">Le Professeur Principal</p>
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">Signature de validation</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-2">La Directrice des Études</p>
              <div className="inline-block px-3 py-1 border-2 border-indigo-800 text-indigo-900 rounded font-black text-[9px] uppercase tracking-wider mb-2 rotate-[-4deg]">
                Cachet Officiel Établissement
              </div>
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">Béatrice Fontaine • Proviseure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
