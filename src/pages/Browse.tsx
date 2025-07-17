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
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Browse All Content</h1>
            <p className="text-lg text-muted-foreground">
              Easily access all your content across various speaker moments and effortlessly<br />
              share key highlights using the search feature.
            </p>
          </div>
          <Button variant="default" className="bg-blue-500 hover:bg-blue-600 text-white">
            View Gallery
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Content Type Tabs */}
        <div className="flex gap-4 mb-8">
          <Button
            variant={activeTab === 'photos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('photos')}
            className={activeTab === 'photos' 
              ? 'bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-full' 
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200 px-8 py-2 rounded-full border-blue-200'
            }
          >
            Photos
          </Button>
          <Button
            variant={activeTab === 'reels' ? 'default' : 'outline'}
            onClick={() => setActiveTab('reels')}
            className={activeTab === 'reels' 
              ? 'bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 rounded-full' 
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200 px-8 py-2 rounded-full border-blue-200'
            }
          >
            Reels
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by speaker, event, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 py-3 text-base border-gray-200 bg-white shadow-sm rounded-full"
          />
        </div>

        {/* Visual Content Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredContent.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                {/* Placeholder image with gradient background */}
                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/40 rounded-full"></div>
                  </div>
                </div>
                
                {/* Play button overlay for reels */}
                {item.type === 'reel' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-black/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Play className="h-8 w-8 text-white ml-1" fill="white" />
                    </div>
                  </div>
                )}
                
                {/* Diffused watermark */}
                <div className="absolute bottom-4 left-4">
                  <span className="text-white text-sm font-medium bg-black/20 px-2 py-1 rounded backdrop-blur-sm">
                    diffused
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredContent.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No {activeTab} found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search terms to find the content you're looking for
            </p>
          </div>
        )}
      </div>
    </div>
  );
}