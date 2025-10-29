import React, { useState, useEffect, useCallback, useMemo } from 'react';
// FIX: Removed unused import 'getAllListingIds' which is not exported from supabaseService.
import { getListings, updateListings, exportToFile, getListingsByIds } from '../services/supabaseService';
import { Listing, FilterState, GameSort, Game, GameFilter } from '../types';
import { formatRelativeTime } from '../utils';
import { SearchIcon, ChevronDown, ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, DownloadCloudIcon, Loader2, EyeOffIcon } from './Icons';

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

    const handleBulkAction = async (action: 'hide' | 'unhide' | 'exportSelected') => {
        setIsProcessing(true);
        setError(null);
        const ids = Array.from(selectedIds) as number[];
        try {
            if (action === 'hide') {
                await updateListings(game.id!, ids, { is_hidden: true });
            } else if (action === 'unhide') {
                await updateListings(game.id!, ids, { is_hidden: false });
            } else if (action === 'exportSelected') {
                if (ids.length === 0) { alert("No items selected."); setIsProcessing(false); return; }
                const listingsToExport = await getListingsByIds(game.id!, ids);
                if (listingsToExport.length > 0) {
                    const downloadableUrl = await exportToFile(listingsToExport, `export-${game.slug}-${view}-${new Date().toISOString()}`);
                    window.open(downloadableUrl, '_blank');
                } else {
                    alert("Could not retrieve listings for export.");
                }
            }
            setSelectedIds(new Set());
            fetchAndSetListings();
        } catch(err: any) {
            setError(`Action failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };
    
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
                    <button onClick={handleSelectAllVisible} className="text-sm bg-white dark:bg-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 shadow-sm">{selectedIds.size === listings.length && listings.length > 0 ? 'Clear' : 'Select Visible'}</button>
                    {view === 'active' && <button onClick={() => handleBulkAction('hide')} className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 disabled:opacity-50" disabled={selectedIds.size === 0 || isProcessing}><EyeOffIcon className="w-4 h-4 inline-block mr-1" />Hide ({selectedIds.size})</button>}
                    {view === 'hidden' && <button onClick={() => handleBulkAction('unhide')} className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 disabled:opacity-50" disabled={selectedIds.size === 0 || isProcessing}>Unhide ({selectedIds.size})</button>}
                     <button onClick={() => handleBulkAction('exportSelected')} className="text-sm bg-primary-500 text-white px-3 py-1.5 rounded-md hover:bg-primary-600 disabled:opacity-50" disabled={selectedIds.size === 0 || isProcessing}><DownloadCloudIcon className="w-4 h-4 inline-block mr-1" />Export ({selectedIds.size})</button>
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
                                <th scope="col" className="p-4"><input type="checkbox" onChange={handleSelectAllVisible} checked={selectedIds.size === listings.length && listings.length > 0} /></th>
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
