// src/hooks/useAudioPlayer.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import { Track, PlayerState } from '../types/player';
import { revokeCoverUrl } from '../services/metadata';
import { fadeOut, fadeIn } from '../services/audioEngine';

type RepeatMode = 'off' | 'all' | 'one';

export function useAudioPlayer() {
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousTrackRef = useRef<Track | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;

    // Create AudioContext, GainNode and AnalyserNode
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    // GainNode controla el volumen maestro con fade
    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNodeRef.current = gainNode;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaElementSource(audio);
    // Cadena: source → gainNode → analyser → destination
    source.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);
    analyserRef.current = analyser;
    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => handleEnded();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    // MediaSession integration
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seekTo(details.seekTime);
      });
    }

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.src = '';
      if (previousTrackRef.current?.coverUrl) {
        revokeCoverUrl(previousTrackRef.current);
      }
      audioContext.close();
    };
  }, []);

  // Update media session metadata when track changes
  useEffect(() => {
    const track = getCurrentTrack();
    if (track && 'mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.coverUrl ? [{ src: track.coverUrl, sizes: '512x512' }] : [],
      });
    } else if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
    }
  }, [currentIndex, queue]);

  // Cleanup old object URL when track changes
  useEffect(() => {
    const prev = previousTrackRef.current;
    const current = getCurrentTrack();
    if (prev && prev !== current) {
      if (prev.coverUrl) revokeCoverUrl(prev);
    }
    previousTrackRef.current = current || null;
  }, [currentIndex, queue]);

  const getCurrentTrack = useCallback((): Track | null => {
    if (currentIndex === null || currentIndex < 0 || currentIndex >= queue.length) return null;
    return queue[currentIndex];
  }, [currentIndex, queue]);

  const playTrack = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reanudar AudioContext si está suspendido
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Find track in queue or add it
    let index = queue.findIndex(t => t.id === track.id);
    if (index === -1) {
      const newQueue = [...queue, track];
      setQueue(newQueue);
      index = newQueue.length - 1;
    }
    setCurrentIndex(index);
    const url = URL.createObjectURL(track.fileBlob);
    audio.src = url;
    audio.play();
    setIsPlaying(true);
  }, [queue]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reanudar AudioContext si está suspendido
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (audio.paused) {
      audio.play().then(() => {
        if (gainNodeRef.current) {
          fadeIn(gainNodeRef.current, volume, 200);
        }
      });
      setIsPlaying(true);
    } else {
      if (gainNodeRef.current) {
        fadeOut(gainNodeRef.current, 300).then(() => {
          audio.pause();
        });
      } else {
        audio.pause();
      }
      setIsPlaying(false);
    }
  }, [volume]);

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return;
    let nextIndex: number;
    if (isShuffle) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * queue.length);
      } while (randomIndex === currentIndex && queue.length > 1);
      nextIndex = randomIndex;
    } else {
      nextIndex = (currentIndex !== null ? currentIndex : -1) + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0;
        else return;
      }
    }
    setCurrentIndex(nextIndex);
    const track = queue[nextIndex];
    if (track) {
      const audio = audioRef.current;
      if (audio) {
        const url = URL.createObjectURL(track.fileBlob);
        audio.src = url;
        audio.play();
        setIsPlaying(true);
      }
    }
  }, [queue, currentIndex, isShuffle, repeatMode]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    let prevIndex = (currentIndex !== null ? currentIndex : 0) - 1;
    if (prevIndex < 0) {
      if (repeatMode === 'all') prevIndex = queue.length - 1;
      else return;
    }
    setCurrentIndex(prevIndex);
    const track = queue[prevIndex];
    if (track) {
      const audio = audioRef.current;
      if (audio) {
        const url = URL.createObjectURL(track.fileBlob);
        audio.src = url;
        audio.play();
        setIsPlaying(true);
      }
    }
  }, [queue, currentIndex, repeatMode]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(seconds, audio.duration || 0);
      setCurrentTime(audio.currentTime);
    }
  }, []);

  const setVolumeValue = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setVolume(clamped);
    // Controlar volumen via GainNode (no audio.volume) para preservar el fade
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped;
    }
    if (clamped === 0) setIsMuted(true);
    else setIsMuted(false);
  }, []);

  const setSpeed = useCallback((rate: number) => {
    const clamped = Math.min(2, Math.max(0.25, rate));
    setPlaybackRate(clamped);
    if (audioRef.current) {
      audioRef.current.playbackRate = clamped;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle(prev => !prev);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const handleEnded = useCallback(() => {
    if (repeatMode === 'one') {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
    } else {
      nextTrack();
    }
  }, [repeatMode, nextTrack]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(null);
    setIsPlaying(false);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
      setCurrentTime(0);
      setDuration(0);
    }
    // revoke all cover URLs
    queue.forEach(t => {
      if (t.coverUrl) revokeCoverUrl(t);
    });
  }, [queue]);

  const addTracks = useCallback((tracks: Track[]) => {
    setQueue(prev => [...prev, ...tracks]);
  }, []);

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return null;
    // Solucionamos la estrictez de TypeScript forzando el tipado
    analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
    return dataArrayRef.current;
  }, []);

  const updateTrackCover = useCallback((trackId: string, coverUrl: string | undefined) => {
    setQueue(prevQueue => 
      prevQueue.map(track => {
        if (track.id === trackId) {
          if (track.coverUrl && track.coverUrl !== coverUrl) {
            revokeCoverUrl(track);
          }
          return { ...track, coverUrl };
        }
        return track;
      })
    );
  }, []);

  return {
    // state
    queue,
    currentIndex,
    currentTrack: getCurrentTrack(),
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    playbackRate,
    // actions
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume: setVolumeValue,
    setSpeed,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    clearQueue,
    addTracks,
    getFrequencyData,
    updateTrackCover,
  };
}