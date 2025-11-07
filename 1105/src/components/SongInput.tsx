import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";

interface SongInputProps {
  onGenerate: (song: string, artist: string) => void;
  isLoading: boolean;
}

export const SongInput = ({ onGenerate, isLoading }: SongInputProps) => {
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (song.trim()) {
      onGenerate(song, artist);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="노래 제목을 입력하세요..."
            value={song}
            onChange={(e) => setSong(e.target.value)}
            className="pl-12 h-14 text-lg bg-card/80 backdrop-blur-sm border-primary/20 focus:border-primary transition-all"
            disabled={isLoading}
          />
        </div>
        
        <div className="relative">
          <Input
            type="text"
            placeholder="아티스트 이름 (선택사항)"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="h-12 bg-card/80 backdrop-blur-sm border-primary/20 focus:border-primary transition-all"
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          disabled={!song.trim() || isLoading}
          className="w-full h-14 text-lg font-semibold gradient-primary hover:opacity-90 transition-all glow-primary"
        >
          {isLoading ? (
            <>
              <Sparkles className="mr-2 h-5 w-5 animate-spin" />
              추천 노래 찾는 중...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              추천 노래 받기
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
