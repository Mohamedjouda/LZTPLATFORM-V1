import React, { useState, useEffect, useCallback } from 'react';
import { getGames, upsertGame } from '../services/apiService';
import { gamePresets } from '../game-presets';
import { Game } from '../types';
import { PlusIcon, EditIcon, Loader2, AlertTriangle, ChevronDown, XIcon, CogIcon } from './Icons';
import { useNotifications } from './NotificationSystem';

const emptyGame: Omit<Game, 'id' | 'created_at'> = {
    name: '', slug: '', category: '', description: '', api_base_url: 'https://prod-api.lzt.market', list_path: '', check_path_template: '',
    default_filters: {}, columns: [], filters: [], sorts: [], fetch_worker_enabled: true, check_worker_enabled: true, fetch_interval_minutes: 60, fetch_page_limit: 10
};

const ToggleSwitch: React.FC<{ enabled: boolean; onChange: () => void; disabled?: boolean; }> = ({ enabled, onChange, disabled }) => (
  <button
    type="button"
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 ${
      enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
    }`}
    aria-checked={enabled}
    role="switch"
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const JsonTextarea: React.FC<{label: string; value: any; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; name: string; error?: boolean}> = ({ label, value, onChange, name, error }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <textarea
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            rows={5}
            className={`mt-1 block w-full shadow-sm sm:text-sm border rounded-md p-2 font-mono bg-gray-50 dark:bg-gray-900 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
        />
        {error && <p className="mt-1 text-xs text-red-500">Invalid JSON format.</p>}
    </div>
);

const GameFormModal: React.FC<{ game: Partial<Game>; onClose: () => void; onSave: (game: Partial<Game>) => void; }> = ({ game, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Game>>(game);
    const [jsonErrors, setJsonErrors] = useState<Record<string, boolean>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({
            ...prev,
            [name]: isNumber ? (value === '' ? undefined : Number(value)) : value
        }));
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: keyof Game) => {
        const { value } = e.target;
        let isValid = true;
        try {
            const parsed = JSON.parse(value);
            setFormData(prev => ({ ...prev, [field]: parsed }));
        } catch (error) {
            isValid = false;
        }
        setJsonErrors(prev => ({ ...prev, [field]: !isValid }));
        // Also update the raw string value in state so the user can see their input
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const stringifyJson = (data: any) => {
        if (typeof data === 'string') return data;
        return JSON.stringify(data, null, 2);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-12 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl m-4">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">{game.id ? 'Edit Game' : 'Add New Game'}</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="Game Name" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        <input type="text" name="slug" value={formData.slug || ''} onChange={handleChange} placeholder="Slug (e.g., 'fortnite')" className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    {/* Other fields... */}
                    <JsonTextarea label="Columns" name="columns" value={stringifyJson(formData.columns)} onChange={(e) => handleJsonChange(e, 'columns')} error={jsonErrors.columns}/>
                    <JsonTextarea label="Filters" name="filters" value={stringifyJson(formData.filters)} onChange={(e) => handleJsonChange(e, 'filters')} error={jsonErrors.filters}/>
                    <JsonTextarea label="Sorts" name="sorts" value={stringifyJson(formData.sorts)} onChange={(e) => handleJsonChange(e, 'sorts')} error={jsonErrors.sorts}/>
                </div>
                <div className="flex justify-end p-4 border-t dark:border-gray-700 space-x-2">
                    <button onClick={onClose} className="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg">Cancel</button>
                    <button onClick={() => onSave(formData)} className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">Save</button>
                </div>
            </div>
        </div>
    );
};

