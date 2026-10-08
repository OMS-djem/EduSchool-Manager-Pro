import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Award,
  Sparkles,
  User,
  Calendar,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Users,
  Check,
  Loader2,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { Student } from '../types';
import { useSchool } from '../context/SchoolContext';
import {
  EmailSummaryData,
  buildStudentReportSummary,
  dispatchAutomatedReportCardEmail,
  EmailDispatchResult
} from '../services/reportNotificationService';
import { ReportCardSignature } from './DigitalSignatureModal';

interface ReportCardEmailDispatchModalProps {
  // If provided, dispatch for this single student; otherwise, class-wide batch mode
  student?: Student;
  targetClass?: string;
  onClose: () => void;
}

export const ReportCardEmailDispatchModal: React.FC<ReportCardEmailDispatchModalProps> = ({
  student,
  targetClass,
  onClose,
}) => {
  const {
    students,
    grades,
    subjects,
    attendance,
    selectedTerm,
    academicYear,
    saveParentMonitoring,
    language
  } = useSchool();

  // Mode: 'single' if student is provided, 'batch' if class-wide
  const mode = student ? 'single' : 'batch';
  const effectiveClass = targetClass || student?.gradeClass || 'Terminale S1';

  // Target students list
  const targetStudents = student
    ? [student]
    : students.filter((s) => s.gradeClass === effectiveClass);

  const [activeTab, setActiveTab] = useState<'preview' | 'logs'>('preview');
  const [personalNote, setPersonalNote] = useState<string>(
    'Madame, Monsieur, nous avons le plaisir de vous transmettre le bilan académique de votre enfant pour ce trimestre. Nous restons à votre entière disposition pour tout échange lors de la réunion parents-professeurs.'
  );

  // Batch progress state
  const [isSending, setIsSending] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [sentResults, setSentResults] = useState<EmailDispatchResult[]>([]);
  const [activeStudentIdx, setActiveStudentIdx] = useState(0);
  const [dispatchComplete, setDispatchComplete] = useState(false);

  // Single preview student
  const previewStudent = targetStudents[activeStudentIdx] || targetStudents[0];

  // Load signature for preview student if exists
  const [previewSignature, setPreviewSignature] = useState<ReportCardSignature | null>(null);

  useEffect(() => {
    if (!previewStudent) return;
    try {
      const saved = localStorage.getItem(`eduschool_report_sig_${previewStudent.id}_${selectedTerm}`);
      if (saved) {
        setPreviewSignature(JSON.parse(saved));
      } else {
        setPreviewSignature(null);
      }
    } catch {
      setPreviewSignature(null);
    }
  }, [previewStudent, selectedTerm]);

  const summaryData: EmailSummaryData | null = previewStudent
    ? {
        ...buildStudentReportSummary(
          previewStudent,
          selectedTerm,
          academicYear,
          grades,
          subjects,
          attendance,
          previewSignature
        ),
        teacherPersonalNote: personalNote,
      }
    : null;

  // Sound chime
  const playSentSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio fallback
    }
  };

  // Launch Automated Dispatch
  const handleStartDispatch = async () => {
    setIsSending(true);
    setProgressPercent(0);
    const results: EmailDispatchResult[] = [];

    for (let i = 0; i < targetStudents.length; i++) {
      const stu = targetStudents[i];
      let sig: ReportCardSignature | null = null;
      try {
        const saved = localStorage.getItem(`eduschool_report_sig_${stu.id}_${selectedTerm}`);
        if (saved) sig = JSON.parse(saved);
      } catch {
        // fallback
      }

      const data = {
        ...buildStudentReportSummary(
          stu,
          selectedTerm,
          academicYear,
          grades,
          subjects,
          attendance,
          sig
        ),
        teacherPersonalNote: personalNote,
      };

      // Simulated network dispatch latency
      await new Promise((resolve) => setTimeout(resolve, 320));

      const res = await dispatchAutomatedReportCardEmail(data, saveParentMonitoring);
      results.push(res);
      setSentResults([...results]);
      setProgressPercent(Math.round(((i + 1) / targetStudents.length) * 100));
    }

    setIsSending(false);
    setDispatchComplete(true);
    playSentSound();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-4 max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">
                  {mode === 'single'
                    ? `Notification Email du Bulletin • ${student?.name}`
                    : `Diffusion Automatique des Bulletins par Email • ${effectiveClass}`}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  Système Automatisé
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Envoi du résumé officiel des notes, appréciations et sceau numérique ({selectedTerm})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Tabs Subheader */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aperçu Email Destinataire
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Journal d'Expédition</span>
              {sentResults.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {sentResults.length}
                </span>
              )}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
            <span>
              Destinataires : <strong className="text-slate-900">{targetStudents.length} parent(s)</strong>
            </span>
            <span>•</span>
            <span>
              Période : <strong className="text-indigo-700 font-bold">{selectedTerm}</strong>
            </span>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs font-sans">
          {/* Dispatch Progress Banner if active or complete */}
          {(isSending || dispatchComplete) && (
            <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-2xl p-4 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  {isSending ? (
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>
                    {isSending
                      ? `Envoi automatisé en cours... (${sentResults.length} / ${targetStudents.length})`
                      : `Diffusion terminée avec succès ! (${sentResults.length} emails délivrés)`}
                  </span>
                </div>
                <span className="font-mono font-bold text-indigo-900 text-xs">{progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Tab 1: Email Preview & Configuration */}
          {activeTab === 'preview' && summaryData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Settings & Personalization */}
              <div className="space-y-4">
                {/* Target Student Selector (for batch mode) */}
                {mode === 'batch' && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Sélectionner un élève pour prévisualisation :
                    </label>
                    <select
                      value={activeStudentIdx}
                      onChange={(e) => setActiveStudentIdx(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-medium"
                    >
                      {targetStudents.map((s, idx) => (
                        <option key={s.id} value={idx}>
                          {s.name} ({s.parentEmail})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Email Metadata Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider border-b pb-1.5 border-slate-200">
                    Paramètres d'Acheminement
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Expéditeur :</span>
                      <strong className="text-slate-800 font-mono text-[11px]">
                        scolarite@eduschool.org (Serveur SMTP Officiel)
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Destinataire Parent :</span>
                      <strong className="text-indigo-900 font-mono text-[11px]">
                        {previewStudent.parentEmail}
                      </strong>
                      <span className="text-slate-500 block text-[10px] mt-0.5">
                        Au nom de : {previewStudent.parentName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Objet du Message :</span>
                      <span className="font-semibold text-slate-800">
                        [EduSchool] Relevé officiel des notes de {previewStudent.name} • {selectedTerm}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Teacher Accompaniment Message */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Mot d'accompagnement du Professeur Principal / Direction :
                  </label>
                  <textarea
                    rows={4}
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ajoutez une note personnalisée qui sera affichée en tête de l'email..."
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Ce mot d'introduction sera inclus dans tous les emails envoyés aux parents.
                  </p>
                </div>

                {/* Digital Verification Status */}
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Certification Numérique Intégrée</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    L'email inclut le sceau cryptographique officiel et un lien sécurisé permettant aux parents d'émarger leur accusé de réception directement sur le portail.
                  </p>
                </div>
              </div>

              {/* Right Column: HTML Email Render Preview */}
              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                  <span>Aperçu du Courriel Réceptionné (Format Mobile & Desktop) :</span>
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                    Gabarit HTML Responsive
                  </span>
                </div>

                {/* Simulated Email Client Container */}
                <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-sm bg-white">
                  {/* Fake Email Client Bar */}
                  <div className="bg-slate-800 text-slate-300 px-4 py-2 text-[11px] flex items-center justify-between border-b border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <span className="font-mono text-slate-400 ml-2">Boîte de réception • {previewStudent.parentEmail}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Notification Automatique</span>
                  </div>

                  {/* Email Body Content */}
                  <div className="p-6 bg-slate-50 space-y-4">
                    {/* Header */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                            <BookOpen className="w-5 h-5 text-indigo-400" />
                          </div>
                          <div>
                            <h2 className="font-black text-sm uppercase tracking-tight text-slate-900">
                              EduSchool International
                            </h2>
                            <p className="text-[10px] text-indigo-700 font-bold uppercase">
                              Direction des Études • Bulletin Scolaire
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 font-bold font-mono text-[10px] rounded-md border border-indigo-200">
                          {selectedTerm}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs text-slate-800">
                          Chers parents de <strong>{previewStudent.name}</strong>,
                        </p>
                        <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          « {personalNote} »
                        </p>
                      </div>

                      {/* Synthesis KPIs */}
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                        <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100">
                          <span className="text-[9px] uppercase font-bold text-indigo-800 block">
                            Moyenne Générale
                          </span>
                          <span className="font-black text-lg text-indigo-950">
                            {summaryData.overallAverage} <span className="text-xs font-normal">/20</span>
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block">
                            Rang Classe
                          </span>
                          <span className="font-bold text-sm text-slate-800 mt-1 block">
                            {summaryData.classRank}
                          </span>
                        </div>

                        <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          <span className="text-[9px] uppercase font-bold text-emerald-800 block">
                            Assiduité
                          </span>
                          <span className="font-bold text-sm text-emerald-900 mt-1 block">
                            {summaryData.attendanceRate}%
                          </span>
                        </div>
                      </div>

                      {/* Honors mention */}
                      <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] font-bold flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Mention : {summaryData.councilHonors.label}</span>
                        </div>
                        <span className="text-[10px] text-amber-700 font-normal">
                          Décision Conseil de Classe
                        </span>
                      </div>

                      {/* Grades Summary Table */}
                      <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-600 uppercase text-[9px] font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2 px-2.5">Discipline</th>
                              <th className="py-2 px-1 text-center">Coeff</th>
                              <th className="py-2 px-1 text-center">Note /20</th>
                              <th className="py-2 px-2.5">Appréciation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {summaryData.subjectsBreakdown.slice(0, 5).map((s, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/60">
                                <td className="py-1.5 px-2.5 font-bold text-slate-800">{s.name}</td>
                                <td className="py-1.5 px-1 text-center font-mono text-slate-500">{s.coefficient}</td>
                                <td className="py-1.5 px-1 text-center font-mono font-bold text-indigo-900">
                                  {s.score.toFixed(1)}
                                </td>
                                <td className="py-1.5 px-2.5 text-slate-600 italic text-[10px] line-clamp-1">
                                  {s.appreciation}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Call-to-action button */}
                      <div className="text-center pt-2">
                        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-sm">
                          <span>Consulter le Bulletin Complet & Émarger</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <p className="text-[9px] text-slate-400 mt-1.5">
                          Lien crypté à authentification unique réservé aux représentants légaux.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Dispatch Delivery Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm">
                  Historique d'Expédition des Bulletins par Email
                </h4>
                <span className="text-slate-500 text-xs">
                  {sentResults.length} / {targetStudents.length} emails délivrés
                </span>
              </div>

              {sentResults.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <Mail className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-medium text-xs">
                    Aucun envoi n'a encore été initié pour cette session.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Cliquez sur le bouton ci-dessous pour déclencher l'envoi automatisé.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Statut</th>
                        <th className="py-2.5 px-3">Élève</th>
                        <th className="py-2.5 px-3">Destinataire Email</th>
                        <th className="py-2.5 px-3">Horodatage Envoi</th>
                        <th className="py-2.5 px-3">Identifiant Message</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sentResults.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Délivré</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">{r.studentName}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-indigo-900">{r.recipientEmail}</td>
                          <td className="py-2.5 px-3 text-slate-600">{r.sentAt}</td>
                          <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{r.messageId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2">
            {!dispatchComplete ? (
              <button
                disabled={isSending}
                onClick={handleStartDispatch}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-60"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Expédition en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {mode === 'single'
                        ? "Envoyer l'Email Officiel au Parent"
                        : `Lancer la Diffusion Automatique (${targetStudents.length} Parents)`}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  setDispatchComplete(false);
                  handleStartDispatch();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ré-expédier</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
