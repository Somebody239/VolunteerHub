import React, { useState } from 'react';
import { useVolunteerOpportunities } from '@/hooks/use-volunteer-opportunities';
import { ExternalOpportunityCard } from '@/components/ExternalOpportunityCard';
import { ExternalOpportunityDialog } from '@/components/ExternalOpportunityDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search } from 'lucide-react';

export default function TestVolunteerAPI() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data, isLoading, error, refetch } = useVolunteerOpportunities({
        searchTerm,
        enabled: true
    });

    const handleSearch = () => {
        refetch();
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold">Volunteer Connector API Test</h1>
                    <p className="text-muted-foreground">
                        Testing integration with Volunteer Connector API
                    </p>
                </div>

                {/* Search Controls */}
                <div className="glass-card p-6 rounded-xl">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium mb-2">
                                Search Term
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                                <Input
                                    placeholder="Search for opportunities..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? (
                                <RefreshCw className="animate-spin mr-2" size={16} />
                            ) : (
                                <Search className="mr-2" size={16} />
                            )}
                            Search
                        </Button>
                    </div>
                </div>

                {/* Results */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            Results {data && `(${data.results.length})`}
                        </h2>
                        {data && (
                            <div className="text-sm text-muted-foreground">
                                Total available: {data.count}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="glass-card p-6 rounded-xl border border-destructive/20">
                            <div className="text-destructive font-medium">Error loading opportunities</div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {error.message}
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="glass-card p-6 rounded-xl">
                            <div className="flex items-center gap-3">
                                <RefreshCw className="animate-spin" size={20} />
                                <span>Loading opportunities...</span>
                            </div>
                        </div>
                    )}

                    {data && data.results.length === 0 && (
                        <div className="glass-card p-6 rounded-xl text-center">
                            <div className="text-muted-foreground">
                                No opportunities found for "{searchTerm}"
                            </div>
                        </div>
                    )}

                    {data && data.results.length > 0 && (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {data.results.slice(0, 12).map((opportunity, index) => (
                                <ExternalOpportunityCard
                                    key={index}
                                    {...opportunity}
                                    onClick={() => {
                                        setSelectedOpportunity(opportunity);
                                        setDialogOpen(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {data && data.results.length > 12 && (
                        <div className="text-center text-sm text-muted-foreground">
                            Showing first 12 of {data.results.length} results
                        </div>
                    )}
                </div>

                {/* Dialog */}
                <ExternalOpportunityDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    opportunity={selectedOpportunity}
                />
            </div>
        </div>
    );
}
