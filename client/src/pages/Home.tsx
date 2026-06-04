import { useEffect, useState, useRef } from 'react';
import { Play, Search, ChevronLeft, ChevronRight, Star, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import HLSPlayer from '@/components/HLSPlayer';
import { useLocation } from 'wouter';

interface Channel {
  name: string;
  logo: string;
  group: string;
  url: string;
  popularity?: number;
}

interface ChannelsData {
  [key: string]: Channel[];
}

/**
 * Dark Cinema Minimalism Design
 * - Favorites section with LocalStorage
 * - Organized sections: Bangladeshi, Hindi Entertainment, Others
 * - Popular channels ranked first
 * - Auto-scroll to player on channel selection
 * - Home logo link
 */
export default function Home() {
  const [channels, setChannels] = useState<ChannelsData>({});
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const playerRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Load favorites from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('livetv_favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

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
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, []);

  const handleImageError = (logoUrl: string) => {
    setImageErrors(prev => new Set(prev).add(logoUrl));
  };

  const getPlaceholderColor = (text: string) => {
    const colors = ['#E50914', '#0066FF', '#00D9FF', '#FF6B35', '#FFD700'];
    const hash = text.charCodeAt(0) + text.charCodeAt(text.length - 1);
    return colors[hash % colors.length];
  };

  const toggleFavorite = (channelName: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(channelName)) {
      newFavorites.delete(channelName);
    } else {
      newFavorites.add(channelName);
    }
    setFavorites(newFavorites);
    localStorage.setItem('livetv_favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const selectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    // Auto-scroll to player
    setTimeout(() => {
      playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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

  const ChannelCard = ({ channel, isFavorite }: { channel: Channel; isFavorite: boolean }) => (
    <div
      onClick={() => selectChannel(channel)}
      className={`channel-card cursor-pointer group relative ${
        selectedChannel?.name === channel.name ? 'ring-2 ring-accent' : ''
      }`}
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

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(channel.name);
        }}
        className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-accent transition-colors"
      >
        <Star
          className="w-4 h-4"
          fill={isFavorite ? '#E50914' : 'none'}
          color={isFavorite ? '#E50914' : '#fff'}
        />
      </button>

      {/* Play Button */}
      <div className="play-button">
        <button className="p-3 rounded-full bg-accent text-accent-foreground hover:scale-110 transition-transform duration-300">
          <Play className="w-6 h-6" />
        </button>
      </div>

      {/* Channel Info */}
      <div className="p-3 bg-card">
        <p className="text-xs font-semibold text-foreground truncate">{channel.name}</p>
        <p className="text-xs text-muted-foreground truncate">{channel.group}</p>
      </div>
    </div>
  );

  const ChannelSection = ({ title, channelsList }: { title: string; channelsList: Channel[] }) => {
    const filtered = channelsList.filter(ch =>
      ch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filtered.length === 0) return null;

    return (
      <div className="mb-12">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-accent rounded"></div>
          {title} ({filtered.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((channel, index) => (
            <div key={`${channel.name}-${index}`} style={{ animationDelay: `${index * 30}ms` }}>
              <ChannelCard channel={channel} isFavorite={favorites.has(channel.name)} />
            </div>
          ))}
        </div>
      </div>
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

  // Get favorite channels
  const favoriteChannels = Object.values(channels)
    .flat()
    .filter(ch => favorites.has(ch.name))
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container flex items-center justify-between py-4 gap-4">
          {/* Home Logo Link */}
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title="Go to Home"
          >
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <HomeIcon className="w-6 h-6 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-bold hidden sm:block">
              <span className="text-accent">Live</span> <span className="text-foreground">TV</span>
            </h1>
          </button>

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
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Video Player Section */}
        {selectedChannel && (
          <div ref={playerRef} className="sticky top-0 z-30 bg-secondary">
            <div className="container py-4">
              {/* HLS Video Player */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4 border border-border">
                {selectedChannel.url ? (
                  <HLSPlayer
                    src={selectedChannel.url}
                    poster={selectedChannel.logo}
                    autoplay={true}
                    controls={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-4">
                    <p className="text-foreground">স্ট্রিম উপলব্ধ নেই</p>
                  </div>
                )}
              </div>

              {/* Channel Details Card */}
              <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{selectedChannel.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedChannel.group}</p>
                </div>
                <button
                  onClick={() => toggleFavorite(selectedChannel.name)}
                  className="p-3 rounded-full hover:bg-secondary transition-colors"
                >
                  <Star
                    className="w-6 h-6"
                    fill={favorites.has(selectedChannel.name) ? '#E50914' : 'none'}
                    color={favorites.has(selectedChannel.name) ? '#E50914' : '#888'}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Channels Sections */}
        <div className="container py-8">
          {/* Favorites Section */}
          {favoriteChannels.length > 0 && (
            <ChannelSection title="⭐ আমার পছন্দের চ্যানেল" channelsList={favoriteChannels} />
          )}

          {/* Bangladeshi Channels */}
          {channels['Bangladeshi'] && (
            <ChannelSection title="🇧🇩 বাংলাদেশী চ্যানেল" channelsList={channels['Bangladeshi']} />
          )}

          {/* Hindi Entertainment */}
          {channels['Hindi Entertainment'] && (
            <ChannelSection title="🇮🇳 হিন্দি বিনোদন" channelsList={channels['Hindi Entertainment']} />
          )}

          {/* Other Categories */}
          {Object.entries(channels).map(([category, channelsList]) => {
            if (['Bangladeshi', 'Hindi Entertainment', 'Favorites'].includes(category)) return null;
            return <ChannelSection key={category} title={category} channelsList={channelsList} />;
          })}
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
