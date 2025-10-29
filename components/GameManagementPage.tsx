import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getGames, upsertGame } from '../services/apiService';
import { gamePresets } from '../game-presets';
import { Game, GameColumn, GameFilter, GameSort } from '../types';
import { PlusIcon, EditIcon, Trash2Icon, XIcon, Loader2, AlertTriangle, ChevronDown, GripVertical, PlusCircleIcon } from './Icons';
import { useNotifications } from './NotificationSystem';

const emptyGame: Omit<Game, 'id' | 'created_at'> = {
    name: '', slug: '', category: '', description: '', api_base_url: 'https://prod-api.lzt.market', list_path: '', check_path_template: '',
    default_filters: {}, columns: [], filters: [], sorts: [], fetch_worker_enabled: true, check_worker_enabled: true,
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


const GameManagementPage: React.FC<{ onGamesUpdated: () => void; }> = ({ onGamesUpdated }) => {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGame, setSelectedGame] = useState<Partial<Game> | null>(null);
    const [isUpdating, setIsUpdating] = useState<number | null>(null);
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
            loadGames();
        } catch (err: any) {
            const message = `Error saving game: ${err.message}`;
            addNotification({ type: 'error', message, code: 'GM-501' });
            alert(message);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-12 h-12 animate-spin text-primary-500"/></div>;
    }
    
    return (
        <div className="space-y-6">
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert"><p>{error}</p></div>}
            
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Game Configurations</h1>
                <div className="flex space-x-2">
                    <PresetDropdown onSelect={handleAddFromPreset} />
                    <button onClick={handleAdd} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 flex items-center">
                        <PlusIcon className="w-5 h-5 mr-2" /> Add New Game
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">API Endpoint</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fetch Worker</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check Worker</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {games.map((game) => (
                            <tr key={game.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900 dark:text-white">{game.name}</div><div className="text-sm text-gray-500 dark:text-gray-400">{game.slug}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{game.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">{game.list_path || '/'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <ToggleSwitch
                                        enabled={game.fetch_worker_enabled ?? true}
                                        onChange={() => handleToggle(game, 'fetch')}
                                        disabled={isUpdating === game.id}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <ToggleSwitch
                                        enabled={game.check_worker_enabled ?? true}
                                        onChange={() => handleToggle(game, 'check')}
                                        disabled={isUpdating === game.id}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEdit(game)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200 p-1"><EditIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                         {games.length === 0 && (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-500">No game configurations found. Add one to get started.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {isModalOpen && selectedGame && <GameModal game={selectedGame} onClose={handleModalClose} onSave={handleModalSave} />}
        </div>
    );
};

// ... (The rest of the file remains the same, no need to repeat it)
const PresetDropdown: React.FC<{onSelect: (key: string) => void}> = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 flex items-center">
                <PlusIcon className="w-5 h-5 mr-2" /> Add from Preset <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}/>
            </button>
            {isOpen && (
                <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg max-h-80 overflow-y-auto right-0">
                    {Object.entries(gamePresets).map(([key, preset]) => (
                        <button key={key} onClick={() => { onSelect(key); setIsOpen(false); }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                            {preset.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

const GameModal: React.FC<{ game: Partial<Game>, onClose: () => void, onSave: (game: Partial<Game>) => void }> = ({ game, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Game>>({
      ...game,
      default_filters: game.default_filters || {},
      columns: game.columns || [],
      filters: game.filters || [],
      sorts: game.sorts || [],
    });

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold">{formData.id ? `Edit ${formData.name}`: 'Add New Game'}</h2>
                    <button onClick={onClose}><XIcon className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="name" label="Name" value={formData.name || ''} onChange={handleTextChange} required />
                        <Input name="slug" label="Slug" value={formData.slug || ''} onChange={handleTextChange} required />
                        <Input name="category" label="Category" value={formData.category || ''} onChange={handleTextChange} />
                        <Input name="api_base_url" label="API Base URL" value={formData.api_base_url || ''} onChange={handleTextChange} required />
                        <Input name="list_path" label="List Path" value={formData.list_path || ''} onChange={handleTextChange} />
                        <Input name="check_path_template" label="Check Path Template" value={formData.check_path_template || ''} onChange={handleTextChange} placeholder="{id}/check-account" />
                    </div>
                    <TextArea name="description" label="Description" value={formData.description || ''} onChange={handleTextChange} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-700">
                       <p className="md:col-span-2 text-sm text-gray-500">Use the forms below to configure the UI and API parameters for this game.</p>
                       
                       <KeyValueEditor
                         title="Default Filters"
                         data={formData.default_filters || {}}
                         onChange={(newData) => setFormData(prev => ({...prev, default_filters: newData}))}
                       />
                       <DraggableListEditor
                         title="Columns"
                         items={formData.columns || []}
                         onChange={(newItems) => setFormData(prev => ({...prev, columns: newItems as GameColumn[]}))}
                         itemSchema={{ id: '', label: '', type: 'core', is_numeric: false, min_width: '' }}
                         renderItem={(item: GameColumn) => `${item.label} (${item.id})`}
                         editorComponent={ColumnEditor}
                       />
                       <DraggableListEditor
                         title="Filters"
                         items={formData.filters || []}
                         onChange={(newItems) => setFormData(prev => ({...prev, filters: newItems as GameFilter[]}))}
                         itemSchema={{ id: '', label: '', type: 'text', is_advanced: false }}
                         renderItem={(item: GameFilter) => `${item.label} (${item.type})`}
                         editorComponent={FilterEditor}
                       />
                       <DraggableListEditor
                         title="Sorts"
                         items={formData.sorts || []}
                         onChange={(newItems) => setFormData(prev => ({...prev, sorts: newItems as GameSort[]}))}
                         itemSchema={{ id: '', label: '', column: '', ascending: false }}
                         renderItem={(item: GameSort) => `${item.label} (by ${item.column})`}
                         editorComponent={SortEditor}
                       />

                    </div>
                </form>
                 <div className="flex justify-end p-4 border-t dark:border-gray-700">
                    <button onClick={onClose} type="button" className="mr-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">Save Game</button>
                </div>
            </div>
        </div>
    );
};


// Key-Value Editor for Default Filters
const KeyValueEditor: React.FC<{ title: string; data: Record<string, string>; onChange: (data: Record<string, string>) => void; }> = ({ title, data, onChange }) => {
    const entries = useMemo(() => Object.entries(data), [data]);

    const handleUpdate = (index: number, key: string, value: string) => {
        const newEntries = [...entries];
        newEntries[index] = [key, value];
        onChange(Object.fromEntries(newEntries));
    };
    
    const handleAdd = () => onChange({ ...data, [`new_filter_${Date.now()}`]: '' });

    const handleDelete = (key: string) => {
        const newData = { ...data };
        delete newData[key];
        onChange(newData);
    };

    return (
        <div className="space-y-2 rounded-lg border dark:border-gray-700 p-4">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                <button type="button" onClick={handleAdd} className="text-primary-500 hover:text-primary-700"><PlusCircleIcon className="w-5 h-5" /></button>
            </div>
            {entries.map(([key, value], index) => (
                <div key={index} className="flex items-center space-x-2">
                    <input type="text" value={key} onChange={(e) => handleUpdate(index, e.target.value, value)} placeholder="Key" className="flex-1 p-1.5 text-sm rounded-md bg-gray-50 dark:bg-gray-700 border dark:border-gray-600" />
                    <input type="text" value={value} onChange={(e) => handleUpdate(index, key, e.target.value)} placeholder="Value" className="flex-1 p-1.5 text-sm rounded-md bg-gray-50 dark:bg-gray-700 border dark:border-gray-600" />
                    <button type="button" onClick={() => handleDelete(key)} className="text-red-500 hover:text-red-700 p-1"><Trash2Icon className="w-4 h-4" /></button>
                </div>
            ))}
        </div>
    );
};


// Generic Drag-and-Drop List Editor
const DraggableListEditor: React.FC<{title: string; items: any[]; onChange: (items: any[]) => void; itemSchema: any; renderItem: (item: any) => string; editorComponent: React.FC<any>;}> = ({ title, items, onChange, itemSchema, renderItem, editorComponent: EditorComponent }) => {
    const [editing, setEditing] = useState<{ item: any; index: number } | 'new' | null>(null);
    const dragItem = React.useRef<number | null>(null);
    const dragOverItem = React.useRef<number | null>(null);

    const handleDrop = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newItems = [...items];
        const [draggedItem] = newItems.splice(dragItem.current, 1);
        newItems.splice(dragOverItem.current, 0, draggedItem);
        dragItem.current = null;
        dragOverItem.current = null;
        onChange(newItems);
    };

    const handleSave = (item: any) => {
        const newItems = [...items];
        if (editing === 'new') {
            newItems.push(item);
        } else if (editing) {
            newItems[editing.index] = item;
        }
        onChange(newItems);
        setEditing(null);
    };
    
    const handleDelete = (index: number) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            onChange(items.filter((_, i) => i !== index));
        }
    }

    return (
        <div className="space-y-2 rounded-lg border dark:border-gray-700 p-4">
            <div className="flex justify-between items-center mb-2">
                 <h3 className="font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
                <button type="button" onClick={() => setEditing('new')} className="text-primary-500 hover:text-primary-700"><PlusCircleIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1">
            {items.map((item, index) => (
                <div key={index} draggable
                     onDragStart={() => dragItem.current = index}
                     onDragEnter={() => dragOverItem.current = index}
                     onDragEnd={handleDrop}
                     onDragOver={(e) => e.preventDefault()}
                     className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md group">
                    <div className="flex items-center">
                        <GripVertical className="w-5 h-5 mr-2 text-gray-400 cursor-grab" />
                        <span className="text-sm">{renderItem(item)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                       <button type="button" onClick={() => setEditing({item, index})} className="text-gray-400 hover:text-blue-500"><EditIcon className="w-4 h-4" /></button>
                       <button type="button" onClick={() => handleDelete(index)} className="text-gray-400 hover:text-red-500"><Trash2Icon className="w-4 h-4" /></button>
                    </div>
                </div>
            ))}
            </div>
            {editing !== null && <EditorComponent item={editing === 'new' ? itemSchema : editing.item} onSave={handleSave} onClose={() => setEditing(null)} />}
        </div>
    );
};

// Sub-Modals for Editing specific item types
const EditorModalBase: React.FC<{ title: string, onClose: () => void, children: React.ReactNode, onSave: () => void }> = ({ title, onClose, children, onSave }) => (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-60">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
                <h3 className="text-lg font-bold">{title}</h3>
                <button onClick={onClose}><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">{children}</div>
            <div className="flex justify-end p-4 border-t dark:border-gray-700">
                <button onClick={onClose} type="button" className="mr-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={onSave} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Save</button>
            </div>
        </div>
    </div>
);

const ColumnEditor: React.FC<{ item: GameColumn, onSave: (item: GameColumn) => void, onClose: () => void }> = ({ item, onSave, onClose }) => {
    const [data, setData] = useState(item);
    return <EditorModalBase title={item.id ? "Edit Column" : "Add Column"} onClose={onClose} onSave={() => onSave(data)}>
        <Input label="ID" value={data.id} onChange={e => setData({...data, id: e.target.value})} />
        <Input label="Label" value={data.label} onChange={e => setData({...data, label: e.target.value})} />
        <Select label="Type" value={data.type} onChange={e => setData({...data, type: e.target.value as any})} options={['core', 'game_specific']} />
        <Checkbox label="Is Numeric" checked={data.is_numeric || false} onChange={e => setData({...data, is_numeric: e.target.checked})} />
        <Input label="Min Width (e.g., 10rem)" value={data.min_width || ''} onChange={e => setData({...data, min_width: e.target.value})} />
    </EditorModalBase>;
};

const FilterEditor: React.FC<{ item: GameFilter, onSave: (item: GameFilter) => void, onClose: () => void }> = ({ item, onSave, onClose }) => {
    const [data, setData] = useState(item);
    return <EditorModalBase title={item.id ? "Edit Filter" : "Add Filter"} onClose={onClose} onSave={() => onSave(data)}>
        <Input label="ID" value={data.id} onChange={e => setData({...data, id: e.target.value})} />
        <Input label="Label" value={data.label} onChange={e => setData({...data, label: e.target.value})} />
        <Select label="Type" value={data.type} onChange={e => setData({...data, type: e.target.value as any})} options={['text', 'number_range', 'select']} />
        {data.type === 'text' && <>
            <Input label="Param Name" value={data.param_name || ''} onChange={e => setData({...data, param_name: e.target.value})} />
            <Input label="Placeholder" value={data.placeholder || ''} onChange={e => setData({...data, placeholder: e.target.value})} />
        </>}
        {data.type === 'number_range' && <>
            <Input label="Min Param Name" value={data.param_name_min || ''} onChange={e => setData({...data, param_name_min: e.target.value})} />
            <Input label="Max Param Name" value={data.param_name_max || ''} onChange={e => setData({...data, param_name_max: e.target.value})} />
        </>}
        {data.type === 'select' && <>
             <Input label="Param Name" value={data.param_name || ''} onChange={e => setData({...data, param_name: e.target.value})} />
             <TextArea label="Options (comma-separated)" value={Array.isArray(data.options) ? data.options.join(', ') : ''} onChange={e => setData({...data, options: e.target.value.split(',').map(s => s.trim())})} />
        </>}
        <Checkbox label="Is Advanced" checked={data.is_advanced} onChange={e => setData({...data, is_advanced: e.target.checked})} />
    </EditorModalBase>;
};

const SortEditor: React.FC<{ item: GameSort, onSave: (item: GameSort) => void, onClose: () => void }> = ({ item, onSave, onClose }) => {
    const [data, setData] = useState(item);
    return <EditorModalBase title={item.id ? "Edit Sort" : "Add Sort"} onClose={onClose} onSave={() => onSave(data)}>
        <Input label="ID" value={data.id} onChange={e => setData({...data, id: e.target.value})} />
        <Input label="Label" value={data.label} onChange={e => setData({...data, label: e.target.value})} />
        <Input label="Column" value={data.column} onChange={e => setData({...data, column: e.target.value})} />
        <Checkbox label="Ascending" checked={data.ascending} onChange={e => setData({...data, ascending: e.target.checked})} />
    </EditorModalBase>;
};

// Generic Form Components for Modals
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div>
        <label htmlFor={props.name || label} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input {...props} id={props.name || label} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 p-2" />
    </div>
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & {label: string}> = ({label, ...props}) => (
     <div>
        <label htmlFor={props.name || label} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <textarea {...props} id={props.name || label} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 p-2" />
    </div>
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & {label: string, options: string[]}> = ({label, options, ...props}) => (
    <div>
        <label htmlFor={props.name || label} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <select {...props} id={props.name || label} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 p-2">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & {label: string}> = ({label, ...props}) => (
    <div className="flex items-center mt-2">
        <input {...props} type="checkbox" id={props.name || label} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
        <label htmlFor={props.name || label} className="ml-2 block text-sm text-gray-900 dark:text-gray-300">{label}</label>
    </div>
);


export default GameManagementPage;
