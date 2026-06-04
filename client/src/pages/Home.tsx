import { useEffect, useState, useRef } from 'react';
import { Play, Search, Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
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
 * - Horizontal category tabs (like reference IPTV app)
 * - In-place video player (no page redirect)
 * - Scrollable channel list below
 * - Deep black background (#0F0F0F) for premium streaming feel
 * - Crimson red (#E50914) and electric blue (#0066FF) accents
 */
export default function Home() {
  const [channels, setChannels] = useState<ChannelsData>({});
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Bangla');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const tabScrollRef = useRef<HTMLDivElement>(null);

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

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabScrollRef.current) {
      const scrollAmount = 300;
      tabScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
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
          <h1 className="text-2xl font-bold">
            <span className="text-accent">Live</span> <span className="text-foreground">TV</span>
          </h1>
          
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

      {/* Category Tabs - Horizontal Scrollable */}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="relative flex items-center">
          {/* Left Scroll Button */}
          <button
            onClick={() => scrollTabs('left')}
            className="absolute left-0 z-10 p-2 bg-gradient-to-r from-card to-transparent hover:from-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-accent" />
          </button>

          {/* Scrollable Tabs Container */}
          <div
            ref={tabScrollRef}
            className="flex overflow-x-auto scrollbar-hide px-12 py-3 gap-2"
            style={{ scrollBehavior: 'smooth' }}
          >
            {sortedCategories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  setSearchQuery('');
                  // Select first channel of category
                  if (channels[category] && channels[category].length > 0) {
                    setSelectedChannel(channels[category][0]);
                  }
                }}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 font-medium text-sm ${
                  activeCategory === category
                    ? 'bg-accent text-accent-foreground shadow-lg shadow-accent/50'
                    : 'bg-secondary text-foreground hover:bg-muted'
                }`}
              >
                {category}
                <span className="ml-2 text-xs opacity-75">({channels[category]?.length || 0})</span>
              </button>
            ))}
          </div>

          {/* Right Scroll Button */}
          <button
            onClick={() => scrollTabs('right')}
            className="absolute right-0 z-10 p-2 bg-gradient-to-l from-card to-transparent hover:from-secondary transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-accent" />
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        {/* Video Player Section */}
        {selectedChannel && (
          <div className="sticky top-0 z-30 bg-secondary">
            <div className="container py-4">
              {/* Video Player */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
                {/* Channel Logo Background */}
                <div className="absolute inset-0 opacity-20">
                  <ImageWithFallback
                    src={selectedChannel.logo}
                    alt={selectedChannel.name}
                    className="w-full h-full object-cover blur-xl"
                  />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black"></div>

                {/* Player Content */}
                <div className="relative h-full flex flex-col items-center justify-center">
                  {/* Channel Logo */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-card border-2 border-accent mb-4 shadow-lg">
                    <ImageWithFallback
                      src={selectedChannel.logo}
                      alt={selectedChannel.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Channel Info */}
                  <div className="text-center mb-6">
                    <div className="live-badge mb-3 justify-center">
                      <div className="w-2 h-2 rounded-full bg-accent-foreground animate-pulse"></div>
                      লাইভ
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">{selectedChannel.name}</h2>
                    <p className="text-muted-foreground">{selectedChannel.group}</p>
                  </div>

                  {/* Play Button */}
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-primary text-accent-foreground gap-2 mb-4"
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

              {/* Channel Details Card */}
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{selectedChannel.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedChannel.group}</p>
                  </div>
                  <div className="live-badge">
                    <div className="w-2 h-2 rounded-full bg-accent-foreground animate-pulse"></div>
                    লাইভ
                  </div>
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
                  className={`channel-card cursor-pointer group ${
                    selectedChannel?.name === channel.name ? 'ring-2 ring-accent' : ''
                  }`}
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
