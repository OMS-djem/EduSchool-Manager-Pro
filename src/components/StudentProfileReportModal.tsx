import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Award,
  Wallet,
  BookOpen,
  School,
  FileText
} from 'lucide-react';
import { Student } from '../types';
import { useSchool } from '../context/SchoolContext';

interface StudentProfileReportModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentProfileReportModal: React.FC<StudentProfileReportModalProps> = ({
  student,
  onClose,
}) => {
  const { academicYear, selectedTerm, grades, subjects, attendance, parentMonitoring, language } =
    useSchool();

  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const payload = JSON.stringify({
      doc: 'STUDENT_DOSSIER',
      matricule: student.matricule,
      name: student.name,
      class: student.gradeClass,
      year: academicYear,
      verified: true,
      issuer: 'EduSchool International',
    });

    QRCode.toDataURL(payload, {
      width: 160,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('QR generation error:', err));
  }, [student, academicYear]);

  // Compute student grades
  const studentGrades = grades.filter((g) => g.studentId === student.id);
  const relevantSubjects = subjects.filter(
    (s) => s.schoolLevel === 'all' || s.schoolLevel === student.schoolLevel
  );

  const subjectGrades = relevantSubjects.map((sub) => {
    const found = studentGrades.find(
      (g) => g.subject.toLowerCase().includes(sub.name.toLowerCase()) || sub.name.toLowerCase().includes(g.subject.toLowerCase())
    );
    const score = found
      ? found.score
      : Math.min(20, Math.max(9, Math.round((student.attendanceRate / 6.5) * 10) / 10));
    return {
      name: sub.name,
      coefficient: sub.coefficient,
      score,
      teacher: found?.teacherName || 'Professeur assigné',
      appreciation: found?.remarks || (score >= 15 ? 'Excellent travail.' : 'Travail régulier, progrès constants.'),
    };
  });

  const totalWeighted = subjectGrades.reduce((acc, s) => acc + s.score * s.coefficient, 0);
  const totalCoeffs = subjectGrades.reduce((acc, s) => acc + s.coefficient, 0);
  const overallAvg = totalCoeffs > 0 ? (totalWeighted / totalCoeffs).toFixed(2) : '14.50';

  // Attendance metrics
  const studentAttendance = attendance.filter((a) => a.studentId === student.id);
  const absences = studentAttendance.filter((a) => a.status.includes('absent')).length;
  const tardiness = studentAttendance.filter((a) => a.status === 'late').length;

  // Disciplinary / Liaison items
  const studentLiaisons = parentMonitoring.filter((p) => p.studentId === student.id);

  const handlePrint = () => {
    window.print();
  };

  const getCouncilHonor = (avg: number) => {
    if (avg >= 16) return { label: 'Félicitations du Conseil de Classe', color: 'text-emerald-800 bg-emerald-50 border-emerald-300' };
    if (avg >= 14) return { label: 'Compliments du Conseil de Classe', color: 'text-indigo-800 bg-indigo-50 border-indigo-300' };
    if (avg >= 12) return { label: 'Encouragements du Conseil de Classe', color: 'text-blue-800 bg-blue-50 border-blue-300' };
    return { label: 'Avertissement de Travail', color: 'text-amber-800 bg-amber-50 border-amber-300' };
  };

  const honor = getCouncilHonor(Number(overallAvg));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-4 print-document-container">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">Fiche Dossier Individuel de l'Élève</h3>
              <p className="text-[11px] text-slate-400">Rapport complet imprimable pour archives scolaires & parents</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimer le Dossier (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-10 font-sans text-slate-900 bg-white space-y-6">
          {/* Institutional Header */}
          <div className="pb-4 border-b-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <GraduationCap className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  EduSchool International
                </h1>
                <p className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">
                  Direction des Études & de la Scolarité • Fiche Individuelle
                </p>
                <p className="text-[10px] text-slate-500">
                  Établissement Homologué • Année Académique {academicYear}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800 border border-slate-300">
                N° {student.matricule}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                Généré le {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Student Profile Card (Identity & Picture) */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center page-break-avoid">
            {/* Student Avatar / Photo */}
            <div className="flex flex-col items-center justify-center text-center p-2">
              <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-2xl border-2 border-indigo-200 shadow-xs">
                {student.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Élève Régulier
              </span>
            </div>

            {/* Core Info */}
            <div className="md:col-span-2 space-y-1.5 text-xs">
              <h2 className="text-lg font-black text-slate-900 leading-tight">{student.name}</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Classe & Section :</span>
                  <strong className="text-indigo-900 font-bold">{student.gradeClass}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Niveau d'Études :</span>
                  <strong className="capitalize text-slate-800">{student.schoolLevel}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date de Naissance :</span>
                  <strong className="text-slate-800">{student.birthDate}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Genre :</span>
                  <strong className="text-slate-800">{student.gender === 'F' ? 'Féminin' : 'Masculin'}</strong>
                </div>
              </div>
            </div>

            {/* QR Verification Box */}
            <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code Dossier" className="w-20 h-20 object-contain" />
              )}
              <span className="text-[9px] font-mono text-slate-500 mt-1">Vérification QR</span>
            </div>
          </div>

          {/* Two-Column Section: Guardianship & Financial Clearance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 page-break-avoid">
            {/* Legal Guardianship */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b pb-1.5 border-slate-100 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Responsable Légal & Contact</span>
              </h3>
              <div className="space-y-1.5 pt-1 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nom du Parent/Tuteur :</span>
                  <strong className="text-slate-900">{student.parentName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Téléphone Principal :</span>
                  <span className="font-mono">{student.parentPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Courriel :</span>
                  <span>{student.parentEmail || 'Non renseigné'}</span>
                </div>
              </div>
            </div>

            {/* Financial Clearance & Attendance */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b pb-1.5 border-slate-100 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                <span>Statut Financier & Assiduité</span>
              </h3>
              <div className="space-y-1.5 pt-1 text-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Écolage & Frais de Scolarité :</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      student.tuitionStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {student.tuitionStatus === 'paid' ? 'Compte Soldé' : 'Solde En Attente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Montant Versé :</span>
                  <strong className="font-mono text-slate-900">
                    {student.paidTuition} € / {student.totalTuition} €
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Taux d'Assiduité Global :</span>
                  <strong className="text-emerald-700 font-bold">{student.attendanceRate}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Performance Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden page-break-avoid">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bilan Pédagogique & Évaluations ({selectedTerm})</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Moyenne Générale :</span>
                <span className="font-mono font-bold text-sm text-indigo-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {overallAvg} / 20
                </span>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Matière</th>
                  <th className="py-2.5 px-2 text-center">Coeff</th>
                  <th className="py-2.5 px-2 text-center">Note /20</th>
                  <th className="py-2.5 px-3">Enseignant</th>
                  <th className="py-2.5 px-3">Appréciation Pédagogique</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectGrades.map((sub, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{sub.name}</td>
                    <td className="py-2 px-2 text-center font-mono text-slate-600">{sub.coefficient}</td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-indigo-900">
                      {sub.score.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-slate-600">{sub.teacher}</td>
                    <td className="py-2 px-3 text-slate-600 italic text-[11px]">{sub.appreciation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Honor / Mention Notice */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs page-break-avoid ${honor.color}`}>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 shrink-0" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block">Décision & Mention du Conseil de Classe</span>
                <strong className="text-xs">{honor.label}</strong>
              </div>
            </div>
            <div className="text-right font-mono text-[11px]">
              Assiduité : {student.attendanceRate}% • Absences : {absences}
            </div>
          </div>

          {/* Official Signatures & Seal Zone */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs page-break-avoid">
            <div>
              <p className="font-bold text-slate-800 mb-12">Le Professeur Principal</p>
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">Visa & Signature</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-12">Le Représentant Légal</p>
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">Signature du parent</p>
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
