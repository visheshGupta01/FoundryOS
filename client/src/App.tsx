import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { WorkspaceView } from './components/workspace/WorkspaceView';
import { RecentChatsView } from './components/recent/RecentChatsView';
import { EmployeesView } from './components/employees/EmployeesView';
import { BrainView } from './components/brain/BrainView';
import { SavedReportsView } from './components/archive/SavedReportsView';
import { TokenAnalyticsView } from './components/analytics/TokenAnalyticsView';
import { PluginsView } from './components/plugins/PluginsView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { ApprovalsView } from './components/approvals/ApprovalsView';
import { ArtifactModal } from './components/modals/ArtifactModal';
import { OnboardingModal } from './components/modals/OnboardingModal';
import { SettingsModal } from './components/modals/SettingsModal';

const AppContent: React.FC = () => {
  const { activeView } = useApp();

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
      case 'brain':
        return <BrainView />;
      case 'archive':
        return <SavedReportsView />;
      case 'integrations':
        return <IntegrationsView />;
      case 'token-analytics':
        return <TokenAnalyticsView />;
      case 'plugins':
        return <PluginsView />;
      default:
        return <WorkspaceView />;
    }
  };

  return (
    <div style={styles.appLayout}>
      <Sidebar />
      <div style={styles.mainContent}>
        <Header />
        <main key={activeView} className="view-transition" style={styles.viewContainer} data-tour="chat-area">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      <ArtifactModal />
      <OnboardingModal />
      <SettingsModal />
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
