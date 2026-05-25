const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

const dbPath = process.argv[2] || './logistics.db';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const sqlite = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open SQLite DB:', err.message);
    process.exit(1);
  }
});

function allAsync(query, params = []) {
  return new Promise((resolve, reject) => {
    sqlite.all(query, params, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });
}

(async function run() {
  try {
    const factures = await allAsync('SELECT numeroFacture, dossier_id FROM factures');
    console.log(`Local factures count: ${factures.length}`);

    const dossierMap = new Map();
    factures.forEach(f => {
      if (f.dossier_id) {
        const list = dossierMap.get(f.dossier_id) || [];
        list.push(f.numeroFacture);
        dossierMap.set(f.dossier_id, list);
      }
    });

    const dossierIds = Array.from(dossierMap.keys());
    if (dossierIds.length === 0) {
      console.log('No dossier_id references found in local factures.');
      process.exit(0);
    }

    // Query Supabase for existing dossiers
    const chunkSize = 100;
    let existing = [];
    for (let i = 0; i < dossierIds.length; i += chunkSize) {
      const chunk = dossierIds.slice(i, i + chunkSize);
      const { data, error } = await supabase.from('dossiers').select('id').in('id', chunk);
      if (error) throw error;
      existing = existing.concat((data || []).map(d => d.id));
    }

    const missing = dossierIds.filter(id => !existing.includes(id));
    console.log(`Referenced dossiers: ${dossierIds.length}, existing in Supabase: ${existing.length}, missing: ${missing.length}`);

    if (missing.length) {
      console.log('Missing dossier IDs and their local factures:');
      missing.forEach(id => {
        console.log(`- ${id} referenced by factures: ${dossierMap.get(id).join(', ')}`);
      });

      console.log('\nAttempting to show local dossier rows for the missing IDs (if any):');
      for (const id of missing) {
        const rows = await allAsync('SELECT * FROM dossiers WHERE id = ?', [id]);
        if (rows && rows.length) console.log(JSON.stringify(rows[0], null, 2));
        else console.log(`No local dossier row found for id=${id}`);
      }
    } else {
      console.log('No missing dossiers — all referenced dossiers exist in Supabase.');
    }

    sqlite.close();
    process.exit(0);
  } catch (err) {
    console.error('Diagnostic error:', err.message || err);
    sqlite.close();
    process.exit(1);
  }
})();
