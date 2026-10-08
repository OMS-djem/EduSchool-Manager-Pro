import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { UserRole } from '../types';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  roleLabelFr: string;
  roleLabelEn: string;
  roleLabelAr: string;
  linkedStudentId?: string; // For parent & student roles
}

export const DEMO_PROFILES: DemoUser[] = [
  {
    id: 'usr-admin',
    name: 'Béatrice Fontaine',
    email: 'direction@eduschool.org',
    role: 'principal',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    roleLabelFr: 'Chef d’Établissement (Proviseure)',
    roleLabelEn: 'School Principal / Director',
    roleLabelAr: 'مديرة المؤسسة التعليمية',
  },
  {
    id: 'usr-teacher',
    name: 'Prof. Laurent Diallo',
    email: 'laurent.diallo@eduschool.org',
    role: 'teacher',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    roleLabelFr: 'Enseignant - Mathématiques',
    roleLabelEn: 'Mathematics Teacher',
    roleLabelAr: 'أستاذ مادة الرياضيات',
  },
  {
    id: 'usr-bursar',
    name: 'Étienne Girard',
    email: 'finance@eduschool.org',
    role: 'bursar',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    roleLabelFr: 'Intendant & Comptable',
    roleLabelEn: 'Bursar & Finance Officer',
    roleLabelAr: 'المقتصد والمحاسب المالي',
  },
  {
    id: 'usr-parent',
    name: 'Karim Benali',
    email: 'karim.benali@gmail.com',
    role: 'parent',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    roleLabelFr: 'Parent d’élève (Yasmine)',
    roleLabelEn: 'Parent (Yasmine\'s Father)',
    roleLabelAr: 'ولي أمر الطالبة (ياسمين)',
    linkedStudentId: 's-1',
  },
  {
    id: 'usr-student',
    name: 'Yasmine Benali',
    email: 'yasmine.benali@eduschool.org',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    roleLabelFr: 'Élève - Terminale S1',
    roleLabelEn: 'Student - Grade 12',
    roleLabelAr: 'طالبة - السنة النهائية علمي',
    linkedStudentId: 's-1',
  },
  {
    id: 'usr-superadmin',
    name: 'Super Admin IT',
    email: 'admin@eduschool.org',
    role: 'super_admin',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    roleLabelFr: 'Super Administrateur Système',
    roleLabelEn: 'System Super Administrator',
    roleLabelAr: 'المدير العام للنظام المعلوماتي',
  }
];

interface AuthContextType {
  currentUser: DemoUser;
  firebaseUser: User | null;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_PROFILES[0]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setFirebaseUser(user);
      if (user) {
        // If logged in with Google, update user details
        setCurrentUser({
          id: user.uid,
          name: user.displayName || 'Utilisateur Google',
          email: user.email || 'user@google.com',
          role: 'principal',
          avatar: user.photoURL || DEMO_PROFILES[0].avatar,
          roleLabelFr: 'Chef d’Établissement (Connecté)',
          roleLabelEn: 'School Principal (Logged in)',
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const switchRole = (role: UserRole) => {
    const profile = DEMO_PROFILES.find(p => p.role === role) || DEMO_PROFILES[0];
    setCurrentUser(profile);
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.warn('Google sign-in skipped or cancelled:', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setFirebaseUser(null);
      setCurrentUser(DEMO_PROFILES[0]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        currentRole: currentUser.role,
        switchRole,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
