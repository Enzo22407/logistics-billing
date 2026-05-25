import React, { useState } from 'react';
import { API_BASE_URL } from './api';
import DossiersView from './components/DossiersView';
import FacturationForm from './components/FacturationForm';
import FacturesView from './components/FacturesView';
import ClientsView from './components/ClientsView';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Ship, 
  Plane, 
  Truck,
  Search,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'dashboard';
  });

  React.useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);
  const [dossiers, setDossiers] = useState([]);
  const [factures, setFactures] = useState([]);
  const [factureViewMode, setFactureViewMode] = useState('list');
  const [editFactureData, setEditFactureData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const respDossiers = await fetch(`${API_BASE_URL}/api/dossiers`);
      const dataDossiers = await respDossiers.json();
      setDossiers(dataDossiers);

      const respFactures = await fetch(`${API_BASE_URL}/api/factures`);
      const dataFactures = await respFactures.json();
      setFactures(dataFactures);
    } catch (error) {
      console.error('Erreur lors du chargement des données du dashboard:', error);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
    // Réinitialiser les modes formulaires
    setFactureViewMode('list');
    setEditFactureData(null);
  }, [activeTab]);

  const formatCurrency = (amount) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';

  const caMois = factures.filter(f => f.statut === 'Validée').reduce((sum, f) => sum + f.totalTtc, 0);
  const dossiersEnCours = dossiers.length;
  const facturesImpayees = factures.filter(f => f.statut === 'Proforma').reduce((sum, f) => sum + f.totalTtc, 0);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Ship className="sidebar-logo-icon" size={28} />
          <span className="sidebar-title">F2N Logistics</span>
        </div>
        
        <nav className="nav-menu">
          <a className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} />
            Tableau de Bord
          </a>
          <a className={`nav-item ${activeTab === 'dossiers' ? 'active' : ''}`} onClick={() => setActiveTab('dossiers')}>
            <Truck size={20} />
            Dossiers / Opérations
          </a>
          <a className={`nav-item ${activeTab === 'factures' ? 'active' : ''}`} onClick={() => setActiveTab('factures')}>
            <FileText size={20} />
            Facturation
          </a>
          <a className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`} onClick={() => setActiveTab('clients')}>
            <Users size={20} />
            Clients & Partenaires
          </a>
          <div style={{ flex: 1 }}></div>
          <a className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} />
            Paramètres
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Rechercher un dossier (ex: B/L, Facture)..." />
          </div>
          
          <div className="user-profile">
            <Bell size={20} style={{ color: 'var(--text-secondary)', cursor: 'pointer', marginRight: '16px' }} />
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>Admin Utilisateur</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>F2N Logistics</span>
            </div>
            <div className="avatar">A</div>
          </div>
        </header>

        {/* Views */}
        {activeTab === 'dashboard' && (
        <div className="dashboard-page">
          <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 className="page-title">Aperçu Global</h1>
              <p className="page-subtitle">Performances et statuts des dossiers en cours</p>
            </div>
            <button className="btn btn-primary" onClick={() => setActiveTab('dossiers')}>
              <Plus size={18} />
              Nouveau Dossier
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Chiffre d'Affaires (Mois)</span>
                <span className="stat-value">{formatCurrency(caMois)}</span>
                <span className="stat-trend" style={{ color: 'var(--text-secondary)' }}>
                  Basé sur les factures validées
                </span>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-primary)' }}>
                <FileText size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Dossiers en Cours</span>
                <span className="stat-value">{dossiersEnCours}</span>
                <span className="stat-trend" style={{ color: 'var(--text-secondary)' }}>
                  Total dossiers enregistrés
                </span>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-secondary)' }}>
                <Ship size={24} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Encours Facturé (Proforma)</span>
                <span className="stat-value">{formatCurrency(facturesImpayees)}</span>
                <span className="stat-trend" style={{ color: 'var(--text-secondary)' }}>
                  Proformas en attente
                </span>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-danger)' }}>
                <Users size={24} />
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Débours en Attente</span>
                <span className="stat-value">0 FCFA</span>
                <span className="stat-trend" style={{ color: 'var(--text-secondary)' }}>
                  À facturer aux clients
                </span>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-warning)' }}>
                <Plane size={24} />
              </div>
            </div>
          </div>

          {/* Recent Operations Table */}
          <div className="data-table-container">
            <div className="data-table-header">
              <h2 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Opérations Récentes</h2>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '6px 12px' }}>Voir tout</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>N° Dossier</th>
                  <th>Type</th>
                  <th>Client</th>
                  <th>Statut Facturation</th>
                  <th>Montant</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dossiers.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>Aucune opération récente à afficher.</td>
                  </tr>
                )}
                {dossiers.slice(0, 5).map(d => {
                  const relatedFacture = factures.find(f => f.dossier_id === d.id);
                  const isPayee = relatedFacture?.statut === 'Validée';
                  const amount = relatedFacture ? formatCurrency(relatedFacture.totalTtc) : '-';
                  
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: '500' }}>{d.id}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {d.modeTransport === 'Maritime' && <Ship size={14} color="var(--accent-primary)"/>}
                          {d.modeTransport === 'Aérien' && <Plane size={14} color="var(--accent-secondary)"/>}
                          {d.modeTransport === 'Terrestre' && <Truck size={14} color="var(--accent-warning)"/>}
                          {d.modeTransport}
                        </span>
                      </td>
                      <td>{d.client_nom || d.expediteur || '-'}</td>
                      <td>
                        <span className={`badge ${relatedFacture ? (isPayee ? 'badge-success' : 'badge-warning') : 'badge-primary'}`}>
                          {relatedFacture ? (isPayee ? 'Facture Validée' : 'Proforma Émise') : 'À Facturer'}
                        </span>
                      </td>
                      <td>{amount}</td>
                      <td>
                        <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setActiveTab('dossiers')}>Détails</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {activeTab === 'dossiers' && (
          <DossiersView />
        )}

        {activeTab === 'factures' && (
          factureViewMode === 'list' ? (
            <FacturesView 
              onCreateFacture={() => {
                setFactureViewMode('form');
                setEditFactureData(null);
              }}
              onViewFacture={(facture) => {
                setFactureViewMode('form');
                setEditFactureData(facture);
              }}
            />
          ) : (
            <FacturationForm 
              editData={editFactureData}
              onCancel={() => {
                setFactureViewMode('list');
                setEditFactureData(null);
              }}
            />
          )
        )}

        {activeTab === 'clients' && (
          <ClientsView />
        )}
      </main>
    </div>
  );
}

export default App;
