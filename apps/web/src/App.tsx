import './index.css';

import { Outlet } from 'react-router-dom';

import Footer from './components/Footer';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <div className="app-root">
      <header className="app-header">
        <Navbar />
      </header>

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
