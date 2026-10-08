import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Mail,
  Phone,
  Shield,
  Building,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Staff } from '../types';

export const StaffView: React.FC = () => {
  const { staff, saveStaff, deleteStaff, language, t } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState<Staff['department']>('Administration');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'active' | 'on_leave'>('active');

  const departments: Staff['department'][] = [
    'Administration',
    'Finance',
    'Student Affairs',
    'Logistics',
    'Library',
    'Health & Counseling',
  ];

  const filteredStaff = staff.filter((st) => {
    const matchesDept = deptFilter === 'all' || st.department === deptFilter;
    const matchesSearch =
      st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setName('');
    setRole('');
    setDepartment('Administration');
    setEmail('');
    setPhone('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Staff) => {
    setEditingStaff(st);
    setName(st.name);
    setRole(st.role);
    setDepartment(st.department);
    setEmail(st.email);
    setPhone(st.phone);
    setStatus(st.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Staff = {
      id: editingStaff ? editingStaff.id : `st-${Date.now()}`,
      name,
      role,
      department,
      schoolLevel: 'all',
      email,
      phone,
      status,
      joinDate: editingStaff?.joinDate || new Date().toISOString().split('T')[0],
    };
    await saveStaff(updated);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {language === 'fr' ? 'Personnel Administratif & Technique' : 'Administrative & Operational Staff'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'fr'
              ? 'Direction, intendance, vie scolaire, santé, CDI et maintenance générale.'
              : 'Leadership, bursar, student life, healthcare, library, and facility teams.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={language === 'fr' ? 'Rechercher un membre...' : 'Search staff...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 w-48 sm:w-56"
            />
          </div>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">{language === 'fr' ? 'Tous Départements' : 'All Departments'}</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addStaff')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStaff.map((st) => (
          <div
            key={st.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-sm">
                    {st.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{st.name}</h3>
                    <p className="text-xs text-indigo-600 font-medium">{st.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(st)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteStaff(st.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Building className="w-3 h-3 text-slate-400" />
                  <span>{st.department}</span>
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  st.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {st.status === 'active' ? 'En poste' : 'En congé'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[11px] text-slate-400">Depuis : {st.joinDate}</span>
              <div className="flex items-center gap-2.5">
                <a href={`mailto:${st.email}`} className="text-slate-400 hover:text-indigo-600" title={st.email}>
                  <Mail className="w-4 h-4" />
                </a>
                <a href={`tel:${st.phone}`} className="text-slate-400 hover:text-indigo-600" title={st.phone}>
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {editingStaff
                  ? (language === 'fr' ? 'Modifier Personnel' : 'Edit Staff')
                  : (language === 'fr' ? 'Nouveau Membre du Personnel' : 'New Staff Member')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom Complet</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mme. Valérie Tessier"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Rôle / Titre du Poste</label>
                <input
                  type="text"
                  required
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="Intendant, CPE, Responsable CDI..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Département</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@eduschool.org"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+33 1 ..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  />
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
    </div>
  );
};
