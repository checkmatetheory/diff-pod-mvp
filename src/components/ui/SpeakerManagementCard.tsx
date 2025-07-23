import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Edit, 
  ExternalLink, 
  BarChart3, 
  Trash2,
  Copy,
  Settings
} from "lucide-react";
import { toast } from "sonner";

interface Speaker {
  id: string;
  full_name: string;
  email: string;
  company: string;
  job_title: string;
  bio: string;
  linkedin_url: string;
  headshot_url: string | null;
  slug: string;
  created_at: string;
  total_sessions?: number;
  total_views?: number;
  revenue_attributed?: number;
  avg_engagement?: number;
}

interface SpeakerManagementCardProps {
  speaker: Speaker;
  onEdit: (speaker: Speaker) => void;
  onAdvanced: (speaker: Speaker) => void;
  onDelete: (speaker: Speaker) => void;
  onRemove?: (speaker: Speaker) => void;
  onViewMicrosite?: (speaker: Speaker) => void;
  showMetrics?: boolean;
  compact?: boolean;
}

export default function SpeakerManagementCard({
  speaker,
  onEdit,
  onAdvanced,
  onDelete,
  onRemove,
  onViewMicrosite,
  showMetrics = false,
  compact = false
}: SpeakerManagementCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleCopyEmail = () => {
    if (speaker.email) {
      navigator.clipboard.writeText(speaker.email);
      toast.success("Email copied to clipboard");
    }
  };

  const handleViewMicrosite = () => {
    if (onViewMicrosite) {
      onViewMicrosite(speaker);
    } else {
      toast.info("Microsite functionality not available");
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 border rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 hover:shadow-md transition-all group relative">
        <Avatar className="h-10 w-10 flex-shrink-0">
          {speaker.headshot_url ? (
            <AvatarImage src={speaker.headshot_url} alt={speaker.full_name} />
          ) : null}
          <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            {speaker.full_name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{speaker.full_name}</p>
          {speaker.job_title && speaker.company ? (
            <p className="text-xs text-muted-foreground">
              {speaker.job_title} at {speaker.company}
            </p>
          ) : speaker.job_title ? (
            <p className="text-xs text-muted-foreground">{speaker.job_title}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Speaker</p>
          )}
        </div>

        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEdit(speaker)}>
              <Edit className="h-4 w-4 mr-2" />
              Quick Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewMicrosite}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Microsite
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAdvanced(speaker)}>
              <Settings className="h-4 w-4 mr-2" />
              Advanced Options
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(speaker)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Speaker
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Card className="relative group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        {/* Action Menu - Top Right */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-3 right-3 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => onEdit(speaker)}>
              <Edit className="h-4 w-4 mr-2" />
              Quick Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleViewMicrosite}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Microsite
            </DropdownMenuItem>
            {speaker.email && (
              <DropdownMenuItem onClick={handleCopyEmail}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Email
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAdvanced(speaker)}>
              <Settings className="h-4 w-4 mr-2" />
              Advanced Options
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Analytics coming soon!")}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(speaker)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Speaker
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Speaker Info */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-16 w-16">
            {speaker.headshot_url ? (
              <AvatarImage src={speaker.headshot_url} alt={speaker.full_name} />
            ) : (
              <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {speaker.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 truncate">{speaker.full_name}</h3>
            <p className="text-sm text-gray-600 truncate">{speaker.job_title}</p>
            <p className="text-sm text-gray-500 truncate">{speaker.company}</p>
            {speaker.revenue_attributed && speaker.revenue_attributed > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200 mt-2">
                Top Performer
              </Badge>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        {showMetrics && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-lg font-bold text-gray-800">{speaker.total_sessions || 0}</p>
              <p className="text-xs text-gray-600">Sessions</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-lg font-bold text-green-600">
                {speaker.revenue_attributed ? formatCurrency(speaker.revenue_attributed) : '$0'}
              </p>
              <p className="text-xs text-gray-600">Revenue</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-lg font-bold text-gray-800">
                {speaker.total_views ? formatNumber(speaker.total_views) : '0'}
              </p>
              <p className="text-xs text-gray-600">Views</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gray-50">
              <p className="text-lg font-bold text-gray-800">
                {speaker.avg_engagement ? `${speaker.avg_engagement.toFixed(0)}%` : '0%'}
              </p>
              <p className="text-xs text-gray-600">Engagement</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onEdit(speaker)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleViewMicrosite}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 