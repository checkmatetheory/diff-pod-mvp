import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  FileVideo, 
  Eye, 
  Share2, 
  Download,
  Users,
  Clock,
  Calendar
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Header from "@/components/Header";

const Analytics = () => {
  const navigate = useNavigate();
  // Simulated data
  const sessionUploadsData = [
    { month: "Jan", sessions: 8, content: 32 },
    { month: "Feb", sessions: 12, content: 48 },
    { month: "Mar", sessions: 15, content: 60 },
    { month: "Apr", sessions: 18, content: 72 },
    { month: "May", sessions: 22, content: 88 },
    { month: "Jun", sessions: 25, content: 100 }
  ];

  const contentTypeData = [
    { type: "Blog Posts", count: 156, color: "hsl(var(--primary))" },
    { type: "Social Posts", count: 134, color: "hsl(var(--accent))" },
    { type: "Summaries", count: 89, color: "hsl(var(--secondary))" },
    { type: "Transcripts", count: 67, color: "hsl(var(--muted))" }
  ];

  const engagementData = [
    { date: "Mon", views: 245, shares: 23, downloads: 12 },
    { date: "Tue", views: 312, shares: 31, downloads: 18 },
    { date: "Wed", views: 189, shares: 19, downloads: 8 },
    { date: "Thu", views: 423, shares: 42, downloads: 24 },
    { date: "Fri", views: 378, shares: 38, downloads: 19 },
    { date: "Sat", views: 201, shares: 15, downloads: 7 },
    { date: "Sun", views: 156, shares: 12, downloads: 5 }
  ];

  const topSessionsData = [
    { 
      title: "AI in Fintech: Future Trends Panel",
      views: 1234,
      shares: 89,
      exports: 34,
      date: "2024-01-15",
      trend: "up"
    },
    {
      title: "Quarterly Investment Review",
      views: 987,
      shares: 67,
      exports: 23,
      date: "2024-01-10",
      trend: "up"
    },
    {
      title: "Digital Transformation Strategies",
      views: 756,
      shares: 45,
      exports: 18,
      date: "2024-01-08",
      trend: "down"
    },
    {
      title: "Market Analysis Deep Dive",
      views: 623,
      shares: 34,
      exports: 15,
      date: "2024-01-05",
      trend: "up"
    }
  ];

  const chartConfig = {
    sessions: {
      label: "Sessions",
      color: "hsl(var(--primary))"
    },
    content: {
      label: "Content Pieces",
      color: "hsl(var(--accent))"
    },
    views: {
      label: "Views",
      color: "hsl(var(--primary))"
    },
    shares: {
      label: "Shares", 
      color: "hsl(var(--accent))"
    },
    downloads: {
      label: "Downloads",
      color: "hsl(var(--secondary))"
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <Header />
          <main className="flex-1">
            <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient-primary mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your content performance and engagement metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                  <p className="text-2xl font-bold">127</p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    +18% from last month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-primary-subtle">
                  <FileVideo className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">24.7K</p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    +24% from last month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-accent-subtle">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Shares</p>
                  <p className="text-2xl font-bold">1.8K</p>
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <TrendingDown className="h-4 w-4" />
                    -3% from last month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-secondary-subtle">
                  <Share2 className="h-5 w-5 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold">892</p>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    +12% from last month
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Download className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Session Uploads Trend */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Content Growth</CardTitle>
              <CardDescription>Sessions uploaded and content pieces generated over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <LineChart data={sessionUploadsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="sessions" 
                    stroke="var(--color-sessions)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-sessions)" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="content" 
                    stroke="var(--color-content)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-content)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Content Type Distribution */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Content Types</CardTitle>
              <CardDescription>Distribution of generated content by type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <PieChart>
                  <Pie
                    data={contentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {contentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Engagement */}
        <Card className="shadow-card mb-8">
          <CardHeader>
            <CardTitle>Weekly Engagement</CardTitle>
            <CardDescription>Views, shares, and downloads over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <AreaChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stackId="1"
                  stroke="var(--color-views)"
                  fill="var(--color-views)"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="shares" 
                  stackId="2"
                  stroke="var(--color-shares)"
                  fill="var(--color-shares)"
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="downloads" 
                  stackId="3"
                  stroke="var(--color-downloads)"
                  fill="var(--color-downloads)"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Top Performing Sessions */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Top Performing Sessions</CardTitle>
                <CardDescription>Sessions ranked by total engagement</CardDescription>
              </div>
              <Button variant="outline">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSessionsData.map((session, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{session.title}</h3>
                        <Badge variant={session.trend === 'up' ? 'secondary' : 'outline'}>
                          {session.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {session.trend}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {session.date}
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-primary" />
                          <span className="font-medium">{session.views.toLocaleString()}</span>
                          <span className="text-muted-foreground">views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Share2 className="h-4 w-4 text-accent" />
                          <span className="font-medium">{session.shares}</span>
                          <span className="text-muted-foreground">shares</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4 text-secondary" />
                          <span className="font-medium">{session.exports}</span>
                          <span className="text-muted-foreground">exports</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/session/${index + 1}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/recap/${index + 1}`)}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
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