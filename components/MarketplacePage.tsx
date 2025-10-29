import React, { useState } from 'react';
import { Game } from '../types';
import Dashboard from './Dashboard';
import ListingsPage from './ListingsPage';

type View = 'dashboard' | 'active' | 'hidden' | 'archived';

interface MarketplacePageProps {
  game: Game;
}

const MarketplacePage: React.FC<MarketplacePageProps> = ({ game }) => {
    const [view, setView] = useState<View>('dashboard');

    const renderContent = () => {
      switch(view) {
        case 'active': return <ListingsPage view="active" game={game} />;
        case 'hidden': return <ListingsPage view="hidden" game={game} />;
        case 'archived': return <ListingsPage view="archived" game={game} />;
        case 'dashboard':
        default:
          return <Dashboard game={game} onViewChange={setView} />;
      }
    };
    
    const tabs: {id: View, label: string}[] = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'active', label: 'Active Listings' },
        { id: 'hidden', label: 'Hidden' },
        { id: 'archived', label: 'Archived' },
    ];

    return (
        <div>
            <div className="mb-6">
                <div className="sm:hidden">
                    <select id="tabs" name="tabs" className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        value={view} onChange={(e) => setView(e.target.value as View)}>
                        {tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                    </select>
                </div>
                <div className="hidden sm:block">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {tabs.map((tab) => (
                                <button key={tab.id} onClick={() => setView(tab.id)}
                                    className={`${view === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}
                                    whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium capitalize`}>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>
            {renderContent()}
        </div>
    );
};

export default MarketplacePage;
