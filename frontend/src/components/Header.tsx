import { NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Header() {
  const { config, user, setUserId } = useApp();

  return (
    <header className="header">
      <div className="container header__inner">
        <NavLink to="/" className="logo">
          {/* Simbolo: un campo da padel visto dall'alto */}
          <svg className="logo__mark" viewBox="0 0 20 32" aria-hidden="true">
            <rect x="1" y="1" width="18" height="30" rx="1.5" />
            <line x1="1" y1="16" x2="19" y2="16" />
            <line x1="1" y1="8" x2="19" y2="8" />
            <line x1="1" y1="24" x2="19" y2="24" />
            <line x1="10" y1="8" x2="10" y2="24" />
          </svg>
          Centro Calatino Padel
        </NavLink>

        <nav className="nav">
          <NavLink to="/" end>
            Prenota
          </NavLink>
          <NavLink to="/prenotazioni">Le mie prenotazioni</NavLink>
        </nav>

        {/* Req. 1: nessun login, l'utente si sceglie da una lista */}
        <label className="user-select">
          Utente
          <select value={user.id} onChange={(e) => setUserId(e.target.value)}>
            {config.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.member ? ' (tesserato)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
