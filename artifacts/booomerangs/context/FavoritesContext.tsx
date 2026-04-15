import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Product } from "@/lib/types";

interface FavoritesContextValue {
  favorites: Product[];
  isFavorite: (id: number) => boolean;
  toggle: (product: Product) => void;
}

const FavoritesContext = createContext<FavoritesContextValue>({
  favorites: [],
  isFavorite: () => false,
  toggle: () => {},
});

const STORAGE_KEY = "booomerangs_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) setFavorites(JSON.parse(data));
    });
  }, []);

  const save = (items: Product[]) => {
    setFavorites(items);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  };

  const isFavorite = (id: number) => favorites.some((f) => f.id === id);

  const toggle = (product: Product) => {
    if (isFavorite(product.id)) {
      save(favorites.filter((f) => f.id !== product.id));
    } else {
      save([...favorites, product]);
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}
