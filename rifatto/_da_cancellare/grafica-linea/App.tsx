import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import { useStore } from './context/StoreContext';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import MyOrders from './pages/MyOrders';
import Staff from './pages/Staff';

export default function App() {
  const { serverError, config } = useStore();

  useEffect(() => {
    document.title = config.labels.shopName;
  }, [config.labels.shopName]);

  return (
    <>
      <Header />
      {serverError && <div className="server-error" role="alert">{serverError}</div>}
      <main className="container">
        <Routes>
          {/* Vista cliente */}
          <Route path="/" element={<Catalog />} />
          <Route path="/carrello" element={<Cart />} />
          <Route path="/ordini" element={<MyOrders />} />
          {/* Vista staff: nessun login, ci si arriva dal selettore nell'header */}
          <Route path="/staff" element={<Staff />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
