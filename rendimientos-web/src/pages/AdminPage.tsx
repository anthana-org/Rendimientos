import { AdminPanel } from '../components/AdminPanel';

export default function AdminPage() {
  return (
    <div className="space-y-8 sm:space-y-12 lg:space-y-16 bg-dark-bg min-h-screen">
      <div className="max-w-7xl xl:max-w-screen-2xl 2xl:max-w-[90vw] mx-auto pl-8 sm:pl-12 lg:pl-16 xl:pl-20 2xl:pl-24 pr-2 sm:pr-3 lg:pr-4 xl:pr-6 2xl:pr-8 pt-8 sm:pt-12 lg:pt-16">
        <AdminPanel />
      </div>
    </div>
  );
}