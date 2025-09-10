import { Calendar, MapPin, Clock, Users, ChevronRight } from 'lucide-react';
import { LiquidGlass } from '@liquidglass/react';

interface OpportunityCardProps {
  title: string;
  organization: string;
  date: string;
  location?: string;
  duration?: string;
  spots?: number;
  category: string;
  isUpcoming?: boolean;
  onClick?: () => void;
}

export const OpportunityCard = ({
  title,
  organization,
  date,
  location,
  duration,
  spots,
  category,
  isUpcoming = false,
  onClick
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
      <div className="glass-card w-full p-4 card-hover cursor-pointer h-full flex flex-col" onClick={onClick}>
        <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-base leading-tight mb-1 truncate">
                  {title}
                </h3>
                <p className="text-muted-foreground text-sm truncate">
                  {organization}
                </p>
              </div>
              {isUpcoming && (
                <span className="px-2 py-0.5 bg-status-pending/20 text-status-pending text-xs rounded-full flex-shrink-0">
                  Upcoming
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
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

            <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
              <div className="flex gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full border border-border text-foreground/80">
                  {category}
                </span>
                <span className="px-2 py-0.5 text-xs rounded-full border border-border text-muted-foreground">
                  Beginner
                </span>
              </div>
              
              <button className="flex items-center gap-1 text-primary hover:text-primary/80 transition-colors flex-shrink-0">
                <span className="text-sm font-medium">Apply</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </LiquidGlass>
  );
};