const GameManagementPage: React.FC<{ onGamesUpdated: () => void; }> = ({ onGamesUpdated }) => {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<Partial<Game> | null>(null);
    const [isUpdating, setIsUpdating] = useState<number | null>(null);
    const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
    const { addNotification } = useNotifications();

    const loadGames = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedGames = await getGames();
            setGames(fetchedGames);
        } catch (err: any) {
            setError(err.message || 'Failed to load games.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadGames();
    }, [loadGames]);

    const handleAdd = () => {
        setSelectedGame(emptyGame);
        setIsModalOpen(true);
    };
    
    const handleAddFromPreset = (presetKey: string) => {
        const preset = (gamePresets as Record<string, Omit<Game, 'id' | 'created_at'>>)[presetKey];
        if (preset) {
            setSelectedGame(preset);
            setIsModalOpen(true);
            setIsPresetDropdownOpen(false);
        }
    }

    const handleEdit = (game: Game) => {
        setSelectedGame(game);
        setIsModalOpen(true);
    };
    
    const handleToggle = async (game: Game, worker: 'fetch' | 'check') => {
      setIsUpdating(game.id!);
      const key = worker === 'fetch' ? 'fetch_worker_enabled' : 'check_worker_enabled';
      const currentValue = game[key] ?? true;
      const updatedGame = { ...game, [key]: !currentValue };
      
      try {
        await upsertGame({ id: updatedGame.id, [key]: updatedGame[key] });
        setGames(games.map(g => g.id === game.id ? updatedGame : g));
        addNotification({ type: 'info', message: `${worker.charAt(0).toUpperCase() + worker.slice(1)} worker for '${game.name}' is now ${!currentValue ? 'enabled' : 'disabled'}.`, code: 'GM-202' });
      } catch (err: any) {
        const message = `Failed to update ${game.name}: ${err.message}`;
        setError(message);
        addNotification({ type: 'error', message, code: 'GM-502' });
        setTimeout(() => setError(null), 3000);
      } finally {
        setIsUpdating(null);
      }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedGame(null);
    };

    const handleModalSave = async (gameToSave: Partial<Game>) => {
        try {
            await upsertGame(gameToSave);
            addNotification({ type: 'success', message: `Game configuration for '${gameToSave.name}' saved successfully.`, code: 'GM-200' });
            handleModalClose();
            onGamesUpdated();
            await loadGames();
        } catch (err: any) {
            const message = `Failed to save game: ${err.message}`;
            addNotification({ type: 'error', message, code: 'GM-501' });
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary-500" /></div>;
    }

    if (error) {
        return <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
                    Define which games to monitor. Add a custom configuration or use a pre-defined preset to start quickly.
                    Workers can be toggled to enable or disable automated data fetching and status checks for each game.
                </p>
                <div className="flex space-x-2 flex-shrink-0">
                    <div className="relative">
                         <button onClick={() => setIsPresetDropdownOpen(prev => !prev)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center">
                            <PlusIcon className="w-5 h-5 mr-2" /> Add from Preset <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                        {isPresetDropdownOpen && (
                            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-10">
                                <div className="py-1" role="menu" aria-orientation="vertical">
                                    {Object.keys(gamePresets).map(key => (
                                        <button key={key} onClick={() => handleAddFromPreset(key)} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600" role="menuitem">
                                            {(gamePresets as any)[key].name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={handleAdd} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 flex items-center">
                        <CogIcon className="w-5 h-5 mr-2" /> Add Custom Game
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <div className="flex">
                        <div className="py-1"><AlertTriangle className="h-5 w-5 text-red-500 mr-3" /></div>
                        <div>
                            <p className="font-bold">An error occurred</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
                    {games.map(game => (
                        <li key={game.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-center space-x-4">
                                <div className="flex-1">
                                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{game.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{game.description}</p>
                                </div>
                                <div className="flex items-center space-x-6 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <label className="font-medium">Fetch</label>
                                        <ToggleSwitch enabled={game.fetch_worker_enabled} onChange={() => handleToggle(game, 'fetch')} disabled={isUpdating === game.id} />
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <label className="font-medium">Check</label>
                                        <ToggleSwitch enabled={game.check_worker_enabled} onChange={() => handleToggle(game, 'check')} disabled={isUpdating === game.id} />
                                    </div>
                                </div>
                                <button onClick={() => handleEdit(game)} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400">
                                    <EditIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            {isModalOpen && selectedGame && (
                <GameFormModal 
                    game={selectedGame}
                    onClose={handleModalClose}
                    onSave={handleModalSave}
                />
            )}
        </div>
    );
};

export default GameManagementPage;
