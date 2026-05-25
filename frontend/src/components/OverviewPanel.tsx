import { AlertTriangle, CheckCircle, Clock, MessageSquare, TrendingUp, Users, ArrowUpRight, AlertCircle } from 'lucide-react';
import { TREND_DATA, PRODUCT_DISTRIBUTION, SEVERITY_DISTRIBUTION, type Complaint } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchComplaints } from '@/api';

interface Props {
  onViewComplaint: (c: Complaint) => void;
}

export function OverviewPanel({ onViewComplaint }: Props) {
  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: fetchComplaints,
  });

  const now = new Date();
  const total = complaints.length;
  
  // Uncatered: status is strictly "Open"
  const uncatered = complaints.filter((c: any) => 
    c.status === 'Open'
  ).length;
  
  // Ongoing: status is strictly "In Progress"
  const ongoing = complaints.filter((c: any) => 
    c.status === 'In Progress'
  ).length;
  
  // Escalated: status is 'Escalated' OR deadline breached (and not resolved/closed)
  const escalated = complaints.filter((c: any) => 
    c.status === 'Escalated' || (c.status !== 'Resolved' && c.status !== 'Closed' && new Date(c.sla_deadline) < now)
  ).length;
  
  const resolved = complaints.filter((c: any) => 
    c.status === 'Resolved' || c.status === 'Closed'
  ).length;

  const stats = [
    { label: 'Total Complaints', value: total.toString(), icon: MessageSquare, color: 'text-primary' },
    { label: 'Uncatered', value: uncatered.toString(), icon: AlertCircle, color: 'text-muted-foreground' },
    { label: 'Ongoing', value: ongoing.toString(), icon: Clock, color: 'text-warning' },
    { label: 'Escalated', value: escalated.toString(), icon: AlertTriangle, color: 'text-destructive' },
    { label: 'Resolved', value: resolved.toString(), icon: CheckCircle, color: 'text-success' },
  ];

  const recentComplaints = complaints.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time database statistics strictly from MongoDB</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`stat-card animate-fade-in-up animate-stagger-${i + 1}`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trend Chart */}
        <div className="stat-card lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground mb-4">Complaint Trend (15 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TREND_DATA}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="complaints" fill="hsl(220, 70%, 25%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" fill="hsl(152, 60%, 40%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="escalated" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Distribution */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">By Product</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={PRODUCT_DISTRIBUTION} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {PRODUCT_DISTRIBUTION.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-2">
            {PRODUCT_DISTRIBUTION.slice(0, 4).map((p) => (
              <span key={p.name} className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} /> {p.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Complaints</h3>
          <button onClick={() => {}} className="text-xs font-medium text-primary hover:underline">View All →</button>
        </div>
        <div className="space-y-2">
          {recentComplaints.map((c) => (
            <button
              key={c.complaint_id}
              onClick={() => onViewComplaint(c)}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                c.severity === 'critical' ? 'bg-destructive' :
                c.severity === 'high' ? 'bg-warning' :
                c.severity === 'medium' ? 'bg-accent' : 'bg-success'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-foreground">{c.complaint_id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium channel-badge-${c.channel}`}>{c.channel}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{c.message}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-severity-${c.severity}`}>
                  {c.severity}
                </span>
                <p className="text-[10px] text-muted-foreground mt-1">{c.product}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
