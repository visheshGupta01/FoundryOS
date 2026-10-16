import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import { RecentChatsView } from './components/recent/RecentChatsView';
import { EmployeesView } from './components/employees/EmployeesView';
import { SavedReportsView } from './components/archive/SavedReportsView';
import { PluginsView } from './components/plugins/PluginsView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { ArtifactModal } from './components/modals/ArtifactModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { SettingsView } from './components/settings/SettingsView';

import { LoginPage } from './components/auth/LoginPage';
import { LandingPage } from './components/landing/LandingPage';
import { isAuthenticated, logout } from './services/auth.service';

type AppScreen = 'landing' | 'auth' | 'dashboard';

const AppContent: React.FC = () => {
  const { activeView, setActiveView, theme, toggleTheme } = useApp();
  const [, setIsAuth] = React.useState(isAuthenticated);
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signin');

  const [currentScreen, setCurrentScreen] = React.useState<AppScreen>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if ((hash === '#app' || hash === '#dashboard') && isAuthenticated()) {
        return 'dashboard';
      }
      if (hash === '#login' || hash === '#auth' || hash === '#signup') {
        return 'auth';
      }
    }
    return 'landing';
  });

  React.useEffect(() => {
    const handleAuthChange = () => {
      const auth = isAuthenticated();
      setIsAuth(auth);
      if (!auth) {
        setCurrentScreen('landing');
        try {
          window.history.replaceState(null, '', window.location.pathname);
        } catch {
          window.location.hash = '';
        }
      }
    };

    const handleHashChange = () => {
      const rawHash = window.location.hash.toLowerCase();
      const hash = rawHash.replace(/^#\/?/, '');
      if (hash === 'app' || hash === 'dashboard') {
        if (isAuthenticated()) {
          setCurrentScreen('dashboard');
        } else {
          setAuthMode('signin');
          setCurrentScreen('auth');
        }
      } else if (hash === 'signup') {
        setAuthMode('signup');
        setCurrentScreen('auth');
      } else if (hash === 'login' || hash === 'auth') {
        setAuthMode('signin');
        setCurrentScreen('auth');
      } else {
        setCurrentScreen('landing');
      }
    };

    window.addEventListener('foundry_auth_changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('foundry_auth_changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleLaunchFromLanding = () => {
    if (isAuthenticated()) {
      window.location.hash = '#app';
      setCurrentScreen('dashboard');
    } else {
      setAuthMode('signup');
      window.location.hash = '#signup';
      setCurrentScreen('auth');
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuth(false);
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch {
      window.location.hash = '';
    }
    setCurrentScreen('landing');
  };

  const handleSignInFromLanding = () => {
    if (isAuthenticated()) {
      window.location.hash = '#app';
      setCurrentScreen('dashboard');
    } else {
      setAuthMode('signin');
      window.location.hash = '#login';
      setCurrentScreen('auth');
    }
  };

  if (currentScreen === 'landing') {
    return (
      <LandingPage
        onSignIn={handleSignInFromLanding}
        onLaunchWorkspace={handleLaunchFromLanding}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentScreen === 'auth') {
    return (
      <LoginPage
        key={authMode}
        initialMode={authMode}
        onLoginSuccess={() => {
          setIsAuth(true);
          window.location.hash = '#app';
          setCurrentScreen('dashboard');
          setActiveView('chat');
        }}
        onBackToLanding={() => {
          try {
            window.history.replaceState(null, '', window.location.pathname);
          } catch {
            window.location.hash = '';
          }
          setCurrentScreen('landing');
        }}
      />
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'chat':
        return <WorkspaceView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'recent-chats':
        return <RecentChatsView />;
      case 'employees':
        return <EmployeesView />;
      case 'archive':
        return <SavedReportsView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'plugins':
        return <PluginsView />;
      case 'brain':
      case 'token-analytics':
      case 'settings':
        return <SettingsView />;
      default:
        return <WorkspaceView />;
    }
  };

  return (
    <div style={styles.appLayout}>
      <Sidebar />
      <div style={styles.mainContent}>
        <Header onLogout={handleLogout} />
        <main key={activeView} className="view-transition" style={styles.viewContainer} data-tour="chat-area">
          {renderActiveView()}
        </main>
      </div>

      <ArtifactModal />
      <OnboardingModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appLayout: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative'
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    height: '100vh',
    minHeight: 0,
    overflow: 'hidden',
    background: 'transparent',
    position: 'relative'
  },
  viewContainer: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  }
};
