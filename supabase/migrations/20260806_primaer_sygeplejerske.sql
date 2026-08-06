-- Migration: Primær sygeplejerske fra Monday (board_relation-felt, "Connect boards")
-- Monday API returnerer navnet/navnene på de koblede items i .text, som en
-- kommasepareret streng — samme mønster som de øvrige tekst-kolonner.
ALTER TABLE monday_kunder ADD COLUMN IF NOT EXISTS primaer_sygeplejerske text;
