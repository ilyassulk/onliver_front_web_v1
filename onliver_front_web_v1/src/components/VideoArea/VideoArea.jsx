import React, { useState, useEffect } from 'react';
import {
  ParticipantTile,
  GridLayout,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import styles from './VideoArea.module.scss';

function VideoArea({ tracks }) {
  const [fullscreenTrack, setFullscreenTrack] = useState(null);

  // Обработка клавиши Escape для выхода из полноэкранного режима
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && fullscreenTrack) {
        setFullscreenTrack(null);
      }
    };

    if (fullscreenTrack) {
      document.addEventListener('keydown', handleKeyPress);
      // Предотвращаем скролл страницы в полноэкранном режиме
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.body.style.overflow = 'unset';
    };
  }, [fullscreenTrack]);

  // Определяем, есть ли экранная демонстрация
  const screenShareTracks = tracks.filter(
    (track) => track.source === Track.Source.ScreenShare
  );
  const hasScreenShare = screenShareTracks.length > 0;

  // Определяем основные треки для отображения
  const mainTracks = tracks.filter(
    (track) => track.source === Track.Source.Camera
  );

  console.log('📺 Main tracks:', mainTracks);
  console.log('🖥️ Screen share tracks:', screenShareTracks);

  const handleParticipantClick = (trackRef) => {
    // Переключаем полноэкранный режим для выбранного трека
    if (fullscreenTrack && fullscreenTrack.participant.identity === trackRef.participant.identity) {
      setFullscreenTrack(null); // Выходим из полноэкранного режима
    } else {
      setFullscreenTrack(trackRef); // Входим в полноэкранный режим
    }
  };

  // Если есть полноэкранный трек, показываем только его
  if (fullscreenTrack) {
    return (
      <div className={styles.videoArea}>
        <RoomAudioRenderer />
        <div className={styles.fullscreenContainer}>
          <div className={styles.fullscreenVideo}>
            <ParticipantTile 
              trackRef={fullscreenTrack}
              onParticipantClick={() => setFullscreenTrack(null)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.videoArea}>
      {/* Рендерер аудио для всех участников */}
      <RoomAudioRenderer />
      
      {hasScreenShare ? (
        // Если есть экранная демонстрация, показываем её в центре
        <div className={styles.screenShareContainer}>
          <GridLayout tracks={screenShareTracks}>
            <ParticipantTile 
              onParticipantClick={(event) => {
                const trackRef = screenShareTracks.find(track => 
                  track.participant.identity === event.participant.identity
                );
                if (trackRef) handleParticipantClick(trackRef);
              }}
            />
          </GridLayout>
          {/* Участники в маленьком окне */}
          <div className={styles.participantGrid}>
            <GridLayout tracks={mainTracks}>
              <ParticipantTile 
                onParticipantClick={(event) => {
                  const trackRef = mainTracks.find(track => 
                    track.participant.identity === event.participant.identity
                  );
                  if (trackRef) handleParticipantClick(trackRef);
                }}
              />
            </GridLayout>
          </div>
        </div>
      ) : (
        // Обычная сетка участников
        <GridLayout tracks={mainTracks}>
          <ParticipantTile 
            onParticipantClick={(event) => {
              const trackRef = mainTracks.find(track => 
                track.participant.identity === event.participant.identity
              );
              if (trackRef) handleParticipantClick(trackRef);
            }}
          />
        </GridLayout>
      )}
    </div>
  );
}

export default VideoArea; 