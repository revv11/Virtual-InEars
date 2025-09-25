import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Music, Users, Wifi, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface LandingPageProps {
  onCreateRoom: (userName: string) => void;
  onJoinRoom: (roomCode: string, userName: string) => void;
  connectionStatus?: 'disconnected' | 'connecting' | 'connected';
  error?: string | null;
}

const LandingPage = ({ onCreateRoom, onJoinRoom, connectionStatus, error }: LandingPageProps) => {
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const handleCreateRoom = () => {
    if (userName.trim()) {
      onCreateRoom(userName.trim());
    }
  };

  const handleJoinRoom = () => {
    if (userName.trim() && roomCode.trim()) {
      onJoinRoom(roomCode.trim().toUpperCase(), userName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-audio-panel to-background p-4">
      <div className="container mx-auto max-w-4xl pt-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Music className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Virtual IEM Metronome
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional synchronized metronome for live band performances. 
            Stay in perfect time across all devices.
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Badge variant="secondary" className="gap-2">
              <Wifi className="w-4 h-4" />
              Real-time Sync
            </Badge>
            <Badge variant="secondary" className="gap-2">
              <Users className="w-4 h-4" />
              Multi-Device
            </Badge>
            <Badge variant="secondary" className="gap-2">
              <Clock className="w-4 h-4" />
              Precise Timing
            </Badge>
          </div>
        </div>

        {/* Connection Status */}
        {connectionStatus && (
          <div className="mb-6">
            {connectionStatus === 'connecting' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Connecting to server...
                </AlertDescription>
              </Alert>
            )}
            {connectionStatus === 'connected' && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Connected to server
                </AlertDescription>
              </Alert>
            )}
            {connectionStatus === 'disconnected' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  Disconnected from server
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert className="border-red-200 bg-red-50 mt-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main interface */}
        <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-panel">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>
              Create a new room or join an existing session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="create" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-audio-control">
                <TabsTrigger value="create" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Create Room
                </TabsTrigger>
                <TabsTrigger value="join" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Join Room
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="create" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Name</label>
                    <Input
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-audio-control border-border/50 focus:border-primary"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateRoom}
                    disabled={!userName.trim()}
                    className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3"
                  >
                    <Music className="w-4 h-4 mr-2" />
                    Create New Room
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="join" className="space-y-6 mt-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Name</label>
                    <Input
                      placeholder="Enter your name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-audio-control border-border/50 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Room Code</label>
                    <Input
                      placeholder="Enter 6-digit room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="bg-audio-control border-border/50 focus:border-primary font-mono tracking-wider"
                      maxLength={6}
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                    />
                  </div>
                  <Button 
                    onClick={handleJoinRoom}
                    disabled={!userName.trim() || !roomCode.trim()}
                    className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Join Room
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="bg-card/30 backdrop-blur-sm border-border/30">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Wifi className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Real-time Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                All devices stay perfectly synchronized with millisecond precision for professional live performances.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-sm border-border/30">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <CardTitle className="text-lg">Multi-Device</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Connect unlimited band members across phones, tablets, and computers for coordinated performances.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/30 backdrop-blur-sm border-border/30">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-audio-meter/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                <Clock className="w-6 h-6 text-audio-meter" />
              </div>
              <CardTitle className="text-lg">Precise Timing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Web Audio API ensures rock-solid timing accuracy essential for professional music production.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;