import React from 'react';
import { X, Printer, CheckCircle, Receipt, Building2 } from 'lucide-react';
import { FinanceTransaction } from '../types';
import { useSchool } from '../context/SchoolContext';

interface ReceiptModalProps {
  transaction: FinanceTransaction;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ transaction, onClose }) => {
  const { academicYear, language } = useSchool();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300">
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">
              {language === 'fr' ? 'Reçu Officiel d’Encaissement' : 'Official Payment Receipt'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'fr' ? 'Imprimer' : 'Print'}</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-5 print:p-0">
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Building2 className="w-5 h-5 text-indigo-600" />
                GROUPE SCOLAIRE EDUSCHOOL
              </div>
              <p className="text-xs text-slate-500">Service de l’Intendance & Comptabilité</p>
              <p className="text-[11px] text-slate-400">Année : {academicYear}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">N° Reçu</span>
              <span className="font-mono font-bold text-sm text-indigo-700">{transaction.invoiceNumber}</span>
              <span className="block text-[11px] text-slate-500 mt-0.5">Date : {transaction.paidDate || new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Bénéficiaire / Élève :</span>
              <span className="font-bold text-slate-900">{transaction.studentName || 'Établissement'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Niveau Scolaire :</span>
              <span className="font-semibold text-slate-700 uppercase">{transaction.schoolLevel || 'Général'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Motif de paiement :</span>
              <span className="font-semibold text-slate-800">{transaction.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mode de règlement :</span>
              <span className="font-medium text-slate-800">{transaction.paymentMethod}</span>
            </div>
            {transaction.notes && (
              <div className="flex justify-between pt-1 border-t border-slate-200 text-slate-600 italic">
                <span>Détails :</span>
                <span>{transaction.notes}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-xs text-emerald-800 uppercase font-semibold">Montant Total Encaissé</span>
            <div className="text-3xl font-extrabold text-emerald-950 mt-0.5">
              {transaction.amount.toLocaleString()} €
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold mt-1">
              <CheckCircle className="w-4 h-4" />
              <span>Règlement validé et acquitté</span>
            </div>
          </div>

          <div className="flex justify-between items-end pt-4 border-t text-xs">
            <div>
              <p className="text-slate-500 text-[11px]">Signature du payeur :</p>
              <div className="border-b border-slate-300 w-28 h-8"></div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 border-2 border-emerald-600 text-emerald-700 rounded font-bold uppercase text-[9px] mb-1">
                ACQUITTÉ - CAISSE
              </div>
              <p className="text-slate-600 font-semibold">L’Intendant Scolaire</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
