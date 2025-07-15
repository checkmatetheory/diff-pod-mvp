import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  Users, 
  X, 
  ExternalLink,
  Share2,
  Copy,
  Linkedin,
  Twitter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversion {
  id: string;
  conversion_type: string;
  conversion_value: number;
  referral_code?: string;
  speaker_name: string;
  event_name: string;
  celebrated_at: string;
}

interface ConversionCelebrationProps {
  eventId?: string;
  speakerId?: string;
  onClose?: () => void;
  className?: string;
}

export default function ConversionCelebration({
  eventId,
  speakerId,
  onClose,
  className = ""
}: ConversionCelebrationProps) {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchRecentConversions();
  }, [eventId, speakerId]);

  const fetchRecentConversions = async () => {
    try {
      let query = supabase
        .from('conversion_celebrations')
        .select(`
          *,
          speaker:speakers(full_name),
          event:events(name, subdomain)
        `)
        .order('celebrated_at', { ascending: false })
        .limit(5);

      if (eventId) {
        query = query.eq('event_id', eventId);
      }
      if (speakerId) {
        query = query.eq('speaker_id', speakerId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const processedConversions = data?.map(conv => ({
        id: conv.id,
        conversion_type: conv.conversion_type,
        conversion_value: conv.conversion_value || 0,
        referral_code: conv.referral_code,
        speaker_name: conv.speaker?.full_name || 'Unknown Speaker',
        event_name: conv.event?.name || 'Unknown Event',
        celebrated_at: conv.celebrated_at,
      })) || [];

      setConversions(processedConversions);
      setTotalValue(processedConversions.reduce((sum, conv) => sum + conv.conversion_value, 0));
      
      // Show celebration if there are recent conversions
      if (processedConversions.length > 0) {
        setVisible(true);
        
        // Auto-hide after 10 seconds
        setTimeout(() => setVisible(false), 10000);
      }
    } catch (error) {
      console.error('Error fetching conversions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversionIcon = (type: string) => {
    switch (type) {
      case 'ticket_purchase':
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 'registration':
        return <Users className="h-6 w-6 text-blue-500" />;
      case 'email_capture':
        return <TrendingUp className="h-6 w-6 text-green-500" />;
      default:
        return <DollarSign className="h-6 w-6 text-primary" />;
    }
  };

  const getConversionMessage = (conversion: Conversion) => {
    switch (conversion.conversion_type) {
      case 'ticket_purchase':
        return `Congrats! ${conversion.speaker_name} just sold a ticket to ${conversion.event_name}!`;
      case 'registration':
        return `🎉 ${conversion.speaker_name} generated a registration for ${conversion.event_name}!`;
      case 'email_capture':
        return `📧 ${conversion.speaker_name} captured a new lead for ${conversion.event_name}!`;
      default:
        return `💰 ${conversion.speaker_name} generated a conversion for ${conversion.event_name}!`;
    }
  };

  const shareConversion = async (conversion: Conversion, platform: string) => {
    const text = `🎉 Amazing! Just generated a ${conversion.conversion_type.replace('_', ' ')} worth $${conversion.conversion_value} through my speaker microsite! #DiffusedSuccess #SpeakerImpact`;
    const url = window.location.href;

    let shareUrl = '';
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        toast.success('Celebration message copied!');
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=550,height=420');
      toast.success(`Shared celebration on ${platform}!`);
    }
  };

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible || conversions.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 max-w-md ${className}`}>
      <Card className="enhanced-card border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-2xl animate-bounce">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-yellow-800">Conversion Alert!</h3>
                <p className="text-sm text-yellow-700">Your speaker network is working!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-yellow-700 hover:text-yellow-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 mb-4">
            {conversions.slice(0, 3).map((conversion) => (
              <div key={conversion.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                {getConversionIcon(conversion.conversion_type)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getConversionMessage(conversion)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {conversion.conversion_value > 0 && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        ${conversion.conversion_value}
                      </Badge>
                    )}
                    {conversion.referral_code && (
                      <Badge variant="outline" className="text-xs">
                        {conversion.referral_code}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(conversion.celebrated_at).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalValue > 0 && (
            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Value Generated:</span>
                <span className="text-lg font-bold text-green-600">${totalValue}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => shareConversion(conversions[0], 'linkedin')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Linkedin className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareConversion(conversions[0], 'twitter')}
              className="flex-1"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Tweet
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => shareConversion(conversions[0], 'copy')}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-gray-600">
              Powered by Diffused • Attribution tracking in action!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for using conversion celebrations
export function useConversionCelebrations(eventId?: string, speakerId?: string) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentConversions, setRecentConversions] = useState<Conversion[]>([]);

  useEffect(() => {
    if (!eventId) return;

    // Subscribe to new conversions
    const subscription = supabase
      .channel('conversion-celebrations')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversion_celebrations',
          filter: eventId ? `event_id=eq.${eventId}` : undefined,
        },
        (payload) => {
          // Show celebration for new conversions
          setShowCelebration(true);
          console.log('New conversion celebration:', payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId, speakerId]);

  return {
    showCelebration,
    setShowCelebration,
    recentConversions,
  };
} 