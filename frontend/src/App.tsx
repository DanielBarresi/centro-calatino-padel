import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';

export default function App() {
  return (
    <>
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Booking />} />
          <Route path="/prenotazioni" element={<MyBookings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
