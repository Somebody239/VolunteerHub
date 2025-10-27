import { User, Award, Zap, Calendar, Clock } from 'lucide-react';
import { LiquidGlass } from '@liquidglass/react';

interface ProfileCardProps {
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  totalHours: number;
  streak: number;
  school?: string;
  variant?: 'glass' | 'plain';
}

export const ProfileCard = ({ 
  name, 
  level, 
  xp, 
  maxXp, 
  totalHours, 
  streak, 
  school,
  variant = 'glass'
}: ProfileCardProps) => {
  const xpPercentage = (xp / maxXp) * 100;

  const Inner = (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User size={18} className="text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-sm truncate">{name}</h3>
        {school && <p className="text-xs text-muted-foreground truncate">{school}</p>}
        
        <div className="flex items-center gap-2 mt-1">
          <Award size={12} className="text-badge flex-shrink-0" />
          <span className="text-xs font-medium text-foreground">Lvl.{level}</span>
          <div className="flex-1 h-1.5 bg-level rounded-full overflow-hidden">
            <div 
              className="h-full bg-xp progress-fill rounded-full" 
              style={{ width: `${xpPercentage}%` }}
            />
          </div>
          <span className="text-xs text-foreground font-medium whitespace-nowrap">{xp} / {maxXp}</span>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{totalHours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-status-confirmed" />
            <span>{streak}</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (variant === 'plain') {
    return (
      <div className="py-1">
        {Inner}
      </div>
    );
  }

  return (
    <LiquidGlass
      borderRadius={16}
      blur={0.4}
      contrast={1.1}
      brightness={1.05}
      saturation={1.1}
      shadowIntensity={0.2}
      displacementScale={0.8}
      elasticity={0.5}
    >
      <div className="glass-card p-4">
        {Inner}
      </div>
    </LiquidGlass>
  );
}
;