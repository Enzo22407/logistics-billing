const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const { createClient } = require('@supabase/supabase-js');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'logistics.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());

let db = null;

// Supabase detection
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const useSupabase = !!SUPABASE_URL;
let supabase = null;

if (useSupabase) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Using Supabase as the primary database.');
} else {
  // Initialize SQLite if Supabase not configured
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Erreur lors de l\'ouverture de la base de données', err.message);
    } else {
      console.log('Connecté à la base de données SQLite.');

      // Création des tables
      db.serialize(() => {
        // Table Clients/Partenaires
        db.run(`CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL,
          nom TEXT NOT NULL,
          nif TEXT,
          rccm TEXT,
          contact TEXT,
          email TEXT,
          tel TEXT,
          adresse TEXT,
          ville TEXT
        )`);

        // Table Dossiers (Expéditions)
        db.run(`CREATE TABLE IF NOT EXISTS dossiers (
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
          client_id INTEGER,
          expediteur TEXT,
          natureMarchandise TEXT,
          nombresColis TEXT,
          typeConteneur TEXT,
          poids TEXT,
          volume TEXT,
          valeurMarchandise TEXT,
          dateCreation TEXT,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )`);

        // Migration : ajouter la colonne dateCreation si la table existe déjà
        db.run(`ALTER TABLE dossiers ADD COLUMN dateCreation TEXT`, (err) => {
          // Ignorer l'erreur si la colonne existe déjà
        });

        // Table Factures
        db.run(`CREATE TABLE IF NOT EXISTS factures (
          numeroFacture TEXT PRIMARY KEY,
          date TEXT,
          dossier_id TEXT,
          client_id INTEGER,
          statut TEXT,
          sousTotal REAL,
          montantTva REAL,
          totalTtc REAL,
          FOREIGN KEY (dossier_id) REFERENCES dossiers(id),
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )`);

        // Table Lignes de Facture
        db.run(`CREATE TABLE IF NOT EXISTS facture_lignes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          facture_id TEXT,
          description TEXT,
          quantite REAL,
          prixUnitaire REAL,
          taxable BOOLEAN,
          FOREIGN KEY (facture_id) REFERENCES factures(numeroFacture)
        )`);

        console.log('Tables initialisées.');
      });
    }
  });

  // expose db for legacy handlers
  app.locals.db = db;
}

// Helper to normalize keys to lowercase
function normalizeKeys(obj) {
  const out = {};
  Object.keys(obj || {}).forEach(k => {
    out[k.toLowerCase()] = obj[k];
  });
  return out;
}

// ==========================================
// ROUTES API
// ==========================================

app.get('/', (req, res) => {
  res.send('API Backend F2N Logistics en ligne.');
});

