import { useState } from 'react';
import LandingPage from '@/components/LandingPage';
import MetronomeRoom from '@/components/MetronomeRoom';
import { useRoom } from '@/hooks/useRoom';

const Index = () => {
  const { 
    roomState, 
    metronomeState, 
    connectionStatus, 
    error,
    clockOffset,
    createRoom, 
    joinRoom, 
    leaveRoom,
    startMetronome,
    stopMetronome,
    changeBPM,
    changeTimeSignature
  } = useRoom();

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
        metronomeState={metronomeState}
        onLeaveRoom={leaveRoom}
        clockOffsetRef={clockOffset}
        onStartMetronome={startMetronome}
        onStopMetronome={stopMetronome}
        onChangeBPM={changeBPM}
        onChangeTimeSignature={changeTimeSignature}
      />
    );
  }

  return (
    <LandingPage
      onCreateRoom={handleCreateRoom}
      onJoinRoom={handleJoinRoom}
      connectionStatus={connectionStatus}
      error={error}
    />
  );
};

export default Index;
