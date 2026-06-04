import { useEffect, useState } from 'react';
import { Play, Menu, Search, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Channel {
  name: string;
  logo: string;
  group: string;
  url: string;
}

interface ChannelsData {
  [key: string]: Channel[];
}

/**
 * Dark Cinema Minimalism Design
 * - Deep black background (#0F0F0F) for premium streaming feel
 * - Crimson red (#E50914) and electric blue (#0066FF) accents
 * - Smooth animations and glowing effects on hover
 * - Content-first layout with minimal UI chrome
 */
export default function Home() {
  const [channels, setChannels] = useState<ChannelsData>({});
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Bangla');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Load channels data
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const response = await fetch('/channels.json');
        const data = await response.json();
        setChannels(data);
        
        // Set first channel as selected
        const firstCategory = Object.keys(data)[0];
        if (data[firstCategory] && data[firstCategory].length > 0) {
          setSelectedChannel(data[firstCategory][0]);
          setActiveCategory(firstCategory);
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  // Get filtered channels for current category
  const currentChannels = channels[activeCategory] || [];
  const filteredChannels = currentChannels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get all categories sorted by priority
  const categoryOrder = [
    'Bangla', 'Bangladesh', 'Indian Bangla',
    'India', 'Hindi',
    'Sports', 'IPL-2026', 'PSL-2026',
    'News', 'News (AR)', 'News (ES)',
    'Entertainment', 'Drama',
    'Islamic', 'Religious',
    'Kids',
    'Music',
    'Movies', 'Movie',
    'English',
  ];

  const sortedCategories = Object.keys(channels).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const handleImageError = (logoUrl: string) => {
    setImageErrors(prev => new Set(prev).add(logoUrl));
  };

  const getPlaceholderColor = (text: string) => {
    const colors = ['#E50914', '#0066FF', '#00D9FF', '#FF6B35', '#FFD700'];
    const hash = text.charCodeAt(0) + text.charCodeAt(text.length - 1);
    return colors[hash % colors.length];
  };

  const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
    const hasError = imageErrors.has(src);
    
    if (hasError) {
      return (
        <div
          className={`${className} flex items-center justify-center font-bold text-white text-center p-2`}
          style={{ backgroundColor: getPlaceholderColor(alt) }}
        >
          {alt.substring(0, 2).toUpperCase()}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => handleImageError(src)}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 text-foreground">লাইভ চ্যানেল লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-accent" />
            </button>
            <h1 className="text-2xl font-bold">
              <span className="text-accent">Live</span> <span className="text-foreground">TV</span>
            </h1>
          </div>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="চ্যানেল খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Developer Info */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
            <span>Developer: Rakib Mahmud Shihab</span>
            <a
              href="https://facebook.com/mahmud.sb.90"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-primary transition-colors"
              title="Facebook"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Categories */}
        <aside
          className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 absolute lg:relative w-64 bg-card border-r border-border overflow-y-auto transition-transform duration-300 z-40 h-full`}
        >
          <div className="p-4 space-y-2">
            <h2 className="text-heading text-foreground mb-4">ক্যাটাগরি</h2>
            {sortedCategories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery('');
                  setSidebarOpen(false);
                }}
                className={`category-tab w-full text-left px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeCategory === category
                    ? 'active bg-accent text-accent-foreground font-semibold'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                <span>{category}</span>
                <span className="ml-2 text-xs opacity-70">
                  ({channels[category]?.length || 0})
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Featured Channel */}
          {selectedChannel && (
            <div className="relative h-80 sm:h-96 bg-secondary overflow-hidden group">
              {/* Channel Logo Background */}
              <div className="absolute inset-0 opacity-10">
                <ImageWithFallback
                  src={selectedChannel.logo}
                  alt={selectedChannel.name}
                  className="w-full h-full object-cover blur-xl"
                />
              </div>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>

              {/* Content */}
              <div className="relative h-full flex items-center">
                <div className="container flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                  {/* Logo */}
                  <div className="flex-shrink-0 w-32 h-32 sm:w-40 sm:h-40 rounded-lg overflow-hidden bg-card border-2 border-accent shadow-2xl">
                    <ImageWithFallback
                      src={selectedChannel.logo}
                      alt={selectedChannel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <div className="live-badge mb-4 justify-center sm:justify-start">
                      <div className="w-2 h-2 rounded-full bg-accent-foreground animate-pulse"></div>
                      লাইভ
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{selectedChannel.name}</h2>
                    <p className="text-muted-foreground mb-6">{selectedChannel.group}</p>
                    <Button
                      size="lg"
                      className="bg-accent hover:bg-primary text-accent-foreground gap-2"
                      onClick={() => {
                        if (selectedChannel.url) {
                          window.open(selectedChannel.url, '_blank');
                        }
                      }}
                    >
                      <Play className="w-5 h-5" />
                      এখনই দেখুন
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Channels Grid */}
          <div className="container py-8">
            <h3 className="text-heading text-foreground mb-6">
              {activeCategory} চ্যানেল ({filteredChannels.length})
            </h3>

            {filteredChannels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">কোনো চ্যানেল পাওয়া যাচ্ছে না</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredChannels.map((channel, index) => (
                  <div
                    key={`${channel.name}-${index}`}
                    onClick={() => setSelectedChannel(channel)}
                    className="channel-card cursor-pointer group"
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    {/* Channel Logo */}
                    <div className="aspect-square overflow-hidden bg-secondary">
                      <ImageWithFallback
                        src={channel.logo}
                        alt={channel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>

                    {/* Gradient Overlay */}
                    <div className="gradient-overlay"></div>

                    {/* Play Button */}
                    <div className="play-button">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (channel.url) {
                            window.open(channel.url, '_blank');
                          }
                        }}
                        className="p-3 rounded-full bg-accent text-accent-foreground hover:scale-110 transition-transform duration-300"
                      >
                        <Play className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Channel Info */}
                    <div className="p-3 bg-card">
                      <p className="text-xs font-semibold text-foreground truncate">{channel.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{channel.group}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-6 mt-auto">
        <div className="container text-center text-sm text-muted-foreground space-y-2">
          <p>
            ডেভেলপার: <span className="font-semibold text-foreground">Rakib Mahmud Shihab</span> | 
            <a
              href="https://facebook.com/mahmud.sb.90"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-accent hover:text-primary transition-colors"
            >
              facebook.com/mahmud.sb.90
            </a>
          </p>
          <p className="text-xs">© 2026 Live TV BD-IN. সকল চ্যানেল লাইভ স্ট্রিমিং সেবা।</p>
        </div>
      </footer>
    </div>
  );
}
