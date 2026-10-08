import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  X,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  QrCode,
  Sparkles
} from 'lucide-react';
import { Student } from '../types';

interface StudentBadgeModalProps {
  student: Student;
  academicYear: string;
  onClose: () => void;
  language: 'fr' | 'en';
}

export const StudentBadgeModal: React.FC<StudentBadgeModalProps> = ({
  student,
  academicYear,
  onClose,
  language,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    // Encode structured student identity in the QR code
    const payload = JSON.stringify({
      matricule: student.matricule,
      id: student.id,
      name: student.name,
      gradeClass: student.gradeClass,
      schoolLevel: student.schoolLevel,
      parentPhone: student.parentPhone,
      academicYear,
    });

    QRCode.toDataURL(payload, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [student, academicYear]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls Bar */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>{language === 'fr' ? 'Badge Scolaire & QR Code' : 'Student ID Badge & QR Code'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable ID Card Graphic */}
        <div className="p-5 flex flex-col items-center bg-slate-100">
          <div
            id="printable-student-badge"
            className="w-full bg-white rounded-2xl border-2 border-indigo-500/40 shadow-lg p-5 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Top decorative header band */}
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-500"></div>

            {/* School Crest / Header */}
            <div className="relative z-10 flex flex-col items-center mt-1">
              <div className="w-16 h-16 rounded-2xl bg-white p-1 shadow-md border-2 border-indigo-100 mb-2">
                <img
                  src={student.photoUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256`}
                  alt={student.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              </div>

              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-900">
                EduSchool International
              </span>
              <h3 className="font-bold text-base text-slate-900 leading-tight mt-0.5">
                {student.name}
              </h3>

              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold border border-indigo-200">
                  {student.matricule}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
                  {student.gradeClass}
                </span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="my-3 p-2 bg-white rounded-xl border border-slate-200 shadow-inner flex flex-col items-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR ${student.matricule}`}
                  className="w-36 h-36 object-contain"
                />
              ) : (
                <div className="w-36 h-36 flex items-center justify-center text-slate-400 text-xs">
                  Génération QR...
                </div>
              )}
              <span className="text-[9px] font-mono text-slate-400 tracking-wider mt-1">
                SCAN POUR POINTAGE INSTANTANÉ
              </span>
            </div>

            {/* Student Info Details */}
            <div className="w-full space-y-1 text-left text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
              <div className="flex justify-between">
                <span className="text-slate-400">Niveau :</span>
                <span className="font-bold text-slate-700 uppercase">{student.schoolLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Année Scolaire :</span>
                <span className="font-semibold text-slate-800">{academicYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Urgence Responsable :</span>
                <span className="font-medium text-slate-800">{student.parentPhone}</span>
              </div>
            </div>

            {/* Security watermark footer */}
            <div className="mt-3 flex items-center gap-1 text-[9px] text-slate-400 font-semibold uppercase">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Carte Scolaire Officielle Valide</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Fermer
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimer le Badge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
