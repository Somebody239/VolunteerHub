import { Clock, TrendingUp, Calendar, Target } from 'lucide-react';

interface StatsBarProps {
  monthlyHours: number;
  streak: number;
  upcomingEvents: number;
  completedTasks: number;
}

export const StatsBar = ({ monthlyHours, streak, upcomingEvents, completedTasks }: StatsBarProps) => {
  const stats = [
    { icon: Clock, value: monthlyHours, label: 'Hours', color: 'status-confirmed' },
    { icon: TrendingUp, value: streak, label: 'Day Streak', color: 'status-pending' },
    { icon: Calendar, value: upcomingEvents, label: 'Upcoming', color: 'status-completed' },
    { icon: Target, value: completedTasks, label: 'Completed', color: 'badge' },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {stats.map(({ icon: Icon, value, label, color }) => (
        <div key={label} className="flex items-center gap-3 glass-card p-3 flex-shrink-0">
          <div className={`w-8 h-8 rounded-full bg-${color}/20 flex items-center justify-center`}>
            <Icon size={16} className={`text-${color}`} />
          </div>
          <div>
            <div className="text-lg font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};