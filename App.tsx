import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GlobalSettings, Game } from './types';
import { initSupabase, getGames } from './services/supabaseService';
import GameDashboard from './components/GameDashboard';
import SettingsPage from './components/SettingsPage';
import GameManagementPage from './components/GameManagementPage';
import ApiInfoPage from './components/ApiInfoPage';
import { SettingsIcon, Loader2, SunIcon, MoonIcon, GameIcon, InfoIcon } from './components/Icons';

type Page = 'game-dashboard' | 'manage-games' | 'settings' | 'api-info';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('settings');
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(storedTheme || (prefersDark ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const loadDataOnMount = useCallback(async (currentSettings: GlobalSettings) => {
    setError(null);
    try {
      const supabase = initSupabase(currentSettings.supabaseUrl, currentSettings.supabaseAnonKey);
      if (supabase) {
        const fetchedGames = await getGames();
        setGames(fetchedGames);
        if (fetchedGames.length > 0) {
          setSelectedGameId(fetchedGames[0].id!);
        }
      }
    } catch (err: any) {
      setError(`Failed to load initial data: ${err.message}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('unified-listings-platform-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setIsLoading(true);
        loadDataOnMount(parsed);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
      setIsLoading(false);
    }
  }, [loadDataOnMount]);

  const handleSettingsSave = useCallback(async (newSettings: GlobalSettings) => {
    setSettings(newSettings);
    localStorage.setItem('unified-listings-platform-settings', JSON.stringify(newSettings));
    setIsLoading(true);
    setError(null);
    try {
      initSupabase(newSettings.supabaseUrl, newSettings.supabaseAnonKey);
      const fetchedGames = await getGames();
      setGames(fetchedGames);
      if (fetchedGames.length > 0) {
        setSelectedGameId(fetchedGames[0].id!);
        setPage('game-dashboard');
      } else {
        setPage('manage-games');
      }
    } catch (err: any) {
       setError(`Failed to save settings and load games: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleGameSelect = (gameId: number) => {
    setSelectedGameId(gameId);
    setPage('game-dashboard');
  };
  
  const handleGamesUpdated = async () => {
    if (settings) {
       setIsLoading(true);
       try {
           const fetchedGames = await getGames();
           setGames(fetchedGames);
       } catch (err: any) {
           setError(`Failed to refresh games: ${err.message}`);
       } finally {
           setIsLoading(false);
       }
    }
  };

  const selectedGame = useMemo(() => {
    return games.find(g => g.id === selectedGameId) || null;
  }, [games, selectedGameId]);

  const pageTitle = useMemo(() => {
    switch(page) {
      case 'game-dashboard': return selectedGame?.name || "Game Dashboard";
      case 'manage-games': return "Manage Games";
      case 'settings': return "Global Settings";
      case 'api-info': return "API Info";
      default: return "UGLP";
    }
  }, [page, selectedGame]);

  const renderView = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin text-primary-500" /></div>;
    }
    if (error) {
        return <div className="p-4 m-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
    }

    if (!settings && page !== 'settings') {
      return <SettingsPage onSave={handleSettingsSave} currentSettings={settings} />;
    }
    
    switch (page) {
      case 'game-dashboard':
        return selectedGame ? <GameDashboard key={selectedGame.id} game={selectedGame} settings={settings!} /> : <div>Select a game</div>;
      case 'manage-games':
        return <GameManagementPage onGamesUpdated={handleGamesUpdated} />;
      case 'settings':
        return <SettingsPage onSave={handleSettingsSave} currentSettings={settings} />;
      case 'api-info':
        return <ApiInfoPage />;
      default:
        return <div>Welcome! Please configure your settings and add a game.</div>;
    }
  };

  const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 group ${active ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title={label}>
      {icon}
      {isSidebarOpen && <span className="ml-4 whitespace-nowrap">{label}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
      <aside className={`flex flex-col bg-gray-800 text-white transition-all duration-300 shadow-2xl z-20 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700/50">
           {isSidebarOpen && <span className="text-xl font-semibold">U.G.L.P.</span>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          <NavItem icon={<GameIcon className="w-6 h-6 flex-shrink-0" />} label="Manage Games" active={page === 'manage-games'} onClick={() => setPage('manage-games')} />
          <hr className="my-2 border-gray-700/50"/>
          {games.map(game => (
            <NavItem 
              key={game.id} 
              icon={<div className="w-6 h-6 flex-shrink-0 flex items-center justify-center text-xs font-bold bg-gray-600 rounded-md">{game.name.substring(0,2).toUpperCase()}</div>} 
              label={game.name} 
              active={page === 'game-dashboard' && selectedGameId === game.id} 
              onClick={() => handleGameSelect(game.id!)} 
            />
          ))}
        </nav>
        <div className="px-2 py-4 border-t border-gray-700/50 space-y-2">
          <NavItem icon={<InfoIcon className="w-6 h-6 flex-shrink-0" />} label="API Info" active={page === 'api-info'} onClick={() => setPage('api-info')} />
          <NavItem icon={<SettingsIcon className="w-6 h-6 flex-shrink-0" />} label="Settings" active={page === 'settings'} onClick={() => setPage('settings')} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 z-10 flex-shrink-0">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">{pageTitle}</h1>
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900 transition-colors" aria-label="Toggle theme">
                {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
        </header>
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-950">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;