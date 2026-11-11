// config e utente selezionato, condivisi con tutti


import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api} from '../api';
import type { AppConfig,User} from '../types';
import {loadLocal,saveLocal} from '../utils';


interface AppValue{
    config: AppConfig;
    user:User;
    setUserId: (id:string) => void;
}


const AppContext = createContext <AppValue | null> (null);
const USER_KEY = 'padel_user';

export function AppProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string>(() => loadLocal(USER_KEY, ''));


  // da qui laa configurazione si carica una volta all'avvio
  useEffect(() => {
    api.getConfig().then(setConfig, (e: Error) => setError(e.message));
  }, []);

  // L'utente scelto resta anche dopo il ricaricamento
  useEffect(() => saveLocal(USER_KEY, userId), [userId]);

  if (!config) {
    return (
      <div className="boot">
        {error ? <p className="error">Server non raggiungibile: avvia il backend e ricarica.</p> : <p className="muted">Caricamento…</p>}
      </div>
    );
  }

  // Se non c'è un utente salvato, parto dal primo della lista
  const user = config.users.find((u) => u.id === userId) ?? config.users[0];

  return <AppContext.Provider value={{ config, user, setUserId }}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp va usato dentro <AppProvider>');
  return ctx;
}