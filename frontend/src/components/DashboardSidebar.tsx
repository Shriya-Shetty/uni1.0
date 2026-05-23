import { LayoutDashboard, MessageSquare, TrendingUp, Clock, Search, Shield, LogOut, PlusCircle, Mic, FileText, Bot, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ActiveView } from '@/pages/Index';
import { useQuery } from '@tanstack/react-query';
import { fetchDbStatus } from '@/api';

interface Props {
  activeView: ActiveView;
  role: string;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
}

export function DashboardSidebar({ activeView, role, onNavigate, onLogout }: Props) {
  const isCustomer = role === 'user';
  const isManager = role === 'manager';
  const isAdmin = role === 'admin';

  const { data: dbStatus } = useQuery({
    queryKey: ['db-status'],
    queryFn: fetchDbStatus,
    refetchInterval: 10000, // Check every 10s
  });

  const NAV_ITEMS: { id: ActiveView; label: string; icon: React.ElementType; roles: string[] }[] = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager'] },
    { id: 'complaints', label: 'All Complaints', icon: MessageSquare, roles: ['admin', 'manager'] },
    { id: 'submit-complaint', label: 'Online Form', icon: PlusCircle, roles: ['user'] },
    { id: 'voice-complaint', label: 'Voice Input', icon: Mic, roles: ['user'] },
    { id: 'pdf-complaint', label: 'PDF Upload', icon: FileText, roles: ['user'] },
    { id: 'chatbot-complaint', label: 'AI Chatbot', icon: Bot, roles: ['user'] },
    { id: 'trends', label: 'Trend Analysis', icon: TrendingUp, roles: ['admin', 'manager'] },
    { id: 'sla', label: 'SLA Tracking', icon: Clock, roles: ['admin', 'manager'] },
    { id: 'root-cause', label: 'Root Cause AI', icon: Search, roles: ['admin', 'manager'] },
  ];

  const filteredItems = NAV_ITEMS.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 sidebar-gradient flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg accent-gradient flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-sidebar-foreground tracking-wide uppercase">Union Bank</h1>
            <p className="text-[10px] text-sidebar-foreground/60 tracking-widest uppercase">AI Grievance</p>
          </div>
        </div>
      </div>

      {/* Role Info */}
      <div className="px-5 py-3 border-b border-sidebar-border bg-sidebar-accent/20">
        <p className="text-[10px] text-sidebar-foreground/50 uppercase font-bold tracking-tighter">Current Role</p>
        <p className="text-xs font-medium text-sidebar-primary capitalize">{role === 'user' ? 'Customer' : role === 'manager' ? 'Bank Manager' : 'Grievance Officer'}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {filteredItems.map((item) => {
          const isActive = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* DB Status */}
      <div className="p-3 border-t border-sidebar-border mx-2 mb-2 bg-sidebar-accent/10 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-3 h-3 text-sidebar-foreground/50" />
          <p className="text-[9px] font-bold text-sidebar-foreground/50 uppercase tracking-tighter">Storage Mode</p>
        </div>
        <div className="flex items-center gap-2">
          {dbStatus?.status === 'Connected' ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <p className="text-[10px] font-medium text-success">Live MongoDB</p>
            </>
          ) : dbStatus?.status === 'Mock' ? (
            <>
              <AlertCircle className="w-2.5 h-2.5 text-warning" />
              <p className="text-[10px] font-medium text-warning">Sessional (Mock)</p>
            </>
          ) : (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
              <p className="text-[10px] font-medium text-destructive">Offline</p>
            </>
          )}
        </div>
        <p className="text-[8px] text-sidebar-foreground/40 mt-1 leading-tight">{dbStatus?.message}</p>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
