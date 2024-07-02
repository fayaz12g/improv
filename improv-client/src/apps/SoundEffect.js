import React, { useEffect, useRef } from 'react';

const SoundEffect = ({ audioSrc }) => {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const playAudio = () => {
      if (!isPlayingRef.current) {
        audio.play();
        isPlayingRef.current = true;
      }
    };

    const handleInteraction = () => {
      playAudio();
    };

    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    // Preload the audio
    audio.preload = 'auto';
    audio.load();

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audioSrc]);

  return null; // This component doesn't render anything
};

export default SoundEffect;