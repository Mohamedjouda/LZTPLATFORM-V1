import React, { useState, useEffect } from 'react';
import { Game } from '../types';
import { getGames, upsertGame, deleteGame } from '../services/supabaseService';
import { Loader2 } from './Icons';

const GameManagementPage: React.FC<{onGamesUpdated: () => void}> = ({onGamesUpdated}) => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGame, setEditingGame] = useState<Partial<Game> | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        setIsLoading(true);
        const data = await getGames();
        setGames(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGames();
  }, []);

  const handleAddNew = () => {
    const newGame: Partial<Game> = {
      name: '', slug: '', category: '', description: '', api_base_url: 'https://prod-api.lzt.market',
      list_path: '', check_path_template: '', default_filters: {}, columns: [], filters: [], sorts: [],
    };
    setEditingGame(newGame);
  };

  const handleSave = async (gameToSave: Partial<Game>) => {
    try {
        setIsLoading(true);
        await upsertGame(gameToSave);
        const data = await getGames();
        setGames(data);
        setEditingGame(null);
        onGamesUpdated();
    } catch(err: any) {
        setError(`Failed to save game: ${err.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>;
  }
  
  if (editingGame) {
    return <GameEditor game={editingGame} onSave={handleSave} onCancel={() => setEditingGame(null)} onGamesUpdated={onGamesUpdated} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Configured Games</h1>
        <button onClick={handleAddNew} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700">Add Custom Game</button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {games.map(game => (
            <li key={game.id} className="p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div>
                <p className="text-lg font-semibold text-primary-600 dark:text-primary-400">{game.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{game.description}</p>
              </div>
              <button onClick={() => setEditingGame(game)} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500">Edit</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

interface GameEditorProps {
    game: Partial<Game>;
    onSave: (game: Partial<Game>) => void;
    onCancel: () => void;
    onGamesUpdated: () => void;
}

const GameEditor: React.FC<GameEditorProps> = ({game, onSave, onCancel, onGamesUpdated}) => {
    const [formData, setFormData] = useState(game);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        try {
            const parsed = JSON.parse(value);
            setFormData(prev => ({...prev, [name]: parsed}));
        } catch(e) {
            // Maybe show an error to the user
            console.error("Invalid JSON:", e);
        }
    }

    const handleDelete = async () => {
        if (!formData.id) return;
        if (window.confirm(`Are you sure you want to delete "${formData.name}"? This will also delete all associated listings and logs. This action cannot be undone.`)) {
            setIsDeleting(true);
            try {
                await deleteGame(formData.id);
                onGamesUpdated();
                onCancel();
            } catch (err: any) {
                alert(`Failed to delete game: ${err.message}`);
            } finally {
                setIsDeleting(false);
            }
        }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm max-w-4xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold">{formData.id ? 'Edit Game' : 'Add New Game'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Name" name="name" value={formData.name || ''} onChange={handleChange} />
                <InputField label="Slug" name="slug" value={formData.slug || ''} onChange={handleChange} />
            </div>
            <InputField label="Category" name="category" value={formData.category || ''} onChange={handleChange} />
            <InputField label="Description" name="description" value={formData.description || ''} onChange={handleChange} as="textarea" />
            <h3 className="text-xl font-bold border-t dark:border-gray-700 pt-4 mt-4">API Config</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <InputField label="API Base URL" name="api_base_url" value={formData.api_base_url || ''} onChange={handleChange} />
                 <InputField label="List Path" name="list_path" value={formData.list_path || ''} onChange={handleChange} />
                 <InputField label="Check Path Template" name="check_path_template" value={formData.check_path_template || ''} onChange={handleChange} placeholder="/{id}" />
            </div>
            <JsonField label="Default Filters (JSON)" name="default_filters" value={JSON.stringify(formData.default_filters || {}, null, 2)} onChange={handleJsonChange} />
            <h3 className="text-xl font-bold border-t dark:border-gray-700 pt-4 mt-4">UI Config</h3>
            <JsonField label="Columns (JSON)" name="columns" value={JSON.stringify(formData.columns || [], null, 2)} onChange={handleJsonChange} />
            <JsonField label="Filters (JSON)" name="filters" value={JSON.stringify(formData.filters || [], null, 2)} onChange={handleJsonChange} />
            <JsonField label="Sorts (JSON)" name="sorts" value={JSON.stringify(formData.sorts || [], null, 2)} onChange={handleJsonChange} />

            <div className="flex justify-end items-center gap-4 pt-4 border-t dark:border-gray-700">
                {formData.id && (
                    <button 
                        onClick={handleDelete} 
                        disabled={isDeleting}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-red-400 mr-auto flex items-center"
                    >
                         {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Delete Game
                    </button>
                )}
                <button onClick={onCancel} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button onClick={() => onSave(formData)} className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg">Save Game</button>
            </div>
        </div>
    );
}

const InputField: React.FC<{label: string, name: string, value: string, onChange: any, placeholder?: string, as?: 'input' | 'textarea'}> = ({label, name, value, onChange, placeholder, as = 'input'}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        {as === 'input' ? 
            <input type="text" name={name} id={name} value={value} onChange={onChange} placeholder={placeholder} className="mt-1 block w-full p-2.5 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
            :
            <textarea name={name} id={name} value={value} onChange={onChange} rows={3} className="mt-1 block w-full p-2.5 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500" />
        }
    </div>
);

const JsonField: React.FC<{label: string, name: string, value: string, onChange: any}> = ({label, name, value, onChange}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <textarea name={name} id={name} value={value} onChange={onChange} rows={10} className="mt-1 block w-full p-2.5 dark:bg-gray-900 border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 font-mono text-xs" />
    </div>
);

export default GameManagementPage;