import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Award,
  CheckCircle2,
  School,
  User,
  Calendar,
  ShieldCheck,
  PenTool,
  Lock,
  FileCheck,
  RotateCcw,
  Mail,
  Send
} from 'lucide-react';
import { Student, Grade } from '../types';
import { useSchool } from '../context/SchoolContext';
import { DigitalSignatureModal, ReportCardSignature } from './DigitalSignatureModal';
import { ReportCardEmailDispatchModal } from './ReportCardEmailDispatchModal';

interface ReportCardModalProps {
  student: Student;
  onClose: () => void;
}

export const ReportCardModal: React.FC<ReportCardModalProps> = ({ student, onClose }) => {
  const { language, academicYear, selectedTerm, grades, subjects, attendance } = useSchool();
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [signature, setSignature] = useState<ReportCardSignature | null>(null);

  // Storage key for student & term digital signature
  const storageKey = `eduschool_report_sig_${student.id}_${selectedTerm}`;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setSignature(JSON.parse(saved));
      } else {
        // If not saved in localStorage, provide an initial pre-certified signature for demonstration
        const sampleSig: ReportCardSignature = {
          id: `sig-init-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          term: selectedTerm,
          academicYear,
          signerName: 'Marc Dubois',
          signerRole: 'principal_teacher',
          signerTitle: 'Professeur Principal de la classe',
          signatureDataUrl: '',
          signatureType: 'calligraphy',
          signedAt: `${new Date().toLocaleDateString('fr-FR')} à 10:30`,
          securityHash: `SHA256:8F9B2C4E1D8E${student.matricule.replace(/[^0-9]/g, '')}`,
          verificationCode: `EDS-VERIF-2024-${student.matricule}`,
          isFinalized: true,
          certStatement:
            'Certifié conforme et approuvé par le conseil de classe pour transmission aux parents.',
        };
        setSignature(sampleSig);
      }
    } catch {
      // Storage fallback
    }
  }, [student.id, selectedTerm, academicYear]);

  const handleSaveSignature = (newSig: ReportCardSignature) => {
    setSignature(newSig);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newSig));
    } catch {
      // Storage fallback
    }
    setIsSignatureModalOpen(false);
    // Open automated email dispatch prompt
    setTimeout(() => {
      setIsEmailModalOpen(true);
    }, 350);
  };

  const handleRevokeSignature = () => {
    if (
      window.confirm(
        language === 'fr'
          ? 'Êtes-vous sûr de vouloir révoquer la signature numérique de ce bulletin ?'
          : 'Are you sure you want to revoke the digital signature of this report card?'
      )
    ) {
      setSignature(null);
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Storage fallback
      }
    }
  };

  // Filter student grades for the active term
  const studentGrades = grades.filter(
    (g) => g.studentId === student.id && g.term === selectedTerm
  );

  // If no grades yet, synthesize from available subjects for realistic demo
  const displayRows = subjects
    .filter(
      (sub) =>
        sub.schoolLevel === 'all' ||
        sub.schoolLevel === student.schoolLevel
    )
    .map((sub) => {
      const existing = studentGrades.find((g) => g.subject.includes(sub.name) || sub.name.includes(g.subject));
      if (existing) {
        return {
          subject: sub.name,
          coefficient: sub.coefficient,
          score: existing.score,
          classAvg: 14.2,
          minScore: 8.5,
          maxScore: 19.5,
          teacher: existing.teacherName || 'Enseignant titulaire',
          appreciation: existing.remarks || 'Travail sérieux et régulier.',
        };
      }
      // Demo fallback grade based on attendance rate
      const simulatedScore = Math.min(20, Math.max(9, Math.round((student.attendanceRate / 6.5) * 10) / 10));
      return {
        subject: sub.name,
        coefficient: sub.coefficient,
        score: simulatedScore,
        classAvg: 13.8,
        minScore: 7.0,
        maxScore: 19.0,
        teacher: 'Professeur certifié',
        appreciation: simulatedScore >= 16 ? 'Excellent investissement intellectuel.' : 'Ensemble satisfaisant, poursuivre les efforts.',
      };
    });

  // Calculate weighted average
  let totalWeightedScore = 0;
  let totalCoeffs = 0;
  displayRows.forEach((r) => {
    totalWeightedScore += r.score * r.coefficient;
    totalCoeffs += r.coefficient;
  });
  const overallAvg = totalCoeffs > 0 ? (totalWeightedScore / totalCoeffs).toFixed(2) : '15.00';

  // Attendance summary for this student
  const studentAtt = attendance.filter((a) => a.studentId === student.id);
  const absences = studentAtt.filter((a) => a.status.includes('absent')).length;
  const lates = studentAtt.filter((a) => a.status === 'late').length;

  const handlePrint = () => {
    window.print();
  };

  const getHonors = (avg: number) => {
    if (avg >= 16) return { label: 'Félicitations du Conseil de Classe', color: 'text-emerald-700 bg-emerald-50 border-emerald-300' };
    if (avg >= 14) return { label: 'Tableau d’Honneur avec Encouragements', color: 'text-indigo-700 bg-indigo-50 border-indigo-300' };
    if (avg >= 12) return { label: 'Tableau d’Honneur', color: 'text-blue-700 bg-blue-50 border-blue-300' };
    if (avg >= 10) return { label: 'Encouragements pour les efforts fournis', color: 'text-amber-700 bg-amber-50 border-amber-300' };
    return { label: 'Avertissement Travail - Doit redoubler d’efforts', color: 'text-rose-700 bg-rose-50 border-rose-300' };
  };

  const honors = getHonors(parseFloat(overallAvg));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden my-auto border border-slate-300">
        {/* Top Action Bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide">
              {language === 'fr' ? 'Bulletin Scolaire Officiel' : 'Official Academic Report Card'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {signature ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  title="Document signé numériquement - Cliquer pour modifier ou re-signer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>Signé Numériquement</span>
                </button>
                <button
                  onClick={handleRevokeSignature}
                  className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg text-xs transition-colors cursor-pointer"
                  title="Révoquer la signature"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer animate-pulse"
              >
                <PenTool className="w-4 h-4" />
                <span>Finaliser & Signer</span>
              </button>
            )}

            <button
              onClick={() => setIsEmailModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
              title="Envoyer le résumé officiel par email au parent"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Notifier Parent (Email)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'fr' ? 'Imprimer / Exporter PDF' : 'Print / Export PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Digital Signature Integrity Ribbon (hidden in paper print) */}
        {signature && (
          <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white text-xs border-b border-emerald-800/50 flex flex-wrap items-center justify-between gap-2 print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-bold text-emerald-300">
                  Document Officiel Scellé & Signé Numériquement
                </span>
                <span className="text-slate-300 ml-1.5">
                  par <strong>{signature.signerName}</strong> ({signature.signerTitle}) le {signature.signedAt}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-emerald-200">
              <span className="bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50">
                {signature.verificationCode}
              </span>
              <span className="text-slate-400 hidden sm:inline">{signature.securityHash}</span>
            </div>
          </div>
        )}

        {/* Printable Bulletin Document */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-serif text-slate-900 print:p-0">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-[11px] font-sans font-bold uppercase tracking-widest text-slate-500">
                  RÉPUBLIQUE • MINISTÈRE DE L’ÉDUCATION NATIONALE
                </div>
                <h1 className="text-xl sm:text-2xl font-bold font-sans tracking-tight text-slate-900 mt-0.5">
                  GROUPE SCOLAIRE INTERNATIONAL EDUSCHOOL
                </h1>
                <p className="text-xs font-sans text-slate-600">
                  Primaire • Collège d’Enseignement Général • Lycée d’Excellence
                </p>
                <p className="text-[11px] font-sans text-slate-500">
                  12 Avenue des Savoirs • contact@eduschool.org • Tél: +33 1 45 00 11 00
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white font-sans text-xs font-bold rounded">
                  {selectedTerm.toUpperCase()}
                </div>
                <div className="text-xs font-sans font-semibold text-slate-600 mt-1">
                  Année Scolaire : {academicYear}
                </div>
              </div>
            </div>
          </div>

          {/* Student Profile Summary Box */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-5 font-sans">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Élève</span>
                <span className="font-bold text-slate-900 text-sm">{student.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Matricule & Sexe</span>
                <span className="font-semibold text-slate-800">{student.matricule} ({student.gender === 'F' ? 'Féminin' : 'Masculin'})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Niveau & Classe</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                  {student.gradeClass} ({student.schoolLevel.toUpperCase()})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Responsable Légal</span>
                <span className="font-semibold text-slate-800">{student.parentName}</span>
              </div>
            </div>
          </div>

          {/* Grades Table */}
          <div className="overflow-x-auto mb-5 border border-slate-300 rounded-lg">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="py-2.5 px-3">Matière / Discipline</th>
                  <th className="py-2.5 px-2 text-center w-12">Coeff</th>
                  <th className="py-2.5 px-2 text-center w-16 bg-indigo-50/70 font-bold text-indigo-900">Note /20</th>
                  <th className="py-2.5 px-2 text-center w-16 text-slate-500">Moy. Cl.</th>
                  <th className="py-2.5 px-2 text-center w-20 text-slate-500">Min - Max</th>
                  <th className="py-2.5 px-3">Appréciations des Professeurs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {displayRows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{row.subject}</td>
                    <td className="py-2.5 px-2 text-center font-medium text-slate-600">{row.coefficient}</td>
                    <td className="py-2.5 px-2 text-center font-bold text-slate-900 bg-indigo-50/40 text-sm">
                      <span className={row.score >= 10 ? 'text-emerald-700' : 'text-rose-600'}>
                        {row.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-slate-600">{row.classAvg.toFixed(1)}</td>
                    <td className="py-2.5 px-2 text-center text-[11px] text-slate-500">
                      {row.minScore} - {row.maxScore}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 italic text-[11px]">
                      "{row.appreciation}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Academic Synthesis & Class Council Decisions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 font-sans">
            {/* Overall GPA */}
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-xl border border-indigo-200 text-center">
              <span className="text-[11px] font-semibold uppercase text-indigo-800 tracking-wider block">
                Moyenne Générale Pondérée
              </span>
              <div className="text-3xl font-extrabold text-indigo-950 mt-1">
                {overallAvg} <span className="text-sm font-normal text-slate-600">/ 20</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Rang dans la classe : <strong className="text-indigo-900">2ème / 28</strong>
              </p>
            </div>

            {/* Attendance & Discipline */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-semibold uppercase text-slate-600 tracking-wider block mb-1">
                Assiduité & Ponctualité
              </span>
              <div className="space-y-1 text-slate-700">
                <div className="flex justify-between">
                  <span>Taux de présence :</span>
                  <strong className="text-emerald-700">{student.attendanceRate}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Absences enregistrées :</span>
                  <span>{absences} demi-journée(s)</span>
                </div>
                <div className="flex justify-between">
                  <span>Retards :</span>
                  <span>{lates}</span>
                </div>
              </div>
            </div>

            {/* Council Honor Notice */}
            <div className={`p-4 rounded-xl border flex flex-col justify-center items-center text-center ${honors.color}`}>
              <CheckCircle2 className="w-6 h-6 mb-1" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Mention du Conseil</span>
              <span className="font-bold text-xs mt-0.5">{honors.label}</span>
            </div>
          </div>

          {/* Signatures & Seal Box */}
          <div className="pt-4 border-t-2 border-slate-300 font-sans grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs page-break-avoid">
            {/* Column 1: Teacher / Authority Digital Signature */}
            <div>
              <p className="font-semibold text-slate-700 mb-2">
                {signature?.signerTitle || 'Le Professeur Principal'}
              </p>

              {signature ? (
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
                  {signature.signatureDataUrl ? (
                    <img
                      src={signature.signatureDataUrl}
                      alt={`Signature de ${signature.signerName}`}
                      className="h-12 max-w-full mx-auto object-contain my-1"
                    />
                  ) : (
                    <div className="h-12 flex items-center justify-center font-serif italic text-lg text-blue-950 font-bold">
                      {signature.signerName}
                    </div>
                  )}
                  <p className="font-bold text-slate-900 text-xs mt-1">{signature.signerName}</p>
                  
                  {/* Security Verification Stamp */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[9px] font-mono text-emerald-800 flex flex-col items-center gap-0.5">
                    <span className="flex items-center gap-1 font-bold text-emerald-700">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Signé numériquement le {signature.signedAt}
                    </span>
                    <span className="text-slate-400 text-[8px]">{signature.securityHash}</span>
                  </div>

                  <button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="mt-1.5 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold underline print:hidden cursor-pointer"
                  >
                    Modifier signature
                  </button>
                </div>
              ) : (
                <div className="border border-dashed border-amber-300 bg-amber-50/60 rounded-xl p-3 my-1 print:border-none print:bg-transparent">
                  <p className="text-[11px] text-amber-800 font-medium mb-1.5 print:hidden">
                    En attente de signature
                  </p>
                  <button
                    onClick={() => setIsSignatureModalOpen(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs print:hidden cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Signer le Bulletin</span>
                  </button>
                  <div className="border-b border-slate-400 w-32 mx-auto mt-6 hidden print:block"></div>
                </div>
              )}
            </div>

            {/* Column 2: Parents Visa */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="font-semibold text-slate-700 mb-6">Les Parents / Tuteur Légal</p>
                <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/50 print:border-none print:bg-transparent">
                  <p className="text-[11px] text-slate-500 mb-1">Visa de prise de connaissance</p>
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                    Portail Parents : Accusé de réception
                  </span>
                  <div className="border-b border-slate-400 w-32 mx-auto mt-6"></div>
                  <p className="text-[9px] text-slate-400 mt-1">Signature du responsable</p>
                </div>
              </div>
            </div>

            {/* Column 3: Headmistress & Official Seal */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="font-semibold text-slate-700 mb-3">La Directrice Générale</p>
                <div className="inline-block px-3 py-1 border-2 border-indigo-800 text-indigo-900 rounded font-black text-[9px] uppercase tracking-wider mb-2 rotate-[-4deg] bg-indigo-50/50">
                  Cachet Officiel Établissement
                </div>
                <div className="font-serif italic text-sm text-indigo-950 font-bold mb-1">
                  Béatrice Fontaine
                </div>
                <div className="border-b border-slate-400 w-32 mx-auto"></div>
                <p className="text-[10px] text-slate-400 mt-1">Proviseure & Inspection</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secure Digital Signature Modal */}
      {isSignatureModalOpen && (
        <DigitalSignatureModal
          studentId={student.id}
          studentName={student.name}
          gradeClass={student.gradeClass}
          term={selectedTerm}
          existingSignature={signature}
          onSave={handleSaveSignature}
          onClose={() => setIsSignatureModalOpen(false)}
        />
      )}

      {/* Automated Email Notification Modal */}
      {isEmailModalOpen && (
        <ReportCardEmailDispatchModal
          student={student}
          onClose={() => setIsEmailModalOpen(false)}
        />
      )}
    </div>
  );
};
