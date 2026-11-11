import { motion } from 'motion/react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ChevronIcon } from './Icons';

const LINKS = [
  { to: '/', label: 'Prenota' },
  { to: '/prenotazioni', label: 'Le mie prenotazioni' },
];

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

export default function Header() {
  const { config, user, setUserId } = useApp();
  const { pathname } = useLocation();

  return (
    <header className="header">
      <div className="container header__inner">
        <NavLink to="/" className="logo" aria-label="Centro Calatino Padel, prenota un campo">
          {/* Simbolo: un campo da padel visto dall'alto con la pallina */}
          <svg className="logo__mark" viewBox="0 0 22 34" aria-hidden="true">
            <rect x="1" y="1" width="20" height="32" rx="2.5" />
            <path d="M1 17h20M1 8.5h20M1 25.5h20M11 8.5v17" />
            <circle className="logo__ball" cx="15.5" cy="12.5" r="2.4" />
          </svg>
          <span className="logo__text">
            Centro Calatino <b>Padel</b>
          </span>
        </NavLink>

        {/* La pillola gialla scivola sotto la voce attiva */}
        <nav className="nav" aria-label="Sezioni">
          {LINKS.map((l) => {
            const active = l.to === '/' ? pathname === '/' : pathname.startsWith(l.to);
            return (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className="nav__link">
                {active && <motion.span layoutId="nav-pill" className="nav__pill" transition={{ type: 'spring', stiffness: 520, damping: 40 }} />}
                <span className="nav__label">{l.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Req. 1: nessun login, l'utente si sceglie da una lista */}
        <label className="user-select">
          <span className="sr-only">Utente</span>
          <span className={`avatar ${user.member ? 'avatar--member' : ''}`} aria-hidden="true">
            {initials(user.name)}
          </span>
          <span className="user-select__text" aria-hidden="true">
            <span className="user-select__name">{user.name}</span>
            <span className="user-select__role">{user.member ? 'Tesserato' : 'Socio'}</span>
          </span>
          <ChevronIcon className="user-select__chev" width={16} height={16} />
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
