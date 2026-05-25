// Migrate data from local SQLite to Supabase (Postgres)
// Usage:
// 1) Create your Supabase project and run backend/supabase_schema.sql in the SQL editor.
// 2) Set environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// 3) Run: node migrate-to-supabase.js [path/to/logistics.db]

const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dbPath = process.argv[2] || './backend/logistics.db';
const sqlite = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB:', err.message);
    process.exit(1);
  }
});

function allAsync(query, params=[]) {
  return new Promise((resolve, reject) => {
    sqlite.all(query, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

function normalizeRowKeys(obj) {
  const out = {};
  Object.keys(obj).forEach(k => {
    out[k.toLowerCase()] = obj[k];
  });
  return out;
}

async function migrate() {
  try {
    console.log('Reading clients...');
    const clients = await allAsync('SELECT * FROM clients');
    if (clients && clients.length) {
      // Normalize keys to lowercase to match Postgres column names
      const mappedClients = clients.map(normalizeRowKeys);
      const res = await supabase.from('clients').upsert(mappedClients, { onConflict: 'id' });
      if (res.error) throw res.error;
      console.log(`Migrated ${clients.length} clients.`);
    }

    console.log('Reading dossiers...');
    const dossiers = await allAsync('SELECT * FROM dossiers');
    if (dossiers && dossiers.length) {
      const mappedDossiers = dossiers.map(normalizeRowKeys);
      const res = await supabase.from('dossiers').upsert(mappedDossiers, { onConflict: 'id' });
      if (res.error) throw res.error;
      console.log(`Migrated ${dossiers.length} dossiers.`);
    }

    console.log('Reading factures...');
    const factures = await allAsync('SELECT * FROM factures');
    if (factures && factures.length) {
      const mappedFactures = factures.map(normalizeRowKeys);

      // Ensure referenced dossiers exist in Supabase to avoid FK violations
      const dossierIds = Array.from(new Set(mappedFactures.map(f => f.dossier_id).filter(Boolean)));
      if (dossierIds.length) {
        const { data: existingDossiers } = await supabase.from('dossiers').select('id').in('id', dossierIds);
        const existingIds = (existingDossiers || []).map(d => d.id);
        const missingIds = dossierIds.filter(id => !existingIds.includes(id));
        if (missingIds.length) {
          console.log(`Found ${missingIds.length} missing dossiers referenced by factures. Attempting to migrate/create placeholders...`);
          for (const mid of missingIds) {
            // Try to fetch from local sqlite
            const local = await allAsync('SELECT * FROM dossiers WHERE id = ?', [mid]);
            if (local && local.length) {
              const toInsert = normalizeRowKeys(local[0]);
              const r = await supabase.from('dossiers').upsert([toInsert], { onConflict: 'id' });
              if (r.error) console.warn('Warning: could not upsert missing dossier', mid, r.error.message || r.error);
              else console.log('Inserted missing dossier from local DB:', mid);
            } else {
              // Create a minimal placeholder dossier so FK constraint is satisfied
              const placeholder = { id: mid, datecreation: new Date().toISOString().split('T')[0] };
              const r = await supabase.from('dossiers').upsert([placeholder], { onConflict: 'id' });
              if (r.error) console.warn('Warning: could not create placeholder dossier', mid, r.error.message || r.error);
              else console.log('Created placeholder dossier:', mid);
            }
          }
        }
      }

      // Postgres lower-cases unquoted identifiers, so use lowercase conflict column
      const conflictCol = 'numerofacture';

      // Upsert factures one by one to detect which row(s) cause FK violations
      let migratedCount = 0;
      for (const f of mappedFactures) {
        try {
          // normalize empty dossier_id to null to avoid FK errors
          if (f.hasOwnProperty('dossier_id') && (f.dossier_id === '' || f.dossier_id === undefined)) {
            f.dossier_id = null;
          }

          // ensure referenced dossier exists before inserting this facture
          if (f.dossier_id) {
            const { data: ddata, error: derr } = await supabase.from('dossiers').select('id').eq('id', f.dossier_id).limit(1);
            if (derr) throw derr;
            if (!ddata || ddata.length === 0) {
              // try to fetch from local sqlite
              const localD = await allAsync('SELECT * FROM dossiers WHERE id = ?', [f.dossier_id]);
              if (localD && localD.length) {
                const toInsert = normalizeRowKeys(localD[0]);
                const r = await supabase.from('dossiers').upsert([toInsert], { onConflict: 'id' });
                if (r.error) console.warn('Warning: could not upsert missing dossier for facture', f.numeroFacture, r.error.message || r.error);
                else console.log('Inserted missing dossier for facture:', f.numeroFacture, f.dossier_id);
              } else {
                const placeholder = { id: f.dossier_id, datecreation: new Date().toISOString().split('T')[0] };
                const r = await supabase.from('dossiers').upsert([placeholder], { onConflict: 'id' });
                if (r.error) console.warn('Warning: could not create placeholder dossier for facture', f.numeroFacture, r.error.message || r.error);
                else console.log('Created placeholder dossier for facture:', f.numeroFacture, f.dossier_id);
              }
            }
          }

          const res = await supabase.from('factures').upsert([f], { onConflict: conflictCol });
          if (res.error) {
            // log detailed error and continue
            console.error('Failed to upsert facture:', f.numeroFacture || JSON.stringify(f), 'error:', res.error.message || res.error);
          } else {
            migratedCount++;
          }
        } catch (err) {
          console.error('Exception while migrating facture', f.numeroFacture || JSON.stringify(f), err.message || err);
        }
      }

      console.log(`Migrated ${migratedCount} / ${factures.length} factures.`);
    }

    console.log('Reading facture_lignes...');
    const lignes = await allAsync('SELECT * FROM facture_lignes');
    if (lignes && lignes.length) {
      // Normalize keys and convert taxable numeric to boolean
      const mapped = lignes.map(r => {
        const n = normalizeRowKeys(r);
        if (n.hasOwnProperty('taxable')) n.taxable = n.taxable ? true : false;
        return n;
      });

      let migratedLignes = 0;
      for (const ln of mapped) {
        try {
          // normalize empty facture_id
          if (ln.hasOwnProperty('facture_id') && (ln.facture_id === '' || ln.facture_id === undefined)) {
            ln.facture_id = null;
          }

          if (!ln.facture_id) {
            console.warn('Skipping facture_ligne with empty facture_id', ln);
            continue;
          }

          // ensure parent facture exists
          const { data: fdata, error: fderr } = await supabase.from('factures').select('numerofacture').eq('numerofacture', ln.facture_id).limit(1);
          if (fderr) throw fderr;
          if (!fdata || fdata.length === 0) {
            console.warn('Skipping facture_ligne because parent facture missing in Supabase:', ln.facture_id);
            continue;
          }

          const r = await supabase.from('facture_lignes').upsert([ln], { onConflict: 'id' });
          if (r.error) {
            console.error('Failed to upsert facture_ligne:', JSON.stringify(ln), 'error:', r.error.message || r.error);
          } else {
            migratedLignes++;
          }
        } catch (err) {
          console.error('Exception while migrating facture_ligne', JSON.stringify(ln), err.message || err);
        }
      }

      console.log(`Migrated ${migratedLignes} / ${lignes.length} facture_lignes.`);
    }

    console.log('Migration complete.');
    sqlite.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message || err);
    sqlite.close();
    process.exit(1);
  }
}

migrate();