// --- CLIENTS ---
app.get('/api/clients', (req, res) => {
  if (useSupabase) {
    supabase.from('clients').select('*').then(({ data, error }) => {
      if (error) return res.status(500).json({ error: error.message || error });
      res.json(data || []);
    });
  } else {
    db.all("SELECT * FROM clients", [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

app.post('/api/clients', (req, res) => {
  const payload = normalizeKeys(req.body);
  if (useSupabase) {
    supabase.from('clients').insert([payload]).then(({ data, error }) => {
      if (error) return res.status(500).json({ error: error.message || error });
      res.json({ id: data && data[0] && data[0].id, message: 'Client ajouté avec succès' });
    });
  } else {
    const { type, nom, nif, rccm, contact, email, tel, adresse, ville } = req.body;
    const query = `INSERT INTO clients (type, nom, nif, rccm, contact, email, tel, adresse, ville) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.run(query, [type, nom, nif, rccm, contact, email, tel, adresse, ville], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: "Client ajouté avec succès" });
    });
  }
});

app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const payload = normalizeKeys(req.body);
  if (useSupabase) {
    supabase.from('clients').update(payload).eq('id', id).then(({ data, error }) => {
      if (error) return res.status(500).json({ error: error.message || error });
      res.json({ message: 'Client mis à jour avec succès' });
    });
  } else {
    const { type, nom, nif, rccm, contact, email, tel, adresse, ville } = req.body;
    const query = `UPDATE clients SET type = ?, nom = ?, nif = ?, rccm = ?, contact = ?, email = ?, tel = ?, adresse = ?, ville = ? WHERE id = ?`;
    db.run(query, [type, nom, nif, rccm, contact, email, tel, adresse, ville, id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Client mis à jour avec succès" });
    });
  }
});

app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  if (useSupabase) {
    supabase.from('clients').delete().eq('id', id).then(({ error }) => {
      if (error) return res.status(500).json({ error: error.message || error });
      res.json({ message: 'Client supprimé avec succès' });
    });
  } else {
    db.run("DELETE FROM clients WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Client supprimé avec succès" });
    });
  }
});

// --- DOSSIERS ---
app.get('/api/dossiers', (req, res) => {
  if (useSupabase) {
    // fetch dossiers and clients then merge client names
    Promise.all([
      supabase.from('dossiers').select('*'),
      supabase.from('clients').select('id,nom')
    ]).then(([dRes, cRes]) => {
      if (dRes.error) return res.status(500).json({ error: dRes.error.message || dRes.error });
      if (cRes.error) return res.status(500).json({ error: cRes.error.message || cRes.error });
      const clientsMap = {};
      (cRes.data || []).forEach(c => { clientsMap[c.id] = c.nom; });
      const out = (dRes.data || []).map(d => ({ ...d, client_nom: clientsMap[d.client_id] || null }));
      res.json(out);
    });
  } else {
    const query = `
      SELECT d.*, c.nom as client_nom 
      FROM dossiers d 
      LEFT JOIN clients c ON d.client_id = c.id
    `;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

app.post('/api/dossiers', (req, res) => {
  // Simplification : on s'attend à un objet complet dans le body
  const data = req.body;
  const prefix = data.typeOperation === 'Import' ? 'IMP' : data.typeOperation === 'Export' ? 'EXP' : 'TRS';
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;
  if (useSupabase) {
    (async () => {
      try {
        const { data: last, error } = await supabase.from('dossiers').select('id').like('id', pattern).order('id', { ascending: false }).limit(1);
        if (error) return res.status(500).json({ error: error.message || error });
        let nextNum = 1;
        if (last && last.length) {
          const parts = last[0].id.split('-');
          const lastNum = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        const id = data.id || `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`;
        const payload = normalizeKeys(data);
        payload.id = id;
        payload.datecreation = payload.datecreation || new Date().toISOString().split('T')[0];
        const { error: insErr } = await supabase.from('dossiers').insert([payload]);
        if (insErr) return res.status(500).json({ error: insErr.message || insErr });
        res.json({ id: id, message: 'Dossier créé avec succès' });
      } catch (err) {
        res.status(500).json({ error: err.message || err });
      }
    })();
  } else {
    // Calculer le prochain numéro de dossier de manière fiable basé sur la DB
    db.get(`SELECT id FROM dossiers WHERE id LIKE ? ORDER BY id DESC LIMIT 1`, [pattern], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      let nextNum = 1;
      if (row) {
        const parts = row.id.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }

      const id = data.id || `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`;

      const query = `INSERT INTO dossiers (
        id, typeOperation, modeTransport, numBL, incoterm, compagnie, navire, numVoyage, 
        etd, eta, origine, destination, client_id, expediteur, natureMarchandise, 
        nombresColis, typeConteneur, poids, volume, valeurMarchandise, dateCreation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        id, data.typeOperation, data.modeTransport, data.numBL, data.incoterm,
        data.compagnie, data.navire, data.numVoyage, data.etd, data.eta,
        data.origine, data.destination, data.client_id, data.expediteur,
        data.natureMarchandise, data.nombresColis, data.typeConteneur,
        data.poids, data.volume, data.valeurMarchandise,
        data.dateCreation || new Date().toISOString().split('T')[0]
      ];

      db.run(query, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: id, message: "Dossier créé avec succès" });
      });
    });
  }
});

app.put('/api/dossiers/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (useSupabase) {
    const payload = normalizeKeys(data);
    supabase.from('dossiers').update(payload).eq('id', id).then(({ error }) => {
      if (error) return res.status(500).json({ error: error.message || error });
      res.json({ message: 'Dossier mis à jour avec succès' });
    });
  } else {
    const query = `UPDATE dossiers SET typeOperation = ?, modeTransport = ?, numBL = ?, incoterm = ?, compagnie = ?, navire = ?, numVoyage = ?, etd = ?, eta = ?, origine = ?, destination = ?, client_id = ?, expediteur = ?, natureMarchandise = ?, nombresColis = ?, typeConteneur = ?, poids = ?, volume = ?, valeurMarchandise = ? WHERE id = ?`;
    const params = [
      data.typeOperation, data.modeTransport, data.numBL, data.incoterm,
      data.compagnie, data.navire, data.numVoyage, data.etd, data.eta,
      data.origine, data.destination, data.client_id, data.expediteur,
      data.natureMarchandise, data.nombresColis, data.typeConteneur,
      data.poids, data.volume, data.valeurMarchandise, id
    ];
    db.run(query, params, function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Dossier mis à jour avec succès" });
    });
  }
});

app.delete('/api/dossiers/:id', (req, res) => {
  const { id } = req.params;
  if (useSupabase) {
    supabase.from('dossiers').delete().eq('id', id).then(({ error }) => {
      if (error) return res.status(500).json({ error: error.message || error });
      res.json({ message: 'Dossier supprimé avec succès' });
    });
  } else {
    db.run("DELETE FROM dossiers WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Dossier supprimé avec succès" });
    });
  }
});

// Endpoint pour obtenir le prochain numéro de facture ou proforma séquentiel
app.get('/api/next-facture-number/:type', (req, res) => {
  const { type } = req.params; // 'PRO' ou 'FACT'
  const year = new Date().getFullYear();
  const pattern = `${type}-${year}-%`;
  if (useSupabase) {
    (async () => {
      try {
        const { data, error } = await supabase.from('factures').select('numeroFacture').like('numeroFacture', pattern).order('numeroFacture', { ascending: false }).limit(1);
        if (error) return res.status(500).json({ error: error.message || error });
        let nextNum = 1;
        if (data && data.length) {
          const parts = data[0].numeroFacture.split('-');
          const lastNum = parseInt(parts[parts.length - 1]);
          if (!isNaN(lastNum)) nextNum = lastNum + 1;
        }
        const number = `${type}-${year}-${String(nextNum).padStart(3, '0')}`;
        res.json({ number });
      } catch (err) {
        res.status(500).json({ error: err.message || err });
      }
    })();
  } else {
    db.get(`SELECT numeroFacture FROM factures WHERE numeroFacture LIKE ? ORDER BY numeroFacture DESC LIMIT 1`, [pattern], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      let nextNum = 1;
      if (row) {
        const parts = row.numeroFacture.split('-');
        const lastNum = parseInt(parts[parts.length - 1]);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }

      const number = `${type}-${year}-${String(nextNum).padStart(3, '0')}`;
      res.json({ number });
    });
  }
});

// --- FACTURES ---
app.get('/api/factures', (req, res) => {
  if (useSupabase) {
    Promise.all([
      supabase.from('factures').select('*'),
      supabase.from('clients').select('id,nom')
    ]).then(([fRes, cRes]) => {
      if (fRes.error) return res.status(500).json({ error: fRes.error.message || fRes.error });
      if (cRes.error) return res.status(500).json({ error: cRes.error.message || cRes.error });
      const clientsMap = {};
      (cRes.data || []).forEach(c => { clientsMap[c.id] = c.nom; });
      const out = (fRes.data || []).map(f => ({ ...f, client_nom: clientsMap[f.client_id] || null }));
      res.json(out);
    });
  } else {
    const query = `
      SELECT f.*, c.nom as client_nom 
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
    `;
    db.all(query, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
});

app.get('/api/factures/:numeroFacture', (req, res) => {
  const { numeroFacture } = req.params;
  if (useSupabase) {
    (async () => {
      try {
        const { data: fdata, error: ferr } = await supabase.from('factures').select('*').eq('numeroFacture', numeroFacture).limit(1);
        if (ferr) return res.status(500).json({ error: ferr.message || ferr });
        const facture = (fdata && fdata[0]) || null;
        if (!facture) return res.status(404).json({ error: 'Facture non trouvée' });
        const { data: lignes, error: lerr } = await supabase.from('facture_lignes').select('*').eq('facture_id', numeroFacture);
        if (lerr) return res.status(500).json({ error: lerr.message || lerr });
        res.json({ factureInfo: facture, lignes: lignes || [] });
      } catch (err) {
        res.status(500).json({ error: err.message || err });
      }
    })();
  } else {
    const queryFacture = `
      SELECT f.*, c.nom as client_nom 
      FROM factures f
      LEFT JOIN clients c ON f.client_id = c.id
      WHERE f.numeroFacture = ?
    `;
    db.get(queryFacture, [numeroFacture], (err, facture) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!facture) return res.status(404).json({ error: "Facture non trouvée" });

      db.all("SELECT * FROM facture_lignes WHERE facture_id = ?", [numeroFacture], (err, lignes) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ factureInfo: facture, lignes });
      });
    });
  }
});

app.delete('/api/factures/:numeroFacture', (req, res) => {
  const { numeroFacture } = req.params;
  if (useSupabase) {
    (async () => {
      try {
        await supabase.from('facture_lignes').delete().eq('facture_id', numeroFacture);
        await supabase.from('factures').delete().eq('numeroFacture', numeroFacture);
        res.json({ message: 'Facture supprimée avec succès' });
      } catch (err) {
        res.status(500).json({ error: err.message || err });
      }
    })();
  } else {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      db.run("DELETE FROM facture_lignes WHERE facture_id = ?", [numeroFacture], (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
      });
      db.run("DELETE FROM factures WHERE numeroFacture = ?", [numeroFacture], (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }
        db.run("COMMIT");
        res.json({ message: "Facture supprimée avec succès" });
      });
    });
  }
});

