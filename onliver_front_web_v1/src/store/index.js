import { configureStore } from '@reduxjs/toolkit';
import videoRoomReducer from './slices/videoRoomSlice';

export const store = configureStore({
  reducer: {
    videoRoom: videoRoomReducer,
  },
});

export default store; 