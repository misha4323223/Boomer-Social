import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { CartItem } from "@/lib/types";
import { getOrCreateSessionId } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";

interface CartContextValue {
  items: CartItem[];
  sessionId: string;
  isLoading: boolean;
  totalCount: number;
  refetch: () => Promise<void>;
  addToCart: (productId: number, size?: string, color?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  sessionId: "",
  isLoading: false,
  totalCount: 0,
  refetch: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    initSession();
  }, [user]);

  const initSession = async () => {
    let sid: string;
    if (user) {
      sid = `user_${user.id}`;
    } else {
      sid = await getOrCreateSessionId();
    }
    setSessionId(sid);
  };

  useEffect(() => {
    if (sessionId) {
      fetchCart();
    }
  }, [sessionId]);

  const fetchCart = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/cart/${sessionId}`);
      setItems(res.data?.items ?? res.data ?? []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: number, size?: string, color?: string, quantity = 1) => {
    await api.post("/cart", { sessionId, productId, size, color, quantity });
    await fetchCart();
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    await api.patch(`/cart/${itemId}`, { quantity });
    await fetchCart();
  };

  const removeItem = async (itemId: number) => {
    await api.delete(`/cart/${itemId}`);
    await fetchCart();
  };

  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{
      items,
      sessionId,
      isLoading,
      totalCount,
      refetch: fetchCart,
      addToCart,
      updateQuantity,
      removeItem,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
