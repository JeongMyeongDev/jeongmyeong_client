import { create } from 'zustand';
import { moderationService } from '../services/moderationService';
import type { Sanction } from '../types/moderation';

const isCurrentlyActive = (sanction: Sanction) => {
  if (sanction.status !== 'ACTIVE') return false;
  const now = Date.now();
  const startsAt = new Date(sanction.startsAt).getTime();
  const endsAt = sanction.endsAt ? new Date(sanction.endsAt).getTime() : null;
  return startsAt <= now && (!endsAt || endsAt > now);
};

interface ModerationState {
  sanctions: Sanction[];
  activeSanctions: Sanction[];
  isLoading: boolean;
  fetchSanctions: () => Promise<void>;
  acknowledgeSanction: (sanctionId: string) => Promise<void>;
  clearSanctions: () => void;
  canWrite: () => boolean;
  canCreateDebate: () => boolean;
  isSuspended: () => boolean;
}

export const useModerationStore = create<ModerationState>((set, get) => ({
  sanctions: [],
  activeSanctions: [],
  isLoading: false,
  fetchSanctions: async () => {
    set({ isLoading: true });
    try {
      const { data } = await moderationService.getMySanctions();
      const sanctions = data.sanctions;
      set({ sanctions, activeSanctions: sanctions.filter(isCurrentlyActive) });
    } finally {
      set({ isLoading: false });
    }
  },
  acknowledgeSanction: async (sanctionId) => {
    await moderationService.acknowledgeSanction(sanctionId);
    await get().fetchSanctions();
  },
  clearSanctions: () => set({ sanctions: [], activeSanctions: [] }),
  canWrite: () =>
    !get().activeSanctions.some((sanction) =>
      ['WRITE_RESTRICTION', 'TEMP_SUSPENSION', 'PERMANENT_SUSPENSION'].includes(sanction.type),
    ),
  canCreateDebate: () =>
    !get().activeSanctions.some((sanction) =>
      ['DEBATE_CREATE_RESTRICTION', 'TEMP_SUSPENSION', 'PERMANENT_SUSPENSION'].includes(sanction.type),
    ),
  isSuspended: () =>
    get().activeSanctions.some((sanction) =>
      ['TEMP_SUSPENSION', 'PERMANENT_SUSPENSION'].includes(sanction.type),
    ),
}));
