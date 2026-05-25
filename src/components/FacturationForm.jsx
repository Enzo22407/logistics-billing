import React, { useState } from 'react';
import { API_BASE_URL } from '../api';
import { Plus, Trash2, Printer, Save, CheckCircle, Ship, MapPin, Box, Hash, User } from 'lucide-react';

const FacturationForm = ({ onCancel, editData }) => {
  const [availableDossiers, setAvailableDossiers] = useState([]);
  const [factureInfo, setFactureInfo] = useState({
    numeroFacture: 'Chargement...',
    date: new Date().toISOString().split('T')[0],
    dossierLie: '',
  });

  const [lignes, setLignes] = useState([
    { id: 1, description: '', quantite: 1, prixUnitaire: 0, taxable: true },
  ]);

  const fetchDossiers = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/dossiers`);
      if (data.length > 0 && !editData) {
        setFactureInfo(prev => ({ ...prev, dossierLie: data[0].id }));
      }
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    }
  };

  React.useEffect(() => {
    fetchDossiers();

    const fetchNextNumber = async () => {
      if (!editData) {
        const response = await fetch(`${API_BASE_URL}/api/next-facture-number/PRO`);
        const data = await response.json();
        setFactureInfo(prev => ({ ...prev, numeroFacture: data.number }));
      }
    };
    fetchNextNumber();

    if (editData) {
      const loadInvoiceData = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/factures/${editData.numeroFacture}`);
          const data = await response.json();
          if (data.factureInfo) {
            setFactureInfo({
              numeroFacture: data.factureInfo.numeroFacture,
              date: data.factureInfo.date,
              dossierLie: data.factureInfo.dossier_id || '',
            });
          }
          if (data.lignes) {
            setLignes(data.lignes.map((l, index) => ({
              id: l.id || index + 1,
              description: l.description,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              taxable: !!l.taxable
            })));
          }
        } catch (error) {
          console.error("Erreur lors du chargement des détails de la facture:", error);
        }
      };
      loadInvoiceData();
    }
  }, [editData]);

  const selectedDossier = availableDossiers.find(d => d.id === factureInfo.dossierLie) || {
    client_nom: '-',
    numBL: '-',
    navire: '-',
    origine: '-',
    destination: '-',
    natureMarchandise: '-',
    poids: '-',
    volume: '-',
    nombresColis: '-',
    client_id: null
  };

  const tvaRate = 0.18;

  const handleInfoChange = (e) => {
    setFactureInfo({ ...factureInfo, [e.target.name]: e.target.value });
  };

  const handleSave = async (statut = 'Proforma', customNumFacture = null) => {
    const payload = {
      factureInfo: {
        ...factureInfo,
        numeroFacture: customNumFacture || factureInfo.numeroFacture,
        client_id: selectedDossier.client_id,
        statut
      },
      lignes,
      totaux: {
        sousTotal,
        montantTva: montantTVA,
        totalTtc: totalTTC
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/factures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        alert(statut === 'Proforma' ? 'Proforma enregistrée avec succès !' : `Facture validée et enregistrée avec succès !`);
        if (onCancel) onCancel();
      } else {
        alert("Erreur lors de l'enregistrement de la facture.");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la facture:", error);
    }
  };

  const handleValidate = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/next-facture-number/FACT`);
      const data = await response.json();
      setFactureInfo(prev => ({ ...prev, numeroFacture: data.number }));
      handleSave('Validée', data.number);
    } catch (error) {
      console.error("Erreur lors de la génération du numéro de facture:", error);
    }
  };

  const updateLigne = (id, field, value) => {
    setLignes(lignes.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const addLigne = () => {
    const newId = lignes.length > 0 ? Math.max(...lignes.map(l => l.id)) + 1 : 1;
    setLignes([...lignes, { id: newId, description: '', quantite: 1, prixUnitaire: 0, taxable: true }]);
  };

  const removeLigne = (id) => {
    setLignes(lignes.filter(l => l.id !== id));
  };

  const calculateSousTotalHT = () => lignes.reduce((t, l) => t + (l.quantite * l.prixUnitaire), 0);
  const calculateTVA = () => lignes.reduce((t, l) => l.taxable ? t + (l.quantite * l.prixUnitaire * tvaRate) : t, 0);
  const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  const sousTotal = calculateSousTotalHT();
  const montantTVA = calculateTVA();
  const totalTTC = sousTotal + montantTVA;

  const isProforma = factureInfo.numeroFacture.startsWith('PRO');

  return (
    <div className="dashboard-page">
      <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Éditeur de Facture</h1>
          <p className="page-subtitle">Créez vos documents de facturation logistique</p>
        </div>
      </div>

      <div className="form-container" style={{
        maxWidth: '1000px',
        padding: '48px',
        border: '1px solid var(--border-color)',
        position: 'relative'
      }}>

        {/* --- EN-TÊTE --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>

          {/* Logo & Identité */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '12px',
              backgroundColor: 'var(--accent-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Ship size={32} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                F2N LOGISTICS
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                Commissionnaire Agréé
              </p>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                Zone Franche Industrielle, Dakar, Sénégal<br />
                Tél: +221 33 000 00 00 • NINEA: 000111222333
              </div>
            </div>
          </div>

          {/* Infos Facture */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'inline-block', padding: '8px 24px', borderRadius: '8px',
              border: `2px solid ${isProforma ? 'var(--text-secondary)' : 'var(--accent-primary)'}`,
              color: 'var(--text-primary)',
              fontWeight: '800', fontSize: '1.25rem', letterSpacing: '2px', alignSelf: 'flex-end'
            }}>
              {isProforma ? 'PROFORMA' : 'FACTURE'}
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <div style={{ textAlign: 'right' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Numéro</label>
                <input type="text" className="form-control" style={{ width: '160px', padding: '8px 12px', border: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'right' }} name="numeroFacture" value={factureInfo.numeroFacture} readOnly />
              </div>
              <div style={{ textAlign: 'right' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Date d'émission</label>
                <input type="date" className="form-control" style={{ width: '160px', padding: '8px 12px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', textAlign: 'right' }} name="date" value={factureInfo.date} onChange={handleInfoChange} disabled={!isProforma} />
              </div>
            </div>
          </div>
        </div>

        {/* --- CONTEXTE DU DOSSIER --- */}
        <div style={{
          display: 'flex', gap: '24px', marginBottom: '48px',
          border: '1px solid var(--border-color)', borderRadius: '8px', padding: '24px'
        }}>
          {/* Colonne Client */}
          <div style={{ flex: '1', borderRight: '1px solid var(--border-color)', paddingRight: '24px' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={16} /> Facturé à
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>{selectedDossier.client_nom}</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>NINEA: À renseigner</span>
            </div>
            {isProforma && (
              <div className="no-print">
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '16px', marginBottom: '4px' }}>Changer le Dossier Lié</label>
                <select className="form-control" style={{ width: '100%', padding: '8px 12px', fontSize: '0.9rem', border: '1px solid var(--border-color)' }} name="dossierLie" value={factureInfo.dossierLie} onChange={handleInfoChange}>
                  <option value="">Sélectionner un dossier...</option>
                  {availableDossiers.map(d => (
                    <option key={d.id} value={d.id}>{d.id} - {d.natureMarchandise}</option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ display: 'none', marginTop: '16px' }} className="print-only">
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dossier Lié</label>
              <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{factureInfo.dossierLie}</span>
            </div>
          </div>

          {/* Colonne Expédition */}
          <div style={{ flex: '2' }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={16} /> Détails de l'Expédition
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Hash size={12} /> B/L / LTA</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{selectedDossier.numBL}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Ship size={12} /> Navire / Voyage</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{selectedDossier.navire} {selectedDossier.numVoyage ? `/ V.${selectedDossier.numVoyage}` : ''}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} /> Routage</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{selectedDossier.origine} ➔ {selectedDossier.destination}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Box size={12} /> Poids / Volume / Colis</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>{selectedDossier.poids} kg / {selectedDossier.volume} CBM / {selectedDossier.nombresColis}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- LIGNES DE FACTURE --- */}
        <div style={{ marginBottom: '32px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} className="data-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)' }}>Désignation des Frais</th>
                <th style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)' }}>Qté</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)' }}>Prix Unitaire</th>
                <th className="no-print" style={{ textAlign: 'center', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)' }}>TVA</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', borderBottom: '2px solid var(--border-color)' }}>Montant Total</th>
                <th className="no-print" style={{ width: '40px', borderBottom: '2px solid var(--border-color)' }}></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.id}>
                  <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <input type="text" className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid transparent', fontWeight: '500' }} value={ligne.description} onChange={(e) => updateLigne(ligne.id, 'description', e.target.value)} placeholder="Description..." readOnly={!isProforma} />
                  </td>
                  <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <input type="number" className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid transparent', textAlign: 'center', fontWeight: '500' }} value={ligne.quantite} onChange={(e) => updateLigne(ligne.id, 'quantite', parseFloat(e.target.value) || 0)} readOnly={!isProforma} />
                  </td>
                  <td style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <input type="number" className="form-control" style={{ width: '100%', padding: '8px', border: '1px solid transparent', textAlign: 'right', fontWeight: '500' }} value={ligne.prixUnitaire} onChange={(e) => updateLigne(ligne.id, 'prixUnitaire', parseFloat(e.target.value) || 0)} readOnly={!isProforma} />
                  </td>
                  <td className="no-print" style={{ padding: '8px 16px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    <input type="checkbox" checked={ligne.taxable} onChange={(e) => updateLigne(ligne.id, 'taxable', e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-secondary)' }} disabled={!isProforma} />
                  </td>
                  <td style={{ padding: '8px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)' }}>
                    {formatCurrency(ligne.quantite * ligne.prixUnitaire)}
                  </td>
                  <td className="no-print" style={{ padding: '8px 16px', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    {isProforma && (
                      <button type="button" onClick={() => removeLigne(ligne.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {isProforma && (
            <button type="button" className="btn btn-outline no-print" onClick={addLigne} style={{ marginTop: '16px' }}>
              <Plus size={16} /> Ajouter une ligne
            </button>
          )}
        </div>

        {/* --- RÉSUMÉ FINANCIER --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

          <div style={{ width: '45%', color: 'var(--text-secondary)', fontSize: '0.85rem', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px' }}>
            <p style={{ marginBottom: '8px', color: 'var(--text-primary)' }}><strong>Conditions de paiement :</strong></p>
            <p>Paiement à réception de la facture par chèque ou virement bancaire.<br /><br />
              <strong>Banque BICIS</strong><br />
              IBAN: SN010 01234 000000123456 78<br />
              Code SWIFT: BICISNXXXX</p>
          </div>

          <div style={{ width: '380px', border: '2px solid var(--border-color)', borderRadius: '8px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sous-total HT</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(sousTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>TVA (18%)</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{formatCurrency(montantTVA)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '2px solid var(--border-color)', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              <span>TOTAL TTC</span>
              <span>{formatCurrency(totalTTC)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* --- BOUTONS D'ACTION (Hors Document) --- */}
      <div className="form-actions no-print" style={{ maxWidth: '1000px', margin: '24px auto 0 auto', borderTop: 'none', padding: '0', display: 'flex', justifyContent: 'space-between' }}>
        <button type="button" className="btn btn-outline" onClick={() => window.print()}>
          <Printer size={18} />
          Imprimer / PDF
        </button>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button type="button" className="btn btn-outline" onClick={() => handleSave('Proforma')}>
            <Save size={18} />
            Enregistrer Proforma
          </button>
          {!isProforma ? (
            <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>
              <CheckCircle size={18} /> Facture Validée
            </div>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleValidate}>
              <CheckCircle size={18} />
              Valider la Facture
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

export default FacturationForm;
