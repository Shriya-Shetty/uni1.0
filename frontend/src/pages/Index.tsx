import { useState } from 'react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { OverviewPanel } from '@/components/OverviewPanel';
import { ComplaintsTable } from '@/components/ComplaintsTable';
import { TrendAnalytics } from '@/components/TrendAnalytics';
import { SLATracker } from '@/components/SLATracker';
import { ComplaintDetail } from '@/components/ComplaintDetail';
import { RootCausePanel } from '@/components/RootCausePanel';
import { CustomerComplaintForm } from '@/components/CustomerComplaintForm';
import Login from './Login';

export type ActiveView = 'overview' | 'complaints' | 'trends' | 'sla' | 'root-cause' | 'submit-complaint' | 'voice-complaint' | 'pdf-complaint' | 'chatbot-complaint';

const Index = () => {
  const [activeView, setActiveView] = useState<ActiveView>('overview');
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  if (!role) {
    return <Login onLogin={(r) => {
      setRole(r);
      if (r === 'user') setActiveView('submit-complaint');
      else setActiveView('overview');
    }} />;
  }

  const renderView = () => {
    if (selectedComplaint) {
      return <ComplaintDetail complaint={selectedComplaint} role={role || 'admin'} onBack={() => setSelectedComplaint(null)} />;
    }
    switch (activeView) {
      case 'overview': return <OverviewPanel onViewComplaint={setSelectedComplaint} />;
      case 'complaints': return <ComplaintsTable onViewComplaint={setSelectedComplaint} />;
      case 'trends': return <TrendAnalytics />;
      case 'sla': return <SLATracker />;
      case 'root-cause': return <RootCausePanel />;
      case 'submit-complaint': return <CustomerComplaintForm mode="online" />;
      case 'voice-complaint': return <CustomerComplaintForm mode="voice" />;
      case 'pdf-complaint': return <CustomerComplaintForm mode="pdf" />;
      case 'chatbot-complaint': return <CustomerComplaintForm mode="chatbot" />;
      default: return <OverviewPanel onViewComplaint={setSelectedComplaint} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar 
        activeView={activeView} 
        role={role}
        onNavigate={(view) => { setActiveView(view); setSelectedComplaint(null); }} 
        onLogout={() => setRole(null)}
      />
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
