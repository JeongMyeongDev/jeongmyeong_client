import { create } from 'zustand';
import type { ChatRoom, Message } from '../types/message';

interface MessageState {
  chatRooms: ChatRoom[];
  currentMessages: Message[];
  setChatRooms: (rooms: ChatRoom[]) => void;
  setCurrentMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  chatRooms: [],
  currentMessages: [],
  setChatRooms: (chatRooms) => set({ chatRooms }),
  setCurrentMessages: (messages) => set({ currentMessages: messages }),
  addMessage: (message) => set((state) => ({ currentMessages: [...state.currentMessages, message] })),
}));
