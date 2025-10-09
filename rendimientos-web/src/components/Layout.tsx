import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}