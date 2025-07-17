import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, Eye, Headphones, Download, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Analytics = () => {
  const handleExportReport = () => {
    toast({
      title: "Report exported successfully!",
      description: "Your analytics report has been generated and downloaded.",
    });
  };

  const handleDownloadData = () => {
    toast({
      title: "Data download started",
      description: "Your analytics data is being prepared for download.",
    });
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: '$105,234',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Total Views',
      value: '29.4K',
      change: '+18.2%',
      trend: 'up',
      icon: Eye,
      color: 'text-blue-600'
    },
    {
      title: 'Total Downloads',
      value: '18.7K',
      change: '+8.1%',
      trend: 'up',
      icon: Download,
      color: 'text-purple-600'
    },
    {
      title: 'Engagement Rate',
      value: '78.5%',
      change: '-2.3%',
      trend: 'down',
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 8500, episodes: 4 },
    { month: 'Feb', revenue: 12000, episodes: 6 },
    { month: 'Mar', revenue: 15400, episodes: 8 },
    { month: 'Apr', revenue: 18200, episodes: 9 },
    { month: 'May', revenue: 22100, episodes: 11 },
    { month: 'Jun', revenue: 25800, episodes: 12 },
  ];

  const platformData = [
    { name: 'Spotify', value: 45, color: '#1DB954' },
    { name: 'Apple Podcasts', value: 30, color: '#A855F7' },
    { name: 'YouTube', value: 15, color: '#FF0000' },
    { name: 'Google Podcasts', value: 10, color: '#4285F4' },
  ];

  const topEpisodes = [
    {
      title: 'AI in Fintech: Future Trends Panel',
      views: 8500,
      revenue: 2400,
      date: '2024-01-15',
      engagement: 85
    },
    {
      title: 'Crypto Market Analysis Q4 2024',
      views: 7200,
      revenue: 1950,
      date: '2024-01-12',
      engagement: 78
    },
    {
      title: 'Startup Funding Landscape',
      views: 6800,
      revenue: 1750,
      date: '2024-01-10',
      engagement: 82
    },
    {
      title: 'Tech Innovation Summit Recap',
      views: 6200,
      revenue: 1600,
      date: '2024-01-08',
      engagement: 76
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full relative overflow-hidden">
        {/* Subtle Sky Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/20 to-sky-50/30" />
        
        {/* Minimal Cloud Elements */}
        <div className="absolute top-16 right-1/3 w-20 h-10 bg-white/10 rounded-full blur-lg" />
        <div className="absolute bottom-1/4 left-1/6 w-28 h-14 bg-white/8 rounded-full blur-xl" />
        
        <AppSidebar />
        <SidebarInset className="flex-1 relative z-10">
          <Header />
          <main className="flex-1 px-8 py-12">
            <div className="max-w-7xl mx-auto space-y-12">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="backdrop-blur-sm bg-white/40 p-6 rounded-2xl border border-white/30 shadow-lg">
                  <h1 className="text-4xl font-bold mb-2 text-gray-800">Analytics Dashboard</h1>
                  <p className="text-lg text-gray-600">
                    Track performance, revenue, and engagement across all your podcasts
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={handleExportReport}
                    className="backdrop-blur-sm bg-white/50 border border-white/40 hover:bg-white/70 shadow-lg"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Export Report
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={handleDownloadData}
                    className="bg-blue-600/90 hover:bg-blue-700/90 backdrop-blur-sm shadow-lg border border-blue-500/20"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Data
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat) => (
                  <Card key={stat.title} className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {stat.title}
                          </p>
                          <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                          <div className="flex items-center gap-1 mt-3">
                            {stat.trend === 'up' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <p className={`text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                              {stat.change}
                            </p>
                          </div>
                        </div>
                        <div className={`p-4 rounded-2xl ${stat.title.includes('Revenue') ? 'bg-green-100/80' : 'bg-gray-100/80'} backdrop-blur-sm`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl text-gray-800">Revenue Growth</CardTitle>
                    <CardDescription className="text-base text-gray-600">
                      Monthly revenue and episode count over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="backdrop-blur-sm bg-white/30 rounded-xl p-4 border border-white/30">
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueData}>
                          <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                          <YAxis stroke="#6B7280" fontSize={12} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '12px',
                              backdropFilter: 'blur(8px)'
                            }} 
                          />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#10B981" 
                            strokeWidth={3}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Platform Distribution */}
                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40 hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-8">
                    <CardTitle className="text-xl text-gray-800">Platform Distribution</CardTitle>
                    <CardDescription className="text-base text-gray-600">
                      Audience breakdown by platform
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 pt-0">
                    <div className="backdrop-blur-sm bg-white/30 rounded-xl p-4 border border-white/30">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={platformData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {platformData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '8px',
                              backdropFilter: 'blur(8px)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Episodes */}
              <Card className="border-0 backdrop-blur-md bg-white/50 shadow-xl border border-white/40">
                <CardHeader className="pb-8">
                  <CardTitle className="text-xl text-gray-800">Top Performing Episodes</CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    Your most successful episodes by views and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <div className="space-y-6">
                    {topEpisodes.map((episode, index) => (
                      <div key={episode.title} className="flex items-center justify-between p-6 rounded-2xl backdrop-blur-sm bg-white/40 border border-white/30 hover:bg-white/60 transition-all duration-300">
                        <div className="flex items-center gap-6">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/90 text-white flex items-center justify-center font-bold backdrop-blur-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800">{episode.title}</h3>
                            <p className="text-gray-600">{episode.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800">{episode.views.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">${episode.revenue.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">Revenue</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{episode.engagement}%</p>
                            <p className="text-sm text-gray-600">Engagement</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">94.2%</div>
                    <p className="text-gray-600">Completion Rate</p>
                  </CardContent>
                </Card>
                
                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">4.8/5</div>
                    <p className="text-gray-600">Average Rating</p>
                  </CardContent>
                </Card>
                
                <Card className="border-0 backdrop-blur-md bg-white/50 shadow-lg border border-white/30 hover:shadow-xl hover:bg-white/60 transition-all duration-300">
                  <CardContent className="p-8 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">42</div>
                    <p className="text-gray-600">Total Episodes</p>
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