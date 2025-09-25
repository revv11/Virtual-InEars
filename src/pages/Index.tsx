import { useState } from 'react';
import LandingPage from '@/components/LandingPage';
import MetronomeRoom from '@/components/MetronomeRoom';
import useRoom from '@/hooks/useRoom';

const Index = () => {
  const { roomState, createRoom, joinRoom, leaveRoom } = useRoom();

  const handleCreateRoom = (userName: string) => {
    createRoom(userName);
  };

  const handleJoinRoom = (roomCode: string, userName: string) => {
    joinRoom(roomCode, userName);
  };

  if (roomState) {
    return (
      <MetronomeRoom
        roomCode={roomState.roomCode}
        isHost={roomState.isHost}
        users={roomState.users}
        currentUser={roomState.currentUser}
        onLeaveRoom={leaveRoom}
      />
    );
  }

  return (
    <LandingPage
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
    />
  );
};

export default Index;
