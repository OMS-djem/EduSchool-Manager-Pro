/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { TeachersView } from './views/TeachersView';
import { StudentsView } from './views/StudentsView';
import { StaffView } from './views/StaffView';
import { FinancesView } from './views/FinancesView';
import { ExamsView } from './views/ExamsView';
import { ParentalMonitoringView } from './views/ParentalMonitoringView';
import { SubjectsModulesView } from './views/SubjectsModulesView';
import { DigitalLibraryView } from './views/DigitalLibraryView';
import { StudentFeedbackView } from './views/StudentFeedbackView';
import { SettingsView } from './views/SettingsView';

function MainLayout() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [openStudentModal, setOpenStudentModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);

  const { currentRole } = useAuth();
  const { language } = useSchool();

  // If role is strictly parent, default tab can be parent portal
  React.useEffect(() => {
    if (currentRole === 'parent') {
      setCurrentTab('parentMonitoring');
    }
  }, [currentRole]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Global Application Header */}
      <Header onNavigate={(tab) => setCurrentTab(tab)} />

      {/* Main Body with Sidebar & Dynamic View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar currentTab={currentTab} setCurrentTab={setCurrentTab} />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenAddStudent={() => {
                setCurrentTab('students');
                setOpenStudentModal(true);
              }}
              onOpenAddPayment={() => {
                setCurrentTab('finances');
                setOpenPaymentModal(true);
              }}
            />
          )}

          {currentTab === 'teachers' && <TeachersView />}

          {currentTab === 'students' && (
            <StudentsView
              isAddModalOpenInitially={openStudentModal}
              onCloseAddModalInitially={() => setOpenStudentModal(false)}
            />
          )}

          {currentTab === 'staff' && <StaffView />}

          {currentTab === 'finances' && (
            <FinancesView
              isAddModalOpenInitially={openPaymentModal}
              onCloseAddModalInitially={() => setOpenPaymentModal(false)}
            />
          )}

          {currentTab === 'exams' && <ExamsView />}

          {currentTab === 'parentMonitoring' && <ParentalMonitoringView />}

          {currentTab === 'curriculum' && <SubjectsModulesView />}

          {currentTab === 'library' && <DigitalLibraryView />}

          {currentTab === 'feedback' && <StudentFeedbackView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <MainLayout />
      </SchoolProvider>
    </AuthProvider>
  );
}
