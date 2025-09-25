import { useState, useEffect, useRef, useCallback } from 'react';

// --- Interfaces ---
interface MetronomeConfig {
  bpm: number;
  timeSignature: string;
  volume: number;
  manualOffset: number; // Offset in milliseconds
}

interface MetronomeState {
  isPlaying: boolean;
  currentBeat: number;
}

// --- Constants ---
const LOOKAHEAD_TIME_MS = 25.0;
const SCHEDULE_AHEAD_TIME_SEC = 0.1;

// --- Hook Definition ---
export const useMetronome = (config: MetronomeConfig) => {
  const [state, setState] = useState<MetronomeState>({
    isPlaying: false,
    currentBeat: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const schedulerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const nextBeatTimeRef = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);
  const prevOffsetRef = useRef<number>(0); // Ref to track the previous offset value

  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        audioContextRef.current = audioContext;
        gainNodeRef.current = gainNode;
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };
    initAudio();

    return () => {
      if (schedulerTimerRef.current) clearTimeout(schedulerTimerRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = config.volume / 100;
    }
  }, [config.volume]);

  const playClick = useCallback((isAccent: boolean, time: number) => {
    const audioContext = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    if (!audioContext || !gainNode) return;

    const osc = audioContext.createOscillator();
    const env = audioContext.createGain();
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, time);
    osc.type = 'square';
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(0.4, time + 0.001);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    osc.connect(env);
    env.connect(gainNode);
    osc.start(time);
    osc.stop(time + 0.1);
  }, []);

  const scheduler = useCallback(() => {
    const audioContext = audioContextRef.current;
    if (!audioContext || !state.isPlaying) return;

    const beatsPerMeasure = parseInt(config.timeSignature.split('/')[0], 10) || 4;
    const secondsPerBeat = 60.0 / config.bpm;

    while (nextBeatTimeRef.current < audioContext.currentTime + SCHEDULE_AHEAD_TIME_SEC) {
      const beatInMeasure = currentBeatRef.current % beatsPerMeasure;
      playClick(beatInMeasure === 0, nextBeatTimeRef.current);
      nextBeatTimeRef.current += secondsPerBeat;
      currentBeatRef.current += 1;
      setState(prevState => ({ ...prevState, currentBeat: currentBeatRef.current }));
    }
    schedulerTimerRef.current = setTimeout(scheduler, LOOKAHEAD_TIME_MS);
  }, [config.bpm, config.timeSignature, playClick, state.isPlaying]);

  const start = useCallback((serverStartTime: number, clockOffset: number) => {
    const audioContext = audioContextRef.current;
    if (!audioContext || state.isPlaying) return;
    if (audioContext.state === 'suspended') audioContext.resume();

    const estimatedServerTimeNow = Date.now() + clockOffset;
    const timeElapsedMs = estimatedServerTimeNow - serverStartTime;
    const timeElapsedSec = Math.max(0, timeElapsedMs / 1000);

    const secondsPerBeat = 60.0 / config.bpm;
    const beatsPassed = Math.floor(timeElapsedSec / secondsPerBeat);

    const timeOfNextBeatMs = serverStartTime + (beatsPassed + 1) * secondsPerBeat * 1000;
    const timeUntilNextBeatMs = timeOfNextBeatMs - estimatedServerTimeNow;
    const audioContextStartTime = audioContext.currentTime + timeUntilNextBeatMs / 1000;

    const finalStartTime = audioContextStartTime + (config.manualOffset / 1000);
    prevOffsetRef.current = config.manualOffset;

    currentBeatRef.current = beatsPassed;
    nextBeatTimeRef.current = finalStartTime;
    
    setState({ isPlaying: true, currentBeat: beatsPassed });
  }, [state.isPlaying, config.bpm, config.manualOffset]);

  const stop = useCallback(() => {
    if (!state.isPlaying) return;
    if (schedulerTimerRef.current) clearTimeout(schedulerTimerRef.current);
    setState({ isPlaying: false, currentBeat: 0 });
  }, [state.isPlaying]);

  useEffect(() => {
    if (state.isPlaying) {
      const newOffset = config.manualOffset;
      const oldOffset = prevOffsetRef.current;
      const adjustment = (newOffset - oldOffset) / 1000;

      if (adjustment !== 0) {
        nextBeatTimeRef.current += adjustment;
      }
      prevOffsetRef.current = newOffset;
    }
  }, [config.manualOffset, state.isPlaying]);

  useEffect(() => {
    if (state.isPlaying) {
      scheduler();
    } else if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current);
    }
  }, [state.isPlaying, scheduler]);

  return { ...state, start, stop };
};

export default useMetronome;