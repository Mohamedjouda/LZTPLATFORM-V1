import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getListings, updateListings, exportToFile, getListingsByIds, getAllListingIds, getAllListingsForExport } from '../services/apiService';
import { Listing, FilterState, Game, GameFilter } from '../types';
import { formatRelativeTime } from '../utils';
import { SearchIcon, ChevronDown, ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, DownloadCloudIcon, Loader2, EyeOffIcon, ArchiveIcon, ArchiveRestoreIcon } from './Icons';
import { useNotifications } from './NotificationSystem';

const getDealScoreColor = (score: number | null) => {
    if (score === null || score === undefined) return 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300';
    if (score >= 85) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    if (score >= 50) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
};

const getColumnValue = (listing: Listing, columnId: string) => {
    if (columnId in listing) {
        return (listing as any)[columnId];
    }
    return listing.game_specific_data?.[columnId];
};

const FilterField: React.FC<{ filter: GameFilter; values: FilterState; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; }> = ({ filter, values, onChange }) => {
    const commonClasses = "w-full mt-1 p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm";
    
    switch (filter.type) {
        case 'number_range':
            return (
                <div className="flex space-x-2">
                    <input type="number" name={`${filter.id}_min`} value={values[`${filter.id}_min`] || ''} onChange={onChange} placeholder="Min" className={commonClasses} />
                    <input type="number" name={`${filter.id}_max`} value={values[`${filter.id}_max`] || ''} onChange={onChange} placeholder="Max" className={commonClasses} />
                </div>
            );
        case 'select':
            return (
                <select name={filter.id} value={values[filter.id] || ''} onChange={onChange} className={commonClasses}>
                    <option value="">All</option>
                    {filter.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        case 'text':
        default:
            return <input type="text" name={filter.id} value={values[filter.id] || ''} onChange={onChange} placeholder={filter.placeholder || `e.g., specific ${filter.label}`} className={commonClasses} />;
    }
};

interface ListingsPageProps {
  view: 'active' | 'hidden' | 'archived';
  game: Game;
}

const ListingsPage: React.FC<ListingsPageProps> = ({ view, game }) => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [filters, setFilters] = useState<FilterState>({});
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    const [sort, setSort] = useState<string>(game.sorts[0]?.id || 'newest');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSelectingAll, setIsSelectingAll] = useState(false);
    const [isExporting, setIsExporting] = useState<null | 'selected' | 'all'>(null);
    const { addNotification } = useNotifications();


    const fetchAndSetListings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, count } = await getListings(game, view, filters, sort, page, rowsPerPage);
            setListings(data);
            setTotalCount(count);
        } catch (err: any) {
            const message = err instanceof Error ? err.message : JSON.stringify(err);
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }, [game, view, filters, sort, page, rowsPerPage]);

    useEffect(() => {
        fetchAndSetListings();
    }, [fetchAndSetListings]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        setPage(1);
        fetchAndSetListings();
    };
    
    const handleClearFilters = () => {
        setFilters({});
        setPage(1);
    };

    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => { const newSet = new Set(prev); if (newSet.has(id)) newSet.delete(id); else newSet.add(id); return newSet; });
    };
    
    const handleSelectAllVisible = () => {
        setSelectedIds(prev => prev.size === listings.length ? new Set() : new Set(listings.map(l => l.item_id)));
    };

    const handleSelectAll = async () => {
        setIsSelectingAll(true);
        setError(null);
        try {
            const ids = await getAllListingIds(game, view, filters);
            setSelectedIds(new Set(ids));
        } catch (err: any) {
            setError(`Failed to select all listings: ${err.message}`);
        } finally {
            setIsSelectingAll(false);
        }
    };
    
    const handleClearSelection = () => {
        setSelectedIds(new Set());
    };

    const handleBulkAction = async (action: 'hide' | 'unhide' | 'archive' | 'unarchive') => {
        setIsProcessing(true);
        setError(null);
        // FIX: Explicitly type `ids` as `number[]` to resolve TypeScript inference issue.
        const ids: number[] = Array.from(selectedIds);
        try {
            let successMessage = '';
            if (action === 'hide') {
                await updateListings(game.id!, ids, { is_hidden: true });
                successMessage = `${ids.length} listing(s) hidden successfully.`;
            } else if (action === 'unhide') {
                await updateListings(game.id!, ids, { is_hidden: false });
                successMessage = `${ids.length} listing(s) restored successfully.`;
            } else if (action === 'archive') {
                await updateListings(game.id!, ids, { is_archived: true, archived_at: new Date().toISOString(), archived_reason: 'Manually archived' });
                successMessage = `${ids.length} listing(s) archived successfully.`;
            } else if (action === 'unarchive') {
                await updateListings(game.id!, ids, { is_archived: false, archived_at: null, archived_reason: null });
                successMessage = `${ids.length} listing(s) unarchived successfully.`;
            }
            setSelectedIds(new Set());
            fetchAndSetListings();
            addNotification({ type: 'success', message: successMessage, code: 'LST-210' });
        } catch(err: any) {
            const message = `Action failed: ${err.message}`;
            setError(message);
            addNotification({ type: 'error', message: message, code: 'LST-510' });
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleExport = async (type: 'selected' | 'all') => {
        setIsExporting(type);
        setError(null);
        try {
            let listingsToExport: Listing[];
            if (type === 'all') {
                listingsToExport = await getAllListingsForExport(game, view, filters, sort);
            } else { // 'selected'
                // FIX: Explicitly type `ids` as `number[]` to resolve TypeScript inference issue.
                const ids: number[] = Array.from(selectedIds);
                if (ids.length === 0) {
                    addNotification({ type: 'info', message: 'No items selected for export.', code: 'EXP-100' });
                    setIsExporting(null);
                    return;
                }
                listingsToExport = await getListingsByIds(game.id!, ids);
            }

            if (listingsToExport.length > 0) {
                const fileName = `export-${game.slug}-${view}-${new Date().toISOString().split('T')[0]}`;
                const downloadableUrl = await exportToFile(listingsToExport, fileName);
                window.open(downloadableUrl, '_blank');
                addNotification({ type: 'success', message: `${listingsToExport.length} listings exported.`, code: 'EXP-200' });
            } else {
                addNotification({ type: 'info', message: 'No listings found to export.', code: 'EXP-101' });
            }
        } catch (err: any) {
            const message = `Export failed: ${err.message}`;
            setError(message);
            addNotification({ type: 'error', message, code: 'EXP-500' });
        } finally {
            setIsExporting(null);
        }
    }
    
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    const basicFilters = useMemo(() => game.filters.filter(f => !f.is_advanced), [game.filters]);
    const advancedFilters = useMemo(() => game.filters.filter(f => f.is_advanced), [game.filters]);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
                 <div className="relative w-full mb-4">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <SearchIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="title"
                        placeholder="Search by title and press Enter..."
                        value={filters.title || ''}
                        onChange={handleFilterChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                        className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {basicFilters.filter(f => f.id !== 'title').map(filter => (
                         <div key={filter.id}>
                             <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{filter.label}</label>
                             <FilterField filter={filter} values={filters} onChange={handleFilterChange} />
                         </div>
                    ))}
                </div>
                 <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center">
                    {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                </button>
                {showAdvancedFilters && (
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 border-t pt-4 dark:border-gray-700">
                        {advancedFilters.map(filter => (
                            <div key={filter.id}>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{filter.label}</label>
                                <FilterField filter={filter} values={filters} onChange={handleFilterChange} />
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex space-x-2 mt-4">
                    <button onClick={handleApplyFilters} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors">Apply Filters</button>
                    <button onClick={handleClearFilters} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Clear</button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleSelectAllVisible} className="text-sm bg-white dark:bg-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm">{selectedIds.size === listings.length && listings.length > 0 ? 'Deselect Page' : 'Select Page'}</button>
                    <button onClick={handleSelectAll} disabled={isSelectingAll} className="text-sm bg-white dark:bg-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm flex items-center disabled:opacity-50">
                        {isSelectingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : `Select All (${totalCount})`}
                    </button>
                    {selectedIds.size > 0 && <button onClick={handleClearSelection} className="text-sm bg-white dark:bg-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm">Clear ({selectedIds.size})</button>}
                    
                    {view === 'active' && <button onClick={() => handleBulkAction('hide')} className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 disabled:opacity-50 flex items-center" disabled={selectedIds.size === 0 || isProcessing}><EyeOffIcon className="w-4 h-4 inline-block mr-1" />Hide ({selectedIds.size})</button>}
                    {view === 'hidden' && <button onClick={() => handleBulkAction('unhide')} className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center" disabled={selectedIds.size === 0 || isProcessing}>Unhide ({selectedIds.size})</button>}
                    
                    {(view === 'active' || view === 'hidden') && <button onClick={() => handleBulkAction('archive')} className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 disabled:opacity-50 flex items-center" disabled={selectedIds.size === 0 || isProcessing}><ArchiveIcon className="w-4 h-4 inline-block mr-1" />Archive ({selectedIds.size})</button>}
                    {view === 'archived' && <button onClick={() => handleBulkAction('unarchive')} className="text-sm bg-indigo-500 text-white px-3 py-1.5 rounded-md hover:bg-indigo-600 disabled:opacity-50 flex items-center" disabled={selectedIds.size === 0 || isProcessing}><ArchiveRestoreIcon className="w-4 h-4 inline-block mr-1" />Unarchive ({selectedIds.size})</button>}

                    <button onClick={() => handleExport('selected')} className="text-sm bg-blue-500 text-white px-3 py-1.5 rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center" disabled={selectedIds.size === 0 || isExporting !== null}>
                       {isExporting === 'selected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DownloadCloudIcon className="w-4 h-4 inline-block mr-1" />Export Selected ({selectedIds.size})</>}
                    </button>
                     <button onClick={() => handleExport('all')} className="text-sm bg-primary-500 text-white px-3 py-1.5 rounded-md hover:bg-primary-600 disabled:opacity-50 flex items-center" disabled={isExporting !== null}>
                        {isExporting === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <><DownloadCloudIcon className="w-4 h-4 inline-block mr-1" />Export All ({totalCount})</>}
                    </button>
                </div>
                 <div>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm">
                        {game.sorts.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                 {isLoading ? ( <div className="flex justify-center items-center h-96"><Loader2 className="w-12 h-12 animate-spin text-primary-500"/></div>
                ) : error ? ( <div className="text-center p-8 text-red-500">{error}</div>
                ) : listings.length === 0 ? ( <div className="text-center p-8 text-gray-500">No listings found.</div>
                ) : (
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAllVisible} checked={selectedIds.size > 0 && listings.every(l => selectedIds.has(l.item_id))} /></th>
                                {game.columns.map(col => <th key={col.id} scope="col" className="px-6 py-3 whitespace-nowrap" style={{minWidth: col.min_width}}>{col.label}</th>)}
                                {view === 'archived' && <th scope="col" className="px-6 py-3 min-w-[12rem]">Archived Reason</th>}
                                <th scope="col" className="px-6 py-3 whitespace-nowrap">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map((item, index) => (
                                <tr key={item.item_id} className={`border-b dark:border-gray-700 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                                    <td className="w-4 p-4"><input type="checkbox" checked={selectedIds.has(item.item_id)} onChange={() => handleSelectRow(item.item_id)} /></td>
                                    {game.columns.map(col => (
                                        <td key={col.id} className="px-6 py-4" style={{ minWidth: col.min_width }}>
                                            {renderCell(item, col.id)}
                                        </td>
                                    ))}
                                    {view === 'archived' && <td className="px-6 py-4 text-xs max-w-xs truncate">{item.archived_reason}</td>}
                                    <td className="px-6 py-4 whitespace-nowrap">{formatRelativeTime(item.last_seen_at)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {Math.min((page - 1) * rowsPerPage + 1, totalCount)} to {Math.min(page * rowsPerPage, totalCount)} of {totalCount}
                </div>
                 <div className="flex items-center space-x-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="p-2 rounded-md disabled:opacity-50 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <span className="text-sm">Page {page} of {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoading} className="p-2 rounded-md disabled:opacity-50 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm"><ChevronRightIcon className="w-5 h-5"/></button>
                     <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }} className="p-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm">
                        {[25, 50, 100, 250].map(size => <option key={size} value={size}>Show {size}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

function renderCell(listing: Listing, columnId: string) {
    const value = getColumnValue(listing, columnId);
    
    if (columnId === 'url') {
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline"><ExternalLinkIcon className="w-4 h-4"/></a>;
    }
    if (columnId === 'deal_score') {
         return value !== null && value !== undefined ? (
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getDealScoreColor(value)}`}>{value}</span>
        ) : <span className="text-gray-500 dark:text-gray-400">N/A</span>;
    }
    if (['first_seen_at', 'last_seen_at', 'last_activity_at'].includes(columnId)) {
        return value ? <span title={new Date(value).toLocaleString()}>{formatRelativeTime(value)}</span> : 'N/A';
    }
    if (typeof value === 'number') {
        return value.toLocaleString();
    }
    if (typeof value === 'string' && value.length > 50) {
        return <div className="truncate max-w-sm" title={value}>{value}</div>
    }
    if (value === null || value === undefined) {
        return <span className="text-gray-400">N/A</span>;
    }
    return String(value);
}

export default ListingsPage;