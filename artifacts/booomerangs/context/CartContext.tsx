import React, { createContext, useContext, useEffect, useRef, useState } from "react";
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
  const sessionIdRef = useRef("");

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
    sessionIdRef.current = sid;
    setSessionId(sid);
  };

  useEffect(() => {
    if (sessionId) {
      fetchCart();
    }
  }, [sessionId]);

  const fetchCart = async () => {
    const sid = sessionIdRef.current || sessionId;
    if (!sid) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/cart/${sid}`);
      const data = res.data;
      const cartItems: CartItem[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
        ? data.items
        : [];
      setItems(cartItems);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: number, size?: string, color?: string, quantity = 1) => {
    const sid = sessionIdRef.current || sessionId;
    await api.post("/cart", { sessionId: sid, productId, size, color, quantity });
    await fetchCart();
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    // Optimistic update (сравниваем через Number, т.к. id может прийти строкой)
    setItems((prev) =>
      prev.map((item) => (Number(item.id) === Number(itemId) ? { ...item, quantity } : item))
    );
    try {
      await api.patch(`/cart/${itemId}`, { quantity });
    } catch (e: any) {
      console.error("[Cart] updateQuantity error:", e?.response?.status, e?.response?.data);
    }
    await fetchCart();
  };

  const removeItem = async (itemId: number) => {
    const sid = sessionIdRef.current || sessionId;
    // Optimistic update — убираем сразу из UI без ожидания сервера
    setItems((prev) => prev.filter((item) => Number(item.id) !== Number(itemId)));
    try {
      await api.delete(`/cart/${itemId}`, {
        params: { sessionId: sid },
        data: { sessionId: sid },
      });
      // Успех — состояние уже обновлено оптимистично, не перезагружаем
    } catch (e: any) {
      const status = e?.response?.status;
      console.error(
        "[Cart] removeItem error:",
        "status:", status,
        "data:", JSON.stringify(e?.response?.data),
        "itemId:", itemId,
        "sessionId:", sid
      );
      // 404 — товар уже удалён на сервере, всё ок
      if (status === 404) return;
      // Иная ошибка сервера — восстанавливаем список из сервера
      await fetchCart();
    }
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
