import { Plus, MapPin, FileText, Users } from 'lucide-react';

const quickActions = [
  { icon: Plus, label: 'Log Hours', color: 'status-confirmed' },
  { icon: MapPin, label: 'Find Nearby', color: 'status-pending' },
  { icon: FileText, label: 'Continue App', color: 'status-completed' },
  { icon: Users, label: 'Invite Friend', color: 'muted-foreground' },
];

export const QuickActions = () => {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {quickActions.map(({ icon: Icon, label, color }) => (
        <button
          key={label}
          className="flex items-center gap-2 px-4 py-3 glass-card card-hover whitespace-nowrap flex-shrink-0"
        >
          <div className={`w-8 h-8 rounded-full bg-${color}/20 flex items-center justify-center`}>
            <Icon size={16} className={`text-${color}`} />
          </div>
          <span className="text-sm font-medium text-foreground">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
};