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
  // Держим актуальный список items в ref чтобы обращаться из async-функций
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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
    const sid = sessionIdRef.current || sessionId;
    const item = itemsRef.current.find((i) => Number(i.id) === Number(itemId));

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (Number(i.id) === Number(itemId) ? { ...i, quantity } : i))
    );

    try {
      // Сервер требует все 4 параметра составного ключа YDB
      const params = new URLSearchParams({
        sessionId: sid,
        productId: String(item?.productId ?? ""),
        size: item?.size || "One Size",
        color: item?.color || "Default",
      });
      // Правильный путь: /cart/:id/quantity
      await api.patch(`/cart/${itemId}/quantity?${params.toString()}`, { quantity });
    } catch (e: any) {
      console.error("[Cart] updateQuantity error:", e?.response?.status, e?.response?.data);
      await fetchCart();
      return;
    }
    await fetchCart();
  };

  const removeItem = async (itemId: number) => {
    const sid = sessionIdRef.current || sessionId;
    const item = itemsRef.current.find((i) => Number(i.id) === Number(itemId));

    // Optimistic update — убираем мгновенно из UI
    setItems((prev) => prev.filter((i) => Number(i.id) !== Number(itemId)));

    try {
      // Сервер требует все 4 параметра составного ключа YDB как query params
      const params = new URLSearchParams({
        sessionId: sid,
        productId: String(item?.productId ?? ""),
        size: item?.size || "One Size",
        color: item?.color || "Default",
      });
      await api.delete(`/cart/${itemId}?${params.toString()}`);
      // Успешно — состояние уже обновлено оптимистично
    } catch (e: any) {
      const status = e?.response?.status;
      console.error(
        "[Cart] removeItem error:",
        "status:", status,
        "data:", JSON.stringify(e?.response?.data),
        "itemId:", itemId,
        "sessionId:", sid,
        "productId:", item?.productId,
        "size:", item?.size,
        "color:", item?.color
      );
      // 404 — товар уже удалён, всё ок
      if (status === 404) return;
      // Иная ошибка — восстанавливаем список с сервера
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
