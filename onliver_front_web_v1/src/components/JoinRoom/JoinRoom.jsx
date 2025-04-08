import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './JoinRoom.module.scss';

function JoinRoom() {
  const [roomName, setRoomName] = useState('');
  const [participantName, setParticipantName] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = async (event) => {
    event.preventDefault();
    if (!roomName || !participantName) {
      alert('Пожалуйста, введите имя комнаты и имя участника.');
      return;
    }

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
    }
  };

  return (
    <div className={styles.joinRoomContainer}>
      <h1>Присоединиться к комнате</h1>
      <form onSubmit={handleJoinRoom} className={styles.joinForm}>
        <input
          type="text"
          placeholder="Имя комнаты"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          required
          className={styles.inputField}
        />
        <input
          type="text"
          placeholder="Ваше имя"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
          required
          className={styles.inputField}
        />
        <button type="submit" className={styles.joinButton}>
          Войти
        </button>
      </form>
    </div>
  );
}

export default JoinRoom; 