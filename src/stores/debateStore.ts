import { create } from 'zustand';
import type { Debate, DebateMessage } from '../types/debate';

interface DebateState {
  debates: Debate[];
  currentDebate: Debate | null;
  messages: DebateMessage[];
  setDebates: (debates: Debate[]) => void;
  setCurrentDebate: (debate: Debate | null) => void;
  setMessages: (messages: DebateMessage[]) => void;
  addMessage: (message: DebateMessage) => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  debates: [],
  currentDebate: null,
  messages: [],
  setDebates: (debates) => set({ debates }),
  setCurrentDebate: (debate) => set({ currentDebate: debate }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
}));
