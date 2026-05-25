import React, { useState } from 'react';
import { API_BASE_URL } from '../api';
import { Plus, Ship, Plane, Truck, Eye, FileText, Search } from 'lucide-react';
import DossierForm from './DossierForm';

const DossiersView = () => {
  const [showForm, setShowForm] = useState(false);
  const [editDossier, setEditDossier] = useState(null);

  // Liste des dossiers
  const [dossiers, setDossiers] = useState([]);

  const fetchDossiers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/dossiers`);
      const data = await response.json();
      setDossiers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des dossiers:', error);
    }
  };

  React.useEffect(() => {
    fetchDossiers();
  }, []);

  const getTransportIcon = (mode) => {
    switch (mode) {
      case 'Maritime': return <Ship size={14} color="var(--accent-primary)" />;
      case 'Aérien': return <Plane size={14} color="var(--accent-secondary)" />;
      case 'Terrestre': return <Truck size={14} color="var(--accent-warning)" />;
      default: return <Ship size={14} />;
    }
  };

  const handleDossierSaved = async (newDossier) => {
    const isEdit = !!editDossier;
    const url = isEdit
      ? `${API_BASE_URL}/api/dossiers/${editDossier.id}`
      : `${API_BASE_URL}/api/dossiers`;
    const method = isEdit ? 'PUT' : 'POST';

    let dossierData = { ...newDossier };
    // L'ID est maintenant généré proprement par le serveur

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dossierData)
      });
      if (response.ok) {
        await fetchDossiers();
        setShowForm(false);
        setEditDossier(null);
      } else {
        alert("Erreur lors de l'enregistrement du dossier.");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du dossier:", error);
    }
  };

  const handleEdit = (dossier) => {
    setEditDossier(dossier);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce dossier ?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/dossiers/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchDossiers();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression du dossier:", error);
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditDossier(null);
  };

  if (showForm) {
    return <DossierForm onCancel={handleCancelForm} onSave={handleDossierSaved} editData={editDossier} />;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">Dossiers & Opérations</h1>
          <p className="page-subtitle">Suivez l'ensemble de vos expéditions import/export</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Nouveau Dossier
        </button>
      </div>

      {/* Barre de stats rapides */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
        <div style={{ flex: 1, padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={20} color="var(--accent-primary)" />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dossiers.length}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Dossiers</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Ship size={20} color="var(--accent-primary)" />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dossiers.filter(d => d.typeOperation === 'Import').length}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Imports</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Plane size={20} color="var(--accent-secondary)" />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dossiers.filter(d => d.typeOperation === 'Export').length}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Exports</span>
          </div>
        </div>
        <div style={{ flex: 1, padding: '16px 24px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={20} color="var(--accent-warning)" />
          <div>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{dossiers.filter(d => d.statutFacturation === 'À Facturer').length}</span>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>À Facturer</span>
          </div>
        </div>
      </div>

      {/* Tableau des dossiers */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>N° Dossier</th>
              <th>Type</th>
              <th>Transport</th>
              <th>Client</th>
              <th>Routage</th>
              <th>B/L</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dossiers.length === 0 && (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
                  <div>
                    <FileText size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                    <p style={{ fontSize: '1rem', marginBottom: '4px' }}>Aucun dossier créé pour le moment</p>
                    <p style={{ fontSize: '0.85rem' }}>Cliquez sur "Nouveau Dossier" pour commencer</p>
                  </div>
                </td>
              </tr>
            )}
            {dossiers.map(dossier => (
              <tr key={dossier.id}>
                <td style={{ fontWeight: '600' }}>{dossier.id}</td>
                <td>
                  <span className={`badge ${dossier.typeOperation === 'Import' ? 'badge-primary' : dossier.typeOperation === 'Export' ? 'badge-success' : 'badge-warning'}`}>
                    {dossier.typeOperation}
                  </span>
                </td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {getTransportIcon(dossier.modeTransport)}
                    {dossier.modeTransport}
                  </span>
                </td>
                <td>{dossier.client_nom || dossier.expediteur || '-'}</td>
                <td>
                  <span style={{ fontSize: '0.85rem' }}>
                    {dossier.origine || '-'} ➔ {dossier.destination || '-'}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{dossier.numBL || '-'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{dossier.dateCreation || '-'}</td>
                <td>
                  <span className="badge badge-primary">{dossier.statutFacturation}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEdit(dossier)}>
                      Modifier
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-danger)' }} onClick={() => handleDelete(dossier.id)}>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DossiersView;
