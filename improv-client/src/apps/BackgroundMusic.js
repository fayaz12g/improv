import React, { useEffect, useRef } from 'react';

const BackgroundMusic = ({ audioSrc, loopStart = 24, loopEnd = 72, isPlaying = true }) => {
  const audioRef = useRef(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    const playAudio = () => {
      if (!isPlayingRef.current && isPlaying) {
        audio.play();
        isPlayingRef.current = true;
      }
    };

    const handleTimeUpdate = () => {
      if (audio.currentTime >= loopEnd) {
        audio.currentTime = loopStart;
      }
    };

    const handleEnded = () => {
      audio.currentTime = loopStart;
      if (isPlaying) {
        audio.play();
      }
    };

    const handleInteraction = () => {
      playAudio();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    document.addEventListener('click', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    // Preload the audio
    audio.preload = 'auto';
    audio.load();

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audioSrc, loopStart, loopEnd, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.play().catch(error => console.error("Error playing audio:", error));
      } else {
        audio.pause();
        isPlayingRef.current = false;
      }
    }
  }, [isPlaying]);

  return null; // This component doesn't render anything
};

export default BackgroundMusic;