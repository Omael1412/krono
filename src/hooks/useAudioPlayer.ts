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
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousTrackRef = useRef<Track | null>(null);
  const currentIndexRef = useRef<number | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null); // URL del blob de audio actualmente cargado
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = volume;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass();
    audioContextRef.current = audioContext;

    const gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    gainNodeRef.current = gainNode;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaElementSource(audio);
    source.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(audioContext.destination);
    analyserRef.current = analyser;
    const bufferLength = analyser.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => {
      const d = audio.duration || 0;
      setDuration(d);
      
      // Sincronizar la duración en la cola si estaba en 0
      if (d > 0) {
        setQueue(prev => {
          const idx = currentIndexRef.current;
          if (idx !== null && idx >= 0 && idx < prev.length) {
            const track = prev[idx];
            if (!track.duration) {
              const newQueue = [...prev];
              newQueue[idx] = { ...track, duration: d };
              return newQueue;
            }
          }
          return prev;
        });
      }
    };
    const onEnded = () => handleEnded();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.src = '';
      // Revocar la última URL de audio cargada para no dejar memoria colgada
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
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

  // Cleanup old cover object URL when track changes
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

  /**
   * Carga una pista en el elemento <audio>, revocando la URL anterior
   * y aplicando un fade breve para evitar cortes abruptos entre canciones.
   */
  const loadAndPlayTrack = useCallback((track: Track, index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const switchSource = () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
      const url = URL.createObjectURL(track.fileBlob);
      currentAudioUrlRef.current = url;
      audio.src = url;
      setCurrentIndex(index);
      currentIndexRef.current = index;
      setPlaybackError(null);

      audio.play()
        .then(() => {
          if (gainNodeRef.current) {
            fadeIn(gainNodeRef.current, volume, 200);
          }
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('[useAudioPlayer] Error al reproducir la pista:', err);
          setIsPlaying(false);
          setPlaybackError('No se pudo reproducir la pista. Intenta de nuevo.');
        });
    };

    // Si ya hay algo sonando, hacemos un fade-out corto antes de cambiar de fuente
    if (gainNodeRef.current && !audio.paused) {
      fadeOut(gainNodeRef.current, 150).then(switchSource);
    } else {
      switchSource();
    }
  }, [volume]);

  const playTrack = useCallback((track: Track) => {
    let index = queue.findIndex(t => t.id === track.id);
    if (index === -1) {
      const newQueue = [...queue, track];
      setQueue(newQueue);
      index = newQueue.length - 1;
    }

    // Si la pista clickeada ya es la que está cargada, no reiniciar
    if (currentIndex === index) {
      const audio = audioRef.current;
      if (audio && audio.paused) {
        // Reanuda sin reiniciar (lógica inline para evitar referencia circular)
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audio.play().then(() => {
          if (gainNodeRef.current) fadeIn(gainNodeRef.current, volume, 200);
          setIsPlaying(true);
        }).catch(console.error);
      }
      return;
    }

    loadAndPlayTrack(track, index);
  }, [queue, currentIndex, loadAndPlayTrack, volume]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (audio.paused) {
      audio.play()
        .then(() => {
          if (gainNodeRef.current) {
            fadeIn(gainNodeRef.current, volume, 200);
          }
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('[useAudioPlayer] Error al reanudar:', err);
          setPlaybackError('No se pudo reanudar la reproducción.');
        });
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
    const track = queue[nextIndex];
    if (track) loadAndPlayTrack(track, nextIndex);
  }, [queue, currentIndex, isShuffle, repeatMode, loadAndPlayTrack]);

  const prevTrack = useCallback(() => {
    if (queue.length === 0) return;
    let prevIndex = (currentIndex !== null ? currentIndex : 0) - 1;
    if (prevIndex < 0) {
      if (repeatMode === 'all') prevIndex = queue.length - 1;
      else return;
    }
    const track = queue[prevIndex];
    if (track) loadAndPlayTrack(track, prevIndex);
  }, [queue, currentIndex, repeatMode, loadAndPlayTrack]);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(seconds, audio.duration || 0);
      setCurrentTime(audio.currentTime);
    }
  }, []);

  const setVolumeValue = useCallback((value: number) => {
    // Permite boost hasta 5× via GainNode; el mínimo es 0.
    const clamped = Math.min(5, Math.max(0, value));
    // Para el estado de React usamos el valor real (puede ser > 1 en boost)
    setVolume(clamped);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = clamped;
    }
    if (clamped === 0) setIsMuted(true);
    else if (clamped > 0) setIsMuted(false);
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
        audio.play().catch((err) => console.error('[useAudioPlayer] Error al repetir:', err));
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
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      setCurrentTime(0);
      setDuration(0);
    }
    queue.forEach(t => {
      if (t.coverUrl) revokeCoverUrl(t);
    });
  }, [queue]);

  const addTracks = useCallback((tracks: Track[]) => {
    setQueue(prev => [...prev, ...tracks]);
  }, []);

  const getFrequencyData = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return null;
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

  const updateTrackMeta = useCallback((
    trackId: string,
    updates: Partial<Pick<Track, 'title' | 'artist' | 'album'>>
  ) => {
    setQueue(prevQueue =>
      prevQueue.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      )
    );
  }, []);


  // Registro de MediaSession en efecto separado: así los handlers siempre
  // referencian las versiones más recientes de nextTrack/prevTrack/etc.
  // (antes quedaban "congelados" con la cola vacía del primer render)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => togglePlay());
    navigator.mediaSession.setActionHandler('pause', () => togglePlay());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) seekTo(details.seekTime);
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
    };
  }, [togglePlay, prevTrack, nextTrack, seekTo]);

  return {
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
    playbackError,
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
    updateTrackMeta,
  };
}