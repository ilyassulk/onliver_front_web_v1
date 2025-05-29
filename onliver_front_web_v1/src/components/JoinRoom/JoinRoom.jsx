import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './JoinRoom.module.scss';

function JoinRoom() {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    if (!roomName || !participantName) {
      alert('Пожалуйста, введите название комнаты и ваше имя.');
      return;
    }

    setIsLoading(true);
    try {
      // Получаем токен от вашего бэкенда
      const resp = await fetch(
        `https://onliver.ru:8080/token?roomName=${roomName}&participantName=${participantName}`
      );
      if (!resp.ok) {
        throw new Error(`Ошибка получения токена: ${resp.status}`);
      }
      const data = await resp.json();
      
      // Переходим в комнату, передавая токен и имя участника
      navigate(`/room/${roomName}`, { state: { token: data.token, participantName } });
    } catch (error) {
      console.error('Не удалось присоединиться к комнате:', error);
      alert(`Не удалось присоединиться к комнате: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.joinRoomContainer}>
      <div className={styles.loginBox}>
        <div className={styles.logoSection}>
          <div className={styles.brandContainer}>
            <img 
              src="/icon_onliver.png" 
              alt="Onliver" 
              className={styles.logo}
            />
            <h1 className={styles.appName}>onliver</h1>
          </div>
          <p className={styles.subtitle}>Смотрите фильмы вместе с друзьями</p>
        </div>
        
        <form onSubmit={handleJoinRoom} className={styles.joinForm}>
          <div className={styles.inputGroup}>
            <label htmlFor="roomName" className={styles.label}>
              Название комнаты
            </label>
            <input
              id="roomName"
              type="text"
              placeholder="Например: Пятничный киновечер"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label htmlFor="participantName" className={styles.label}>
              Ваше имя
            </label>
            <input
              id="participantName"
              type="text"
              placeholder="Как вас зовут?"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.joinButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className={styles.loadingSpinner}></div>
            ) : (
              <>
                <span className={styles.buttonTextDesktop}>Присоединиться к просмотру</span>
                <span className={styles.buttonTextMobile}>Присоединиться</span>
              </>
            )}
          </button>
        </form>
        
        <div className={styles.footer}>
          <p>Совместный просмотр фильмов с видеочатом</p>
        </div>
      </div>
    </div>
  );
}

export default JoinRoom; 