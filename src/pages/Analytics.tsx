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
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1 p-6">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                  <p className="text-muted-foreground">
                    Track performance, revenue, and engagement across all your podcasts
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleExportReport}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button onClick={handleDownloadData}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Data
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => (
                  <Card key={stat.title} className="shadow-card">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <div className="flex items-center gap-1 mt-1">
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
                        <div className={`p-3 rounded-full bg-primary-subtle ${stat.color}`}>
                          <stat.icon className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Chart */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Revenue Growth</CardTitle>
                    <CardDescription>
                      Monthly revenue and episode count over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={revenueData}>
                        <XAxis dataKey="month" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Platform Distribution */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Platform Distribution</CardTitle>
                    <CardDescription>
                      Where your audience listens to your podcasts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={platformData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={40}
                          paddingAngle={2}
                        >
                          {platformData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Share']}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Episodes */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Top Performing Episodes</CardTitle>
                  <CardDescription>
                    Your most successful episodes by views and revenue
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topEpisodes.map((episode, index) => (
                      <div key={episode.title} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold">{episode.title}</h4>
                            <p className="text-sm text-muted-foreground">{episode.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-medium">{episode.views.toLocaleString()} views</p>
                            <p className="text-sm text-muted-foreground">${episode.revenue.toLocaleString()} revenue</p>
                          </div>
                          <Badge variant="secondary">
                            {episode.engagement}% engagement
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Analytics;