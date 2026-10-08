import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  X,
  Layers,
  Calendar,
  Building,
  ArrowRight,
  RefreshCw,
  Check,
  Save,
  HelpCircle
} from 'lucide-react';
import { Exam } from '../types';
import { useSchool } from '../context/SchoolContext';
import {
  INSTITUTIONAL_CLASSROOMS,
  STANDARD_TIME_SLOTS,
  checkExamConflicts,
  autoScheduleExamsWithoutConflicts,
  AutomatedScheduleResult
} from '../services/examSchedulerEngine';

interface AutomatedExamSchedulerModalProps {
  onClose: () => void;
}

export const AutomatedExamSchedulerModal: React.FC<AutomatedExamSchedulerModalProps> = ({
  onClose,
}) => {
  const { exams, teachers, staff, saveExam, language, academicYear } = useSchool();

  // Combine teachers and staff for invigilators
  const availableInvigilators = useMemo(() => {
    const list: string[] = [];
    teachers.forEach((t) => list.push(t.name));
    staff.filter((s) => s.status === 'active').forEach((s) => list.push(s.name));
    if (list.length === 0) {
      list.push('Prof. Laurent Diallo', 'Marc Dubois', 'Sophie Laurent', 'M. Jean-Paul Girard', 'Béatrice Fontaine');
    }
    return Array.from(new Set(list));
  }, [teachers, staff]);

  // Current detected conflicts in existing schedule
  const initialConflicts = useMemo(() => {
    return exams
      .map((ex) => ({
        exam: ex,
        report: checkExamConflicts(ex, exams),
      }))
      .filter((item) => item.report.hasConflict);
  }, [exams]);

  const [activeTab, setActiveTab] = useState<'audit' | 'auto_schedule' | 'matrix'>('audit');
  const [scheduleResult, setScheduleResult] = useState<AutomatedScheduleResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Play audio chime
  const playOptimizedChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(554.37, ctx.currentTime + 0.12); // C#5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.24); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.36); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch {
      // Audio fallback
    }
  };

  // Run automated conflict-free optimization
  const handleRunAutoScheduler = () => {
    setIsResolving(true);
    setSavedSuccess(false);

    setTimeout(() => {
      const result = autoScheduleExamsWithoutConflicts(
        exams,
        exams,
        INSTITUTIONAL_CLASSROOMS,
        availableInvigilators
      );
      setScheduleResult(result);
      setIsResolving(false);
      setActiveTab('auto_schedule');
      playOptimizedChime();
    }, 600);
  };

  // Commit updated schedule to database / SchoolContext
  const handleCommitSchedule = async () => {
    if (!scheduleResult) return;
    setIsSavingAll(true);

    for (const exam of scheduleResult.updatedExams) {
      await saveExam(exam);
    }

    setIsSavingAll(false);
    setSavedSuccess(true);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col my-4 max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">
                  Planificateur Automatisé d'Examens & Anti-Conflits
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                  Détection Salles & Surveillants
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Affectation algorithmique intelligente évitant les collisions de locaux et de surveillants
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

        {/* Subheader Navigation */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Diagnostic Conflits</span>
              {initialConflicts.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                  {initialConflicts.length}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  0
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('auto_schedule')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'auto_schedule'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Optimisation Automatique</span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Capacités & Salles</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-600 font-medium">
            <span>Épreuves examinées : </span>
            <strong className="text-slate-900 font-bold">{exams.length} sessions</strong>
            <span className="mx-2">•</span>
            <span>Surveillants mobilisables : </span>
            <strong className="text-indigo-800 font-bold">{availableInvigilators.length}</strong>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs font-sans">
          {/* Tab 1: Conflict Audit */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Conflict Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                  initialConflicts.length > 0
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      initialConflicts.length > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {initialConflicts.length > 0 ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <ShieldCheck className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">
                      {initialConflicts.length > 0
                        ? `${initialConflicts.length} conflit(s) détecté(s) dans le calendrier actuel`
                        : 'Aucun conflit détecté : Calendrier 100% conforme !'}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {initialConflicts.length > 0
                        ? "Certaines épreuves partagent la même salle ou le même surveillant sur un créneau horaire identique."
                        : "Toutes les salles et tous les surveillants sont assignés sans aucun chevauchement horaire."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunAutoScheduler}
                  disabled={isResolving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Résoudre Automatiquement</span>
                </button>
              </div>

              {/* Conflict List */}
              {initialConflicts.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Détail des Collisions Identifiées
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {initialConflicts.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 text-xs">{item.exam.title}</span>
                          <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-mono text-[10px] font-bold border border-rose-200">
                            {item.exam.examDate}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Clock className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Horaire : {item.exam.timeSlot || 'Non défini'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <MapPin className="w-3.5 h-3.5 text-rose-600" />
                            <span>Salle : {item.exam.room || 'Non assignée'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span>Surveillant : {item.exam.invigilatorName || 'Non assigné'}</span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          {item.report.messages.map((msg, mIdx) => (
                            <p key={mIdx} className="text-[10px] text-rose-600 font-semibold leading-tight">
                              ⚠️ {msg}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
                  <p className="font-bold text-slate-700 text-sm">
                    Toutes les épreuves disposent d'un créneau et d'une salle réservés sans conflit !
                  </p>
                  <p className="text-xs text-slate-500">
                    Vous pouvez relancer l'algorithme à tout moment pour optimiser les rotations de surveillants.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Auto Scheduling Results */}
          {activeTab === 'auto_schedule' && (
            <div className="space-y-4">
              {!scheduleResult ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                  <Sparkles className="w-10 h-10 mx-auto text-indigo-500 animate-bounce" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Prêt pour la Planification Automatique Sans Conflit
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      L'algorithme de satisfaction de contraintes assigne instantanément des créneaux, des salles et des surveillants en garantissant zéro superposition horaire.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAutoScheduler}
                    disabled={isResolving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Lancer la Planification Intelligente</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results Summary Box */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-indigo-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Check className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">
                          Planning Optimisé avec Succès (Zéro Conflit)
                        </h4>
                        <p className="text-xs text-slate-600">
                          {scheduleResult.totalExams} épreuves harmonisées • Salles adaptées aux effectifs • Surveillants désignés sans chevauchement.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleCommitSchedule}
                      disabled={isSavingAll}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isSavingAll ? 'Enregistrement...' : savedSuccess ? 'Planning Enregistré ✓' : 'Appliquer et Enregistrer'}</span>
                    </button>
                  </div>

                  {/* Planned Sessions Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                        Calendrier des Épreuves Harmonisées
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                        Anti-Collision Actif
                      </span>
                    </div>

                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Épreuve & Classe</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Créneau Horaire</th>
                          <th className="py-2.5 px-3">Salle Attribuée</th>
                          <th className="py-2.5 px-3">Surveillant Responsable</th>
                          <th className="py-2.5 px-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {scheduleResult.assignmentsSummary.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block">{item.title}</span>
                              <span className="text-[10px] text-slate-400">{item.gradeClass}</span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-700">{item.date}</td>
                            <td className="py-2.5 px-3 font-mono text-indigo-700 font-bold">{item.timeSlot}</td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                {item.room}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-flex items-center gap-1 text-slate-700">
                                <UserCheck className="w-3 h-3 text-indigo-600" />
                                {item.invigilator}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Validé
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Classroom Directory & Capacities */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Inventaire des Salles & Espaces d'Évaluation Disponibles
                </h4>
                <span className="text-slate-500 text-xs">
                  {INSTITUTIONAL_CLASSROOMS.length} locaux répertoriés
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {INSTITUTIONAL_CLASSROOMS.map((room, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-slate-900 text-xs">{room.name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 px-1.5 py-0.2 bg-white rounded border border-slate-200">
                        {room.level.toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Capacité maximale :</span>
                      <strong className="text-indigo-900 font-bold">{room.capacity} places</strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Typologie :</span>
                      <span className="capitalize">{room.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>

          {activeTab === 'audit' && (
            <button
              onClick={handleRunAutoScheduler}
              disabled={isResolving}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Optimiser & Éliminer les Conflits</span>
            </button>
          )}

          {activeTab === 'auto_schedule' && scheduleResult && (
            <button
              onClick={handleCommitSchedule}
              disabled={isSavingAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{savedSuccess ? 'Modifications Appliquées ✓' : 'Valider le Planning Sans Conflit'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
