import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Database, 
  Settings2,
  Hexagon,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'AI Leads', path: '/leads', icon: Users },
  { name: 'Chat', path: '/chat', icon: MessageSquare },
  { name: 'Knowledge Base', path: '/knowledge', icon: Database },
  { name: 'Prompt Manager', path: '/prompt', icon: Settings2 },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-border flex flex-col h-screen sticky top-0">
      <div className="h-[60px] flex items-center px-6 border-b border-border">
        <Hexagon className="w-6 h-6 text-primary mr-2 fill-primary/20" />
        <span className="font-bold text-lg text-slate-800">Swargaseema</span>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
            AI Receptionist
          </h3>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive 
                      ? "bg-blue-50 text-primary" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <item.icon className="w-4 h-4 mr-3" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};
