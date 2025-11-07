import { useState } from "react";
import { SongInput } from "@/components/SongInput";
import { PlaylistDisplay } from "@/components/PlaylistDisplay";
import { useToast } from "@/hooks/use-toast";
import { Music } from "lucide-react";
import heroImage from "@/assets/hero-music.jpg";

interface Song {
  title: string;
  artist: string;
  reason?: string;
  albumCover?: string | null;
}

const Index = () => {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [seedSong, setSeedSong] = useState("");
  const [seedArtist, setSeedArtist] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async (song: string, artist: string) => {
    console.log('Starting playlist generation for:', { song, artist });
    setIsLoading(true);
    setSeedSong(song);
    setSeedArtist(artist);
    
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-playlist`;
      console.log('Calling edge function:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ song, artist }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate playlist');
      }

      const data = await response.json();
      console.log('Received data:', data);
      console.log('Songs array:', data.songs);
      
      setPlaylist(data.songs);
      setIsLoading(false);
      
      toast({
        title: "추천 노래를 찾았습니다!",
        description: `${song}를 기반으로 ${data.songs.length}곡을 추천합니다.`,
      });
    } catch (error) {
      console.error("Playlist generation error:", error);
      toast({
        title: "오류 발생",
        description: error instanceof Error ? error.message : "플레이리스트 생성 중 문제가 발생했습니다.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-6 mb-12">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-primary/10 backdrop-blur-sm inline-block glow-primary">
                <Music className="h-16 w-16 text-primary" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent">
                노래 한 곡 선택하면
              </span>
              <br />
              <span className="text-foreground">당신이 좋아할 노래 추천</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              AI가 당신의 음악 취향을 분석해
              <br />
              비슷한 느낌의 노래를 찾아드립니다
            </p>
          </div>

          <SongInput onGenerate={handleGenerate} isLoading={isLoading} />
        </div>
      </div>

      {/* Playlist Section */}
      {playlist.length > 0 && (
        <div className="container mx-auto px-4 py-16">
          <PlaylistDisplay 
            songs={playlist} 
            seedSong={seedSong}
            seedArtist={seedArtist}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
