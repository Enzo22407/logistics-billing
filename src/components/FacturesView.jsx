import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api';
import { Plus, Search, FileText, Trash2, Eye, Calendar, DollarSign, Layers } from 'lucide-react';

const FacturesView = ({ onCreateFacture, onViewFacture }) => {
  const [factures, setFactures] = useState([]);
  const [search, setSearch] = useState('');

  const fetchFactures = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/factures`);
      const data = await response.json();
      setFactures(data);
    } catch (error) {
      console.error('Erreur lors du chargement des factures:', error);
    }
  };

  useEffect(() => {
    fetchFactures();
  }, []);

  const handleDelete = async (numeroFacture) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la facture ${numeroFacture} ?`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/factures/${numeroFacture}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchFactures();
        } else {
          alert('Erreur lors de la suppression.');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de la facture:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  };

  // Filtrer les factures
  const filteredFactures = factures.filter(f => 
    f.numeroFacture.toLowerCase().includes(search.toLowerCase()) ||
    (f.client_nom && f.client_nom.toLowerCase().includes(search.toLowerCase())) ||
    (f.dossier_id && f.dossier_id.toLowerCase().includes(search.toLowerCase()))
  );

  // Totaux statistiques
  const totalCA = factures.filter(f => f.statut === 'Validée').reduce((sum, f) => sum + f.totalTtc, 0);
  const totalProforma = factures.filter(f => f.statut === 'Proforma').reduce((sum, f) => sum + f.totalTtc, 0);

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Facturation</h1>
          <p className="page-subtitle">Gérez et éditez vos factures et proformas logistiques</p>
        </div>
        <button className="btn btn-primary" onClick={onCreateFacture}>
          <Plus size={18} />
          Créer un Document
        </button>
      </div>

      {/* Stats rapides */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: 1, padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DollarSign size={20} color="var(--accent-primary)" />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(totalCA)}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Chiffre d'Affaires</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layers size={20} color="var(--accent-secondary)" />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formatCurrency(totalProforma)}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Proformas Émises</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={20} color="var(--accent-warning)" />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{factures.length}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Documents</span>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div className="search-bar" style={{ width: '100%', maxWidth: '400px' }}>
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Rechercher une facture (N°, client, dossier)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau des Factures */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Document</th>
              <th>Date</th>
              <th>Type</th>
              <th>Client</th>
              <th>Dossier Lié</th>
              <th style={{ textAlign: 'right' }}>Montant TTC</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFactures.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                  <div>
                    <FileText size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ fontSize: '1rem', marginBottom: '4px' }}>Aucun document trouvé</p>
                  </div>
                </td>
              </tr>
            )}
            {filteredFactures.map(facture => {
              const isProforma = facture.numeroFacture.startsWith('PRO');
              return (
                <tr key={facture.numeroFacture}>
                  <td style={{ fontWeight: '600' }}>{facture.numeroFacture}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} />
                      {facture.date}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${isProforma ? 'badge-warning' : 'badge-success'}`}>
                      {isProforma ? 'Proforma' : 'Facture'}
                    </span>
                  </td>
                  <td>{facture.client_nom || '-'}</td>
                  <td style={{ fontWeight: '500' }}>{facture.dossier_id || '-'}</td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {formatCurrency(facture.totalTtc)}
                  </td>
                  <td>
                    <span className={`badge ${facture.statut === 'Validée' ? 'badge-success' : 'badge-warning'}`}>
                      {facture.statut}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => onViewFacture(facture)}>
                        <Eye size={14} style={{ marginRight: '4px' }} />
                        {isProforma ? 'Modifier' : 'Voir / Imprimer'}
                      </button>
                      <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-danger)' }} onClick={() => handleDelete(facture.numeroFacture)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FacturesView;
