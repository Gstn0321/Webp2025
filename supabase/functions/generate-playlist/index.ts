import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateAlbumCover(songTitle: string, artist: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: `Create a beautiful album cover art for the song "${songTitle}" by ${artist}. Modern, artistic, high quality album artwork.`
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      console.error('Image generation failed:', response.status);
      return null;
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return imageUrl || null;
  } catch (error) {
    console.error('Error generating album cover:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { song, artist } = await req.json();
    console.log('Generating playlist with covers for:', { song, artist });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = artist 
      ? `"${song}" by ${artist}를 좋아하는 사람을 위한 플레이리스트를 만들어주세요. 비슷한 느낌의 노래 8곡을 추천해주세요. 각 노래마다 제목, 아티스트, 그리고 왜 추천하는지 한 문장으로 설명해주세요.`
      : `"${song}"을 좋아하는 사람을 위한 플레이리스트를 만들어주세요. 비슷한 느낌의 노래 8곡을 추천해주세요. 각 노래마다 제목, 아티스트, 그리고 왜 추천하는지 한 문장으로 설명해주세요.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: '당신은 음악 전문가입니다. 사용자의 음악 취향을 분석하고 완벽한 플레이리스트를 만들어주세요.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_playlist",
              description: "비슷한 느낌의 노래들로 플레이리스트를 생성합니다",
              parameters: {
                type: "object",
                properties: {
                  songs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "노래 제목" },
                        artist: { type: "string", description: "아티스트 이름" },
                        reason: { type: "string", description: "추천 이유 (한 문장)" }
                      },
                      required: ["title", "artist", "reason"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["songs"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_playlist" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "서비스 크레딧이 부족합니다. 관리자에게 문의하세요." 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const playlist = JSON.parse(toolCall.function.arguments);
    console.log('Playlist generated:', playlist.songs.length, 'songs');

    // Generate album covers for each song (limit to first 4 for performance)
    console.log('Generating album covers...');
    const songsWithCovers = await Promise.all(
      playlist.songs.slice(0, 4).map(async (songItem: any, index: number) => {
        const albumCover = await generateAlbumCover(songItem.title, songItem.artist, LOVABLE_API_KEY);
        console.log(`Album cover ${index + 1}:`, albumCover ? 'generated' : 'failed');
        return {
          ...songItem,
          albumCover
        };
      })
    );

    // Add remaining songs without covers
    const remainingSongs = playlist.songs.slice(4).map((songItem: any) => ({
      ...songItem,
      albumCover: null
    }));

    const finalPlaylist = {
      songs: [...songsWithCovers, ...remainingSongs]
    };

    console.log('Playlist with covers ready');

    return new Response(JSON.stringify(finalPlaylist), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-playlist function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
