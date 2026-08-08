import React from 'react';
import { Bell, Search } from 'lucide-react';

export const TopNav: React.FC = () => {
  return (
    <header className="h-[60px] border-b border-border bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 flex items-center max-w-2xl">
        <div className="relative w-full max-w-md hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-1.5 border border-border rounded-md leading-5 bg-white placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Search..."
          />
        </div>
      </div>
      <div className="flex items-center space-x-4 text-muted-foreground">
        <button className="p-2 hover:bg-muted rounded-full transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-3 border-l border-border pl-4">
          <div className="w-8 h-8 bg-blue-100 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
            JD
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">John Doe</span>
        </div>
      </div>
    </header>
  );
};
