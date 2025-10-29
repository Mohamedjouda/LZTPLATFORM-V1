import React, { useState, useEffect } from 'react';
import { getSupabaseClient, isDbReady } from '../services/supabaseService';
import { RealtimeChannel } from '@supabase/supabase-js';
import { DatabaseIcon, Loader2 } from './Icons';

type Status = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

const STATUS_CONFIG = {
  CONNECTING: {
    color: 'text-yellow-500',
    dotColor: 'bg-yellow-500',
    text: 'Connecting...',
    tooltip: 'Attempting to establish a real-time connection to the database.',
  },
  CONNECTED: {
    color: 'text-green-500',
    dotColor: 'bg-green-500 animate-pulse',
    text: 'DB Connected',
    tooltip: 'Real-time database connection is active and healthy.',
  },
  RECONNECTING: {
    color: 'text-yellow-500',
    dotColor: 'bg-yellow-500',
    text: 'Reconnecting...',
    tooltip: 'Connection was lost. Attempting to reconnect automatically.',
  },
  DISCONNECTED: {
    color: 'text-red-500',
    dotColor: 'bg-red-500',
    text: 'DB Disconnected',
    tooltip: 'Could not connect to the database. Check your Supabase URL/Key, network connection, or if tables are missing.',
  },
};

const SupabaseStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<Status>('CONNECTING');
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    // This effect runs only once on mount to set up the subscription
    const supabase = getSupabaseClient();
    const initialDbReady = isDbReady();
    setIsReady(initialDbReady);

    if (!supabase || !initialDbReady) {
      setStatus('DISCONNECTED');
      return;
    }
    
    let channel: RealtimeChannel;
    const channelName = `db-status-check-${Math.random()}`;
    
    channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
            // This is just a heartbeat, no action needed on payload.
            // If we receive this, it means the connection is alive.
            setStatus(currentStatus => currentStatus !== 'CONNECTED' ? 'CONNECTED' : currentStatus);
        })
        .subscribe((subStatus, err) => {
            switch (subStatus) {
                case 'SUBSCRIBED':
                    setStatus('CONNECTED');
                    break;
                case 'CHANNEL_ERROR':
                case 'TIMED_OUT':
                    setStatus('RECONNECTING');
                    break;
                case 'CLOSED':
                    // This can be intentional, but if not, treat as disconnected.
                    // If the component is still mounted, it's likely an issue.
                    setStatus('DISCONNECTED');
                    break;
            }
             if (err) {
                console.error('Supabase Realtime Error:', err);
                setStatus('DISCONNECTED');
            }
        });

    return () => {
        if (channel) {
            supabase.removeChannel(channel);
        }
    };
  }, []);

  const config = STATUS_CONFIG[status];
  const finalTooltip = !isReady ? STATUS_CONFIG['DISCONNECTED'].tooltip : config.tooltip;

  return (
    <div className="group relative flex items-center space-x-2 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 border border-transparent">
        {status === 'CONNECTING' || status === 'RECONNECTING' 
            ? <Loader2 className={`w-4 h-4 animate-spin ${config.color}`} />
            : <DatabaseIcon className={`w-4 h-4 ${config.color}`} />
        }
        <span className={`hidden md:inline text-xs font-medium ${config.color}`}>
            {config.text}
        </span>
        <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
        
        {/* Tooltip */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-xs px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {finalTooltip}
        </div>
    </div>
  );
};

export default SupabaseStatusIndicator;