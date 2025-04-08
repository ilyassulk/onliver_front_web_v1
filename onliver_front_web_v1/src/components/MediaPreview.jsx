import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  toggleCamera, 
  toggleMicrophone, 
  setVideoDevices, 
  setAudioDevices,
  setSelectedVideoDevice,
  setSelectedAudioDevice,
  setAudioLevel,
  setMediaCheckComplete
} from '../store/slices/videoRoomSlice';

// Иконки для управления медиа
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
);

const MicOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
  </svg>
);

const CameraOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82L21 17.18V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
  </svg>
);

function MediaPreview() {
  const dispatch = useDispatch();
  const videoRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioStreamRef = useRef(null);
  const rafRef = useRef(null);
  const [screenSize, setScreenSize] = useState('desktop'); // desktop, tablet, mobile
  
  const {
    isCameraEnabled,
    isMicrophoneEnabled,
    videoDevices,
    audioDevices,
    selectedVideoDevice,
    selectedAudioDevice,
    audioLevel
  } = useSelector(state => state.videoRoom);

  // Определяем размер экрана для адаптивности
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1200) {
        setScreenSize('desktop');
      } else if (width >= 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };

    // Вызываем обработчик при монтировании
    handleResize();

    // Добавляем слушатель изменения размера окна
    window.addEventListener('resize', handleResize);

    // Очищаем слушатель при размонтировании
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Инициализация устройств и получение потоков
  useEffect(() => {
    let cleanupFunctions = [];
    
    const initializeMedia = async () => {
      try {
        // Запрашиваем список доступных устройств
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        
        dispatch(setVideoDevices(videoInputs));
        dispatch(setAudioDevices(audioInputs));
        
        // Получение доступа к камере, если она включена
        if (isCameraEnabled) {
          await startVideoStream();
        }
        
        // Получение доступа к микрофону для анализа уровня звука
        if (isMicrophoneEnabled) {
          await startAudioAnalysis();
        }
        
        // Отмечаем, что проверка медиа завершена
        dispatch(setMediaCheckComplete(true));
      } catch (error) {
        console.error('Ошибка инициализации медиа:', error);
      }
    };
    
    initializeMedia();
    
    // Функция очистки
    return () => {
      // Останавливаем все потоки
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Отменяем requestAnimationFrame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      // Закрываем AudioContext
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Выполняем все функции очистки
      cleanupFunctions.forEach(fn => fn());
    };
  }, []);
  
  // Функция для запуска видеопотока
  const startVideoStream = async () => {
    try {
      // Останавливаем предыдущий поток, если он есть
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Настройки для getUserMedia
      const constraints = {
        video: selectedVideoDevice 
          ? { deviceId: { exact: selectedVideoDevice } } 
          : true
      };
      
      // Получаем поток
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      
      // Присваиваем поток элементу video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Ошибка при запуске видеопотока:', error);
      dispatch(toggleCamera());  // Отключаем камеру при ошибке
    }
  };
  
  // Следим за изменением выбранного видеоустройства
  useEffect(() => {
    if (isCameraEnabled && selectedVideoDevice) {
      startVideoStream();
    }
  }, [selectedVideoDevice, isCameraEnabled]);
  
  // Функция для анализа звука с микрофона
  const startAudioAnalysis = async () => {
    try {
      // Останавливаем предыдущий аудиопоток, если он есть
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Настройки для getUserMedia
      const constraints = {
        audio: selectedAudioDevice 
          ? { deviceId: { exact: selectedAudioDevice } } 
          : true
      };
      
      // Получаем поток
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      audioStreamRef.current = stream;
      
      // Создаем AudioContext и анализатор
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      const source = audioContext.createMediaStreamSource(stream);
      
      // Создаем анализатор
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // Подключаем источник к анализатору
      source.connect(analyserRef.current);
      
      // Начинаем анализировать уровень звука
      updateAudioLevel();
    } catch (error) {
      console.error('Ошибка при анализе звука:', error);
      dispatch(toggleMicrophone());  // Отключаем микрофон при ошибке
    }
  };
  
  // Следим за изменением выбранного аудиоустройства
  useEffect(() => {
    if (isMicrophoneEnabled && selectedAudioDevice) {
      startAudioAnalysis();
    }
  }, [selectedAudioDevice, isMicrophoneEnabled]);
  
  // Функция для обновления уровня звука
  const updateAudioLevel = () => {
    if (analyserRef.current && isMicrophoneEnabled) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Вычисляем среднее значение уровня звука
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / dataArray.length;
      // Нормализуем значение от 0 до 100
      const normalizedAverage = Math.min(100, Math.max(0, average * 1.5));
      
      dispatch(setAudioLevel(normalizedAverage));
      
      // Продолжаем обновление в следующем кадре
      rafRef.current = requestAnimationFrame(updateAudioLevel);
    } else {
      dispatch(setAudioLevel(0));
    }
  };
  
  // Обработчики переключения камеры и микрофона
  const handleToggleCamera = () => {
    const newState = !isCameraEnabled;
    dispatch(toggleCamera());
    
    if (newState) {
      startVideoStream();
    } else if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach(track => track.stop());
    }
  };
  
  const handleToggleMicrophone = () => {
    const newState = !isMicrophoneEnabled;
    dispatch(toggleMicrophone());
    
    if (newState) {
      startAudioAnalysis();
    } else {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      dispatch(setAudioLevel(0));
    }
  };
  
  // Настраиваем высоту видеопревью в зависимости от размера экрана
  const getVideoPreviewHeight = () => {
    switch (screenSize) {
      case 'desktop':
        return '280px';
      case 'tablet':
        return '240px';
      case 'mobile':
        return '180px';
      default:
        return '240px';
    }
  };
  
  return (
    <div className={`media-preview ${screenSize}`}>
      {/* Предпросмотр видео */}
      <div 
        className={`video-preview ${screenSize}`} 
        style={{ height: getVideoPreviewHeight() }}
      >
        {isCameraEnabled ? (
          <video ref={videoRef} autoPlay playsInline muted />
        ) : (
          <div className="no-video">Камера отключена</div>
        )}
      </div>
      
      {/* Кнопки управления камерой и микрофоном */}
      <div className="media-controls">
        <button 
          className={`control-button ${isMicrophoneEnabled ? 'active' : 'muted'} ${screenSize}`}
          onClick={handleToggleMicrophone}
          title={isMicrophoneEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
          aria-label={isMicrophoneEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
        >
          {isMicrophoneEnabled ? <MicIcon /> : <MicOffIcon />}
        </button>
        
        <button 
          className={`control-button ${isCameraEnabled ? 'active' : 'muted'} ${screenSize}`}
          onClick={handleToggleCamera}
          title={isCameraEnabled ? 'Выключить камеру' : 'Включить камеру'}
          aria-label={isCameraEnabled ? 'Выключить камеру' : 'Включить камеру'}
        >
          {isCameraEnabled ? <CameraIcon /> : <CameraOffIcon />}
        </button>
      </div>
      
      {/* Индикатор уровня звука */}
      <div className="audio-level-indicator">
        <div 
          className="audio-level-bar" 
          style={{ width: `${audioLevel}%` }}
          role="progressbar"
          aria-valuenow={Math.round(audioLevel)}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      
      {/* Селекторы устройств */}
      <div className={`device-selector ${screenSize}`}>
        {videoDevices.length > 0 && (
          <select
            value={selectedVideoDevice || ''}
            onChange={(e) => dispatch(setSelectedVideoDevice(e.target.value))}
            disabled={!isCameraEnabled}
            aria-label="Выбрать камеру"
          >
            {videoDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Камера ${videoDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        )}
        
        {audioDevices.length > 0 && (
          <select
            value={selectedAudioDevice || ''}
            onChange={(e) => dispatch(setSelectedAudioDevice(e.target.value))}
            disabled={!isMicrophoneEnabled}
            aria-label="Выбрать микрофон"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Микрофон ${audioDevices.indexOf(device) + 1}`}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

export default MediaPreview; 