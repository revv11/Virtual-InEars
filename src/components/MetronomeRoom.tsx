import { useState, useEffect, useRef } from 'react';
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
  Music
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  onLeaveRoom: () => void;
}

const MetronomeRoom = ({ roomCode, isHost, users, currentUser, onLeaveRoom }: MetronomeRoomProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [volume, setVolume] = useState([80]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [nextBeatTime, setNextBeatTime] = useState(0);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Initialize audio context
  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        
        audioContextRef.current = audioContext;
        gainNodeRef.current = gainNode;
        
        // Set initial volume
        gainNode.gain.value = volume[0] / 100;
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        toast({
          title: "Audio Error",
          description: "Failed to initialize audio. Please check your browser permissions.",
          variant: "destructive"
        });
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume[0] / 100;
    }
  }, [volume]);

  // Play click sound
  const playClick = (isAccent = false) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const oscillator = audioContextRef.current.createOscillator();
    const envelope = audioContextRef.current.createGain();
    
    oscillator.connect(envelope);
    envelope.connect(gainNodeRef.current);
    
    // Different frequency for accent vs regular beats
    oscillator.frequency.setValueAtTime(
      isAccent ? 1200 : 800, 
      audioContextRef.current.currentTime
    );
    
    // Sharp attack and quick decay
    envelope.gain.setValueAtTime(0, audioContextRef.current.currentTime);
    envelope.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + 0.1);
    
    oscillator.start(audioContextRef.current.currentTime);
    oscillator.stop(audioContextRef.current.currentTime + 0.1);
  };

  // Metronome logic
  useEffect(() => {
    if (isPlaying) {
      const beatsPerMinute = bpm;
      const msPerBeat = 60000 / beatsPerMinute;
      const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);

      intervalRef.current = setInterval(() => {
        const beat = (currentBeat % beatsPerMeasure) + 1;
        const isAccent = beat === 1;
        
        playClick(isAccent);
        setCurrentBeat(prev => prev + 1);
        setNextBeatTime(Date.now() + msPerBeat);
      }, msPerBeat);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [isPlaying, bpm, timeSignature, currentBeat]);

  const handlePlayPause = () => {
    if (!isHost) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      setIsPlaying(true);
      setCurrentBeat(0);
    }
  };

  const handleBpmChange = (value: number[]) => {
    if (!isHost) return;
    setBpm(value[0]);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast({
      title: "Copied!",
      description: "Room code copied to clipboard",
    });
  };

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
  const beatIndicators = Array.from({ length: beatsPerMeasure }, (_, i) => {
    const beatNumber = i + 1;
    const isCurrentBeat = isPlaying && ((currentBeat % beatsPerMeasure) + 1) === beatNumber;
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
        {/* Header */}
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
          {/* Main Metronome */}
          <div className="lg:col-span-2 space-y-6">
            {/* Beat Display */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Beat Display</CardTitle>
                <div className="text-6xl font-mono audio-display">
                  {bpm}
                  <span className="text-2xl text-muted-foreground ml-2">BPM</span>
                </div>
                <div className="text-lg text-muted-foreground">{timeSignature} Time</div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4 mb-6">
                  {beatIndicators}
                </div>
                
                {/* Play/Pause Button */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handlePlayPause}
                    disabled={!isHost}
                    className={`
                      w-20 h-20 rounded-full text-2xl
                      ${isPlaying 
                        ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                        : 'bg-gradient-primary hover:opacity-90 text-primary-foreground'
                      }
                      ${!isHost ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </Button>
                </div>
                
                {!isHost && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Only the host can control the metronome
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Controls */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* BPM Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium">Tempo (BPM)</label>
                    <span className="text-sm font-mono bg-audio-control px-2 py-1 rounded">
                      {bpm}
                    </span>
                  </div>
                  <Slider
                    value={[bpm]}
                    onValueChange={handleBpmChange}
                    min={40}
                    max={200}
                    step={1}
                    disabled={!isHost}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>40</span>
                    <span>200</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Time Signature */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Time Signature</label>
                    <Select value={timeSignature} onValueChange={setTimeSignature} disabled={!isHost}>
                      <SelectTrigger className="bg-audio-control border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4/4">4/4</SelectItem>
                        <SelectItem value="3/4">3/4</SelectItem>
                        <SelectItem value="2/4">2/4</SelectItem>
                        <SelectItem value="6/8">6/8</SelectItem>
                        <SelectItem value="5/4">5/4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Volume */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="w-4 h-4" />
                      <label className="text-sm font-medium">Volume</label>
                    </div>
                    <Slider
                      value={volume}
                      onValueChange={setVolume}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Panel */}
          <div>
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
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-audio-control rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
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