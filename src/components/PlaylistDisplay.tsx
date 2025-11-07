import { Music2, User, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Song {
  title: string;
  artist: string;
  reason?: string;
  albumCover?: string | null;
}

interface PlaylistDisplayProps {
  songs: Song[];
  seedSong: string;
  seedArtist: string;
}

export const PlaylistDisplay = ({ songs, seedSong, seedArtist }: PlaylistDisplayProps) => {
  const { toast } = useToast();

  const getYouTubeMusicLink = (title: string, artist: string) => {
    const query = encodeURIComponent(`${title} ${artist}`);
    return `https://music.youtube.com/search?q=${query}`;
  };

  const getSpotifyLink = (title: string, artist: string) => {
    const query = encodeURIComponent(`${title} ${artist}`);
    return `https://open.spotify.com/search/${query}`;
  };

  const copyToClipboard = (link: string, platform: string) => {
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: "링크 복사됨",
        description: `${platform} 링크가 클립보드에 복사되었습니다.`,
      });
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          생성된 플레이리스트
        </h2>
        <p className="text-muted-foreground">
          "{seedSong}"{seedArtist && ` - ${seedArtist}`} 기반
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {songs.map((song, index) => (
          <Card
            key={index}
            className="gradient-card border-primary/20 shadow-card hover:border-primary/40 transition-all duration-300 hover:scale-105 backdrop-blur-sm overflow-hidden"
          >
            <CardContent className="p-0">
              <div className="flex gap-4">
                {/* Album Cover */}
                <div className="flex-shrink-0 w-24 h-24 relative">
                  {song.albumCover ? (
                    <img 
                      src={song.albumCover} 
                      alt={`${song.title} album cover`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Music2 className="h-10 w-10 text-primary/40" />
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="flex-1 py-4 pr-4 space-y-2">
                  <h3 className="font-semibold text-lg leading-tight">{song.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{song.artist}</span>
                  </div>
                  {song.reason && (
                    <p className="text-sm text-muted-foreground/80 leading-relaxed">
                      {song.reason}
                    </p>
                  )}
                  
                  {/* Music Platform Links */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(getYouTubeMusicLink(song.title, song.artist), 'YouTube Music')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      YouTube
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => copyToClipboard(getSpotifyLink(song.title, song.artist), 'Spotify')}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Spotify
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
