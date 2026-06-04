import { useEffect, useState, useRef } from 'react';
import { Play, Search, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import HLSPlayer from '@/components/HLSPlayer';

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
 * IPTV Screenshot Exact Layout:
 * - Header: Logo, Search, Dev Info
 * - Large Video Player (16:9 aspect)
 * - Channel Info Card (below player)
 * - Horizontal Category Pills (scrollable)
 * - Channel Grid (2-3 columns)
 * - Sports Section (bottom)
 */
export default function Home() {
  const [channels, setChannels] = useState<ChannelsData>({});
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const playerRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

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

        // Load favorites from LocalStorage
        const saved = localStorage.getItem('livetv_favorites');
        if (saved) {
          const favList = JSON.parse(saved);
          data['Favorites'] = data['Favorites'] || [];
          // Find favorite channels from all categories
          for (const category in data) {
            if (category !== 'Favorites') {
              data[category] = data[category].filter((ch: Channel) => {
                if (favList.includes(ch.name)) {
                  data['Favorites'].push(ch);
                  return true;
                }
                return true;
              });
            }
          }
          // Remove duplicates from Favorites
          data['Favorites'] = Array.from(new Map(data['Favorites'].map((ch: Channel) => [ch.name, ch])).values());
        }
        
        setChannels(data);

        // Set first category (Favorites or Bangla) and channel as selected
        let firstCategory = 'Bangla';
        if (data['Favorites'] && data['Favorites'].length > 0) {
          firstCategory = 'Favorites';
        }
        setActiveCategory(firstCategory);
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
    
    // Update Favorites category
    const updatedChannels = { ...channels };
    updatedChannels['Favorites'] = [];
    
    // Collect all favorite channels from all categories
    for (const category in updatedChannels) {
      if (category !== 'Favorites') {
        updatedChannels[category].forEach((ch: Channel) => {
          if (newFavorites.has(ch.name)) {
            updatedChannels['Favorites'].push(ch);
          }
        });
      }
    }
    
    setChannels(updatedChannels);
  };

  const selectChannel = (channel: Channel, category: string) => {
    setSelectedChannel(channel);
    setActiveCategory(category);
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

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 300;
      categoryScrollRef.current.scrollBy({
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

  const currentCategoryChannels = channels[activeCategory] || [];
  const filteredChannels = currentCategoryChannels.filter(ch =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* HEADER */}
      <header className="bg-[#1a1a1a] border-b border-[#333] sticky top-0 z-50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">▶</span>
            </div>
            <h1 className="text-white font-bold text-lg hidden sm:block">
              <span className="text-accent">IPTV</span> <span className="text-white">লাইভ</span>
            </h1>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
              <Input
                type="text"
                placeholder="চ্যানেল খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#2a2a2a] border-[#444] text-white placeholder:text-[#888] text-sm"
              />
            </div>
          </div>

          {/* Developer Info */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-[#999] whitespace-nowrap">
            <span>Developer: Rakib Mahmud Shihab</span>
            <a
              href="https://facebook.com/mahmud.sb.90"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-[#ff6b6b] transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-[#0f0f0f]">
        {/* VIDEO PLAYER SECTION */}
        {selectedChannel && (
          <div ref={playerRef} className="bg-black py-4 px-4">
            <div className="max-w-7xl mx-auto space-y-3">
              {/* Large Video Player with Red Border */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video border-4 border-accent shadow-2xl">
                {selectedChannel.url ? (
                  <HLSPlayer
                    src={selectedChannel.url}
                    poster={selectedChannel.logo}
                    autoplay={true}
                    controls={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-4 bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
                    <p className="text-[#999]">স্ট্রিম উপলব্ধ নেই</p>
                  </div>
                )}
              </div>

              {/* CHANNEL INFO CARD - Below Player */}
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <ImageWithFallback
                    src={selectedChannel.logo}
                    alt={selectedChannel.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-sm">{selectedChannel.name}</h3>
                    <p className="text-xs text-[#999]">{selectedChannel.group}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 rounded bg-accent text-white font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    LIVE
                  </button>
                  <button
                    onClick={() => toggleFavorite(selectedChannel.name)}
                    className="p-2 rounded hover:bg-[#2a2a2a] transition-colors"
                  >
                    <Star
                      className="w-5 h-5"
                      fill={favorites.has(selectedChannel.name) ? '#E50914' : 'none'}
                      color={favorites.has(selectedChannel.name) ? '#E50914' : '#999'}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CATEGORY TABS - Horizontal Pills */}
        <div className="bg-[#1a1a1a] border-b border-[#333] sticky top-16 z-40 py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <button
              onClick={() => scrollCategories('left')}
              className="p-2 rounded hover:bg-[#2a2a2a] transition-colors flex-shrink-0 text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={categoryScrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
            >
              {Object.keys(channels).map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    if (channels[category] && channels[category].length > 0) {
                      setSelectedChannel(channels[category][0]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all flex-shrink-0 text-sm ${
                    activeCategory === category
                      ? 'bg-accent text-white'
                      : 'bg-[#2a2a2a] text-[#ccc] hover:bg-[#333]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <button
              onClick={() => scrollCategories('right')}
              className="p-2 rounded hover:bg-[#2a2a2a] transition-colors flex-shrink-0 text-white"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CHANNELS GRID */}
        <div className="bg-[#0f0f0f] px-4 py-6">
          <div className="max-w-7xl mx-auto">
            {filteredChannels.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#999]">কোনো চ্যানেল পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredChannels.map((channel, index) => (
                  <div
                    key={`${channel.name}-${index}`}
                    onClick={() => selectChannel(channel, activeCategory)}
                    className={`group cursor-pointer rounded-lg overflow-hidden transition-all border-2 ${
                      selectedChannel?.name === channel.name
                        ? 'border-accent'
                        : 'border-[#333] hover:border-[#555]'
                    }`}
                  >
                    {/* Channel Logo */}
                    <div className="relative aspect-square overflow-hidden bg-[#1a1a1a]">
                      <ImageWithFallback
                        src={channel.logo}
                        alt={channel.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(channel.name);
                        }}
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/70 hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Star
                          className="w-4 h-4"
                          fill={favorites.has(channel.name) ? '#E50914' : 'none'}
                          color={favorites.has(channel.name) ? '#E50914' : '#fff'}
                        />
                      </button>

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-3 rounded-full bg-accent text-white hover:scale-110 transition-transform">
                          <Play className="w-6 h-6" />
                        </button>
                      </div>
                    </div>

                    {/* Channel Info */}
                    <div className="p-2 bg-[#1a1a1a]">
                      <p className="text-xs font-semibold text-white truncate">{channel.name}</p>
                      <p className="text-xs text-[#999] truncate">{channel.group}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#1a1a1a] border-t border-[#333] py-3 px-4">
        <div className="max-w-7xl mx-auto text-center text-xs text-[#999]">
          <p>
            Developer: <span className="font-semibold text-white">Rakib Mahmud Shihab</span> |
            <a
              href="https://facebook.com/mahmud.sb.90"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-accent hover:text-[#ff6b6b] transition-colors"
            >
              facebook.com/mahmud.sb.90
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
