import React, { useState } from 'react';
import { API_BASE_URL } from '../api';
import { Save, X, Info, Package, MapPin, Users, Calendar, Anchor } from 'lucide-react';

const DossierForm = ({ onCancel, onSave, editData }) => {
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    typeOperation: 'Import',
    modeTransport: 'Maritime',
    numBL: '',
    incoterm: 'CIF',
    
    // Transporteur & Dates
    compagnie: '',
    navire: '',
    numVoyage: '',
    etd: '',
    eta: '',

    // Routage
    origine: '',
    destination: '',

    // Acteurs
    expediteur: '',
    client_id: '',

    // Marchandise
    natureMarchandise: '',
    nombresColis: '',
    typeConteneur: 'LCL (Groupage)',
    poids: '',
    volume: '',
    valeurMarchandise: ''
  });

  React.useEffect(() => {
    if (editData) {
      setFormData({
        typeOperation: editData.typeOperation || 'Import',
        modeTransport: editData.modeTransport || 'Maritime',
        numBL: editData.numBL || '',
        incoterm: editData.incoterm || 'CIF',
        compagnie: editData.compagnie || '',
        navire: editData.navire || '',
        numVoyage: editData.numVoyage || '',
        etd: editData.etd || '',
        eta: editData.eta || '',
        origine: editData.origine || '',
        destination: editData.destination || '',
        expediteur: editData.expediteur || '',
        client_id: editData.client_id || '',
        natureMarchandise: editData.natureMarchandise || '',
        nombresColis: editData.nombresColis || '',
        typeConteneur: editData.typeConteneur || 'LCL (Groupage)',
        poids: editData.poids || '',
        volume: editData.volume || '',
        valeurMarchandise: editData.valeurMarchandise || ''
      });
    }
  }, [editData]);

  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/clients`);
        const data = await response.json();
        setClients(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, client_id: data[0].id }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      }
    };
    fetchClients();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    } else {
      if (onCancel) onCancel();
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title">{editData ? `Modifier le Dossier ${editData.id}` : "Nouveau Dossier d'Opération"}</h1>
          <p className="page-subtitle">{editData ? "Modifiez les informations de l'expédition" : "Renseignez toutes les informations de l'expédition"}</p>
        </div>
        <button className="btn btn-outline" onClick={onCancel}>
          <X size={18} />
          Annuler
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          
          {/* Section 1: Type & Transport */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Info size={18} /> Informations Générales
          </h3>
          <div className="form-grid" style={{ marginBottom: '32px' }}>
            <div className="form-group">
              <label className="form-label">Type d'Opération</label>
              <select className="form-control" name="typeOperation" value={formData.typeOperation} onChange={handleChange}>
                <option value="Import">Import</option>
                <option value="Export">Export</option>
                <option value="Transit">Transit</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mode de Transport</label>
              <select className="form-control" name="modeTransport" value={formData.modeTransport} onChange={handleChange}>
                <option value="Maritime">Maritime</option>
                <option value="Aérien">Aérien</option>
                <option value="Terrestre">Terrestre</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">N° de B/L ou LTA</label>
              <input type="text" className="form-control" name="numBL" placeholder="ex: MEDU123456789" value={formData.numBL} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Incoterm</label>
              <select className="form-control" name="incoterm" value={formData.incoterm} onChange={handleChange}>
                <option value="FOB">FOB (Free On Board)</option>
                <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                <option value="EXW">EXW (Ex Works)</option>
                <option value="DAP">DAP (Delivered At Place)</option>
              </select>
            </div>
          </div>

          {/* Section 2: Transporteur & Navire */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)' }}>
            <Anchor size={18} /> Transporteur & Dates
          </h3>
          <div className="form-grid" style={{ marginBottom: '32px' }}>
            <div className="form-group full-width">
              <label className="form-label">Compagnie Maritime / Aérienne</label>
              <input type="text" className="form-control" name="compagnie" placeholder="ex: MSC, Maersk, Air France..." value={formData.compagnie} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Nom du Navire / N° de Vol</label>
              <input type="text" className="form-control" name="navire" placeholder="ex: MSC LIRICA" value={formData.navire} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">N° de Voyage</label>
              <input type="text" className="form-control" name="numVoyage" placeholder="ex: 145B" value={formData.numVoyage} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> ETD (Départ Prévu)
              </label>
              <input type="date" className="form-control" name="etd" value={formData.etd} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> ETA (Arrivée Prévue)
              </label>
              <input type="date" className="form-control" name="eta" value={formData.eta} onChange={handleChange} />
            </div>
          </div>

          {/* Section 3: Routage */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)' }}>
            <MapPin size={18} /> Routage
          </h3>
          <div className="form-grid" style={{ marginBottom: '32px' }}>
            <div className="form-group">
              <label className="form-label">Port / Aéroport d'Origine</label>
              <input type="text" className="form-control" name="origine" placeholder="ex: Shanghai, Chine" value={formData.origine} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Port / Aéroport de Destination</label>
              <input type="text" className="form-control" name="destination" placeholder="ex: Dakar, Sénégal" value={formData.destination} onChange={handleChange} required />
            </div>
          </div>

          {/* Section 4: Acteurs */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-warning)' }}>
            <Users size={18} /> Intervenants
          </h3>
          <div className="form-grid" style={{ marginBottom: '32px' }}>
            <div className="form-group">
              <label className="form-label">Expéditeur (Shipper)</label>
              <input type="text" className="form-control" name="expediteur" placeholder="Nom de la société expéditrice" value={formData.expediteur} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Client / Destinataire (Consignee)</label>
              <select className="form-control" name="client_id" value={formData.client_id} onChange={handleChange} required>
                <option value="">Sélectionner un client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.ville})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 5: Marchandise */}
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Package size={18} /> Détails de la Marchandise
          </h3>
          <div className="form-grid">
            <div className="form-group full-width">
              <label className="form-label">Nature de la marchandise</label>
              <input type="text" className="form-control" name="natureMarchandise" placeholder="ex: Pièces de rechange, Electronique..." value={formData.natureMarchandise} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Quantité (Nombres de Colis)</label>
              <input type="text" className="form-control" name="nombresColis" placeholder="ex: 15 Palettes / 200 Cartons" value={formData.nombresColis} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Type de Chargement / Conteneur</label>
              <select className="form-control" name="typeConteneur" value={formData.typeConteneur} onChange={handleChange}>
                <option value="LCL (Groupage)">LCL (Groupage)</option>
                <option value="FCL 20'">FCL 20' (Conteneur Complet)</option>
                <option value="FCL 40'">FCL 40' (Conteneur Complet)</option>
                <option value="Aérien (Vrac)">Aérien (Vrac)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Poids Total (kg)</label>
              <input type="number" className="form-control" name="poids" placeholder="ex: 12500" value={formData.poids} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Volume (CBM)</label>
              <input type="number" step="0.01" className="form-control" name="volume" placeholder="ex: 28.5" value={formData.volume} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Valeur Marchandise (Déclaration Douane)</label>
              <input type="number" className="form-control" name="valeurMarchandise" placeholder="ex: 15000000 FCFA" value={formData.valeurMarchandise} onChange={handleChange} />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onCancel}>Annuler</button>
            <button type="submit" className="btn btn-primary">
              <Save size={18} />
              {editData ? "Mettre à jour" : "Enregistrer le Dossier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DossierForm;
