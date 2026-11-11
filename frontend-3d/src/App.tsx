import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';

export default function App() {
  const location = useLocation();

  return (
    // reducedMotion="user": se il sistema chiede meno movimento, niente spostamenti (restano le dissolvenze)
    <MotionConfig reducedMotion="user">
      <Header />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className="page"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.16 } }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<Booking />} />
            <Route path="/prenotazioni" element={<MyBookings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
    </MotionConfig>
  );
}
