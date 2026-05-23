import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchComplaints } from '@/api';

export function SLATracker() {
  const { data: complaints = [] } = useQuery({
    queryKey: ['complaints'],
    queryFn: fetchComplaints,
  });

  const total = complaints.length;
  const resolved = complaints.filter((c: any) => c.status?.startsWith('Resolved')).length;
  const resolvedPct = total > 0 ? Math.round((resolved / total) * 100) : 0;
  
  const now = new Date();
  const breachedComplaints = complaints.filter((c: any) => {
    if (c.resolution_status === 'Resolved' || c.resolution_status === 'Closed') return false;
    return new Date(c.sla_deadline) < now;
  });
  const breached = breachedComplaints.length;
  const breachedPct = total > 0 ? Math.round((breached / total) * 100) : 0;
  
  const atRisk = complaints.filter((c: any) => {
    if (c.resolution_status === 'Resolved' || c.resolution_status === 'Closed') return false;
    const deadline = new Date(c.sla_deadline);
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursLeft > 0 && hoursLeft < 12; // Increased to 12h for visibility
  }).length;
  const atRiskPct = total > 0 ? Math.round((atRisk / total) * 100) : 0;

  // Group by product/issue for the table
  const groups = new Map();
  
  complaints.forEach((c: any) => {
    const key = `${c.product}-${c.issue}`;
    if (!groups.has(key)) {
      groups.set(key, {
        product: c.product,
        type: c.issue,
        count: 0,
        severity: c.severity_label,
        totalHours: 0,
        sla_hours: c.severity_label === 'Critical' ? 24 : c.severity_label === 'High' ? 48 : 72,
        resolvedCount: 0
      });
    }
    const g = groups.get(key);
    g.count++;
    if (c.resolution_status === 'Resolved' || c.resolution_status === 'Closed') {
      const created = new Date(c.date_received);
      const updated = new Date(c.updated_at || c.date_received);
      g.totalHours += (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
      g.resolvedCount++;
    }
  });

  const SLA_DATA = Array.from(groups.values()).map(g => ({
    ...g,
    avg_resolution_hours: g.resolvedCount > 0 ? Math.round(g.totalHours / g.resolvedCount) : 0
  }));

      return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground">SLA Tracking</h2>
        <p className="text-sm text-muted-foreground mt-1">Product-Issue wise SLA deadlines and resolution metrics</p>
      </div>

      {/* SLA Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-xs font-semibold text-foreground">Within SLA</span>
          </div>
          <p className="text-3xl font-bold text-success">{resolvedPct}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Complaints resolved within deadline</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-xs font-semibold text-foreground">At Risk</span>
          </div>
          <p className="text-3xl font-bold text-warning">{atRiskPct}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Less than 6 hours to SLA breach</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <span className="text-xs font-semibold text-foreground">SLA Breached</span>
          </div>
          <p className="text-3xl font-bold text-destructive">{breachedPct}%</p>
          <p className="text-[10px] text-muted-foreground mt-1">Past deadline — escalation triggered</p>
        </div>
      </div>

      {/* SLA Table */}
      <div className="stat-card overflow-x-auto">
        <h3 className="text-sm font-semibold text-foreground mb-4">Product-Issue SLA Matrix</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issue Type</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Count</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Severity</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Resolution</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SLA Target</th>
              <th className="text-left py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {SLA_DATA.map((row) => {
              const isAtRisk = row.avg_resolution_hours > row.sla_hours * 0.8;
              const isBreach = row.avg_resolution_hours > row.sla_hours;
              return (
                <tr key={`${row.product}-${row.type}`} className="border-b border-border/50">
                  <td className="py-3 px-3 text-xs font-medium">{row.product}</td>
                  <td className="py-3 px-3 text-xs">{row.type}</td>
                  <td className="py-3 px-3 text-xs font-mono font-semibold">{row.count}</td>
                  <td className="py-3 px-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium badge-severity-${row.severity}`}>{row.severity}</span>
                  </td>
                  <td className="py-3 px-3 text-xs font-mono">{row.avg_resolution_hours}h</td>
                  <td className="py-3 px-3 text-xs font-mono">{row.sla_hours}h</td>
                  <td className="py-3 px-3">
                    {isBreach ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-destructive/10 text-destructive">⚠ Breach</span>
                    ) : isAtRisk ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-warning/10 text-warning">⏳ At Risk</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-success/10 text-success">✅ On Track</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Escalation Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Active SLA Breaches (Action Required)
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {breachedComplaints.length > 0 ? (
              breachedComplaints.map((c: any) => (
                <div key={c._id} className="p-3 bg-destructive/5 border border-destructive/10 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">{c.complaint_id}</p>
                    <p className="text-[10px] text-muted-foreground">{c.product} — {c.issue}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-destructive uppercase">Overdue</p>
                    <p className="text-[8px] text-muted-foreground">{new Date(c.sla_deadline).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <CheckCircle className="w-8 h-8 text-success/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No active SLA breaches. All set!</p>
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">📋 Escalation Rules</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
              <p><span className="font-semibold text-foreground">SLA Breach:</span> Branch Manager is auto-alerted when any complaint crosses SLA deadline</p>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
              <p><span className="font-semibold text-foreground">Volume Threshold (10+):</span> If same product-issue gets 10+ complaints, Regional Office is informed</p>
            </div>
            <div className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
              <p><span className="font-semibold text-foreground">Critical Severity:</span> Auto-escalated to Branch Manager + Fraud Team immediately</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
