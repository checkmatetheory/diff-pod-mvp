import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Eye, Share2, Download, ExternalLink, Star, Target, Zap, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Analytics = () => {
  // CSV export utility functions
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(','))
    ].join('\n');
    return csvContent;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    // Generate summary report CSV
    const reportData = [
      {
        metric: 'Revenue Attributed',
        value: '$287,500',
        change: '+24.8%',
        description: 'Via speaker microsites'
      },
      {
        metric: 'Speaker Reach', 
        value: '156.2K',
        change: '+32.1%',
        description: 'Total microsite views'
      },
      {
        metric: 'Network Effect',
        value: '2.4x',
        change: '+18.7%', 
        description: 'Viral coefficient'
      },
      {
        metric: 'Conversion Rate',
        value: '12.8%',
        change: '-1.2%',
        description: 'Microsite to ticket'
      }
    ];

    const csvContent = convertToCSV(reportData, ['metric', 'value', 'change', 'description']);
    downloadCSV(csvContent, 'speaker-attribution-report.csv');
    
    toast({
      title: "Speaker Analytics Exported!",
      description: "Your speaker performance report has been downloaded as CSV.",
    });
  };

  const handleDownloadData = () => {
    // Combine all data into one comprehensive CSV
    const allData = [];

    // Add summary metrics section
    allData.push({
      dataType: 'SUMMARY',
      name: 'Revenue Attributed',
      value: '$287,500',
      change: '+24.8%',
      description: 'Via speaker microsites'
    });
    allData.push({
      dataType: 'SUMMARY',
      name: 'Speaker Reach',
      value: '156.2K', 
      change: '+32.1%',
      description: 'Total microsite views'
    });
    allData.push({
      dataType: 'SUMMARY',
      name: 'Network Effect',
      value: '2.4x',
      change: '+18.7%',
      description: 'Viral coefficient'
    });
    allData.push({
      dataType: 'SUMMARY',
      name: 'Conversion Rate',
      value: '12.8%',
      change: '-1.2%',
      description: 'Microsite to ticket'
    });

    // Add empty row for separation
    allData.push({});

    // Add speaker performance data
    topSpeakers.forEach(speaker => {
      allData.push({
        dataType: 'SPEAKER_PERFORMANCE',
        name: speaker.name,
        title: speaker.title,
        company: speaker.company,
        event: speaker.eventName,
        micrositeViews: speaker.micrositeViews,
        revenueAttributed: speaker.revenue,
        networkShares: speaker.shares,
        conversionRate: speaker.conversionRate,
        networkGrowth: speaker.networkGrowth
      });
    });

    // Add empty row for separation
    allData.push({});

    // Add revenue attribution data
    revenueAttributionData.forEach(item => {
      allData.push({
        dataType: 'REVENUE_ATTRIBUTION',
        month: item.month,
        speakerRevenue: item.speakerRevenue,
        organicRevenue: item.organicRevenue,
        totalSpeakers: item.totalSpeakers,
        totalRevenue: item.speakerRevenue + item.organicRevenue
      });
    });

    // Add empty row for separation  
    allData.push({});

    // Add network effect data
    networkData.forEach(item => {
      allData.push({
        dataType: 'NETWORK_EFFECT',
        platform: item.name,
        percentage: item.value,
        color: item.color
      });
    });

    // Create comprehensive CSV with all possible columns
    const headers = [
      'dataType', 'name', 'value', 'change', 'description', 'title', 'company', 
      'event', 'micrositeViews', 'revenueAttributed', 'networkShares', 
      'conversionRate', 'networkGrowth', 'month', 'speakerRevenue', 
      'organicRevenue', 'totalSpeakers', 'totalRevenue', 'platform', 
      'percentage', 'color'
    ];

    const csvContent = convertToCSV(allData, headers);
    downloadCSV(csvContent, 'complete-speaker-analytics.csv');

    toast({
      title: "Analytics Data Downloaded!",
      description: "Complete analytics dataset downloaded as single CSV file.",
    });
  };

  // Updated stats for speaker-driven platform
  const stats = [
    {
      title: 'Revenue Attributed',
      value: '$287,500',
      change: '+24.8%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      subtitle: 'Via speaker microsites'
    },
    {
      title: 'Speaker Reach',
      value: '156.2K',
      change: '+32.1%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      subtitle: 'Total microsite views'
    },
    {
      title: 'Network Effect',
      value: '2.4x',
      change: '+18.7%',
      trend: 'up',
      icon: Share2,
      color: 'text-purple-600',
      subtitle: 'Viral coefficient'
    },
    {
      title: 'Conversion Rate',
      value: '12.8%',
      change: '-1.2%',
      trend: 'down',
      icon: Target,
      color: 'text-orange-600',
      subtitle: 'Microsite to ticket'
    }
  ];

  // Speaker attribution data for revenue growth
  const revenueAttributionData = [
    { month: 'Jan', speakerRevenue: 45000, organicRevenue: 15000, totalSpeakers: 8 },
    { month: 'Feb', speakerRevenue: 62000, organicRevenue: 18000, totalSpeakers: 12 },
    { month: 'Mar', speakerRevenue: 78000, organicRevenue: 22000, totalSpeakers: 16 },
    { month: 'Apr', speakerRevenue: 95000, organicRevenue: 25000, totalSpeakers: 20 },
    { month: 'May', speakerRevenue: 125000, organicRevenue: 28000, totalSpeakers: 24 },
    { month: 'Jun', speakerRevenue: 142000, organicRevenue: 30000, totalSpeakers: 28 },
  ];

  // Network effect breakdown
  const networkData = [
    { name: 'LinkedIn', value: 35, color: '#4FC3F7' },
    { name: 'Instagram', value: 22, color: '#FF7043' },
    { name: 'TikTok', value: 18, color: '#AB47BC' },
    { name: 'Twitter/X', value: 15, color: '#536471' },
    { name: 'WhatsApp', value: 10, color: '#25D366' },
  ];

  // Top performing speakers with actual attribution
  const topSpeakers = [
    {
      name: 'Sarah Chen',
      title: 'AI Ethics in Healthcare',
      company: 'MedTech Innovations',
      avatar: '/sarah-chen-headshot.jpg',
      micrositeViews: 12400,
      revenue: 18500,
      shares: 89,
      conversionRate: 14.2,
      networkGrowth: '+156%',
      eventName: 'HealthTech Summit 2024'
    },
    {
      name: 'Marcus Rodriguez',
      title: 'The Future of Fintech',
      company: 'BlockTech Ventures',
      avatar: '/api/placeholder/64/64',
      micrositeViews: 9800,
      revenue: 14200,
      shares: 67,
      conversionRate: 12.8,
      networkGrowth: '+124%',
      eventName: 'FinTech Innovation Expo'
    },
    {
      name: 'Dr. Emily Watson',
      title: 'Quantum Computing Breakthroughs',
      company: 'Quantum Labs',
      avatar: '/api/placeholder/64/64',
      micrositeViews: 8600,
      revenue: 12800,
      shares: 76,
      conversionRate: 15.1,
      networkGrowth: '+98%',
      eventName: 'TechCon 2024'
    },
    {
      name: 'James Park',
      title: 'Sustainable Energy Solutions',
      company: 'GreenTech Corp',
      avatar: '/api/placeholder/64/64',
      micrositeViews: 7200,
      revenue: 9600,
      shares: 54,
      conversionRate: 11.4,
      networkGrowth: '+87%',
      eventName: 'Climate Innovation Summit'
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 px-8 py-12">
            <div className="max-w-7xl mx-auto space-y-12">
              {/* Clean Header - Top Left */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">
                    Speaker Attribution Dashboard
                  </h1>
                  <p className="text-lg text-gray-600">
                    Track revenue attribution and network effects from your speaker microsites
                  </p>
                </div>
                <div className="flex gap-3 mt-2">
                  <Button 
                    variant="outline" 
                    onClick={handleExportReport}
                    className="bg-white hover:bg-gray-50 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Export Attribution Report
                  </Button>
                  <Button 
                    onClick={handleDownloadData}
                    className="bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Data
                  </Button>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat) => (
                  <Card key={stat.title} className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-xl ${
                          stat.title.includes('Revenue') ? 'bg-green-50 border border-green-100' :
                          stat.title.includes('Reach') ? 'bg-blue-50 border border-blue-100' :
                          stat.title.includes('Network') ? 'bg-purple-50 border border-purple-100' :
                          'bg-orange-50 border border-orange-100'
                        }`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                        <div className="flex items-center gap-1">
                          {stat.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.subtitle}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Speaker Revenue Attribution */}
                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                      <Award className="h-6 w-6 text-yellow-600" />
                      Speaker Revenue Attribution
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Revenue generated through speaker microsites vs. organic channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={revenueAttributionData}>
                          <defs>
                            <linearGradient id="speakerGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                            </linearGradient>
                            <linearGradient id="organicGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6B7280" stopOpacity={0.6}/>
                              <stop offset="95%" stopColor="#6B7280" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                          <YAxis stroke="#6B7280" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="speakerRevenue" 
                            stroke="#10B981" 
                            fillOpacity={1} 
                            fill="url(#speakerGradient)"
                            strokeWidth={3}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="organicRevenue" 
                            stroke="#6B7280" 
                            fillOpacity={1} 
                            fill="url(#organicGradient)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Network Effect Distribution */}
                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-xl text-gray-900 flex items-center gap-3">
                      <Share2 className="h-6 w-6 text-purple-600" />
                      Network Effect Channels
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      How speakers are sharing and amplifying content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                      <ResponsiveContainer width="100%" height={320}>
                        <PieChart margin={{ top: 20, right: 60, bottom: 20, left: 60 }}>
                          <Pie
                            data={networkData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="white"
                            strokeWidth={2}
                          >
                            {networkData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value) => [`${value}%`, 'Share']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performing Speakers */}
              <Card className="bg-white border border-gray-200 shadow-md">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl text-gray-900 flex items-center gap-3">
                    <Star className="h-7 w-7 text-yellow-500" />
                    Top Performing Speakers
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Speakers driving the highest revenue attribution and network effects
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="space-y-4">
                    {topSpeakers.map((speaker, index) => (
                      <div key={speaker.name} className="flex items-center justify-between p-6 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md">
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold text-xl shadow-lg" style={{backgroundColor: '#4F8CFF', color: '#ffffff'}}>
                              {index + 1}
                            </div>
                            {index === 0 && (
                              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Star className="h-3 w-3 text-white fill-current" />
                              </div>
                            )}
                          </div>
                          <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                            <AvatarImage src={speaker.avatar} alt={speaker.name} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-lg">
                              {speaker.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">{speaker.name}</h3>
                            <p className="text-gray-600 font-medium">{speaker.title}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                {speaker.company}
                              </Badge>
                              <Badge variant="outline" className="text-purple-700 border-purple-300">
                                {speaker.eventName}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{speaker.micrositeViews.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Microsite Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">${speaker.revenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Revenue Attributed</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{speaker.shares}</p>
                            <p className="text-sm text-gray-600">Network Shares</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{speaker.conversionRate}%</p>
                            <p className="text-sm text-gray-600">Conversion Rate</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <p className="text-lg font-bold text-green-600">{speaker.networkGrowth}</p>
                            </div>
                            <p className="text-sm text-gray-600">Network Growth</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">28</div>
                    <p className="text-gray-600 font-medium">Active Speaker Microsites</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">89%</div>
                    <p className="text-gray-600 font-medium">Speaker Engagement Rate</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">1,247</div>
                    <p className="text-gray-600 font-medium">Total Leads Captured</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg hover:bg-gray-50 transition-all duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">7.2x</div>
                    <p className="text-gray-600 font-medium">Average ROI Multiplier</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;