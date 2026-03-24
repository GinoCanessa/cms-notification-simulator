import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';

export default function Layout() {
  // Initialize dark mode from localStorage / system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (stored === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--color-bg)] text-[var(--color-text)]">
      <TopBar />
      <Outlet />
    </div>
  );
}
