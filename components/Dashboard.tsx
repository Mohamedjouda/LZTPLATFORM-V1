import React, { useState, useEffect, useCallback } from 'react';
import { getDashboardCounts, getLatestLogs, addFetchLog, addCheckLog, updateCheckLog, upsertListings, getActiveListingsForCheck, updateListings } from '../services/supabaseService';
import { fetchListings, checkItemStatus } from '../services/lztService';
import { calculateDealScore } from '../services/geminiService';
import { Listing, FetchLog, CheckLog, Game } from '../types';
import { RefreshCwIcon, Loader2, CheckCircle2, XCircle, AlertTriangle } from './Icons';
import { formatDuration, formatRelativeTime } from '../utils';
import { useNotifications } from './NotificationSystem';

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


interface DashboardProps {
  game: Game;
  onViewChange: (view: 'active' | 'hidden' | 'archived') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ game, onViewChange }) => {
    const [counts, setCounts] = useState({ active: 0, hidden: 0, archived: 0 });
    const [fetchLogs, setFetchLogs] = useState<FetchLog[]>([]);
    const [checkLogs, setCheckLogs] = useState<CheckLog[]>([]);
    const [workerStatus, setWorkerStatus] = useState({ fetch: 'Idle', check: 'Idle' });
    const [lastError, setLastError] = useState<string | null>(null);
    const { addNotification } = useNotifications();

    const isFetchEnabled = game.fetch_worker_enabled ?? true;
    const isCheckEnabled = game.check_worker_enabled ?? true;

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
        if (!isFetchEnabled) return;
        setWorkerStatus(prev => ({ ...prev, fetch: 'Fetching...' }));
        addNotification({ type: 'info', message: `Starting fetch for ${game.name}...`, code: 'F-100' });
        setLastError(null);
        let currentPage = 1, hasNext = true, totalFetched = 0;
        
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
                addNotification({ type: 'success', message: `Page ${currentPage}: Fetched ${items.length} items.`, code: 'F-200' });
                hasNext = hasNextPage;
                currentPage++;
            } catch (error: any) {
                logEntry.status = 'error';
                logEntry.error_message = error.message;
                setLastError(`Fetch error on page ${currentPage}: ${error.message}`);
                addNotification({ type: 'error', message: `Fetch failed on page ${currentPage}: ${error.message}`, code: 'F-500' });
                hasNext = false;
            } finally {
                logEntry.duration_ms = Date.now() - pageStartTime;
                await addFetchLog(logEntry as FetchLog);
                await refreshData();
            }
            if (hasNext) await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setWorkerStatus(prev => ({ ...prev, fetch: `Idle. Last fetch found ${totalFetched} items.` }));
        addNotification({ type: 'success', message: `Fetch complete for ${game.name}. Found ${totalFetched} total items.`, code: 'F-201' });
    };

    const handleRunChecks = async () => {
        if (!isCheckEnabled) return;
        setWorkerStatus(prev => ({ ...prev, check: 'Checking...' }));
        addNotification({ type: 'info', message: `Starting item status checks for ${game.name}...`, code: 'C-100' });
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

                if (log?.id) await updateCheckLog(log.id, { items_checked: totalChecked, items_archived: totalArchived });
                await refreshData();
            }
            if (log?.id) await updateCheckLog(log.id, { status: 'success', duration_ms: Date.now() - startTime });
            setWorkerStatus(prev => ({ ...prev, check: `Idle. Checked ${totalChecked} items, archived ${totalArchived}.` }));
            addNotification({ type: 'success', message: `Checks complete. Checked ${totalChecked}, archived ${totalArchived}.`, code: 'C-200' });
        } catch (error: any) {
            if (log?.id) await updateCheckLog(log.id, { status: 'error', error_message: error.message, duration_ms: Date.now() - startTime });
            setLastError(`Check error: ${error.message}`);
            addNotification({ type: 'error', message: `Check worker failed: ${error.message}`, code: 'C-500' });
            setWorkerStatus(prev => ({...prev, check: 'Error'}));
        } finally {
            await refreshData();
        }
    };
    
    return (
        <div className="space-y-8">
            {lastError && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-center"><AlertTriangle className="w-5 h-5 mr-3" /><span className="font-bold">Error: </span>{lastError}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Active Listings" value={counts.active.toLocaleString()} onClick={() => onViewChange('active')} />
                <StatCard title="Hidden Listings" value={counts.hidden.toLocaleString()} onClick={() => onViewChange('hidden')} />
                <StatCard title="Archived Listings" value={counts.archived.toLocaleString()} onClick={() => onViewChange('archived')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold mb-2">Fetch Worker</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 min-h-[40px]">
                        {isFetchEnabled ? workerStatus.fetch : <span className="text-yellow-500 font-semibold">Worker is disabled.</span>}
                    </p>
                    <button onClick={handleFetchNow} disabled={!isFetchEnabled || workerStatus.fetch.includes('Fetching...')} className="w-full bg-primary-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed flex items-center justify-center">
                        {workerStatus.fetch.includes('Fetching...') ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <RefreshCwIcon className="w-5 h-5 mr-2" />} Fetch Now
                    </button>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold mb-2">Check Worker</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 min-h-[40px]">
                        {isCheckEnabled ? workerStatus.check : <span className="text-yellow-500 font-semibold">Worker is disabled.</span>}
                    </p>
                    <button onClick={handleRunChecks} disabled={!isCheckEnabled || workerStatus.check.includes('Checking...')} className="w-full bg-green-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center">
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

export default Dashboard;