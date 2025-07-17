import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Play, ArrowRight } from "lucide-react";

interface VisualContent {
  id: string;
  type: 'photo' | 'reel';
  url: string;
  thumbnail: string;
  title: string;
  speaker: string;
  event: string;
}

// Demo content matching the mockup
const demoContent: VisualContent[] = [
  {
    id: '1',
    type: 'reel',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'AI Innovation Discussion',
    speaker: 'Dr. Alex Chen',
    event: 'Tech Summit 2024'
  },
  {
    id: '2',
    type: 'reel',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Future of Work Panel',
    speaker: 'Sarah Johnson',
    event: 'Innovation Conference'
  },
  {
    id: '3',
    type: 'photo',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Leadership Workshop',
    speaker: 'Mike Rodriguez',
    event: 'Business Summit'
  },
  {
    id: '4',
    type: 'reel',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Startup Pitch Session',
    speaker: 'Emma Davis',
    event: 'Entrepreneur Expo'
  },
  {
    id: '5',
    type: 'photo',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Panel Discussion',
    speaker: 'Dr. James Wilson',
    event: 'Innovation Summit'
  },
  {
    id: '6',
    type: 'photo',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Keynote Presentation',
    speaker: 'Lisa Chang',
    event: 'Tech Conference'
  },
  {
    id: '7',
    type: 'reel',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Product Demo',
    speaker: 'David Park',
    event: 'Product Summit'
  },
  {
    id: '8',
    type: 'photo',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Networking Session',
    speaker: 'Maria Garcia',
    event: 'Business Forum'
  },
  {
    id: '9',
    type: 'reel',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Investment Strategy',
    speaker: 'Robert Kim',
    event: 'Finance Summit'
  },
  {
    id: '10',
    type: 'photo',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Team Building',
    speaker: 'Jennifer Lopez',
    event: 'Leadership Retreat'
  },
  {
    id: '11',
    type: 'reel',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Marketing Insights',
    speaker: 'Kevin Zhang',
    event: 'Digital Marketing Expo'
  },
  {
    id: '12',
    type: 'photo',
    url: '',
    thumbnail: '/api/placeholder/400/600',
    title: 'Innovation Workshop',
    speaker: 'Amanda Taylor',
    event: 'Creative Conference'
  }
];

export default function Browse() {
  const [activeTab, setActiveTab] = useState<'photos' | 'reels'>('photos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContent = demoContent.filter(item => {
    const matchesTab = activeTab === 'photos' ? item.type === 'photo' : item.type === 'reel';
    const matchesSearch = !searchTerm || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.speaker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.event.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold text-text mb-4">Browse All Content</h1>
            <p className="text-xl text-textSecondary leading-relaxed">
              Easily access all your content across various speaker moments and effortlessly
              share key highlights using the search feature.
            </p>
          </div>
          <Button className="bg-primary hover:bg-primaryDark text-white px-8 py-3 text-lg font-semibold shadow-button hover:shadow-button-hover transition-all duration-200">
            View Gallery
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Content Type Tabs */}
        <div className="flex gap-6 mb-12">
          <Button
            onClick={() => setActiveTab('photos')}
            className={`px-10 py-4 text-lg font-semibold rounded-full transition-all duration-200 ${
              activeTab === 'photos' 
                ? 'bg-primary hover:bg-primaryDark text-white shadow-button-hover' 
                : 'bg-white text-primary border-2 border-accent hover:border-primary hover:bg-accentLight'
            }`}
          >
            Photos
          </Button>
          <Button
            onClick={() => setActiveTab('reels')}
            className={`px-10 py-4 text-lg font-semibold rounded-full transition-all duration-200 ${
              activeTab === 'reels' 
                ? 'bg-primary hover:bg-primaryDark text-white shadow-button-hover' 
                : 'bg-white text-primary border-2 border-accent hover:border-primary hover:bg-accentLight'
            }`}
          >
            Reels
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-lg mb-16">
          <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-textSecondary" />
          <Input
            placeholder="Search by speaker, event, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-16 py-4 text-lg border-accent bg-white shadow-sm rounded-full focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        {/* Visual Content Grid - Larger Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredContent.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-card shadow-card hover:shadow-card-hover transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
                {/* Placeholder image with enhanced gradient background */}
                <div className="w-full h-full bg-gradient-to-br from-blueLight via-accentLight to-accent flex items-center justify-center">
                  <div className="w-24 h-24 bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 bg-white/60 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 bg-white/80 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Play button overlay for reels - Enhanced */}
                {item.type === 'reel' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border-2 border-white/40 group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-10 w-10 text-white ml-1" fill="white" />
                    </div>
                  </div>
                )}
                
                {/* Enhanced diffused watermark */}
                <div className="absolute bottom-6 left-6">
                  <span className="text-white text-base font-bold bg-black/40 px-4 py-2 rounded-lg backdrop-blur-md border border-white/30">
                    diffused
                  </span>
                </div>

                {/* Content info overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-white font-semibold text-lg mb-1 line-clamp-2">{item.title}</h3>
                  <p className="text-white/90 text-sm font-medium">{item.speaker}</p>
                  <p className="text-white/70 text-xs">{item.event}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {filteredContent.length === 0 && (
          <div className="text-center py-32">
            <div className="w-32 h-32 rounded-lg bg-accentLight flex items-center justify-center mx-auto mb-8">
              <Search className="h-16 w-16 text-primary" />
            </div>
            <h3 className="text-3xl font-bold text-text mb-4">No {activeTab} found</h3>
            <p className="text-xl text-textSecondary max-w-md mx-auto">
              Try adjusting your search terms to find the content you're looking for
            </p>
          </div>
        )}
      </div>
    </div>
  );
}