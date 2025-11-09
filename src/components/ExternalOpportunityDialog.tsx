import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MapPin,
    Clock,
    Users,
    ExternalLink,
    Globe,
    Building2,
    Calendar,
    Tag
} from 'lucide-react';

interface ExternalOpportunityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    opportunity: {
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
    } | null;
}

export function ExternalOpportunityDialog({
    open,
    onOpenChange,
    opportunity
}: ExternalOpportunityDialogProps) {
    if (!opportunity) return null;

    const handleApply = () => {
        if (opportunity.externalUrl) {
            window.open(opportunity.externalUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <DialogTitle className="text-2xl font-bold mb-2">
                                {opportunity.title}
                            </DialogTitle>
                            <DialogDescription className="text-lg text-muted-foreground">
                                {opportunity.organization}
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            {opportunity.isRemote && (
                                <Badge variant="secondary" className="text-sm">
                                    <Globe size={14} className="mr-1" />
                                    Remote
                                </Badge>
                            )}
                            <Badge variant="outline" className="text-sm">
                                External Opportunity
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Description</h3>
                        <div
                            className="prose prose-sm max-w-none text-muted-foreground"
                            dangerouslySetInnerHTML={{
                                __html: opportunity.description.replace(/\r\n/g, '<br>')
                            }}
                        />
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Details</h3>

                            <div className="space-y-3">
                                {opportunity.date && (
                                    <div className="flex items-center gap-3">
                                        <Calendar size={16} className="text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">Date</div>
                                            <div className="text-sm text-muted-foreground">{opportunity.date}</div>
                                        </div>
                                    </div>
                                )}

                                {opportunity.location && (
                                    <div className="flex items-center gap-3">
                                        <MapPin size={16} className="text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">Location</div>
                                            <div className="text-sm text-muted-foreground">{opportunity.location}</div>
                                        </div>
                                    </div>
                                )}

                                {opportunity.duration && (
                                    <div className="flex items-center gap-3">
                                        <Clock size={16} className="text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">Duration</div>
                                            <div className="text-sm text-muted-foreground">{opportunity.duration}</div>
                                        </div>
                                    </div>
                                )}

                                {opportunity.spots && (
                                    <div className="flex items-center gap-3">
                                        <Users size={16} className="text-muted-foreground" />
                                        <div>
                                            <div className="text-sm font-medium">Available Spots</div>
                                            <div className="text-sm text-muted-foreground">{opportunity.spots}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Categories & Activities</h3>

                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm font-medium mb-2">Category</div>
                                    <Badge variant="secondary" className="text-sm">
                                        {opportunity.category}
                                    </Badge>
                                </div>

                                {opportunity.activities.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium mb-2">Activities</div>
                                        <div className="flex flex-wrap gap-2">
                                            {opportunity.activities.map((activity, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {activity}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {opportunity.tags && opportunity.tags.length > 0 && (
                                    <div>
                                        <div className="text-sm font-medium mb-2 flex items-center gap-1">
                                            <Tag size={14} />
                                            Tags
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {opportunity.tags.map((tag, index) => (
                                                <Badge key={index} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Organization Info */}
                    <div className="border-t border-border/50 pt-6">
                        <h3 className="text-lg font-semibold mb-3">Organization</h3>
                        <div className="flex items-center gap-3">
                            <Building2 size={20} className="text-muted-foreground" />
                            <div>
                                <div className="font-medium">{opportunity.organization}</div>
                                <div className="text-sm text-muted-foreground">
                                    Learn more about this organization
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Apply Section */}
                    <div className="border-t border-border/50 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ExternalLink size={16} />
                                <span>This opportunity is hosted on Volunteer Connector</span>
                            </div>

                            <Button
                                onClick={handleApply}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                size="lg"
                            >
                                Apply on Volunteer Connector
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
