import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  FileText,
  Edit2,
  Trash2,
  X,
  Phone,
  Mail,
  User,
  Calendar,
  Wallet,
  CheckCircle,
  AlertCircle,
  QrCode,
  Printer,
  Users,
  ClipboardCheck,
  Clock,
  CheckCheck,
  BarChart3
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Student, SchoolLevel } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';
import { StudentBadgeModal } from '../components/StudentBadgeModal';
import { QRAttendanceScannerModal } from '../components/QRAttendanceScannerModal';
import { StudentProfileReportModal } from '../components/StudentProfileReportModal';
import { DailyAttendanceTracker } from '../components/DailyAttendanceTracker';
import { MonthlyAttendanceReportModal } from '../components/MonthlyAttendanceReportModal';

interface StudentsViewProps {
  isAddModalOpenInitially?: boolean;
  onCloseAddModalInitially?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  isAddModalOpenInitially,
  onCloseAddModalInitially
}) => {
  const { schoolLevel, students, saveStudent, deleteStudent, saveAttendance, academicYear, language, t } = useSchool();
  const [viewMode, setViewMode] = useState<'roster' | 'daily_attendance' | 'monthly_reports'>('roster');
  const [isMonthlyModalOpen, setIsMonthlyModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState<Student | null>(null);
  const [selectedStudentForProfileDossier, setSelectedStudentForProfileDossier] = useState<Student | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially || false);

  // Form inputs
  const [name, setName] = useState('');
  const [matricule, setMatricule] = useState(`MAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [studentLevel, setStudentLevel] = useState<'primary' | 'middle' | 'high'>(
    schoolLevel === 'all' ? 'high' : schoolLevel
  );
  const [gradeClass, setGradeClass] = useState('Terminale S1');
  const [birthDate, setBirthDate] = useState('2008-01-01');
  const [gender, setGender] = useState<'M' | 'F'>('F');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [attendanceRate, setAttendanceRate] = useState(96);
  const [tuitionStatus, setTuitionStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [totalTuition, setTotalTuition] = useState(3800);
  const [paidTuition, setPaidTuition] = useState(3800);

  // Unique classes for filter
  const classesList = Array.from(new Set(students.map((s) => s.gradeClass)));

  const filteredStudents = students.filter((s) => {
    const matchesLevel = schoolLevel === 'all' || s.schoolLevel === schoolLevel;
    const matchesClass = classFilter === 'all' || s.gradeClass === classFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesClass && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setName('');
    setMatricule(`MAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
    setStudentLevel(schoolLevel === 'all' ? 'high' : schoolLevel);
    setGradeClass(schoolLevel === 'primary' ? 'CM2-A' : schoolLevel === 'middle' ? '3ème-A' : 'Terminale S1');
    setBirthDate('2008-05-10');
    setGender('F');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setAttendanceRate(98);
    setTuitionStatus('paid');
    setTotalTuition(3500);
    setPaidTuition(3500);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (stu: Student) => {
    setEditingStudent(stu);
    setName(stu.name);
    setMatricule(stu.matricule);
    setStudentLevel(stu.schoolLevel);
    setGradeClass(stu.gradeClass);
    setBirthDate(stu.birthDate);
    setGender(stu.gender);
    setParentName(stu.parentName);
    setParentPhone(stu.parentPhone);
    setParentEmail(stu.parentEmail);
    setAttendanceRate(stu.attendanceRate);
    setTuitionStatus(stu.tuitionStatus);
    setTotalTuition(stu.totalTuition);
    setPaidTuition(stu.paidTuition);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Student = {
      id: editingStudent ? editingStudent.id : `s-${Date.now()}`,
      matricule,
      name,
      schoolLevel: studentLevel,
      gradeClass,
      birthDate,
      gender,
      parentName,
      parentPhone,
      parentEmail,
      attendanceRate: Number(attendanceRate),
      status: 'active',
      tuitionStatus,
      totalTuition: Number(totalTuition),
      paidTuition: Number(paidTuition),
    };
    await saveStudent(updated);
    setIsModalOpen(false);
    if (onCloseAddModalInitially) onCloseAddModalInitially();
  };

  return (
    <div className="space-y-6">
      {/* Title & View Mode Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'fr' ? 'Registre des Élèves & Assiduité' : 'Student Registry & Attendance'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'fr'
              ? 'Fiches individuelles, pointage de présence journalier, motifs d\'absence et bilans mensuels.'
              : 'Individual profiles, daily roll call, absence tracking, and monthly attendance reports.'}
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('roster')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              viewMode === 'roster'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{language === 'fr' ? 'Registre Élèves' : 'Student Registry'}</span>
          </button>

          <button
            onClick={() => setViewMode('daily_attendance')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              viewMode === 'daily_attendance'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'fr' ? 'Appel Journalier' : 'Daily Roll Call'}</span>
          </button>

          <button
            onClick={() => setIsMonthlyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-indigo-700 rounded-xl font-bold transition-all cursor-pointer"
            title="Générer et imprimer le rapport mensuel d'assiduité"
          >
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>{language === 'fr' ? 'Bilan Mensuel (A4)' : 'Monthly Report'}</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Daily Attendance Roll Call */}
      {viewMode === 'daily_attendance' && (
        <DailyAttendanceTracker
          initialClass={classFilter !== 'all' ? classFilter : 'Terminale S1'}
          onSelectStudent={(stu) => setSelectedStudentForProfileDossier(stu)}
        />
      )}

      {/* Mode 2: Student Roster Directory Table */}
      {viewMode === 'roster' && (
        <>
          {/* Filter & Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={language === 'fr' ? 'Nom, matricule, parent...' : 'Search student, matricule...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 w-48 sm:w-56"
                />
              </div>

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
              >
                <option value="all">{language === 'fr' ? 'Toutes Classes' : 'All Classes'}</option>
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setViewMode('daily_attendance')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
                title="Ouvrir la feuille d'appel journalière"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>{language === 'fr' ? 'Faire l\'Appel' : 'Take Attendance'}</span>
              </button>

              <button
                onClick={() => setIsQRScannerOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                title="Ouvrir le scanner de badges QR pour le pointage des présences"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>{language === 'fr' ? 'Pointage QR' : 'QR Attendance'}</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addStudent')}</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Élève & Matricule</th>
                <th className="py-3 px-3">Niveau & Classe</th>
                <th className="py-3 px-3">Parent Référent</th>
                <th className="py-3 px-3 text-center">Assiduité</th>
                <th className="py-3 px-3 text-center">Écolage / Scolarité</th>
                <th className="py-3 px-4 text-right">Actions & Bulletin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((stu) => (
                <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                        {stu.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{stu.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{stu.matricule}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-800 block">{stu.gradeClass}</span>
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      stu.schoolLevel === 'primary' ? 'bg-amber-50 text-amber-700' :
                      stu.schoolLevel === 'middle' ? 'bg-indigo-50 text-indigo-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {stu.schoolLevel}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-slate-600">
                    <span className="font-medium text-slate-800 block">{stu.parentName}</span>
                    <span className="text-[11px] text-slate-400">{stu.parentPhone}</span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      stu.attendanceRate >= 95 ? 'bg-emerald-100 text-emerald-800' :
                      stu.attendanceRate >= 88 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {stu.attendanceRate}%
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                      stu.tuitionStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      stu.tuitionStatus === 'partial' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {stu.tuitionStatus === 'paid' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      <span>{t(stu.tuitionStatus)}</span>
                    </span>
                    <span className="block text-[10px] text-slate-400 mt-0.5">
                      {stu.paidTuition} € / {stu.totalTuition} €
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedStudentForBadge(stu)}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors"
                        title="Générer & Imprimer le Badge Scolaire avec QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Badge</span>
                      </button>
                      <button
                        onClick={() => setSelectedStudentForReport(stu)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors"
                        title="Voir le Bulletin Officiel"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Bulletin</span>
                      </button>
                      <button
                        onClick={() => setSelectedStudentForProfileDossier(stu)}
                        className="flex items-center gap-1 px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-colors"
                        title="Imprimer la Fiche Dossier de l'Élève"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Fiche Profil</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(stu)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                        title="Modifier"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteStudent(stu.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStudent
                  ? (language === 'fr' ? 'Modifier Dossier Élève' : 'Edit Student File')
                  : (language === 'fr' ? 'Nouvelle Inscription Élève' : 'Enroll New Student')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom & Prénom</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Lucas Bernard"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Matricule Officiel</label>
                  <input
                    type="text"
                    required
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Niveau</label>
                  <select
                    value={studentLevel}
                    onChange={(e) => setStudentLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="primary">Primaire</option>
                    <option value="middle">Collège</option>
                    <option value="high">Lycée</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Classe</label>
                  <input
                    type="text"
                    required
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    placeholder="Terminale S1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Genre</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nom du Parent Référent</label>
                  <input
                    type="text"
                    required
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="M. ou Mme. ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone Parent</label>
                  <input
                    type="text"
                    required
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+33 6 ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email du Parent</label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Frais Annuel Total (€)</label>
                  <input
                    type="number"
                    value={totalTuition}
                    onChange={(e) => setTotalTuition(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Montant Réglé (€)</label>
                  <input
                    type="number"
                    value={paidTuition}
                    onChange={(e) => setPaidTuition(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Statut Paiement</label>
                  <select
                    value={tuitionStatus}
                    onChange={(e) => setTuitionStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  >
                    <option value="paid">Soldé (Paid)</option>
                    <option value="partial">Partiel (Partial)</option>
                    <option value="unpaid">Impayé (Unpaid)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Student Report Card Modal */}
      {selectedStudentForReport && (
        <ReportCardModal
          student={selectedStudentForReport}
          onClose={() => setSelectedStudentForReport(null)}
        />
      )}

      {/* Official Student Profile & Dossier Print Modal */}
      {selectedStudentForProfileDossier && (
        <StudentProfileReportModal
          student={selectedStudentForProfileDossier}
          onClose={() => setSelectedStudentForProfileDossier(null)}
        />
      )}

      {/* Student Printable Badge & QR Code Modal */}
      {selectedStudentForBadge && (
        <StudentBadgeModal
          student={selectedStudentForBadge}
          academicYear={academicYear}
          onClose={() => setSelectedStudentForBadge(null)}
          language={language}
        />
      )}

      {/* QR Code Real-Time Attendance Scanner Modal */}
      <QRAttendanceScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        students={students}
        schoolLevel={schoolLevel}
        saveAttendance={saveAttendance}
        saveStudent={saveStudent}
        language={language}
      />

      {/* Official Monthly Attendance Report Modal */}
      {isMonthlyModalOpen && (
        <MonthlyAttendanceReportModal
          selectedClass={classFilter !== 'all' ? classFilter : 'all'}
          onClose={() => setIsMonthlyModalOpen(false)}
        />
      )}
    </div>
  );
};
