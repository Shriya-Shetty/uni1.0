import { TREND_DATA, PRODUCT_DISTRIBUTION, SEVERITY_DISTRIBUTION } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchComplaints } from '@/api';

export function TrendAnalytics() {
  const { data: complaints = [] } = useQuery({
    queryKey: ['complaints'],
    queryFn: fetchComplaints,
  });

  // Calculate product distribution from real data
  const productCounts = new Map();
  complaints.forEach((c: any) => {
    productCounts.set(c.product, (productCounts.get(c.product) || 0) + 1);
  });
  const colors = ['#003366', '#006699', '#3399CC', '#66CCCC', '#99CCFF'];
  const realProductDistribution = Array.from(productCounts.entries()).map(([name, value], i) => ({
    name, value, fill: colors[i % colors.length]
  }));

  // Calculate severity distribution
  const severityCounts = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
  complaints.forEach((c: any) => {
    const s = c.severity >= 9 ? 'Critical' : c.severity >= 7 ? 'High' : c.severity >= 4 ? 'Medium' : 'Low';
    severityCounts[s as keyof typeof severityCounts]++;
  });
  const realSeverityDistribution = [
    { name: 'Critical', value: severityCounts['Critical'], fill: 'hsl(0, 72%, 51%)' },
    { name: 'High', value: severityCounts['High'], fill: 'hsl(24, 94%, 50%)' },
    { name: 'Medium', value: severityCounts['Medium'], fill: 'hsl(45, 93%, 47%)' },
    { name: 'Low', value: severityCounts['Low'], fill: 'hsl(152, 60%, 40%)' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Trend Analysis</h2>
        <p className="text-sm text-muted-foreground mt-1">Complaint patterns, product distribution, and severity trends</p>
      </div>

      {/* Main Trend */}
      <div className="stat-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Complaint Volume (15-Day Trend)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={TREND_DATA}>
            <defs>
              <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(220, 70%, 25%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220, 70%, 25%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(152, 60%, 40%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
            <Area type="monotone" dataKey="complaints" stroke="hsl(220, 70%, 25%)" fill="url(#colorComplaints)" strokeWidth={2} />
            <Area type="monotone" dataKey="resolved" stroke="hsl(152, 60%, 40%)" fill="url(#colorResolved)" strokeWidth={2} />
            <Line type="monotone" dataKey="escalated" stroke="hsl(0, 72%, 51%)" strokeWidth={2} dot={{ r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex gap-6 mt-2 justify-center">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-primary rounded" /> Complaints
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-success rounded" /> Resolved
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-destructive rounded" /> Escalated
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Distribution */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Product-wise Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={realProductDistribution.length > 0 ? realProductDistribution : PRODUCT_DISTRIBUTION} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={9}>
                {(realProductDistribution.length > 0 ? realProductDistribution : PRODUCT_DISTRIBUTION).map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={realSeverityDistribution} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {realSeverityDistribution.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Escalation Alerts */}
      <div className="stat-card border-l-4 border-l-destructive">
        <h3 className="text-sm font-semibold text-foreground mb-3">⚠️ Escalation Triggers</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-foreground">Credit Card → Fraud</p>
              <p className="text-[10px] text-muted-foreground">18 complaints in last 15 days — <span className="font-semibold text-destructive">Regional Office (Western Zone) notified</span></p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full badge-severity-critical font-semibold">10+ threshold breached</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-foreground">Cheque → Clearance Delay</p>
              <p className="text-[10px] text-muted-foreground">15 complaints in last 15 days — <span className="font-semibold text-destructive">Regional Office notified</span></p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full badge-severity-high font-semibold">10+ threshold breached</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-foreground">ATM → Cash Not Dispensed</p>
              <p className="text-[10px] text-muted-foreground">14 complaints — Branch Managers alerted across 4 zones</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full badge-severity-high font-semibold">10+ threshold breached</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
            <div>
              <p className="text-xs font-semibold text-foreground">UPI → Transaction Failed + Refund Pending</p>
              <p className="text-[10px] text-muted-foreground">23 combined complaints — NPCI coordination escalation initiated</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full badge-severity-high font-semibold">10+ threshold breached</span>
          </div>
        </div>
      </div>
    </div>
  );
}
