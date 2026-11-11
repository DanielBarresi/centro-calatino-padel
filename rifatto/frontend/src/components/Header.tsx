import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { cartCount, myOrders, config } = useStore();
  const { labels, statusFlow, cancelledStatus } = config;
  const isStaff = pathname.startsWith('/staff');
  const finalStatus = statusFlow[statusFlow.length - 1];
  const active = myOrders.filter((o) => o.status !== finalStatus && o.status !== cancelledStatus).length;

  return (
    <header className={`header ${isStaff ? 'header--staff' : ''}`}>
      <div className="container header__inner">
        <NavLink to={isStaff ? '/staff' : '/'} className="logo">
          {labels.shopName}
        </NavLink>

        {!isStaff && (
          <nav className="nav" aria-label="Area cliente">
            <NavLink to="/" end>{labels.catalogTitle}</NavLink>
            <NavLink to="/carrello">
              Carrello {cartCount > 0 && <span className="count">{cartCount}</span>}
            </NavLink>
            <NavLink to="/ordini">
              {labels.myOrdersTitle} {active > 0 && <span className="count">{active}</span>}
            </NavLink>
          </nav>
        )}

        {/* Selettore vista cliente / staff: al posto del login, come chiede la traccia */}
        <div className="switch-view" role="group" aria-label="Vista">
          <button className={!isStaff ? 'on' : ''} onClick={() => navigate('/')} aria-pressed={!isStaff}>Cliente</button>
          <button className={isStaff ? 'on' : ''} onClick={() => navigate('/staff')} aria-pressed={isStaff}>Staff</button>
        </div>
      </div>
    </header>
  );
}
