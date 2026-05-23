import { useState } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { type Complaint, type Severity, type Channel, type Status } from '@/data/mockData';
import { useQuery } from '@tanstack/react-query';
import { fetchComplaints } from '@/api';

interface Props {
  onViewComplaint: (c: Complaint) => void;
}

export function ComplaintsTable({ onViewComplaint }: Props) {
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'all'>('all');
  const [filterChannel, setFilterChannel] = useState<Channel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: fetchComplaints,
  });

  const filtered = complaints.filter((c: any) => {
    const message = c.consumer_complaint_narrative || c.message || c.text_content || '';
    if (search && !message.toLowerCase().includes(search.toLowerCase()) && !c.complaint_id.toLowerCase().includes(search.toLowerCase()) && !c.customer_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSeverity !== 'all' && c.severity_label?.toLowerCase() !== filterSeverity) return false;
    if (filterChannel !== 'all' && c.submitted_via?.toLowerCase() !== filterChannel) return false;
    if (filterStatus !== 'all' && c.resolution_status?.toLowerCase() !== filterStatus) return false;
    return true;
  });

  const statusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'open': return 'bg-info/10 text-info';
      case 'in progress': return 'bg-warning/10 text-warning';
      case 'resolved': return 'bg-success/10 text-success';
      case 'closed': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground">All Complaints</h2>
        <p className="text-sm text-muted-foreground mt-1">Browse, filter and manage all registered complaints</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search complaints, customer name, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
        </div>
        <select value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value as any)} className="text-xs bg-card border border-border rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value as any)} className="text-xs bg-card border border-border rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Channels</option>
          <option value="email">Email</option>
          <option value="form">Hard Copy Form</option>
          <option value="chatbot">Chatbot</option>
          <option value="voice">Voice</option>
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="text-xs bg-card border border-border rounded-lg px-3 py-2 focus:outline-none">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Table */}
      <div className="stat-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rank</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product / Type</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sentiment</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SLA</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const slaDate = new Date(c.sla_deadline);
              const now = new Date();
              const slaHoursLeft = Math.round((slaDate.getTime() - now.getTime()) / (1000 * 60 * 60));
              const slaBreach = slaHoursLeft < 0;
              return (
                <tr key={c.complaint_id} onClick={() => onViewComplaint(c)} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors">
                  <td className="py-3 px-3">
                    <span className="text-xs font-bold text-primary">#{Math.round((c.priority_rank || 0) * 100)}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs font-medium">{c.complaint_id}</td>
                  <td className="py-3 px-3">
                    <p className="text-xs font-medium">{c.customer_name || 'Customer'}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="text-xs font-medium text-foreground">{c.product}</p>
                    <p className="text-[10px] text-muted-foreground">{c.issue}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium channel-badge-${(c.submitted_via || 'web').toLowerCase()}`}>{c.submitted_via}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-severity-${(c.severity_label || 'medium').toLowerCase()}`}>{c.severity_label}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs">{c.sentiment_label === 'Positive' ? '😊' : c.sentiment_label === 'Negative' ? '😡' : '😐'}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor(c.resolution_status)}`}>{c.resolution_status}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${slaBreach ? 'bg-destructive' : 'bg-success'}`} />
                      <span className={`text-[10px] font-medium ${slaBreach ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {slaBreach ? 'Breached' : `${slaHoursLeft}h left`}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No complaints match the current filters.</p>
        )}
      </div>
    </div>
  );
}
