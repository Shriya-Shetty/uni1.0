import { useState } from 'react';
import { Search, Filter, CheckCircle2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchComplaints } from '@/api';

interface Props {
  onViewComplaint: (c: any) => void;
}

export function ComplaintsTable({ onViewComplaint }: Props) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed'>('ongoing');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: fetchComplaints,
  });

  const calculateDynamicScore = (c: any) => {
    const pBase = c.priority_rank || 0;
    const tStart = new Date(c.date_received || c.created_at).getTime();
    const tSla = new Date(c.sla_deadline).getTime();
    const tNow = Date.now();

    let uTime = 0;
    if (tNow <= tSla) {
      // On Track: Urgency grows from 0.0 to 0.5
      const totalSlaDuration = tSla - tStart;
      const elapsed = tNow - tStart;
      uTime = totalSlaDuration > 0 ? (elapsed / totalSlaDuration) * 0.5 : 0.5;
    } else {
      // Breached: Starts at 0.5 + 0.2 for every 24 hours overdue
      const overdue = tNow - tSla;
      const daysOverdue = overdue / (1000 * 60 * 60 * 24);
      uTime = 0.5 + (daysOverdue * 0.2);
    }

    return pBase + uTime;
  };

  const ongoing = complaints.filter((c: any) => 
    c.status?.toLowerCase() !== 'resolved' && 
    c.status?.toLowerCase() !== 'closed'
  ).map((c: any) => ({
    ...c,
    dynamic_score: calculateDynamicScore(c)
  })).sort((a: any, b: any) => b.dynamic_score - a.dynamic_score);

  const completed = complaints.filter((c: any) => 
    c.status?.toLowerCase() === 'resolved' || 
    c.status?.toLowerCase() === 'closed'
  ).sort((a: any, b: any) => new Date(b.updated_at || b.date_received).getTime() - new Date(a.updated_at || a.date_received).getTime());

  const currentList = activeTab === 'ongoing' ? ongoing : completed;

  const filtered = currentList.filter((c: any) => {
    const message = c.consumer_complaint_narrative || c.message || '';
    const matchesSearch = !search || 
      message.toLowerCase().includes(search.toLowerCase()) || 
      c.complaint_id.toLowerCase().includes(search.toLowerCase()) || 
      c.customer_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || c.severity_label?.toLowerCase() === filterSeverity.toLowerCase();
    const matchesChannel = filterChannel === 'all' || c.submitted_via?.toLowerCase() === filterChannel.toLowerCase();
    
    return matchesSearch && matchesSeverity && matchesChannel;
  });

  const getSentimentEmoji = (label: string) => {
    switch (label?.toLowerCase()) {
      case 'positive': return '😊';
      case 'negative': return '😡';
      default: return '😐';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Complaint Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor and resolve banking grievances</p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('ongoing')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'ongoing' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Clock className="w-3.5 h-3.5" />
            Ongoing ({ongoing.length})
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'completed' ? 'bg-success text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed ({completed.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-card p-3 rounded-xl border border-border/50">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search complaints, customer name, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/30 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} className="text-xs bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className="text-xs bg-muted/30 border border-border rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Channels</option>
          <option value="web">Online Form</option>
          <option value="voice">Voice</option>
          <option value="pdf">PDF Upload</option>
          <option value="chatbot">Chatbot</option>
        </select>
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto p-0 border-none shadow-xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left py-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {activeTab === 'ongoing' ? 'Rank' : 'Date Completed'}
              </th>
              <th className="text-left py-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">ID</th>
              <th className="text-left py-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Customer</th>
              <th className="text-left py-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Product / Root Cause</th>
              <th className="text-left py-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Channel</th>
              <th className="text-left py-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sentiment</th>
              <th className="text-left py-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Severity</th>
              <th className="text-left py-4 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">SLA Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {filtered.map((c, index) => {
              const slaDate = new Date(c.sla_deadline);
              const now = new Date();
              const slaHoursLeft = Math.round((slaDate.getTime() - now.getTime()) / (1000 * 60 * 60));
              const slaBreach = slaHoursLeft < 0;
              const isResolved = c.status?.toLowerCase() === 'resolved' || c.status?.toLowerCase() === 'closed';

              return (
                <tr key={c.complaint_id} onClick={() => onViewComplaint(c)} className="hover:bg-primary/5 cursor-pointer transition-colors group">
                  <td className="py-4 px-4">
                    {activeTab === 'ongoing' ? (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-primary/10 text-primary">
                        #{index + 1}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-muted-foreground">
                        {new Date(c.updated_at || c.date_received).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-mono text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">{c.complaint_id}</span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-xs font-bold text-foreground">{c.customer_name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">{c.state || 'National'}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground">{c.product}</span>
                      <span className="text-[10px] text-muted-foreground italic line-clamp-1">{c.issue}</span>
                      {activeTab === 'ongoing' && (
                        <div className="mt-1 flex items-center gap-1">
                          <div className="h-1 w-12 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${c.dynamic_score > 1.0 ? 'bg-destructive' : 'bg-primary'}`} 
                              style={{ width: `${Math.min(c.dynamic_score * 50, 100)}%` }} 
                            />
                          </div>
                          <span className="text-[8px] font-mono text-muted-foreground">SCORE: {c.dynamic_score.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter border channel-badge-${(c.submitted_via || 'web').toLowerCase()}`}>
                      {c.submitted_via}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getSentimentEmoji(c.sentiment_label)}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${c.sentiment_label === 'Negative' ? 'text-destructive' : c.sentiment_label === 'Positive' ? 'text-success' : 'text-muted-foreground'}`}>
                        {c.sentiment_label}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter border badge-severity-${(c.severity_label || 'medium').toLowerCase()}`}>
                      {c.severity_label}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {isResolved ? (
                      <div className="flex items-center gap-1.5 text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Completed</span>
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${slaBreach ? 'bg-destructive animate-pulse' : 'bg-success'}`} />
                          <span className={`text-[10px] font-black uppercase tracking-widest ${slaBreach ? 'text-destructive' : 'text-success'}`}>
                            {slaBreach ? 'Breached' : 'On Track'}
                          </span>
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-0.5 font-medium">
                          {slaBreach ? `${Math.abs(slaHoursLeft)}h overdue` : `${slaHoursLeft}h remaining`}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-muted/10">
            <Filter className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No records found for this view</p>
          </div>
        )}
      </div>
    </div>
  );
}
