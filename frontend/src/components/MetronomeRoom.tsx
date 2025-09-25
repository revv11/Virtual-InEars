import { useState, useEffect, useMemo, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Users, 
  Settings,
  Volume2,
  Copy,
  LogOut,
  Crown,
  Music,
  SlidersHorizontal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMetronome } from '@/hooks/useMetronome';

interface User {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

interface MetronomeRoomProps {
  roomCode: string;
  isHost: boolean;
  users: User[];
  currentUser: string;
  metronomeState: {
    isPlaying: boolean;
    bpm: number;
    timeSignature: string;
    startTime: number;
  };
  clockOffsetRef: RefObject<number>; 
  onLeaveRoom: () => void;
  onStartMetronome: () => void;
  onStopMetronome: () => void;
  onChangeBPM: (bpm: number) => void;
  onChangeTimeSignature: (timeSignature: string) => void;
}

const MetronomeRoom = ({
  roomCode,
  isHost,
  users,
  currentUser,
  metronomeState,
  clockOffsetRef,
  onLeaveRoom,
  onStartMetronome,
  onStopMetronome,
  onChangeBPM,
  onChangeTimeSignature,
}: MetronomeRoomProps) => {
  const [volume, setVolume] = useState([80]);
  const [manualOffset, setManualOffset] = useState([0]);
  const { toast } = useToast();

  const metronomeConfig = useMemo(() => ({
    bpm: metronomeState.bpm,
    timeSignature: metronomeState.timeSignature,
    volume: volume[0],
    manualOffset: manualOffset[0],
  }), [metronomeState.bpm, metronomeState.timeSignature, volume, manualOffset]);

  const metronome = useMetronome(metronomeConfig);

  useEffect(() => {
    const clockOffset = clockOffsetRef.current ?? 0;
    
    if (metronomeState.isPlaying && !metronome.isPlaying) {
      metronome.start(metronomeState.startTime, clockOffset);
    } else if (!metronomeState.isPlaying && metronome.isPlaying) {
      metronome.stop();
    }
  }, [metronomeState.isPlaying, metronomeState.startTime, metronome, clockOffsetRef]);

  const handlePlayPause = () => {
    if (!isHost) return;
    metronomeState.isPlaying ? onStopMetronome() : onStartMetronome();
  };

  const handleBpmChange = (value: number[]) => {
    if (!isHost) return;
    onChangeBPM(value[0]);
  };

  const handleTimeSignatureChange = (value: string) => {
    if (!isHost) return;
    onChangeTimeSignature(value);
  };
  
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: 'Copied!',
      description: 'Room code copied to clipboard',
    });
  };

  const beatsPerMeasure = parseInt(metronomeState.timeSignature.split('/')[0], 10);
  const beatIndicators = Array.from({ length: beatsPerMeasure }, (_, i) => {
    const beatNumber = i + 1;
    const isCurrentBeat = metronome.isPlaying && (metronome.currentBeat % beatsPerMeasure) + 1 === beatNumber;
    const isAccent = beatNumber === 1;

    return (
      <div
        key={i}
        className={`
          w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold transition-all duration-100
          ${isCurrentBeat 
            ? isAccent 
              ? 'bg-accent border-accent text-accent-foreground animate-beat-pulse' 
              : 'bg-primary border-primary text-primary-foreground animate-beat-pulse'
            : 'bg-audio-inactive border-border text-muted-foreground'
          }
        `}
      >
        {beatNumber}
      </div>
    );
  });
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-audio-panel to-background p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Virtual IEM Metronome</h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Room:</span>
                <Badge 
                  variant="secondary" 
                  className="font-mono cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={copyRoomCode}
                >
                  {roomCode}
                  <Copy className="w-3 h-3 ml-1" />
                </Badge>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onLeaveRoom}
            className="bg-audio-control border-border hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Beat Display</CardTitle>
                <div className="text-6xl font-mono audio-display">
                  {metronomeState.bpm}
                  <span className="text-2xl text-muted-foreground ml-2">BPM</span>
                </div>
                <div className="text-lg text-muted-foreground">{metronomeState.timeSignature} Time</div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4 mb-6">
                  {beatIndicators}
                </div>
                
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handlePlayPause}
                    disabled={!isHost}
                    className={`
                      w-20 h-20 rounded-full text-2xl
                      ${metronomeState.isPlaying 
                        ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                        : 'bg-gradient-primary hover:opacity-90 text-primary-foreground'
                      }
                      ${!isHost ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {metronomeState.isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </Button>
                </div>
                
                {!isHost && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Only the host can control the metronome
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Tempo (BPM)</label>
                    <span className="text-sm font-mono bg-audio-control px-2 py-1 rounded">
                      {metronomeState.bpm}
                    </span>
                  </div>
                  <Slider
                    value={[metronomeState.bpm]}
                    onValueChange={handleBpmChange}
                    min={40} max={200} step={1} disabled={!isHost}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time Signature</label>
                    <Select value={metronomeState.timeSignature} onValueChange={handleTimeSignatureChange} disabled={!isHost}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4/4">4/4</SelectItem>
                        <SelectItem value="3/4">3/4</SelectItem>
                        <SelectItem value="2/4">2/4</SelectItem>
                        <SelectItem value="6/8">6/8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="w-4 h-4" />
                      <label className="text-sm font-medium">Volume</label>
                    </div>
                    <Slider value={volume} onValueChange={setVolume} min={0} max={100} step={5} />
                  </div>
                </div>

                {!isHost && (
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center mb-2">
                       <label className="text-sm font-medium flex items-center gap-2">
                         <SlidersHorizontal className="w-4 h-4" />
                         Sync Calibration
                       </label>
                       <span className="text-sm font-mono bg-audio-control px-2 py-1 rounded">
                         {manualOffset[0] > 0 ? '+' : ''}{manualOffset[0]}ms
                       </span>
                    </div>
                    <Slider
                      value={manualOffset}
                      onValueChange={setManualOffset}
                      min={-200}
                      max={200}
                      step={5}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Earlier</span>
                      <span>Later</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Connected Users ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-audio-control rounded-lg border">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${user.isHost ? 'bg-accent' : 'bg-green-400'}`}></div>
                        <span className="font-medium">{user.name}</span>
                        {user.name === currentUser && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                      {user.isHost && (
                        <Crown className="w-4 h-4 text-accent" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetronomeRoom;