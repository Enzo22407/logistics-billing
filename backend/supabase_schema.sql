-- Supabase / Postgres schema for logistics-billing
-- Run this in Supabase SQL editor or psql to create tables

CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  nom TEXT NOT NULL,
  nif TEXT,
  rccm TEXT,
  contact TEXT,
  email TEXT,
  tel TEXT,
  adresse TEXT,
  ville TEXT
);

CREATE TABLE IF NOT EXISTS dossiers (
  id TEXT PRIMARY KEY,
  typeOperation TEXT,
  modeTransport TEXT,
  numBL TEXT,
  incoterm TEXT,
  compagnie TEXT,
  navire TEXT,
  numVoyage TEXT,
  etd TEXT,
  eta TEXT,
  origine TEXT,
  destination TEXT,
  client_id INTEGER REFERENCES clients(id),
  expediteur TEXT,
  natureMarchandise TEXT,
  nombresColis TEXT,
  typeConteneur TEXT,
  poids TEXT,
  volume TEXT,
  valeurMarchandise TEXT,
  dateCreation TEXT
);

CREATE TABLE IF NOT EXISTS factures (
  numeroFacture TEXT PRIMARY KEY,
  date TEXT,
  dossier_id TEXT REFERENCES dossiers(id),
  client_id INTEGER REFERENCES clients(id),
  statut TEXT,
  sousTotal NUMERIC,
  montantTva NUMERIC,
  totalTtc NUMERIC
);

CREATE TABLE IF NOT EXISTS facture_lignes (
  id SERIAL PRIMARY KEY,
  facture_id TEXT REFERENCES factures(numeroFacture),
  description TEXT,
  quantite NUMERIC,
  prixUnitaire NUMERIC,
  taxable BOOLEAN
);
