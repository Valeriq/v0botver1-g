import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Users, Mail, Send, Reply } from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const data = [
  { name: 'Mon', sent: 400, replies: 24 },
  { name: 'Tue', sent: 300, replies: 18 },
  { name: 'Wed', sent: 550, replies: 35 },
  { name: 'Thu', sent: 480, replies: 28 },
  { name: 'Fri', sent: 390, replies: 22 },
  { name: 'Sat', sent: 150, replies: 8 },
  { name: 'Sun', sent: 180, replies: 12 },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <PageHeader 
        title="Dashboard" 
        description="Overview of your cold outreach performance."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard 
          title="Total Contacts" 
          value="2,543" 
          icon={Users} 
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard 
          title="Emails Sent" 
          value="12,402" 
          icon={Send} 
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard 
          title="Reply Rate" 
          value="4.2%" 
          icon={Reply} 
          trend={{ value: 0.5, isPositive: true }}
        />
        <StatCard 
          title="Active Campaigns" 
          value="3" 
          icon={Mail} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="col-span-2 bg-card border border-border/50 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-6 font-display">Weekly Performance</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--popover)', 
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="var(--primary)" 
                  fillOpacity={1} 
                  fill="url(#colorSent)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 font-display">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-600">JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium">John Doe replied</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    "Interested in learning more about..."
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">2 hours ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
