import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Video, Play } from 'lucide-react';

interface ReviewVideo {
  id: string;
  name: string;
  role: string;
  firm: string;
  rating: number;
  thumbnail: string;
  videoUrl: string;
  text: string;
}

const AdminReviews = () => {
  const [videos, setVideos] = useState<ReviewVideo[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    firm: '',
    videoUrl: '',
    thumbnail: '',
    text: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = () => {
    const stored = localStorage.getItem('reviewVideos');
    if (stored) {
      setVideos(JSON.parse(stored));
    } else {
      // Default videos
      const defaultVideos: ReviewVideo[] = [
        {
          id: '1',
          name: 'Rahul Sharma',
          role: 'Funded Trader',
          firm: 'FTMO',
          rating: 5,
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          text: 'Amazing quality! The acrylic is premium and UV print is perfect.'
        },
        {
          id: '2',
          name: 'Priya Patel',
          role: 'Day Trader',
          firm: 'The5ers',
          rating: 5,
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          text: 'Fast delivery and beautiful packaging. Highly recommended!'
        },
        {
          id: '3',
          name: 'Amit Kumar',
          role: 'Prop Trader',
          firm: 'MyForexFunds',
          rating: 5,
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          text: 'Perfect way to celebrate my milestone. Thank you!'
        }
      ];
      setVideos(defaultVideos);
      localStorage.setItem('reviewVideos', JSON.stringify(defaultVideos));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const addVideo = () => {
    if (!formData.name || !formData.videoUrl) {
      toast({
        title: 'Missing information',
        description: 'Name and Video URL are required',
        variant: 'destructive',
      });
      return;
    }

    // Convert YouTube URL to embed format
    let embedUrl = formData.videoUrl;
    
    // Extract video ID from various YouTube URL formats
    let videoId = '';
    if (formData.videoUrl.includes('youtube.com/watch?v=')) {
      videoId = formData.videoUrl.split('v=')[1]?.split('&')[0] || '';
    } else if (formData.videoUrl.includes('youtu.be/')) {
      videoId = formData.videoUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (formData.videoUrl.includes('/embed/')) {
      videoId = formData.videoUrl.split('/embed/')[1]?.split('?')[0] || '';
    }
    
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }

    // Auto-generate thumbnail if not provided
    const thumbnailUrl = formData.thumbnail || 
      (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : 'https://placehold.co/640x360?text=Video');

    const newVideo: ReviewVideo = {
      id: Date.now().toString(),
      name: formData.name,
      role: formData.role || 'Trader',
      firm: formData.firm || 'Independent',
      rating: 5,
      thumbnail: thumbnailUrl,
      videoUrl: embedUrl,
      text: formData.text || 'Great product!'
    };

    const updated = [...videos, newVideo];
    setVideos(updated);
    localStorage.setItem('reviewVideos', JSON.stringify(updated));
    
    // Trigger update event
    window.dispatchEvent(new Event('reviewsUpdated'));

    setFormData({
      name: '',
      role: '',
      firm: '',
      videoUrl: '',
      thumbnail: '',
      text: ''
    });

    toast({
      title: 'Review added',
      description: 'Review video has been added successfully',
    });
  };

  const deleteVideo = (id: string) => {
    const updated = videos.filter(v => v.id !== id);
    setVideos(updated);
    localStorage.setItem('reviewVideos', JSON.stringify(updated));
    
    // Trigger update event
    window.dispatchEvent(new Event('reviewsUpdated'));

    toast({
      title: 'Review deleted',
      description: 'Review video has been removed',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Review Videos</h1>
        <p className="text-muted-foreground">Manage trader testimonial videos</p>
      </div>

      {/* Add New Video */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Review Video
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Trader Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Rahul Sharma"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                placeholder="Funded Trader"
                value={formData.role}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firm">Firm/Company</Label>
              <Input
                id="firm"
                name="firm"
                placeholder="FTMO, The5ers, etc."
                value={formData.firm}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnail">Thumbnail URL</Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                value={formData.thumbnail}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">Video URL (YouTube Link) *</Label>
            <Input
              id="videoUrl"
              name="videoUrl"
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
              value={formData.videoUrl}
              onChange={handleInputChange}
            />
            <p className="text-xs text-muted-foreground">
              Paste any YouTube URL format - we'll convert it automatically
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text">Review Text</Label>
            <Input
              id="text"
              name="text"
              placeholder="Amazing quality! The acrylic is premium..."
              value={formData.text}
              onChange={handleInputChange}
            />
          </div>

          <Button onClick={addVideo}>
            <Plus className="h-4 w-4 mr-2" />
            Add Review
          </Button>
        </CardContent>
      </Card>

      {/* Current Videos */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Current Review Videos ({videos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="space-y-3">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative group">
                  <img
                    src={video.thumbnail}
                    alt={video.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/640x360?text=Video';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-bold">{video.name}</p>
                  <p className="text-sm text-muted-foreground">{video.role} • {video.firm}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{video.text}</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteVideo(video.id)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {videos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No review videos yet. Add your first review above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
        <p className="font-medium">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Paste any YouTube URL - we auto-convert to embed format</li>
          <li>Thumbnail auto-generated if not provided</li>
          <li>Hover over videos on homepage to play them</li>
          <li>Changes reflect on homepage in real-time</li>
          <li>Videos auto-rotate every 2 seconds on homepage</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminReviews;