import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { 
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  Zap,
  Target,
  Award,
  ArrowUpRight,
  Plus,
  BarChart3,
  Share2,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface ConversionData {
  id: string;
  speaker_name: string;
  event_name: string;
  conversion_type: 'ticket_sale' | 'email_capture' | 'sponsor_signup';
  value: number;
  timestamp: string;
  microsite_url: string;
}

interface PendingApproval {
  id: string;
  speaker_name: string;
  event_name: string;
  content_type: 'microsite' | 'video_clips' | 'summary';
  created_at: string;
  priority: 'high' | 'medium' | 'low';
}

const Dashboard = () => {
  const navigate = useNavigate();
  
  // ROI-focused stats that event organizers care about
  const stats = [
    {
      title: 'Total Revenue Attributed',
      value: '$847K',
      change: '+$127K this month',
      icon: DollarSign,
      color: 'text-green-600',
      trend: 'up',
      subtitle: 'From speaker microsites'
    },
    {
      title: 'Tickets Sold',
      value: '2,847',
      change: '+412 this week',
      icon: Calendar,
      color: 'text-blue-600',
      trend: 'up',
      subtitle: 'Next year registrations'
    },
    {
      title: 'Qualified Leads',
      value: '18.2K',
      change: '+2.1K this month',
      icon: Users,
      color: 'text-purple-600',
      trend: 'up',
      subtitle: 'Email captures & signups'
    },
    {
      title: 'Speaker Network ROI',
      value: '12.4x',
      change: '+2.1x vs last event',
      icon: TrendingUp,
      color: 'text-orange-600',
      trend: 'up',
      subtitle: 'Revenue per $ invested'
    }
  ];

  // Mock active events data (focusing on revenue attribution)
  const activeEvents = [
    {
      id: '1',
      name: 'FinTech Innovation Summit 2024',
      description: 'Generating revenue through speaker network effects',
      brand_logo_url: null,
      category: 'Financial Technology',
      status: 'live',
      analytics: {
        revenue_attributed: 247000,
        tickets_sold: 892,
        qualified_leads: 5600,
        speaker_count: 24,
        conversion_rate: 8.2,
        top_performing_speaker: 'Sarah Chen'
      },
      next_event_date: '2025-03-15',
      registration_url: 'https://fintech2025.com'
    }
  ];

  // Recent conversions (dopamine hits for the organizer)
  const recentConversions: ConversionData[] = [
    {
      id: '1',
      speaker_name: 'Sarah Chen',
      event_name: 'FinTech Summit 2024',
      conversion_type: 'ticket_sale',
      value: 299,
      timestamp: '2024-01-15T14:30:00Z',
      microsite_url: '/speaker/sarah-chen'
    },
    {
      id: '2',
      speaker_name: 'Marcus Rodriguez',
      event_name: 'AI Conference 2024',
      conversion_type: 'sponsor_signup',
      value: 5000,
      timestamp: '2024-01-15T13:15:00Z',
      microsite_url: '/speaker/marcus-rodriguez'
    },
    {
      id: '3',
      speaker_name: 'Dr. Priya Sharma',
      event_name: 'Tech Summit 2024',
      conversion_type: 'email_capture',
      value: 25, // estimated value per email
      timestamp: '2024-01-15T12:45:00Z',
      microsite_url: '/speaker/priya-sharma'
    }
  ];

  // Content pending approval (giving organizers control)
  const pendingApprovals: PendingApproval[] = [
    {
      id: '1',
      speaker_name: 'Alex Thompson',
      event_name: 'DevCon 2024',
      content_type: 'microsite',
      created_at: '2024-01-15T10:00:00Z',
      priority: 'high'
    },
    {
      id: '2',
      speaker_name: 'Lisa Wong',
      event_name: 'Marketing Expo',
      content_type: 'video_clips',
      created_at: '2024-01-15T09:30:00Z',
      priority: 'medium'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getConversionIcon = (type: string) => {
    switch (type) {
      case 'ticket_sale': return Calendar;
      case 'email_capture': return Users;
      case 'sponsor_signup': return Award;
      default: return Target;
    }
  };

  const getConversionColor = (type: string) => {
    switch (type) {
      case 'ticket_sale': return 'text-green-600';
      case 'email_capture': return 'text-blue-600';
      case 'sponsor_signup': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle Sky Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-sky-50/40" />
      
      {/* Minimal Cloud Elements */}
      <div className="absolute top-20 right-1/4 w-24 h-12 bg-white/15 rounded-full blur-xl" />
      <div className="absolute bottom-1/3 left-1/5 w-32 h-16 bg-white/10 rounded-full blur-xl" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section - Revenue Attribution Focus */}
        <div className="mb-16">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 to-blue-600 p-12 shadow-xl backdrop-blur-sm">
            <div className="relative z-10 max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-white">
                  Revenue Attribution Dashboard
                </h1>
              </div>
              <p className="text-xl text-white/95 mb-8 leading-relaxed">
                Transform your speakers into a measurable revenue channel. Track ticket sales, 
                lead generation, and sponsorship value from every speaker microsite.
              </p>
              <div className="flex gap-4">
                <Button 
                  size="lg" 
                  className="bg-white/95 text-green-600 hover:bg-white backdrop-blur-sm font-semibold shadow-lg" 
                  onClick={() => navigate('/events')}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create New Event
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-white/50 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold" 
                  onClick={() => navigate('/analytics')}
                >
                  <BarChart3 className="h-5 w-5 mr-2" />
                  View Full Analytics
                </Button>
              </div>
            </div>
            
            {/* Revenue Attribution Visual */}
            <div className="absolute top-6 right-6 bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">${(847).toLocaleString()}K</div>
                <div className="text-white/80 text-sm">This Month</div>
                <div className="flex items-center justify-center mt-2 text-white/90">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">+47% vs last month</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROI-Focused Stats Grid */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="backdrop-blur-sm bg-white/40 p-4 rounded-xl border border-white/30">
              <h2 className="text-2xl font-semibold text-gray-800">Revenue Impact Overview</h2>
              <p className="text-gray-600">Real-time attribution from your speaker network</p>
            </div>
            <Badge className="backdrop-blur-sm bg-white/60 border border-white/40 text-gray-700">
              <Eye className="h-4 w-4 mr-2" />
              Live Tracking
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${stat.title.includes('Revenue') ? 'bg-green-100/80' : 'bg-gray-100/80'} backdrop-blur-sm`}>
                          <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </div>
                        <p className="text-sm font-medium text-gray-700">
                          {stat.title}
                        </p>
                      </div>
                      <p className="text-3xl font-bold mb-1 text-gray-800">{stat.value}</p>
                      <p className={`text-sm font-medium ${stat.title.includes('Revenue') ? 'text-green-600' : 'text-blue-600'}`}>
                        {stat.change}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{stat.subtitle}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Two-column layout for real-time activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Recent Conversions - Dopamine Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="backdrop-blur-sm bg-white/40 p-4 rounded-xl border border-white/30">
                <h2 className="text-xl font-semibold text-gray-800">🎉 Recent Conversions</h2>
                <p className="text-sm text-gray-600">Your speakers are generating revenue right now</p>
              </div>
              <Button variant="outline" size="sm" className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70">
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentConversions.map((conversion) => {
                const IconComponent = getConversionIcon(conversion.conversion_type);
                const iconColor = getConversionColor(conversion.conversion_type);
                
                return (
                  <Card key={conversion.id} className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100/80 backdrop-blur-sm">
                            <IconComponent className={`h-4 w-4 ${iconColor}`} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{conversion.speaker_name}</p>
                            <p className="text-xs text-gray-600">{conversion.event_name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(conversion.value)}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(conversion.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Pending Approvals - Control Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="backdrop-blur-sm bg-white/40 p-4 rounded-xl border border-white/30">
                <h2 className="text-xl font-semibold text-gray-800">⏳ Pending Your Approval</h2>
                <p className="text-sm text-gray-600">Review before speaker distribution</p>
              </div>
              <Badge className="bg-orange-100/80 text-orange-700 backdrop-blur-sm border border-orange-200/50">
                {pendingApprovals.length} pending
              </Badge>
            </div>
            
            <div className="space-y-3">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id} className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-orange-100/80 backdrop-blur-sm">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{approval.speaker_name}</p>
                          <p className="text-xs text-gray-600">
                            {approval.content_type.replace('_', ' ')} • {approval.event_name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 px-3 backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70">
                          Review
                        </Button>
                        <Button size="sm" className="h-8 px-3 bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm">
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Active Events - Revenue Focus */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="backdrop-blur-sm bg-white/40 p-4 rounded-xl border border-white/30">
              <h2 className="text-2xl font-semibold text-gray-800">Active Events</h2>
              <p className="text-gray-600">Live revenue attribution from speaker microsites</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/events')} className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70">
              Manage All Events
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {activeEvents.map((event) => (
              <Card key={event.id} className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40 hover:shadow-2xl hover:bg-white/60 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-800">{event.name}</h3>
                        <Badge className="bg-green-100/80 text-green-800 backdrop-blur-sm border border-green-200/50">Live</Badge>
                      </div>
                      <p className="text-gray-600 mb-4">{event.description}</p>
                      
                      {/* Revenue metrics grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-100/80 backdrop-blur-sm rounded-xl border border-green-200/50">
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(event.analytics.revenue_attributed)}
                          </p>
                          <p className="text-xs text-green-600">Revenue</p>
                        </div>
                        <div className="text-center p-4 backdrop-blur-sm bg-white/60 rounded-xl border border-white/40">
                          <p className="text-2xl font-bold text-blue-600">
                            {event.analytics.tickets_sold.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">Tickets</p>
                        </div>
                        <div className="text-center p-4 backdrop-blur-sm bg-white/60 rounded-xl border border-white/40">
                          <p className="text-2xl font-bold text-purple-600">
                            {event.analytics.qualified_leads.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-600">Leads</p>
                        </div>
                        <div className="text-center p-4 backdrop-blur-sm bg-white/60 rounded-xl border border-white/40">
                          <p className="text-2xl font-bold text-orange-600">
                            {event.analytics.conversion_rate}%
                          </p>
                          <p className="text-xs text-gray-600">CVR</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70">
                        View Analytics
                      </Button>
                      <Button size="sm" className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm">
                        Manage Event
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 border-t border-white/30 pt-4">
                    <span>Top performer: <strong className="text-gray-800">{event.analytics.top_performing_speaker}</strong></span>
                    <span>{event.analytics.speaker_count} active speakers</span>
                    <span>Next event: {new Date(event.next_event_date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Revenue-Focused Quick Actions */}
        <div>
          <div className="backdrop-blur-sm bg-white/40 p-4 rounded-xl border border-white/30 mb-8 inline-block">
            <h2 className="text-2xl font-semibold text-gray-800">Revenue Optimization</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 cursor-pointer hover:shadow-xl hover:bg-white/60 transition-all duration-300" onClick={() => navigate('/events')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-100/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">Launch New Event</h3>
                <p className="text-sm text-gray-600">
                  Set up speaker microsites to maximize next year's ticket sales
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 cursor-pointer hover:shadow-xl hover:bg-white/60 transition-all duration-300" onClick={() => navigate('/analytics')}>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-100/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">Revenue Analytics</h3>
                <p className="text-sm text-gray-600">
                  Deep dive into speaker performance and attribution metrics
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 cursor-pointer hover:shadow-xl hover:bg-white/60 transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-100/80 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <Share2 className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2 text-gray-800">Speaker Network</h3>
                <p className="text-sm text-gray-600">
                  Manage speaker incentives and track viral distribution
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;