import { create } from 'zustand';
import { cartAPI } from '../../../shared/api/customer-api';

interface CartState {
  itemCount: number;
  refreshCount: () => Promise<void>;
  setCount: (count: number) => void;
}

export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,

  refreshCount: async () => {
    try {
      const cart = await cartAPI.get();
      const items = cart?.items || [];
      const total = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      set({ itemCount: total });
    } catch {
      // Not logged in or error — keep current count
    }
  },

  setCount: (count) => set({ itemCount: count }),
}));