app.post('/api/factures', (req, res) => {
  const { factureInfo, lignes, totaux } = req.body;
  if (useSupabase) {
    (async () => {
      try {
        const info = normalizeKeys(factureInfo || {});
        // convert empty dossier to null
        if (info.dossierlie === '') info.dossierlie = null;
        const facturePayload = {
          numeroFacture: info.numerofacture || info.numeroFacture || info.numero || null,
          date: info.date || new Date().toISOString().split('T')[0],
          dossier_id: info.dossierlie || info.dossier_id || null,
          client_id: info.client_id || null,
          statut: info.statut || null,
          soustotal: (totaux && totaux.sousTotal) || (totaux && totaux.soustotal) || null,
          montanttva: (totaux && totaux.montantTva) || (totaux && totaux.montanttva) || null,
          totalttc: (totaux && totaux.totalTtc) || (totaux && totaux.totalttc) || null
        };

        // upsert facture header
        const { error: upErr } = await supabase.from('factures').upsert([facturePayload], { onConflict: 'numerofacture' });
        if (upErr) return res.status(500).json({ error: upErr.message || upErr });

        // delete old lines
        const numero = facturePayload.numeroFacture;
        await supabase.from('facture_lignes').delete().eq('facture_id', numero);

        if (!lignes || lignes.length === 0) {
          return res.json({ numeroFacture: numero, message: 'Facture enregistrée avec succès (sans lignes)' });
        }

        const mapped = (lignes || []).map(l => {
          const n = normalizeKeys(l);
          return {
            facture_id: numero,
            description: n.description || null,
            quantite: n.quantite || n.quantite === 0 ? n.quantite : null,
            prixunitaire: n.prixunitaire || n.prixUnitaire || null,
            taxable: !!n.taxable
          };
        });

        const { error: liErr } = await supabase.from('facture_lignes').insert(mapped);
        if (liErr) return res.status(500).json({ error: liErr.message || liErr });

        return res.json({ numeroFacture: numero, message: 'Facture enregistrée avec succès' });
      } catch (err) {
        console.error('Erreur insertion facture supabase:', err);
        return res.status(500).json({ error: err.message || err });
      }
    })();
  } else {
    const { numeroFacture, date, dossierLie, client_id, statut } = factureInfo;

    // Étape 1 : Upsert (INSERT OR REPLACE) l'en-tête de la facture
    // INSERT OR REPLACE évite l'erreur UNIQUE constraint si la proforma existe déjà
    const queryFacture = `INSERT OR REPLACE INTO factures 
      (numeroFacture, date, dossier_id, client_id, statut, sousTotal, montantTva, totalTtc) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    // Convert empty string dossierLie to null for database insertion if no dossier is linked
    const finalDossierLie = dossierLie === '' ? null : dossierLie;

    db.run(queryFacture, [numeroFacture, date, finalDossierLie, client_id, statut, totaux.sousTotal, totaux.montantTva, totaux.totalTtc], function (err) {
      if (err) {
        console.error('Erreur insertion facture:', err.message);
        return res.status(500).json({ error: err.message });
      }

      // Étape 2 : Supprimer les anciennes lignes puis ré-insérer (pour la mise à jour)
      db.run("DELETE FROM facture_lignes WHERE facture_id = ?", [numeroFacture], (deleteErr) => {
        if (deleteErr) {
          console.error('Erreur suppression lignes:', deleteErr.message);
          return res.status(500).json({ error: deleteErr.message });
        }

        if (!lignes || lignes.length === 0) {
          return res.json({ numeroFacture, message: "Facture enregistrée avec succès (sans lignes)" });
        }

        const stmt = db.prepare(`INSERT INTO facture_lignes (facture_id, description, quantite, prixUnitaire, taxable) VALUES (?, ?, ?, ?, ?)`);
        let insertError = null;
        lignes.forEach(ligne => {
          if (!insertError) {
            stmt.run([numeroFacture, ligne.description, ligne.quantite, ligne.prixUnitaire, ligne.taxable ? 1 : 0], (lineErr) => {
              if (lineErr) insertError = lineErr;
            });
          }
        });

        stmt.finalize((finalErr) => {
          if (finalErr || insertError) {
            console.error('Erreur insertion lignes:', (finalErr || insertError).message);
            return res.status(500).json({ error: (finalErr || insertError).message });
          }
          return res.json({ numeroFacture, message: "Facture enregistrée avec succès" });
        });
      });
    });
  }
});

// En production, servir le build frontend depuis dist
const distPath = path.join(__dirname, '..', 'dist');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Démarrage du serveur
// If run directly, start the server; otherwise export app for serverless wrapper
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur Backend en cours d'exécution sur le port ${PORT}`);
  });
} else {
  module.exports = app;
}
