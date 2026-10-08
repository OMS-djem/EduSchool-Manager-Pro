import React, { useState } from 'react';
import {
  HeartHandshake,
  Plus,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  UserCheck,
  X,
  CreditCard,
  Send,
  Mail
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { useAuth } from '../context/AuthContext';
import { ParentMonitoringItem, Student } from '../types';
import { ReportCardModal } from '../components/ReportCardModal';

export const ParentalMonitoringView: React.FC = () => {
  const {
    students,
    parentMonitoring,
    attendance,
    saveParentMonitoring,
    saveAttendance,
    language,
    t
  } = useSchool();
  const { currentUser, currentRole } = useAuth();

  // Selected student for the parent view
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    currentUser.linkedStudentId || students[0]?.id || ''
  );
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);
  const [isNewAlertModalOpen, setIsNewAlertModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [appointmentMessage, setAppointmentMessage] = useState('');
  const [appointmentSent, setAppointmentSent] = useState(false);

  // New Alert/Note Form (for teachers & staff)
  const [alertType, setAlertType] = useState<ParentMonitoringItem['type']>('conduct');
  const [alertTitle, setAlertTitle] = useState('');
  const [alertDesc, setAlertDesc] = useState('');
  const [authorName, setAuthorName] = useState(currentUser.name);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  // Filter notes & attendance for selected student
  const studentNotes = parentMonitoring.filter((m) => m.studentId === selectedStudent?.id);
  const studentAttendance = attendance.filter((a) => a.studentId === selectedStudent?.id);

  const handleAcknowledge = async (item: ParentMonitoringItem) => {
    await saveParentMonitoring({
      ...item,
      acknowledgedByParent: true,
    });
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const newItem: ParentMonitoringItem = {
      id: `mon-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      parentId: selectedStudent.parentEmail || 'parent@eduschool.org',
      date: new Date().toISOString().split('T')[0],
      type: alertType,
      title: alertTitle,
      description: alertDesc,
      author: authorName,
      acknowledgedByParent: false,
    };
    await saveParentMonitoring(newItem);
    setIsNewAlertModalOpen(false);
    setAlertTitle('');
    setAlertDesc('');
  };

  const handleSendAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setAppointmentSent(true);
    setTimeout(() => {
      setAppointmentSent(false);
      setIsAppointmentModalOpen(false);
      setAppointmentMessage('');
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Child Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs uppercase font-bold text-indigo-700 tracking-wider">
              {language === 'fr' ? 'Espace Numérique des Familles' : 'Parent & Family Portal'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {language === 'fr' ? 'Suivi Parental & Vie Scolaire' : 'Parental Monitoring & Student Life'}
          </h2>
          <p className="text-xs text-slate-500">
            {language === 'fr'
              ? 'Accès direct aux absences, observations disciplinaires, devoirs et contact enseignants.'
              : 'Direct live access to attendance records, conduct remarks, homework notices, and teachers.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <label className="text-xs text-slate-500 font-medium">
              {language === 'fr' ? 'Élève suivi :' : 'Monitored child:'}
            </label>
            <select
              value={selectedStudent?.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.name} — {stu.gradeClass} ({stu.schoolLevel.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsNewAlertModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'fr' ? 'Nouvelle Note / Alerte' : 'New Notice / Alert'}</span>
          </button>
        </div>
      </div>

      {selectedStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Student Quick Profile & Key Metrics */}
          <div className="space-y-5">
            {/* Student Snapshot Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
                {selectedStudent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <h3 className="font-bold text-slate-900 text-base mt-3">{selectedStudent.name}</h3>
              <p className="text-xs text-indigo-700 font-semibold bg-indigo-50 inline-block px-2.5 py-0.5 rounded-full mt-1 border border-indigo-100">
                {selectedStudent.gradeClass} • {selectedStudent.schoolLevel.toUpperCase()}
              </p>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Matricule: {selectedStudent.matricule}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-left text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Taux Présence</span>
                  <span className="font-extrabold text-emerald-700 text-sm">{selectedStudent.attendanceRate}%</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Scolarité</span>
                  <span className="font-extrabold text-indigo-900 text-sm">
                    {selectedStudent.paidTuition} € / {selectedStudent.totalTuition} €
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setSelectedStudentForReport(selectedStudent)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span>Consulter Bulletin Scolaire Officiel</span>
                </button>
                <button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Demander Rendez-vous Enseignant</span>
                </button>
              </div>
            </div>

            {/* Attendance Feed Box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-sm">
                    {language === 'fr' ? 'Pointage Présence & Retards' : 'Attendance Log'}
                  </h4>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold">Régulier</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {studentAttendance.length > 0 ? (
                  studentAttendance.map((att) => (
                    <div
                      key={att.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block">{att.date}</span>
                        <span className="text-[11px] text-slate-500">{att.reason || 'Enregistré par la Vie Scolaire'}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        att.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                        att.status === 'late' ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {att.status === 'present' ? 'Présent' : att.status === 'late' ? 'Retard' : 'Absence'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs">
                    Aucune absence ou retard injustifié enregistré ce trimestre.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (2 cols): Communications, Homework & Conduct Notices */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {language === 'fr' ? 'Journal des Échanges École - Famille' : 'School - Family Communication Stream'}
              </h3>
              <span className="text-xs text-slate-500">{studentNotes.length} communication(s)</span>
            </div>

            <div className="space-y-3.5">
              {studentNotes.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    item.type === 'alert'
                      ? 'bg-rose-50/60 border-rose-200'
                      : item.type === 'achievement'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : item.type === 'homework'
                      ? 'bg-blue-50/60 border-blue-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {item.title.includes('[Bulletin') ? (
                        <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <>
                          {item.type === 'alert' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                          {item.type === 'achievement' && <Award className="w-4 h-4 text-emerald-600 shrink-0" />}
                          {item.type === 'homework' && <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />}
                          {item.type === 'appointment' && <Calendar className="w-4 h-4 text-purple-600 shrink-0" />}
                          {item.type === 'conduct' && <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </>
                      )}

                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium shrink-0">{item.date}</span>
                  </div>

                  <p className="text-xs text-slate-700 mt-2 leading-relaxed whitespace-pre-line">
                    {item.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-[11px]">
                        Auteur : <strong className="text-slate-800">{item.author}</strong>
                      </span>
                      {item.title.includes('[Bulletin') && selectedStudent && (
                        <button
                          onClick={() => setSelectedStudentForReport(selectedStudent)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Consulter Bulletin Officiel</span>
                        </button>
                      )}
                    </div>

                    {item.acknowledgedByParent ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accusé de réception émargé</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(item)}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                      >
                        Signer / Accuser réception
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Alert Modal */}
      {isNewAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Émettre une Note aux Parents</h3>
              <button onClick={() => setIsNewAlertModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendAlert} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Type de communication</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                >
                  <option value="conduct">Comportement & Discipline</option>
                  <option value="homework">Consigne Devoir Maison</option>
                  <option value="achievement">Félicitations & Encouragements</option>
                  <option value="alert">Alerte Absence / Retard</option>
                  <option value="appointment">Convocation / Rencontre</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Titre de la communication</label>
                <input
                  type="text"
                  required
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  placeholder="ex: Félicitations pour la progression en calcul"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Message pour les parents</label>
                <textarea
                  rows={4}
                  required
                  value={alertDesc}
                  onChange={(e) => setAlertDesc(e.target.value)}
                  placeholder="Détaillez la remarque ou recommandation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Signataire (Professeur / CPE)</label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAlertModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700"
                >
                  Envoyer aux Parents
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Request Modal */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Demande de Rencontre Pédagogique</h3>
              <button onClick={() => setIsAppointmentModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {appointmentSent ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">Demande transmise avec succès !</h4>
                <p className="text-xs text-slate-500">
                  L’équipe pédagogique ou le secrétariat prendra contact pour convenir du créneau.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendAppointment} className="space-y-3.5 mt-4 text-xs">
                <p className="text-slate-600">
                  Transmettez un message au professeur principal ou à la direction pour solliciter un entretien au sujet de <strong>{selectedStudent.name}</strong>.
                </p>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Motif & créneaux souhaités</label>
                  <textarea
                    rows={4}
                    required
                    value={appointmentMessage}
                    onChange={(e) => setAppointmentMessage(e.target.value)}
                    placeholder="ex: Souhaiterait faire un point sur l'orientation et les résultats en sciences. Disponible les mardis après 17h..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  ></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAppointmentModalOpen(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Envoyer la demande</span>
                  </button>
                </div>
              </form>
            )}
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
    </div>
  );
};
