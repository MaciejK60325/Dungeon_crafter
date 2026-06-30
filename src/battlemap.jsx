import React, { useState, useEffect } from 'react';
import './Battlemap.css';

export default function Battlemap({ roomId, role, roomName, username, onLeave }) {
    const GRID_SIZE = 60;

    //  State Management 
    const [tokensOnMap, setTokensOnMap] = useState([]);
    const [activeToolboxTab, setActiveToolboxTab] = useState('characters');
    const [draggedAsset, setDraggedAsset] = useState(null);
    const [draggedTokenId, setDraggedTokenId] = useState(null);
    const [selectedTokenId, setSelectedTokenId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [isPlayersMenuOpen, setIsPlayersMenuOpen] = useState(false);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const [allowPlayersToDrop, setAllowPlayersToDrop] = useState(true);
    const [allowPlayersToDraw, setAllowPlayersToDraw] = useState(false);
    const [playersList, setPlayersList] = useState([]);

    //  Repository Manager State 
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [managerTab, setManagerTab] = useState('all');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [managerSearch, setManagerSearch] = useState('');

    //  Mock Data Store 
    const [customAssets, setCustomAssets] = useState([
        { id: 'a1', name: 'Warrior', url: 'https://via.placeholder.com/150', category: 'characters', isFavorite: true },
        { id: 'a2', name: 'Mage', url: 'https://via.placeholder.com/150', category: 'characters', isFavorite: false },
        { id: 'a3', name: 'Fireball', url: 'https://via.placeholder.com/150', category: 'attachments', isFavorite: true },
        { id: 'a4', name: 'Dungeon Floor', url: 'https://via.placeholder.com/150', category: 'maps', isFavorite: false },
    ]);

    //  Sync Room Players 
    useEffect(() => {
        setPlayersList([
            { id: 'p1', name: `${username || 'Ty'} (Ty)`, role: role || 'GM', active: true, isOwner: true },
            { id: 'p2', name: 'Gracz 2', role: 'Player', active: true, isOwner: false },
            { id: 'p3', name: 'Gracz 3', role: 'Player', active: false, isOwner: false }
        ]);
    }, [username, role]);

    //  Safe Fallback Handlers 
    const handleGridDrop = (e) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const snapX = Math.floor((e.clientX - rect.left) / GRID_SIZE) * GRID_SIZE;
        const snapY = Math.floor((e.clientY - rect.top) / GRID_SIZE) * GRID_SIZE;

        if (draggedTokenId) {
            // Move existing token
            setTokensOnMap(prev => prev.map(t =>
                t.id === draggedTokenId ? { ...t, x: snapX, y: snapY } : t
            ));
            setDraggedTokenId(null);
        } else if (draggedAsset) {
            // Add new asset
            setTokensOnMap(prev => [...prev, {
                ...draggedAsset,
                id: Date.now().toString(),
                x: snapX,
                y: snapY,
                size: 1,
                isLocked: false
            }]);
            setDraggedAsset(null);
        }
    };

    const handleRemoveTokenFromGrid = (id) => { if (typeof setTokensOnMap === 'function') setTokensOnMap(prev => prev.filter(t => t.id !== id)); };
    const updateTokenProperty = (id, prop, val) => { };
    const handleAssetImport = (e, cat) => { };
    const toggleFavorite = (id, e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        setCustomAssets(prev => prev.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a));
    };

    //  Safe Filtered Computations 
    const displayAssets = Array.isArray(customAssets) ? customAssets.filter(asset => asset.category === activeToolboxTab) : [];

    const filteredManagerAssets = Array.isArray(customAssets) ? customAssets.filter(asset => {
        const matchesTab = managerTab === 'all' || asset.category === managerTab;
        const matchesFav = !showOnlyFavorites || asset.isFavorite;
        const matchesSearch = asset.name ? asset.name.toLowerCase().includes((managerSearch || '').toLowerCase()) : false;
        return matchesTab && matchesFav && matchesSearch;
    }) : [];

    return (
        <div className="room-workspace" onClick={() => {
            setSelectedTokenId(null);
            setIsPlayersMenuOpen(false);
        }}>

            {/*  TOP HEADER  */}
            <div className="vtt-header">
                <div className="vtt-header-left">
                    <div className="vtt-header-icons-group">
                        <div className="vtt-player-profile-node" onClick={(e) => { e.stopPropagation(); alert("Profil..."); }} title="Player Profile Settings">
                            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>

                        <div className="vtt-session-management-container" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className={`vtt-players-toggle-btn ${isPlayersMenuOpen ? 'active' : ''}`}
                                onClick={() => setIsPlayersMenuOpen(!isPlayersMenuOpen)}
                                title="Manage Room & Players"
                            >
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </button>

                            {isPlayersMenuOpen && (
                                <div className="vtt-players-dropdown-card">
                                    <div className="dropdown-section">
                                        <label className="section-micro-title">ROOM CODE</label>
                                        <div className="room-code-share-row">
                                            <span className="room-code-text">{isCodeVisible ? roomId : "••••••"}</span>
                                            <div className="room-code-actions">
                                                <button type="button" className="visibility-toggle-btn" onClick={() => setIsCodeVisible(!isCodeVisible)}>👁</button>
                                                <button type="button" className="copy-code-btn" onClick={() => { navigator.clipboard.writeText(roomId || ''); alert("Copied!"); }}>Copy</button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dropdown-players-list">
                                        {Array.isArray(playersList) && playersList.map(player => (
                                            <div key={player?.id || Math.random()} className="player-list-item-row">
                                                <div className="player-info-meta">
                                                    <span className={`status-dot ${player?.active ? 'online' : ''}`}></span>
                                                    <span className="player-name-string">{player?.name || 'Nieznany gracz'}</span>
                                                </div>
                                                <span className="player-role-pill">{player?.role || 'Player'}</span>
                                                {role === 'GM' && !player?.isOwner && (
                                                    <button type="button" className="player-kick-action-btn" onClick={() => alert('Kick...')}>Kick</button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <span className="vtt-session-title">Sesja: <strong>{roomName || 'Brak'}</strong> <span className="vtt-role-tag">[{role || 'Brak'}]</span></span>
                </div>
                <button type="button" className="leave-btn" onClick={onLeave}>Leave Room</button>
            </div>

            {/*  CANVAS WORKSPACE  */}
            <div className="vtt-main-area">
                <div
                    className="vtt-grid-canvas"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleGridDrop}
                    style={{ backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }}
                >
                    {Array.isArray(tokensOnMap) && tokensOnMap.map(token => (
                        <div
                            key={token.id}
                            draggable={!token.isLocked}
                            onDragStart={() => !token.isLocked && setDraggedTokenId(token.id)}
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTokenId(selectedTokenId === token.id ? null : token.id);
                            }}
                            className={`vtt-map-token ${selectedTokenId === token.id ? 'selected' : ''}`}
                            style={{
                                left: `${token.x}px`,
                                top: `${token.y}px`,
                                width: `${(GRID_SIZE * (token.size || 1)) - 4}px`,
                                height: `${(GRID_SIZE * (token.size || 1)) - 4}px`,
                                backgroundImage: `url(${token.url})`,
                                zIndex: token.zIndex || 1
                            }}
                        >
                            {!token.isLocked && (
                                <span
                                    className="vtt-token-delete-cross"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTokenFromGrid(token.id);
                                    }}
                                >×</span>
                            )}
                        </div>
                    ))}
                </div>

                {/*  SIDEBAR TOOLBOX  */}
                {activeToolboxTab && (
                    <div className="vtt-toolbox-sidebar">
                        <div className="vtt-sidebar-title-bar">
                            <h3>{(activeToolboxTab || '').toUpperCase()}</h3>
                            <button type="button" className="vtt-close-sidebar-btn" onClick={() => setActiveToolboxTab(null)}>×</button>
                        </div>

                        {activeToolboxTab === 'search' ? (
                            <div className="vtt-sidebar-search-block">
                                <input
                                    type="text"
                                    className="vtt-sidebar-search-input"
                                    placeholder="Search active assets..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <div className="vtt-sidebar-grid-scroll">
                                    <div className="vtt-assets-item-grid">
                                        {displayAssets
                                            .filter(a => a && a.name && a.name.toLowerCase().includes((searchQuery || '').toLowerCase()))
                                            .map(asset => (
                                                <div key={asset.id} draggable onDragStart={() => setDraggedAsset(asset)} className="vtt-asset-draggable-card">
                                                    <div className="vtt-asset-img-circle" style={{ backgroundImage: asset.url ? `url(${asset.url})` : 'none' }}></div>
                                                    <div className="vtt-asset-title-text">{asset.name}</div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        ) : activeToolboxTab === 'notes' ? (
                            <div className="vtt-sidebar-grid-scroll">
                                <textarea className="vtt-sidebar-textarea" placeholder="Type room and campaign notes here..."></textarea>
                            </div>
                        ) : (
                            <div className="vtt-sidebar-grid-scroll">
                                {displayAssets.length === 0 ? (
                                    <div className="vtt-empty-state">
                                        No items. <br />Add them via Global Manager.
                                    </div>
                                ) : (
                                    <div className="vtt-assets-item-grid">
                                        {displayAssets.map(asset => (
                                            <div key={asset.id} draggable onDragStart={() => setDraggedAsset(asset)} className="vtt-asset-draggable-card">
                                                <div className="vtt-asset-img-circle" style={{ backgroundImage: asset.url ? `url(${asset.url})` : 'none' }}></div>
                                                <div className="vtt-asset-title-text">{asset.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/*  REPOSITORY MANAGER MODAL  */}
            {isManagerOpen && (
                <div className="vtt-manager-modal-overlay" onClick={() => setIsManagerOpen(false)}>
                    <div className="vtt-manager-modal-window" onClick={(e) => e.stopPropagation()}>
                        <div className="vtt-modal-sidebar">
                            <div className="modal-sidebar-section">
                                <h4>CATEGORIES</h4>
                                <button type="button" className={`modal-side-btn ${managerTab === 'all' ? 'active' : ''}`} onClick={() => setManagerTab('all')}>All Assets</button>
                                <button type="button" className={`modal-side-btn ${managerTab === 'characters' ? 'active' : ''}`} onClick={() => setManagerTab('characters')}>Characters</button>
                                <button type="button" className={`modal-side-btn ${managerTab === 'attachments' ? 'active' : ''}`} onClick={() => setManagerTab('attachments')}>Attachments</button>
                                <button type="button" className={`modal-side-btn ${managerTab === 'maps' ? 'active' : ''}`} onClick={() => setManagerTab('maps')}>Maps</button>
                            </div>
                            <div className="modal-sidebar-section text-top-border">
                                <h4>FILTERS</h4>
                                <button
                                    type="button"
                                    className={`modal-side-btn fav-filter-btn ${showOnlyFavorites ? 'active-fav' : ''}`}
                                    onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                                >
                                    ★ Favorites Only
                                </button>
                            </div>
                        </div>

                        <div className="vtt-modal-main-content">
                            <div className="vtt-modal-upper-bar">
                                <div className="search-wrap">
                                    <input
                                        type="text"
                                        placeholder="Search asset catalog..."
                                        value={managerSearch}
                                        onChange={(e) => setManagerSearch(e.target.value)}
                                        className="vtt-sidebar-search-input"
                                    />
                                </div>
                                <div className="actions-wrap">
                                    <label className="modal-upload-btn">
                                        + Add
                                        <input type="file" accept="image/*" onChange={(e) => handleAssetImport(e, managerTab)} style={{ display: 'none' }} />
                                    </label>
                                    <button type="button" className="vtt-close-sidebar-btn" style={{ color: '#888', display: 'flex', alignItems: 'center' }} onClick={() => setIsManagerOpen(false)}>×</button>
                                </div>
                            </div>

                            <div className="vtt-modal-grid-viewport">
                                {filteredManagerAssets.length === 0 ? (
                                    <div className="vtt-empty-state" style={{ marginTop: '100px' }}>No matching items in repository</div>
                                ) : (
                                    <div className="vtt-modal-items-grid">
                                        {filteredManagerAssets.map(asset => (
                                            <div key={asset.id} className="vtt-modal-asset-card">
                                                <button
                                                    type="button"
                                                    className={`asset-fav-star-trigger ${asset.isFavorite ? 'is-fav' : ''}`}
                                                    onClick={(e) => toggleFavorite(asset.id, e)}
                                                >
                                                    {asset.isFavorite ? '★' : '☆'}
                                                </button>

                                                <div className="vtt-asset-img-circle large" style={{ backgroundImage: asset.url ? `url(${asset.url})` : 'none' }}></div>
                                                <div className="vtt-asset-title-text" style={{ fontWeight: 'bold', color: '#fff' }}>{asset.name}</div>
                                                <span className="vtt-manager-tag">{asset.category}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/*  BOTTOM UTILITY DOCK  */}
            <div className="vtt-bottom-dock">
                <button type="button" onClick={() => setActiveToolboxTab(activeToolboxTab === 'maps' ? null : 'maps')} className={`vtt-dock-icon-btn ${activeToolboxTab === 'maps' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    <span>Maps</span>
                </button>
                <button type="button" onClick={() => setActiveToolboxTab(activeToolboxTab === 'attachments' ? null : 'attachments')} className={`vtt-dock-icon-btn ${activeToolboxTab === 'attachments' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    <span>Attachments</span>
                </button>
                <button type="button" onClick={() => setActiveToolboxTab(activeToolboxTab === 'characters' ? null : 'characters')} className={`vtt-dock-icon-btn ${activeToolboxTab === 'characters' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
                    <span>Characters</span>
                </button>
                <button type="button" onClick={() => setActiveToolboxTab(activeToolboxTab === 'notes' ? null : 'notes')} className={`vtt-dock-icon-btn ${activeToolboxTab === 'notes' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line></svg>
                    <span>Notes</span>
                </button>
                <button type="button" onClick={() => setActiveToolboxTab(activeToolboxTab === 'search' ? null : 'search')} className={`vtt-dock-icon-btn ${activeToolboxTab === 'search' ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <span>Search</span>
                </button>
                <button type="button" onClick={() => setIsManagerOpen(true)} className={`vtt-dock-icon-btn ${isManagerOpen ? 'active' : ''}`}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                    <span>Manager</span>
                </button>
            </div>
        </div>
    );
}