// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useAudioPlayer } from './hooks/useAudioPlayer';
import { useTheme } from './hooks/useTheme';
import { useAppContext } from './store/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { TrackList } from './components/player/TrackList';
import { PlayerControls } from './components/player/PlayerControls';
import { SettingsView } from './views/SettingsView';
import { Track } from './types/player';

function App() {
  const {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    playbackRate,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    seekTo,
    setVolume,
    setSpeed,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    addTracks,
    getFrequencyData,
    updateTrackCover,
    updateTrackMeta,
  } = useAudioPlayer();

  const { dominantColor, settings } = useTheme(currentTrack);
  const { state: appState, toggleFavorite } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleAddTracks = (tracks: Track[]) => {
    addTracks(tracks);
    if (queue.length === 0 && tracks.length > 0) {
      playTrack(tracks[0]);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className="h-screen flex flex-col text-white overflow-hidden transition-colors duration-700 font-sans"
      style={{
        background: `linear-gradient(180deg, ${dominantColor}66 0%, #000000 100%)`,
      }}
    >
      <Topbar onOpenSettings={() => setSettingsOpen(true)} />

      <div className="flex flex-1 min-h-0 relative">
        {/* Sidebar - hidden on mobile unless toggled */}
        <div className={`
          absolute inset-y-0 left-0 z-40 w-64 bg-black/90 backdrop-blur-lg transform transition-transform duration-300 ease-in-out border-r border-neutral-800/50
          lg:relative lg:translate-x-0 lg:flex-shrink-0 lg:bg-black/40
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar onTracksAdded={handleAddTracks} currentTrack={currentTrack} />
        </div>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 bg-black/20">
          <TrackList 
            tracks={queue} 
            currentTrackId={currentTrack?.id}
            coverShape={settings.coverShape}
            onTrackSelect={playTrack}
            onUpdateMeta={updateTrackMeta}
          />
        </div>
      </div>

      {/* Player controls */}
      <PlayerControls
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        playbackRate={playbackRate}
        onTogglePlay={togglePlay}
        onNext={nextTrack}
        onPrev={prevTrack}
        onSeek={seekTo}
        onVolumeChange={setVolume}
        onSpeedChange={setSpeed}
        onToggleMute={toggleMute}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        getFrequencyData={getFrequencyData}
        dominantColor={dominantColor}
        onUpdateCover={updateTrackCover}
        coverShape={settings.coverShape}
        playerLayout={settings.playerLayout}
        buttonStyle={settings.buttonStyle}
        favoriteIds={appState.favoriteIds}
        onToggleFavorite={toggleFavorite}
      />

      {/* Modals */}
      <SettingsView isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* Spacer for bar layout (fullscreen hides it automatically via fixed positioning) */}
      {settings.playerLayout === 'bar' && <div className="h-24 flex-shrink-0" />}
    </div>
  );
}

export default App;