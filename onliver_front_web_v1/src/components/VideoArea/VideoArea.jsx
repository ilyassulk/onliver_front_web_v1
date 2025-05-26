import React from 'react';
import {
  ParticipantTile,
  GridLayout,
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import styles from './VideoArea.module.scss';

function VideoArea({ tracks }) {
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

  return (
    <div className={styles.videoArea}>
      {/* Рендерер аудио для всех участников */}
      <RoomAudioRenderer />
      
      {hasScreenShare ? (
        // Если есть экранная демонстрация, показываем её в центре
        <div className={styles.screenShareContainer}>
          <GridLayout tracks={screenShareTracks}>
            <ParticipantTile />
          </GridLayout>
          {/* Участники в маленьком окне */}
          <div className={styles.participantGrid}>
            <GridLayout tracks={mainTracks}>
              <ParticipantTile />
            </GridLayout>
          </div>
        </div>
      ) : (
        // Обычная сетка участников
        <GridLayout tracks={mainTracks}>
          <ParticipantTile />
        </GridLayout>
      )}
    </div>
  );
}

export default VideoArea; 