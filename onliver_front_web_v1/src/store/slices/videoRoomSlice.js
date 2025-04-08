import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Асинхронное действие для получения токена
export const fetchToken = createAsyncThunk(
  'videoRoom/fetchToken',
  async ({ roomName, participantName }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `https://onliver.ru:8080/token?roomName=${roomName}&participantName=${participantName}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error('Ошибка получения токена');
      }
      
      const tokenData = await response.json();
      return tokenData.token;
    } catch (error) {
      console.error('Ошибка при получении токена:', error);
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  serverUrl: 'wss://onliver.ru:8080/livekit',
  token: null,
  roomName: 'exampleRoom',
  participantName: `user_${Math.floor(Math.random() * 10000)}`,
  isConnecting: false,
  error: null,
  // Состояния для предварительной проверки медиа
  isCameraEnabled: true,
  isMicrophoneEnabled: true,
  videoDevices: [],
  audioDevices: [],
  selectedVideoDevice: null,
  selectedAudioDevice: null,
  mediaCheckComplete: false,
  audioLevel: 0,
};

const videoRoomSlice = createSlice({
  name: 'videoRoom',
  initialState,
  reducers: {
    setRoomName: (state, action) => {
      state.roomName = action.payload;
    },
    setParticipantName: (state, action) => {
      state.participantName = action.payload;
    },
    clearToken: (state) => {
      state.token = null;
    },
    // Редьюсеры для управления медиа устройствами
    toggleCamera: (state) => {
      state.isCameraEnabled = !state.isCameraEnabled;
    },
    toggleMicrophone: (state) => {
      state.isMicrophoneEnabled = !state.isMicrophoneEnabled;
    },
    setVideoDevices: (state, action) => {
      state.videoDevices = action.payload;
      // Если список устройств не пуст и нет выбранного устройства, выбираем первое
      if (action.payload.length > 0 && !state.selectedVideoDevice) {
        state.selectedVideoDevice = action.payload[0].deviceId;
      }
    },
    setAudioDevices: (state, action) => {
      state.audioDevices = action.payload;
      // Если список устройств не пуст и нет выбранного устройства, выбираем первое
      if (action.payload.length > 0 && !state.selectedAudioDevice) {
        state.selectedAudioDevice = action.payload[0].deviceId;
      }
    },
    setSelectedVideoDevice: (state, action) => {
      state.selectedVideoDevice = action.payload;
    },
    setSelectedAudioDevice: (state, action) => {
      state.selectedAudioDevice = action.payload;
    },
    setAudioLevel: (state, action) => {
      state.audioLevel = action.payload;
    },
    setMediaCheckComplete: (state, action) => {
      state.mediaCheckComplete = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchToken.pending, (state) => {
        state.isConnecting = true;
        state.error = null;
      })
      .addCase(fetchToken.fulfilled, (state, action) => {
        state.isConnecting = false;
        state.token = action.payload;
      })
      .addCase(fetchToken.rejected, (state, action) => {
        state.isConnecting = false;
        state.error = action.payload || 'Не удалось получить токен';
      });
  },
});

export const { 
  setRoomName, 
  setParticipantName, 
  clearToken,
  toggleCamera,
  toggleMicrophone,
  setVideoDevices,
  setAudioDevices,
  setSelectedVideoDevice,
  setSelectedAudioDevice,
  setAudioLevel,
  setMediaCheckComplete
} = videoRoomSlice.actions;

export default videoRoomSlice.reducer; 