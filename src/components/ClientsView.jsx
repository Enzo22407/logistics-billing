import React, { useState } from 'react';
import { API_BASE_URL } from '../api';
import { Users, Plus, Building, Phone, Mail, MapPin, Edit, Trash2 } from 'lucide-react';

const ClientsView = ({ onCancel }) => {
  const [showForm, setShowForm] = useState(false);
  
  // Liste des entités
  const [entities, setEntities] = useState([]);
  
  const [formData, setFormData] = useState({
    type: 'Client',
    nom: '',
    nif: '',
    rccm: '',
    contact: '',
    email: '',
    tel: '',
    adresse: '',
    ville: ''
  });
  const [editId, setEditId] = useState(null);

  const fetchClients = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients`);
      const data = await response.json();
      setEntities(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    }
  };

  React.useEffect(() => {
    fetchClients();
  }, []);

  const handleEdit = (entite) => {
    setFormData({
      type: entite.type,
      nom: entite.nom,
      nif: entite.nif || '',
      rccm: entite.rccm || '',
      contact: entite.contact || '',
      email: entite.email || '',
      tel: entite.tel || '',
      adresse: entite.adresse || '',
      ville: entite.ville || ''
    });
    setEditId(entite.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/clients/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchClients();
        } else {
          alert("Erreur lors de la suppression");
        }
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormData({ type: 'Client', nom: '', nif: '', rccm: '', contact: '', email: '', tel: '', adresse: '', ville: '' });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editId 
      ? `${API_BASE_URL}/api/clients/${editId}` 
      : `${API_BASE_URL}/api/clients`;
    const method = editId ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        await fetchClients();
        handleCancelForm();
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du client:", error);
    }
  };

  return (
    <div className="dashboard-page">
      {!showForm ? (
        // Vue Liste
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 className="page-title">Répertoire Clients & Partenaires</h1>
              <p className="page-subtitle">Gérez vos contacts, expéditeurs, destinataires et compagnies</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={18} />
              Nouveau Contact
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom de l'Entreprise</th>
                  <th>Type</th>
                  <th>Contact Principal</th>
                  <th>Téléphone & Email</th>
                  <th>NINEA / NIF</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Aucun contact enregistré.</td>
                  </tr>
                )}
                {entities.map(entite => (
                  <tr key={entite.id}>
                    <td style={{ fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={16} color="var(--text-secondary)" />
                        {entite.nom}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', fontWeight: '400' }}>{entite.ville}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${entite.type === 'Client' ? 'badge-primary' : 'badge-warning'}`}>
                        {entite.type}
                      </span>
                    </td>
                    <td>{entite.contact}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        <span style={{ display: 'block', color: 'var(--text-primary)' }}>{entite.tel}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{entite.email}</span>
                      </div>
                    </td>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{entite.nif}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => handleEdit(entite)}><Edit size={14} /></button>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', color: 'var(--accent-danger)' }} onClick={() => handleDelete(entite.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        // Formulaire d'Ajout
        <>
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 className="page-title">{editId ? "Modifier l'Entité" : "Ajouter une Entité"}</h1>
              <p className="page-subtitle">{editId ? "Modifiez les informations de la fiche" : "Créez la fiche d'un nouveau client ou partenaire"}</p>
            </div>
            <button className="btn btn-outline" onClick={handleCancelForm}>Retour à la liste</button>
          </div>

          <div className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-grid" style={{ marginBottom: '24px' }}>
                <div className="form-group full-width">
                  <label className="form-label">Type d'Entité</label>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="type" value="Client" checked={formData.type === 'Client'} onChange={handleChange} style={{ accentColor: 'var(--accent-primary)' }} />
                      Client (Expéditeur / Destinataire)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="type" value="Partenaire (Transport)" checked={formData.type === 'Partenaire (Transport)'} onChange={handleChange} style={{ accentColor: 'var(--accent-primary)' }} />
                      Compagnie de Transport
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="type" value="Partenaire (Douane/Port)" checked={formData.type === 'Partenaire (Douane/Port)'} onChange={handleChange} style={{ accentColor: 'var(--accent-primary)' }} />
                      Autorité / Douane / Port
                    </label>
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
                <Building size={18} /> Informations sur l'Entreprise
              </h3>
              <div className="form-grid" style={{ marginBottom: '32px' }}>
                <div className="form-group full-width">
                  <label className="form-label">Nom de l'Entreprise</label>
                  <input type="text" className="form-control" name="nom" value={formData.nom} onChange={handleChange} required placeholder="ex: F2N Logistics SARL" />
                </div>
                <div className="form-group">
                  <label className="form-label">NINEA / NIF (N° d'Identification Fiscal)</label>
                  <input type="text" className="form-control" name="nif" value={formData.nif} onChange={handleChange} placeholder="ex: 0123456789" />
                </div>
                <div className="form-group">
                  <label className="form-label">RCCM (Registre du Commerce)</label>
                  <input type="text" className="form-control" name="rccm" value={formData.rccm} onChange={handleChange} placeholder="ex: SN-DKR-2023-B-1234" />
                </div>
              </div>

              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)' }}>
                <Users size={18} /> Coordonnées & Contact Principal
              </h3>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Nom du Contact Principal</label>
                  <input type="text" className="form-control" name="contact" value={formData.contact} onChange={handleChange} required placeholder="ex: Amadou Diop" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14}/> Téléphone</label>
                  <input type="tel" className="form-control" name="tel" value={formData.tel} onChange={handleChange} required placeholder="ex: +221 77 000 00 00" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14}/> Adresse Email</label>
                  <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required placeholder="ex: contact@entreprise.sn" />
                </div>
                <div className="form-group full-width">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14}/> Adresse Physique</label>
                  <input type="text" className="form-control" name="adresse" value={formData.adresse} onChange={handleChange} placeholder="ex: Zone Industrielle, Dakar" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input type="text" className="form-control" name="ville" value={formData.ville} onChange={handleChange} required placeholder="ex: Dakar" />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={handleCancelForm}>Annuler</button>
                <button type="submit" className="btn btn-primary">{editId ? "Mettre à jour" : "Enregistrer la Fiche"}</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ClientsView;
