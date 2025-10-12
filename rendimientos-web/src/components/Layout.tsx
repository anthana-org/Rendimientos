import type { ReactNode } from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}