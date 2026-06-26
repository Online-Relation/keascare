// src/features/favoritter/hooks/useFavoritter/useFavoritter.ts

'use client';

import { useEffect, useState, useCallback } from 'react';

export type FavoritBosted = {
  id: string;
  navn: string;
  kommune: string | null;
  fundNiveau: string | null;
  rapportDato: string | null;
};

const STORAGE_KEY = 'keascare_favoritter';

function læsFavoritter(): FavoritBosted[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function gemFavoritter(favoritter: FavoritBosted[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritter));
}

export function useFavoritter() {
  const [favoritter, setFavoritter] = useState<FavoritBosted[]>([]);

  useEffect(() => {
    setFavoritter(læsFavoritter());
  }, []);

  const erFavorit = useCallback(
    (id: string) => favoritter.some((f) => f.id === id),
    [favoritter]
  );

  const tilføjFavorit = useCallback((bosted: FavoritBosted) => {
    setFavoritter((prev) => {
      if (prev.some((f) => f.id === bosted.id)) return prev;
      const næste = [...prev, bosted];
      gemFavoritter(næste);
      return næste;
    });
  }, []);

  const fjernFavorit = useCallback((id: string) => {
    setFavoritter((prev) => {
      const næste = prev.filter((f) => f.id !== id);
      gemFavoritter(næste);
      return næste;
    });
  }, []);

  const toggleFavorit = useCallback(
    (bosted: FavoritBosted) => {
      if (erFavorit(bosted.id)) {
        fjernFavorit(bosted.id);
      } else {
        tilføjFavorit(bosted);
      }
    },
    [erFavorit, fjernFavorit, tilføjFavorit]
  );

  return { favoritter, erFavorit, toggleFavorit, fjernFavorit, antal: favoritter.length };
}
