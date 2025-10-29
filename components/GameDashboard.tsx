import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardCounts, getLatestLogs, addFetchLog, addCheckLog, updateCheckLog, upsertListings, getActiveListingsForCheck, updateListings } from '../services/supabaseService';
import { fetchListings, checkItemStatus } from '../services/lztService';
import { calculateDealScore } from '../services/geminiService';
import { Listing, FetchLog, CheckLog, Game } from '../types';
import { RefreshCwIcon, Loader2, CheckCircle2, XCircle } from './Icons';
import { formatDuration, formatRelativeTime } from '../utils';
import ListingsPage from './ListingsPage';

const StatCard: React.FC<{ title: string; value: number | string; onClick?: () => void }> = ({ title, value, onClick }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`} onClick={onClick}>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
);

const LogTable: React.FC<{ title: string; logs: (FetchLog | CheckLog)[] }> = ({ title, logs }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm col-span-1 lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0">
                    <tr>
                        <th scope="col" className="px-4 py-3">Status</th>
                        <th scope="col" className="px-4 py-3">Details</th>
                        <th scope="col" className="px-4 py-3">Duration</th>
                        <th scope="col" className="px-4 py-3">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length === 0 ? (
                        <tr><td colSpan={4} className="text-center py-8 text-gray-400">No logs yet.</td></tr>
                    ) : logs.map((log, index) => (
                        <tr key={(log as any).id || index} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600/50">
                            <td className="px-4 py-2">{log.status === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : log.status === 'error' ? <XCircle className="w-5 h-5 text-red-500" /> : <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />}</td>
                            <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                {'items_fetched' in log ? `Fetched ${log.items_fetched} items from page ${log.page}.` : `Checked ${log.items_checked} items, archived ${log.items_archived}.`}
                                {log.error_message && <p className="text-xs text-red-500 mt-1 truncate" title={log.error_message}>{log.error_message}</p>}
                            </td>
                            <td className="px-4 py-2">{formatDuration(log.duration_ms)}</td>
                            <td className="px-4 py-2">{log.created_at ? formatRelativeTime(log.created_at) : 'N/A'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

interface GameDashboardProps {
  game: Game;
}

const GameDashboard: React.FC<GameDashboardProps> = ({ game }) => {
    const [view, setView] = useState<'dashboard' | 'active' | 'hidden' | 'archived'>('dashboard');
    const [counts, setCounts] = useState({ active: 0, hidden: 0, archived: 0 });
    const [fetchLogs, setFetchLogs] = useState<FetchLog[]>([]);
    const [checkLogs, setCheckLogs] = useState<CheckLog[]>([]);
    const [workerStatus, setWorkerStatus] = useState({ fetch: 'Idle', check: 'Idle' });
    const [lastError, setLastError] = useState<string | null>(null);

    const refreshData = useCallback(async () => {
        try {
            setLastError(null);
            const [newCounts, { fetchLogs, checkLogs }] = await Promise.all([
                getDashboardCounts(game.id!),
                getLatestLogs(game.id!)
            ]);
            setCounts(newCounts);
            setFetchLogs(fetchLogs);
            setCheckLogs(checkLogs);
        } catch (error: any) {
            setLastError(`Failed to load dashboard data: ${error.message}`);
        }
    }, [game.id]);

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 5000);
        return () => clearInterval(interval);
    }, [refreshData]);

    const handleFetchNow = async () => {
        setWorkerStatus(prev => ({ ...prev, fetch: 'Fetching...' }));
        setLastError(null);
        let currentPage = 1, hasNext = true, totalFetched = 0;
        const startTime = Date.now();

        while (hasNext) {
            const logEntry: Partial<FetchLog> = { game_id: game.id!, page: currentPage, status: 'success' };
            const pageStartTime = Date.now();
            try {
                const { items, hasNextPage } = await fetchListings(currentPage, game, {});
                logEntry.items_fetched = items.length;
                totalFetched += items.length;
                
                if (items.length > 0) {
                     const listingsToUpsert = await Promise.all(items.map(async (item): Promise<Partial<Listing>> => {
                        const listing: Partial<Listing> = {
                            item_id: item.item_id,
                            game_id: game.id!,
                            url: `${game.api_base_url}/${item.item_id}/`,
                            title: item.title,
                            price: item.price,
                            currency: item.currency,
                            is_hidden: false,
                            is_archived: false,
                            last_seen_at: new Date().toISOString(),
                            raw_response: item as any,
                            game_specific_data: {},
                        };
                        game.columns.forEach(col => {
                           if (col.type === 'game_specific' && item[col.id] !== undefined) {
                               listing.game_specific_data![col.id] = item[col.id];
                           }
                        });
                        listing.deal_score = await calculateDealScore(listing, game);
                        return listing;
                    }));
                    await upsertListings(listingsToUpsert);
                }
                hasNext = hasNextPage;
                currentPage++;
            } catch (error: any) {
                logEntry.status = 'error';
                logEntry.error_message = error.message;
                setLastError(`Fetch error on page ${currentPage}: ${error.message}`);
                hasNext = false;
            } finally {
                logEntry.duration_ms = Date.now() - pageStartTime;
                await addFetchLog(logEntry as FetchLog);
                await refreshData();
            }
            if (hasNext) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setWorkerStatus(prev => ({ ...prev, fetch: `Idle. Last fetch found ${totalFetched} items.` }));
    };

    const handleRunChecks = async () => {
        setWorkerStatus(prev => ({ ...prev, check: 'Checking...' }));
        setLastError(null);
        const startTime = Date.now();
        let log: CheckLog | null = null;
        try {
            log = await addCheckLog({ game_id: game.id!, items_checked: 0, items_archived: 0, status: 'in_progress', duration_ms: 0, error_message: null });
            let cursorId = 0, finished = false, totalChecked = 0, totalArchived = 0;
            const batchSize = 50;

            while (!finished) {
                const listings = await getActiveListingsForCheck(game.id!, cursorId, batchSize);
                if (listings.length === 0) { finished = true; break; }

                const results = await Promise.all(listings.map(async (listing) => {
                    const { isActive, reason } = await checkItemStatus(game.api_base_url, game.check_path_template, listing.item_id);
                    if (!isActive) {
                        await updateListings(game.id!, [listing.item_id], { is_archived: true, archived_reason: reason, archived_at: new Date().toISOString() });
                        return true;
                    }
                    return false;
                }));
                
                totalChecked += listings.length;
                totalArchived += results.filter(r => r).length;
                cursorId = listings[listings.length - 1].item_id;

                if (log.id) await updateCheckLog(log.id, { items_checked: totalChecked, items_archived: totalArchived });
                await refreshData();
            }
            if (log.id) await updateCheckLog(log.id, { status: 'success', duration_ms: Date.now() - startTime });
            setWorkerStatus(prev => ({ ...prev, check: `Idle. Checked ${totalChecked} items, archived ${totalArchived}.` }));
        } catch (error: any) {
            if (log?.id) await updateCheckLog(log.id, { status: 'error', error_message: error.message, duration_ms: Date.now() - startTime });
            setLastError(`Check error: ${error.message}`);
            setWorkerStatus(prev => ({...prev, check: 'Error'}));
        } finally {
            await refreshData();
        }
    };
    
    const renderContent = () => {
      switch(view) {
        case 'active': return <ListingsPage view="active" game={game} />;
        case 'hidden': return <ListingsPage view="hidden" game={game} />;
        case 'archived': return <ListingsPage view="archived" game={game} />;
        case 'dashboard':
        default:
          return (
            <div className="space-y-8">
                {lastError && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg"><span className="font-bold">Error: </span>{lastError}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Active Listings" value={counts.active.toLocaleString()} onClick={() => setView('active')} />
                    <StatCard title="Hidden Listings" value={counts.hidden.toLocaleString()} onClick={() => setView('hidden')} />
                    <StatCard title="Archived Listings" value={counts.archived.toLocaleString()} onClick={() => setView('archived')} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold mb-2">Fetch Worker</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 min-h-[40px]">{workerStatus.fetch}</p>
                        <button onClick={handleFetchNow} disabled={workerStatus.fetch.includes('Fetching...')} className="w-full bg-primary-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 flex items-center justify-center">
                            {workerStatus.fetch.includes('Fetching...') ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCwIcon className="w-5 h-5 mr-2" />} Fetch Now
                        </button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold mb-2">Check Worker</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 min-h-[40px]">{workerStatus.check}</p>
                        <button onClick={handleRunChecks} disabled={workerStatus.check.includes('Checking...')} className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center justify-center">
                            {workerStatus.check.includes('Checking...') ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />} Run Checks
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <LogTable title="Latest Fetch Logs" logs={fetchLogs} />
                    <LogTable title="Latest Check Logs" logs={checkLogs} />
                </div>
            </div>
          );
      }
    };
    
    return (
        <div>
            <div className="mb-6">
                <div className="sm:hidden">
                    <select id="tabs" name="tabs" className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm"
                        value={view} onChange={(e) => setView(e.target.value as any)}>
                        <option value="dashboard">Dashboard</option>
                        <option value="active">Active</option>
                        <option value="hidden">Hidden</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                <div className="hidden sm:block">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                            {['dashboard', 'active', 'hidden', 'archived'].map((tab) => (
                                <button key={tab} onClick={() => setView(tab as any)}
                                    className={`${view === tab ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}
                                    whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium capitalize`}>
                                    {tab}
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

export default GameDashboard;
