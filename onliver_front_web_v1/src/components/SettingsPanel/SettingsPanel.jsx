import React, { useState } from 'react';
import {
  useMediaDevices,
  useLocalParticipant,
  usePersistentUserChoices,
} from '@livekit/components-react';
import styles from './SettingsPanel.module.scss';

function SettingsPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('video');
  
  const { devices: videoDevices } = useMediaDevices({ kind: 'videoinput' });
  const { devices: audioDevices } = useMediaDevices({ kind: 'audioinput' });
  const { devices: audioOutputDevices } = useMediaDevices({ kind: 'audiooutput' });
  
  const { localParticipant } = useLocalParticipant();
  const { saveUserChoices, userChoices } = usePersistentUserChoices();

  const [settings, setSettings] = useState({
    videoQuality: userChoices?.videoQuality || 'high',
    audioQuality: userChoices?.audioQuality || 'high',
    enableNoiseCancellation: userChoices?.enableNoiseCancellation || false,
    enableEchoCancellation: userChoices?.enableEchoCancellation || true,
    selectedVideoDevice: userChoices?.selectedVideoDevice || '',
    selectedAudioDevice: userChoices?.selectedAudioDevice || '',
    selectedAudioOutput: userChoices?.selectedAudioOutput || '',
  });

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveUserChoices(newSettings);
  };

  const handleDeviceChange = async (deviceType, deviceId) => {
    try {
      if (deviceType === 'videoinput') {
        await localParticipant.setCameraEnabled(false);
        await localParticipant.setCameraEnabled(true, { deviceId });
        handleSettingChange('selectedVideoDevice', deviceId);
      } else if (deviceType === 'audioinput') {
        await localParticipant.setMicrophoneEnabled(false);
        await localParticipant.setMicrophoneEnabled(true, { deviceId });
        handleSettingChange('selectedAudioDevice', deviceId);
      }
    } catch (error) {
      console.error('Ошибка при смене устройства:', error);
    }
  };

  const tabs = [
    { id: 'video', label: 'Видео', icon: '📹' },
    { id: 'audio', label: 'Аудио', icon: '🎤' },
    { id: 'general', label: 'Общие', icon: '⚙️' },
  ];

  return (
    <div className={styles.settingsPanel}>
      <div className={styles.header}>
        <h2>Настройки</h2>
        <button className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'video' && (
          <div className={styles.section}>
            <h3>Настройки видео</h3>
            
            <div className={styles.setting}>
              <label>Камера:</label>
              <select
                value={settings.selectedVideoDevice}
                onChange={(e) => handleDeviceChange('videoinput', e.target.value)}
                className={styles.select}
              >
                <option value="">По умолчанию</option>
                {videoDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Камера ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.setting}>
              <label>Качество видео:</label>
              <select
                value={settings.videoQuality}
                onChange={(e) => handleSettingChange('videoQuality', e.target.value)}
                className={styles.select}
              >
                <option value="low">Низкое (360p)</option>
                <option value="medium">Среднее (720p)</option>
                <option value="high">Высокое (1080p)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className={styles.section}>
            <h3>Настройки аудио</h3>
            
            <div className={styles.setting}>
              <label>Микрофон:</label>
              <select
                value={settings.selectedAudioDevice}
                onChange={(e) => handleDeviceChange('audioinput', e.target.value)}
                className={styles.select}
              >
                <option value="">По умолчанию</option>
                {audioDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Микрофон ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.setting}>
              <label>Динамики:</label>
              <select
                value={settings.selectedAudioOutput}
                onChange={(e) => handleSettingChange('selectedAudioOutput', e.target.value)}
                className={styles.select}
              >
                <option value="">По умолчанию</option>
                {audioOutputDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Динамики ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.setting}>
              <label>Качество аудио:</label>
              <select
                value={settings.audioQuality}
                onChange={(e) => handleSettingChange('audioQuality', e.target.value)}
                className={styles.select}
              >
                <option value="low">Низкое</option>
                <option value="medium">Среднее</option>
                <option value="high">Высокое</option>
              </select>
            </div>

            <div className={styles.checkboxSetting}>
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableNoiseCancellation}
                  onChange={(e) => handleSettingChange('enableNoiseCancellation', e.target.checked)}
                />
                Подавление шума
              </label>
            </div>

            <div className={styles.checkboxSetting}>
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableEchoCancellation}
                  onChange={(e) => handleSettingChange('enableEchoCancellation', e.target.checked)}
                />
                Подавление эха
              </label>
            </div>
          </div>
        )}

        {activeTab === 'general' && (
          <div className={styles.section}>
            <h3>Общие настройки</h3>
            
            <div className={styles.info}>
              <p><strong>Версия приложения:</strong> 1.0.0</p>
              <p><strong>Статус подключения:</strong> Подключено</p>
              <p><strong>Качество соединения:</strong> Отличное</p>
            </div>

            <div className={styles.actions}>
              <button className={styles.actionBtn}>
                Проверить микрофон
              </button>
              <button className={styles.actionBtn}>
                Проверить камеру
              </button>
              <button className={styles.actionBtn}>
                Сбросить настройки
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPanel; 