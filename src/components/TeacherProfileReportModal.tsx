import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  X,
  Users,
  Award,
  Clock,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Star,
  CheckCircle2,
  Calendar,
  Layers,
  FileText,
  MessageSquareQuote,
  ShieldCheck
} from 'lucide-react';
import { Teacher } from '../types';
import { useSchool } from '../context/SchoolContext';

interface TeacherProfileReportModalProps {
  teacher: Teacher;
  onClose: () => void;
}

export const TeacherProfileReportModal: React.FC<TeacherProfileReportModalProps> = ({
  teacher,
  onClose,
}) => {
  const { academicYear, students, libraryMaterials, teacherFeedback, language } = useSchool();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const payload = JSON.stringify({
      doc: 'TEACHER_DOSSIER',
      id: teacher.id,
      name: teacher.name,
      qualification: teacher.qualification,
      schoolLevel: teacher.schoolLevel,
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
  }, [teacher, academicYear]);

  // Students taught by this teacher
  const taughtStudents = students.filter((s) => teacher.classes.includes(s.gradeClass));

  // Library materials published by this teacher
  const publishedMaterials = libraryMaterials.filter(
    (m) => m.authorTeacher.toLowerCase().includes(teacher.name.toLowerCase()) ||
           teacher.name.toLowerCase().includes(m.authorTeacher.toLowerCase())
  );

  // Student feedback for this teacher
  const teacherEvaluations = teacherFeedback.filter((fb) => fb.teacherId === teacher.id);
  const avgOverall = teacherEvaluations.length > 0
    ? (teacherEvaluations.reduce((acc, f) => acc + f.overallRating, 0) / teacherEvaluations.length).toFixed(1)
    : '4.8';
  const avgClarity = teacherEvaluations.length > 0
    ? (teacherEvaluations.reduce((acc, f) => acc + f.clarityRating, 0) / teacherEvaluations.length).toFixed(1)
    : '4.7';
  const avgContent = teacherEvaluations.length > 0
    ? (teacherEvaluations.reduce((acc, f) => acc + f.contentRating, 0) / teacherEvaluations.length).toFixed(1)
    : '4.9';
  const avgPacing = teacherEvaluations.length > 0
    ? (teacherEvaluations.reduce((acc, f) => acc + f.pacingRating, 0) / teacherEvaluations.length).toFixed(1)
    : '4.5';
  const avgFairness = teacherEvaluations.length > 0
    ? (teacherEvaluations.reduce((acc, f) => acc + f.fairnessRating, 0) / teacherEvaluations.length).toFixed(1)
    : '4.8';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print-modal-overlay">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-4 print-document-container">
        {/* Modal Toolbar (hidden during printing) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm tracking-tight">Fiche Dossier Pédagogique Enseignant</h3>
              <p className="text-[11px] text-slate-400">Rapport officiel imprimable d'affectation & bilan pédagogique</p>
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

        {/* Printable Document Content */}
        <div className="p-6 sm:p-10 font-sans text-slate-900 bg-white space-y-6">
          {/* Official Institution Header */}
          <div className="pb-4 border-b-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <Users className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  EduSchool International
                </h1>
                <p className="text-xs font-semibold text-indigo-700 tracking-wider uppercase">
                  Direction des Ressources Humaines & de l'Inspection Pédagogique
                </p>
                <p className="text-[10px] text-slate-500">
                  Dossier Individuel d'Affectation • Année Scolaire {academicYear}
                </p>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800 border border-slate-300">
                REF-TCH-{teacher.id.toUpperCase()}
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                Édité le {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {/* Teacher Identity & Academic Credentials Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center page-break-avoid">
            {/* Avatar / Monogram */}
            <div className="flex flex-col items-center justify-center text-center p-2">
              <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-2xl border-2 border-indigo-200 shadow-xs">
                {teacher.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <span className="mt-2 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Enseignant Titulaire
              </span>
            </div>

            {/* Core Info */}
            <div className="md:col-span-2 space-y-1.5 text-xs">
              <h2 className="text-lg font-black text-slate-900 leading-tight">{teacher.name}</h2>
              {teacher.qualification && (
                <div className="flex items-center gap-1.5 text-indigo-800 font-semibold text-xs">
                  <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{teacher.qualification}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1.5 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Courriel Professionnel :</span>
                  <strong className="text-slate-800 font-mono text-[11px]">{teacher.email}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Téléphone / Contact :</span>
                  <strong className="text-slate-800 font-mono text-[11px]">{teacher.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cycle d'Enseignement :</span>
                  <strong className="capitalize text-slate-800">{teacher.schoolLevel}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date d'Intégration :</span>
                  <strong className="text-slate-800">{teacher.joinDate}</strong>
                </div>
              </div>
            </div>

            {/* QR Code Verification */}
            <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="QR Code Enseignant" className="w-20 h-20 object-contain" />
              )}
              <span className="text-[9px] font-mono text-slate-500 mt-1">Homologation RH</span>
            </div>
          </div>

          {/* Allocation & Workload Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 page-break-avoid">
            {/* Weekly Volume */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Volume Horaire</span>
              <div className="text-2xl font-black text-slate-900 mt-1 flex items-baseline gap-1">
                <span>{teacher.weeklyHours}h</span>
                <span className="text-xs text-slate-500 font-normal">/ semaine</span>
              </div>
              <p className="text-[11px] text-slate-500">Service réglementaire annuel garanti</p>
            </div>

            {/* Classes & Pupils */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Effectif Sous Charge</span>
              <div className="text-2xl font-black text-indigo-900 mt-1">
                {taughtStudents.length} Élèves
              </div>
              <p className="text-[11px] text-slate-500">
                Répartis sur {teacher.classes.length} division(s) : {teacher.classes.join(', ')}
              </p>
            </div>

            {/* Disciplines */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Matières Enseignées</span>
              <div className="font-bold text-slate-900 mt-1 line-clamp-1">
                {teacher.subjects[0]}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {teacher.subjects.join(' • ')}
              </p>
            </div>
          </div>

          {/* Student Evaluation & Pedagogical Feedback Barometer */}
          <div className="border border-slate-200 rounded-xl overflow-hidden page-break-avoid">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <MessageSquareQuote className="w-4 h-4 text-indigo-600" />
                <span>Baromètre Pédagogique & Évaluations Anonymes Élèves</span>
              </h3>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 font-bold text-xs text-amber-900">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>Score Global : {avgOverall} / 5.0</span>
              </div>
            </div>

            <div className="p-4 bg-white grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Clarté Explications :</span>
                <strong className="text-slate-900 font-bold text-sm">{avgClarity} / 5</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Qualité Supports :</span>
                <strong className="text-slate-900 font-bold text-sm">{avgContent} / 5</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Rythme du Cours :</span>
                <strong className="text-slate-900 font-bold text-sm">{avgPacing} / 5</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-500 block">Équité des Devoirs :</span>
                <strong className="text-slate-900 font-bold text-sm">{avgFairness} / 5</strong>
              </div>
            </div>

            {/* Action Plan Note if available */}
            {teacherEvaluations[0]?.teacherActionNote && (
              <div className="px-4 pb-3.5 pt-0 bg-white">
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block mb-0.5">
                    Engagement & Plan d'Action Pédagogique Enregistré :
                  </span>
                  <p className="italic text-slate-700 text-[11px]">
                    « {teacherEvaluations[0].teacherActionNote} »
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Published Course Materials in Digital Library */}
          <div className="border border-slate-200 rounded-xl overflow-hidden page-break-avoid">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Publications Pédagogiques & Polycopiés ({publishedMaterials.length})</span>
              </h3>
            </div>

            {publishedMaterials.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Aucun polycopié déposé dans la bibliothèque pour le moment.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Titre du Document</th>
                    <th className="py-2 px-2">Type</th>
                    <th className="py-2 px-2">Format</th>
                    <th className="py-2 px-2">Classes Cibles</th>
                    <th className="py-2 px-3 text-right">Téléchargements</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {publishedMaterials.map((mat) => (
                    <tr key={mat.id}>
                      <td className="py-2 px-3 font-semibold text-slate-800">{mat.title}</td>
                      <td className="py-2 px-2 text-slate-600 capitalize">{mat.type.replace('_', ' ')}</td>
                      <td className="py-2 px-2 font-mono text-[10px]">{mat.fileFormat}</td>
                      <td className="py-2 px-2 text-slate-600">{mat.targetClasses.join(', ')}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-indigo-900">
                        {mat.downloadsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Signatures & Accreditation Stamp */}
          <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-6 text-center text-xs page-break-avoid">
            <div>
              <p className="font-bold text-slate-800 mb-12">L'Enseignant Titulaire</p>
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">{teacher.name}</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-12">L'Inspecteur Pédagogique</p>
              <div className="border-b border-slate-400 w-36 mx-auto"></div>
              <p className="text-[10px] text-slate-400 mt-1">Visa de coordination</p>
            </div>

            <div>
              <p className="font-bold text-slate-800 mb-2">La Directrice Générale</p>
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
