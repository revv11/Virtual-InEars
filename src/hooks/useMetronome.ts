import { useState, useEffect, useRef, useCallback } from 'react';

interface MetronomeConfig {
  bpm: number;
  timeSignature: string;
  volume: number;
}

interface MetronomeState {
  isPlaying: boolean;
  currentBeat: number;
  nextBeatTime: number;
}

export const useMetronome = (config: MetronomeConfig) => {
  const [state, setState] = useState<MetronomeState>({
    isPlaying: false,
    currentBeat: 0,
    nextBeatTime: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const schedulerRef = useRef<NodeJS.Timeout | null>(null);
  const timerWorkerRef = useRef<Worker | null>(null);

  // Initialize Web Audio API
  useEffect(() => {
    const initAudio = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume context if suspended (for mobile browsers)
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        const gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = config.volume / 100;

        audioContextRef.current = audioContext;
        gainNodeRef.current = gainNode;
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };

    initAudio();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (schedulerRef.current) {
        clearTimeout(schedulerRef.current);
      }
      if (timerWorkerRef.current) {
        timerWorkerRef.current.terminate();
      }
    };
  }, []);

  // Update volume when config changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = config.volume / 100;
    }
  }, [config.volume]);

  // Generate click sound using Web Audio API
  const playClick = useCallback((isAccent: boolean = false) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;

    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;

    // Create oscillator for the click
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();

    oscillator.connect(envelope);
    envelope.connect(gainNodeRef.current);

    // Different frequencies for accent vs regular beats
    oscillator.frequency.setValueAtTime(isAccent ? 1200 : 800, now);
    oscillator.type = 'square';

    // Create sharp attack and quick decay envelope
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.3, now + 0.001);
    envelope.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }, []);

  // High-precision metronome scheduler
  const scheduleAhead = 25.0; // 25ms scheduling window
  const lookahead = 25.0; // 25ms lookahead

  const scheduler = useCallback(() => {
    if (!audioContextRef.current || !state.isPlaying) return;

    const beatsPerMeasure = parseInt(config.timeSignature.split('/')[0]);
    const secondsPerBeat = 60.0 / config.bpm;

    while (state.nextBeatTime < audioContextRef.current.currentTime + (lookahead / 1000)) {
      const beatInMeasure = (state.currentBeat % beatsPerMeasure) + 1;
      const isAccent = beatInMeasure === 1;

      // Schedule the click sound
      const clickTime = state.nextBeatTime;
      if (clickTime >= audioContextRef.current.currentTime) {
        playClick(isAccent);
      }

      // Update state
      setState(prevState => ({
        ...prevState,
        currentBeat: prevState.currentBeat + 1,
        nextBeatTime: prevState.nextBeatTime + secondsPerBeat,
      }));
    }

    schedulerRef.current = setTimeout(scheduler, lookahead);
  }, [state.isPlaying, state.currentBeat, state.nextBeatTime, config.bpm, config.timeSignature, playClick]);

  // Start metronome
  const start = useCallback(() => {
    if (!audioContextRef.current) return;

    setState(prevState => ({
      ...prevState,
      isPlaying: true,
      currentBeat: 0,
      nextBeatTime: audioContextRef.current!.currentTime,
    }));
  }, []);

  // Stop metronome
  const stop = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      isPlaying: false,
      currentBeat: 0,
      nextBeatTime: 0,
    }));

    if (schedulerRef.current) {
      clearTimeout(schedulerRef.current);
    }
  }, []);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (state.isPlaying) {
      stop();
    } else {
      start();
    }
  }, [state.isPlaying, start, stop]);

  // Start scheduler when playing
  useEffect(() => {
    if (state.isPlaying) {
      scheduler();
    }
  }, [state.isPlaying, scheduler]);

  return {
    ...state,
    start,
    stop,
    toggle,
  };
};

export default useMetronome;