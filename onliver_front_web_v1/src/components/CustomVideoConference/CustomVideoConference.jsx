import React, { useEffect, useState } from 'react';
import {
  useParticipants,
  useTracks,
  useRoomContext,
  useLocalParticipant,
  LayoutContextProvider,
} from '@livekit/components-react';
import { Track, ConnectionState } from 'livekit-client';
import VideoArea from '../VideoArea';
import VideoControlBar from '../VideoControlBar';
import styles from './CustomVideoConference.module.scss';

function CustomVideoConference(props) {
  return (
    <LayoutContextProvider>
      <CustomVideoConferenceInner {...props} />
    </LayoutContextProvider>
  );
}

function CustomVideoConferenceInner(props) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const [isControlBarVisible, setIsControlBarVisible] = useState(true);
  
  // Получаем треки для отображения
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Автоматическое выключение камеры и микрофона при подключении
  useEffect(() => {
    if (room && room.state === ConnectionState.Connected && localParticipant) {
      const enableDevices = async () => {
        try {
          console.log('🎬 Включаю камеру и микрофон...');
          await localParticipant.setCameraEnabled(false);
          await localParticipant.setMicrophoneEnabled(false);
          console.log('✅ Камера и микрофон включены');
        } catch (error) {
          console.error('❌ Ошибка при включении устройств:', error);
        }
      };
      
      // Небольшая задержка для стабильности
      setTimeout(enableDevices, 1000);
    }
  }, [room, localParticipant]);

  // Логирование для отладки
  useEffect(() => {
    console.log('🎥 Tracks:', tracks);
    console.log('👥 Participants:', participants);
    console.log('🏠 Room state:', room?.state);
    console.log('👤 Local participant:', localParticipant);
    
    // Детальная информация о треках
    tracks.forEach((track, index) => {
      console.log(`Track ${index}:`, {
        source: track.source,
        participant: track.participant?.identity,
        publication: track.publication,
        isSubscribed: track.publication?.isSubscribed,
        isMuted: track.publication?.isMuted,
        track: track.publication?.track
      });
    });
  }, [tracks, participants, room, localParticipant]);

  const handleDisconnect = () => {
    room?.disconnect();
  };

  const toggleControlBar = () => {
    setIsControlBarVisible(!isControlBarVisible);
  };

  // Показываем загрузку, если комната не подключена
  if (!room || room.state !== ConnectionState.Connected) {
    return (
      <div className={styles.videoConference}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Подключение к комнате...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.videoConference} {...props}>
      {/* Основная область видео */}
      <VideoArea tracks={tracks} />

      {/* Панель управления */}
      <VideoControlBar 
        isControlBarVisible={isControlBarVisible}
        onToggleControlBar={toggleControlBar}
        onDisconnect={handleDisconnect}
      />
    </div>
  );
}

export default CustomVideoConference; 