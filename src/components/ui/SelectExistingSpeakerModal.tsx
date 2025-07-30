import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
}

interface SelectExistingSpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakersSelected: (speakers: Speaker[]) => void;
  excludeSpeakerIds?: string[]; // Speakers already in the session
}

export default function SelectExistingSpeakerModal({ 
  isOpen, 
  onClose, 
  onSpeakersSelected,
  excludeSpeakerIds = []
}: SelectExistingSpeakerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [filteredSpeakers, setFilteredSpeakers] = useState<Speaker[]>([]);
  const [selectedSpeakers, setSelectedSpeakers] = useState<Speaker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      loadSpeakers();
    }
  }, [isOpen, user]);

  useEffect(() => {
    // Filter speakers based on search query
    const filtered = speakers.filter(speaker => {
      const searchLower = searchQuery.toLowerCase();
      return (
        speaker.full_name.toLowerCase().includes(searchLower) ||
        speaker.job_title.toLowerCase().includes(searchLower) ||
        speaker.company.toLowerCase().includes(searchLower) ||
        speaker.email.toLowerCase().includes(searchLower)
      );
    });
    setFilteredSpeakers(filtered);
  }, [speakers, searchQuery]);

  const loadSpeakers = async () => {
    setLoading(true);
    try {
      // Build the query conditionally to avoid malformed SQL
      let query = supabase
        .from('speakers')
        .select('*')
        .eq('created_by', user!.id)
        .not('full_name', 'like', '[DELETED]%'); // Exclude archived speakers

      // Only add the exclusion filter if there are speakers to exclude
      if (excludeSpeakerIds.length > 0) {
        query = query.not('id', 'in', `(${excludeSpeakerIds.join(',')})`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setSpeakers(data || []);
    } catch (error) {
      console.error('Error loading speakers:', error);
      toast.error("Failed to load speakers");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakerToggle = (speaker: Speaker) => {
    setSelectedSpeakers(prev => {
      const isSelected = prev.some(s => s.id === speaker.id);
      if (isSelected) {
        return prev.filter(s => s.id !== speaker.id);
      } else {
        return [...prev, speaker];
      }
    });
  };

  const handleAddSelected = () => {
    if (selectedSpeakers.length === 0) {
      toast.error("Please select at least one speaker");
      return;
    }

    onSpeakersSelected(selectedSpeakers);
    handleClose();
  };

  const handleClose = () => {
    setSelectedSpeakers([]);
    setSearchQuery("");
    onClose();
  };

  const isSpeakerSelected = (speakerId: string) => {
    return selectedSpeakers.some(s => s.id === speakerId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Add Existing Speakers
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search speakers by name, company, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Speaker Selection Grid */}
        <div className="flex-1 overflow-y-auto min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading speakers...</p>
              </div>
            </div>
          ) : filteredSpeakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {filteredSpeakers.map((speaker) => {
                const isSelected = isSpeakerSelected(speaker.id);
                
                return (
                  <div
                    key={speaker.id}
                    onClick={() => handleSpeakerToggle(speaker)}
                    className={`
                      relative p-4 border rounded-lg cursor-pointer transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }
                    `}
                  >
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                    )}

                    {/* Speaker Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          {speaker.headshot_url ? (
                            <AvatarImage src={speaker.headshot_url} alt={speaker.full_name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {speaker.full_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{speaker.full_name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{speaker.job_title}</p>
                        </div>
                      </div>

                      {speaker.company && (
                        <Badge variant="secondary" className="text-xs">
                          {speaker.company}
                        </Badge>
                      )}

                      {speaker.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {speaker.email}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <Users className="h-12 w-12 mx-auto text-gray-400 opacity-50" />
                <div>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No speakers found matching your search' : 'No speakers available'}
                  </p>
                  {searchQuery && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Try searching with different keywords
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selection Summary */}
        {selectedSpeakers.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary">
                {selectedSpeakers.length} speaker{selectedSpeakers.length !== 1 ? 's' : ''} selected
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedSpeakers.map((speaker) => (
                <div key={speaker.id} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {speaker.full_name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpeakerToggle(speaker);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddSelected}
            disabled={selectedSpeakers.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add {selectedSpeakers.length > 0 ? selectedSpeakers.length : ''} Speaker{selectedSpeakers.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 