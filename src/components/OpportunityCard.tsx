import { Calendar, MapPin, Clock, Users, ChevronRight, Star, CalendarDays } from 'lucide-react';
import { LiquidGlass } from '@liquidglass/react';

interface OpportunityCardProps {
  title: string;
  organization: string;
  date: string;
  location?: string;
  duration?: string;
  spots?: number;
  category: string;
  tags?: string[];
  isUpcoming?: boolean;
  onClick?: () => void;
  stars?: number;
  xp?: number;
  applied?: boolean;
}

export const OpportunityCard = ({
  title,
  organization,
  date,
  location,
  duration,
  spots,
  category,
  tags,
  isUpcoming = false,
  onClick,
  stars,
  xp,
  applied
}: OpportunityCardProps) => {
  return (
    <LiquidGlass
      borderRadius={16}
      blur={0.3}
      contrast={1.05}
      brightness={1.02}
      saturation={1.05}
      shadowIntensity={0.15}
      displacementScale={0.6}
      elasticity={0.4}
    >
      <div className="glass-card w-full p-3 sm:p-4 card-hover cursor-pointer h-full flex flex-col" onClick={onClick}>
        <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm sm:text-base leading-tight mb-1 line-clamp-2">
                  {title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap">
                  <span className="truncate">{organization}</span>
                  <span className="flex items-center gap-1 flex-shrink-0"><CalendarDays size={12} />{date}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {typeof stars === 'number' && (
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < Math.max(0, Math.min(5, stars || 0)) ? 'text-yellow-500' : 'text-muted-foreground'} />
                      ))}
                    </div>
                    <span className="text-[10px] text-yellow-600">{(Math.max(0, Math.min(5, stars || 0))).toFixed(1)}</span>
                  </div>
                )}
                {typeof xp === 'number' && (
                  <span className="text-[11px] font-medium text-green-600">+{xp} XP</span>
                )}
                {applied && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full border border-border">Applied</span>
                )}
                {isUpcoming && (
                  <span className="px-2 py-0.5 bg-status-pending/20 text-status-pending text-xs rounded-full">
                    Upcoming
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 text-xs text-muted-foreground mb-3 overflow-x-auto whitespace-nowrap">
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>{date}</span>
              </div>
              {location && (
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  <span className="truncate">{location}</span>
                </div>
              )}
              {duration && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{duration}</span>
                </div>
              )}
              {spots && (
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>{spots}</span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between gap-2">
              <div className="flex gap-1 sm:gap-2 overflow-x-auto whitespace-nowrap min-w-0">
                <span className="px-2 py-0.5 text-xs rounded-full border border-border text-foreground/80 flex-shrink-0">
                  {category}
                </span>
                {(tags ?? []).slice(0, 3).map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground flex-shrink-0">
                    {t}
                  </span>
                ))}
                {(tags ?? []).length > 3 && (
                  <span className="px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground flex-shrink-0">
                    +{(tags ?? []).length - 3}
                  </span>
                )}
              </div>
              
              <button className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors flex-shrink-0">
                <span className="text-xs sm:text-sm font-medium">Apply</span>
                <ChevronRight size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </LiquidGlass>
  );
};