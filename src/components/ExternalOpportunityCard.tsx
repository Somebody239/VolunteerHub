import React from 'react';
import { MapPin, Clock, Users, ExternalLink, Globe, Building2, Star, CalendarDays, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExternalOpportunityCardProps {
    title: string;
    organization: string;
    date: string;
    location?: string;
    duration?: string;
    spots?: number;
    category: string;
    tags?: string[];
    applyUrl?: string;
    contactEmail?: string;
    isExternal: boolean;
    externalUrl: string;
    description: string;
    activities: string[];
    isRemote: boolean;
    coordinates?: { lat: number; lng: number };
    opportunityId: string;
    onClick?: () => void;
    onApply?: (opportunityId: string, title: string) => void;
    score?: number;
    xpReward?: number;
    applied?: boolean;
    minAge?: number | null;
    maxAge?: number | null;
    applicationForm?: any;
}

export function ExternalOpportunityCard({
    title,
    organization,
    date,
    location,
    duration,
    spots,
    category,
    tags = [],
    applyUrl,
    contactEmail,
    isExternal,
    externalUrl,
    description,
    activities,
    isRemote,
    coordinates,
    opportunityId,
    onClick,
    onApply,
    score,
    xpReward,
    applied,
    minAge,
    maxAge,
    applicationForm,
}: ExternalOpportunityCardProps) {
    const [appliedLocal, setAppliedLocal] = React.useState<boolean>(() => {
        try {
            const raw = localStorage.getItem('my_external_applications');
            const list: Array<{ opportunity_id: string }> = raw ? JSON.parse(raw) : [];
            return !!list.find((e) => e.opportunity_id === opportunityId);
        } catch { return false; }
    });
    
    // Listen for external application updates
    React.useEffect(() => {
        const handleExternalUpdate = () => {
            try {
                const raw = localStorage.getItem('my_external_applications');
                const list: Array<{ opportunity_id: string }> = raw ? JSON.parse(raw) : [];
                setAppliedLocal(!!list.find((e) => e.opportunity_id === opportunityId));
            } catch { setAppliedLocal(false); }
        };
        
        window.addEventListener('external-updated', handleExternalUpdate);
        return () => window.removeEventListener('external-updated', handleExternalUpdate);
    }, [opportunityId]);
    
    const isApplied = applied ?? appliedLocal;
    const is18Plus = typeof minAge === 'number' && minAge >= 18;
    const hasInternalForm = !applyUrl && applicationForm && Array.isArray(applicationForm) && applicationForm.length >= 0; // >= 0 to include fallback form
    
    const handleApply = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isApplied) return;
        
        // Priority: 1. External apply_url, 2. Internal application form (opens dialog), 3. Generic external URL
        if (hasInternalForm) {
            // Internal application - trigger the onClick to open details dialog with form
            if (onClick) {
                onClick();
            }
            return; // Don't mark as applied yet, let the form submission handle it
        } else if (applyUrl) {
            window.open(applyUrl, '_blank', 'noopener,noreferrer');
        } else if (externalUrl) {
            window.open(externalUrl, '_blank', 'noopener,noreferrer');
        }
        
        // Only call onApply for external applications
        if (onApply && !hasInternalForm) {
            onApply(opportunityId, title);
        }
        setAppliedLocal(true);
    };

    return (
        <div
            className="glass-card p-3 rounded-lg transition-colors duration-200 cursor-pointer border border-border hover:bg-muted/30 card-hover relative"
            onClick={onClick}
        >
            {/* 18+ Indicator Badge - Top Right */}
            {is18Plus && (
                <div className="absolute top-2 right-2 z-10">
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0.5 flex items-center gap-0.5">
                        <AlertCircle size={10} />
                        18+
                    </Badge>
                </div>
            )}
            
            <div className="mb-2">
                <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 pr-12" title={title}>{title}</h3>
                <div className="flex items-center gap-2 text-[10px] whitespace-nowrap overflow-x-auto">
                    {/* Always show star rating - either from score or default to 3 stars */}
                    <div className="flex items-center gap-0.5">
                        <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => {
                                const starsRounded = typeof score === 'number' 
                                    ? Math.max(1, Math.min(5, Math.round((score || 0) / 10)))
                                    : 3; // Default to 3 stars if no score
                                return (
                                    <Star key={i} size={10} className={i < starsRounded ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'} />
                                );
                            })}
                        </div>
                        <span className="text-[9px] text-yellow-600">
                            {typeof score === 'number' ? ((score || 0)/10).toFixed(1) : '3.0'}
                        </span>
                    </div>
                    {typeof xpReward === 'number' && xpReward > 0 && (
                        <span className="text-[10px] font-medium text-green-600">+{xpReward} XP</span>
                    )}
                    {isApplied && (<Badge variant="outline" className="text-[9px] px-1.5 py-0.5">Applied</Badge>)}
                    {isRemote && (<Badge variant="secondary" className="text-[9px] px-1.5 py-0.5"><Globe size={10} className="mr-0.5"/>Remote</Badge>)}
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">External</Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground min-w-0">
                    <Building2 size={10} />
                    <span className="truncate" title={organization}>{organization}</span>
                    {date && (
                        <>
                            <span className="text-muted-foreground/50">•</span>
                            <CalendarDays size={10} />
                            <span className="truncate">{date}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-1.5 mb-2">
                {/* Description - more condensed */}
                <p className="text-[10px] text-muted-foreground line-clamp-2">
                    {description.replace(/<[^>]*>/g, '')} {/* Remove HTML tags */}
                </p>

                {/* Details - more compact */}
                <div className="flex flex-wrap gap-2 text-[9px] text-muted-foreground">
                    {location && (
                        <div className="flex items-center gap-1">
                            <MapPin size={8} />
                            <span className="truncate">{location}</span>
                        </div>
                    )}
                    {duration && (
                        <div className="flex items-center gap-1">
                            <Clock size={8} />
                            <span className="truncate">{duration}</span>
                        </div>
                    )}
                    {spots && (
                        <div className="flex items-center gap-1">
                            <Users size={8} />
                            <span>{spots} spots</span>
                        </div>
                    )}
                </div>

                {/* Category and Tags - more compact */}
                <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5">
                        {category}
                    </Badge>
                    {(tags ?? []).slice(0, 3).map((tag, index) => 
                        <Badge key={index} variant="outline" className="text-[9px] px-1.5 py-0.5">
                            {tag}
                        </Badge>
                    )}
                    {(tags ?? []).length > 3 && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">
                            +{(tags ?? []).length - 3}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Actions - more compact */}
            <div className="flex items-center justify-end pt-2 border-t border-border/50 gap-2">

                <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={isApplied}
                    className={`text-[10px] px-2 py-1 h-6 ${isApplied ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:bg-primary/90 text-primary-foreground"}`}
                >
                    {isApplied ? 'Applied' : 'Apply'}
                </Button>
            </div>
        </div>
    );
}
