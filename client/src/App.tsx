import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { ComparePage } from './pages/ComparePage';
import { SavedComparisonsPage } from './pages/SavedComparisonsPage';
import { PinnedReposPage } from './pages/PinnedReposPage';
import { Activity, Github, Heart } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedUsername, setSelectedUsername] = useState<string>('torvalds');

  const handleSelectDeveloper = (username: string) => {
    setSelectedUsername(username);
    setActiveTab('profile');
  };

  const handleBackToHome = () => {
    setActiveTab('home');
  };

  const handleNavigateToCompare = () => {
    setActiveTab('compare');
  };

  const handleNavigateToSaved = () => {
    setActiveTab('saved');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSearch={handleSelectDeveloper}
      />

      {/* Main Page Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            onSelectDeveloper={handleSelectDeveloper}
            onNavigateToCompare={handleNavigateToCompare}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            username={selectedUsername}
            onBack={handleBackToHome}
            onNavigateToCompare={handleNavigateToCompare}
          />
        )}

        {activeTab === 'compare' && (
          <ComparePage
            onViewProfile={handleSelectDeveloper}
            onNavigateToSaved={handleNavigateToSaved}
          />
        )}

        {activeTab === 'saved' && (
          <SavedComparisonsPage onLoadComparison={handleNavigateToCompare} />
        )}

        {activeTab === 'pinned' && (
          <PinnedReposPage onViewDeveloper={handleSelectDeveloper} />
        )}
      </main>

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Activity className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-300">StackPulse</span>
            <span>— Full-Stack Developer Intelligence & Comparison Platform</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Built with React, TypeScript & PostgreSQL</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Engineered with <Heart className="w-3 h-3 text-red-500 fill-current" />
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CompareProvider>
        <AppContent />
      </CompareProvider>
    </AuthProvider>
  );
};

export default App;
