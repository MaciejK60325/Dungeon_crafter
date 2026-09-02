import React, { useState, useEffect, useRef } from 'react';
import './Battlemap.css';

export default function Battlemap({ roomId, role, roomName, username, onLeave }) {
    const GRID_SIZE = 60;

    const [tokensOnMap, setTokensOnMap] = useState([]);
    const [activeToolboxTab, setActiveToolboxTab] = useState('characters');
    const [draggedAsset, setDraggedAsset] = useState(null);
    const [draggedTokenId, setDraggedTokenId] = useState(null);
    const [selectedTokenIds, setSelectedTokenIds] = useState([]); 
    const [searchQuery, setSearchQuery] = useState('');

    const [isPlayersMenuOpen, setIsPlayersMenuOpen] = useState(false);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const [playersList, setPlayersList] = useState([]);
    const [playerToKick, setPlayerToKick] = useState(null);
    const [copyNotification, setCopyNotification] = useState(false);

    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [managerTab, setManagerTab] = useState('all');
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
    const [managerSearch, setManagerSearch] = useState('');

    const [zoom, setZoom] = useState(1);
    const canvasRef = useRef(null);

    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
    const [selectionBox, setSelectionBox] = useState(null);

    // --- NARZĘDZIA, PINGI I MGŁA WOJNY ---
    const [pings, setPings] = useState([]); 
    const [activeTool, setActiveTool] = useState('select'); // 'select' | 'fog' | 'ping'
    const [revealedCells, setRevealedCells] = useState(new Set()); // zestaw odkrytych kafelków "x,y"

    const [customAssets, setCustomAssets] = useState([
        { id: 'a1', name: 'Warrior', url: 'https://via.placeholder.com/150', category: 'characters', isFavorite: true },
        { id: 'a2', name: 'Mage', url: 'https://via.placeholder.com/150', category: 'characters', isFavorite: false },
        { id: 'a3', name: 'Fireball', url: 'https://via.placeholder.com/150', category: 'attachments', isFavorite: true },
        { id: 'a4', name: 'Dungeon Floor', url: 'https://via.placeholder.com/150', category: 'maps', isFavorite: false },
    ]);

    useEffect(() => {
        setPlayersList([
            { id: 'p1', name: `${username || 'Ty'} (Ty)`, role: role || 'GM', active: true, isOwner: true },
            { id: 'p2', name: 'Gracz 2', role: 'Player', active: true, isOwner: false },
            { id: 'p3', name: 'Gracz 3', role: 'Player', active: false, isOwner: false }
        ]);
    }, [username, role]);

    const handleCanvasMouseDown = (e) => {
        e.preventDefault(); 
        if (e.target !== canvasRef.current && activeTool === 'select') return;

        const rect = canvasRef.current.getBoundingClientRect();
        const startX = (e.clientX - rect.left) / zoom;
        const startY = (e.clientY - rect.top) / zoom;

        // OBSŁUGA PINGU (Tylko pojedynczy ping zamiast duplikacji)
        if (activeTool === 'ping') {
            const newPing = { id: Date.now(), x: startX, y: startY };
            setPings([newPing]); // Używamy tablicy z jednym elementem, żeby uniknąć nałożenia
            setTimeout(() => {
                setPings([]);
            }, 1000); // Trwa równe 1 sekundę zgodnie z animacją CSS
            return;
        }

        setIsSelecting(true);
        setSelectionStart({ x: startX, y: startY });
        setSelectionBox({ x: startX, y: startY, width: 0, height: 0 });
        
        if (activeTool === 'select') {
            setSelectedTokenIds([]);
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (!isSelecting) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) / zoom;
        const currentY = (e.clientY - rect.top) / zoom;

        setSelectionBox({
            x: Math.min(selectionStart.x, currentX),
            y: Math.min(selectionStart.y, currentY),
            width: Math.abs(currentX - selectionStart.x),
            height: Math.abs(currentY - selectionStart.y)
        });
    };

    const handleCanvasMouseUp = () => {
        if (isSelecting && selectionBox) {
            // 1. ZAZNACZANIE TOKENÓW
            if (activeTool === 'select') {
                const newSelection = tokensOnMap.filter(t => {
                    const tokenRight = t.x + (GRID_SIZE * (t.size || 1));
                    const tokenBottom = t.y + (GRID_SIZE * (t.size || 1));
                    return (
                        t.x < selectionBox.x + selectionBox.width &&
                        tokenRight > selectionBox.x &&
                        t.y < selectionBox.y + selectionBox.height &&
                        tokenBottom > selectionBox.y
                    );
                }).map(t => t.id);
                setSelectedTokenIds(newSelection);
            }

            // 2. OBSZAROWA MGŁA WOJNY
            if (activeTool === 'fog' && role === 'GM') {
                const startCellX = Math.floor(selectionBox.x / GRID_SIZE);
                const startCellY = Math.floor(selectionBox.y / GRID_SIZE);
                const endCellX = Math.floor((selectionBox.x + selectionBox.width) / GRID_SIZE);
                const endCellY = Math.floor((selectionBox.y + selectionBox.height) / GRID_SIZE);

                setRevealedCells(prev => {
                    const newSet = new Set(prev);
                    let allRevealed = true;
                    for (let x = startCellX; x <= endCellX; x++) {
                        for (let y = startCellY; y <= endCellY; y++) {
                            if (!newSet.has(`${x},${y}`)) {
                                allRevealed = false;
                                break;
                            }
                        }
                    }

                    for (let x = startCellX; x <= endCellX; x++) {
                        for (let y = startCellY; y <= endCellY; y++) {
                            const key = `${x},${y}`;
                            if (allRevealed) {
                                newSet.delete(key);
                            } else {
                                newSet.add(key);
                            }
                        }
                    }
                    return newSet;
                });
            }
        }
        setIsSelecting(false);
        setSelectionBox(null);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.2));

    const handleWheelZoom = (e) => {
        if (e.ctrlKey) {
            e.preventDefault();
            setZoom(prev => {
                const newZoom = e.deltaY > 0 ? prev - 0.05 : prev + 0.05;
                return Math.min(Math.max(newZoom, 0.2), 3);
            });
        }
    };

    const handleGridDrop = (e) => {
        e.preventDefault();
        const rect = canvasRef.current.getBoundingClientRect();
        const dropX = (e.clientX - rect.left) / zoom;
        const dropY = (e.clientY - rect.top) / zoom;
        const snapX = Math.floor(dropX / GRID_SIZE) * GRID_SIZE;
        const snapY = Math.floor(dropY / GRID_SIZE) * GRID_SIZE;

        if (draggedTokenId) {
            const draggedToken = tokensOnMap.find(t => t.id === draggedTokenId);
            if (draggedToken) {
                const deltaX = snapX - draggedToken.x;
                const deltaY = snapY - draggedToken.y;

                if (selectedTokenIds.includes(draggedTokenId)) {
                    setTokensOnMap(prev => prev.map(t =>
                        selectedTokenIds.includes(t.id) ? { ...t, x: t.x + deltaX, y: t.y + deltaY } : t
                    ));
                } else {
                    setTokensOnMap(prev => prev.map(t =>
                        t.id === draggedTokenId ? { ...t, x: snapX, y: snapY } : t
                    ));
                }
            }
            setDraggedTokenId(null);
        } else if (draggedAsset) {
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
    const handleAssetImport = (e, cat) => { };
    const toggleFavorite = (id, e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        setCustomAssets(prev => prev.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a));
    };

    const confirmKickPlayer = () => {
        if (playerToKick) {
            setPlayersList(prev => prev.filter(p => p.id !== playerToKick.id));
            setPlayerToKick(null);
        }
    };

    const copyRoomCode = () => {
        navigator.clipboard.writeText(roomId || '');
        setCopyNotification(true);
        setTimeout(() => {
            setCopyNotification(false);
        }, 2000);
    };

    const displayAssets = Array.isArray(customAssets) ? customAssets.filter(asset => asset.category === activeToolboxTab) : [];

    const filteredManagerAssets = Array.isArray(customAssets) ? customAssets.filter(asset => {
        const matchesTab = managerTab === 'all' || asset.category === managerTab;
        const matchesFav = !showOnlyFavorites || asset.isFavorite;
        const matchesSearch = asset.name ? asset.name.toLowerCase().includes((managerSearch || '').toLowerCase()) : false;
        return matchesTab && matchesFav && matchesSearch;
    }) : [];

    return (
        <div className="room-workspace" onClick={() => {
            setSelectedTokenIds([]);
            setIsPlayersMenuOpen(false);
        }} onContextMenu={(e) => e.preventDefault()}>
            <div className="vtt-header">
                <div className="vtt-header-left">
                    <div className="vtt-header-icons-group">
                        <div className="vtt-player-profile-node" onClick={(e) => { e.stopPropagation(); }} title="Player Profile Settings">
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
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label className="section-micro-title" style={{ margin: 0 }}>ROOM CODE</label>
                                            <span style={{ fontSize: '11px', color: '#4caf50', background: 'rgba(76, 175, 80, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>● Otwarty</span>
                                        </div>
                                        <div className="room-code-share-row">
                                            <span className="room-code-text" onClick={copyRoomCode} style={{ cursor: 'pointer' }} title="Click to copy">{isCodeVisible ? roomId : "••••••"}</span>
                                            <div className="room-code-actions">
                                                <button type="button" className="visibility-toggle-btn" onClick={() => setIsCodeVisible(!isCodeVisible)}>👁</button>
                                                <button type="button" className="copy-code-btn" onClick={copyRoomCode}>Copy</button>
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
                                                    <button 
                                                        type="button" 
                                                        className="player-kick-action-btn" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPlayerToKick(player);
                                                        }}
                                                    >
                                                        Kick
                                                    </button>
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

            <div className="vtt-main-area" style={{ display: 'flex', width: '100%', height: 'calc(100vh - 50px)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ flex: 1, height: '100%', overflow: 'auto', position: 'relative' }} onWheel={handleWheelZoom}>
                    <div
                        ref={canvasRef}
                        className="vtt-grid-canvas"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleGridDrop}
                        onMouseDown={handleCanvasMouseDown}
                        onMouseMove={handleCanvasMouseMove}
                        onMouseUp={handleCanvasMouseUp}
                        onMouseLeave={handleCanvasMouseUp}
                        style={{ 
                            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            width: '10000px', 
                            height: '10000px',
                            cursor: activeTool === 'ping' ? 'crosshair' : (activeTool === 'fog' ? 'crosshair' : (isSelecting ? 'crosshair' : 'default')),
                            position: 'relative'
                        }}
                    >
                        {/* WIZUALIZACJA MGŁY WOJNY */}
                        {Array.from({ length: 40 }).map((_, rx) => 
                            Array.from({ length: 40 }).map((_, ry) => {
                                const cellKey = `${rx},${ry}`;
                                const isRevealed = revealedCells.has(cellKey);
                                if (isRevealed) return null;
                                return (
                                    <div 
                                        key={cellKey} 
                                        style={{
                                            position: 'absolute',
                                            left: `${rx * GRID_SIZE}px`,
                                            top: `${ry * GRID_SIZE}px`,
                                            width: `${GRID_SIZE}px`,
                                            height: `${GRID_SIZE}px`,
                                            backgroundColor: '#121212',
                                            border: '1px solid #222',
                                            zIndex: 5,
                                            pointerEvents: 'none'
                                        }}
                                    />
                                );
                            })
                        )}

                        {/* WIZUALIZACJA PINGÓW (Naprawiona animacja pojedynczego pingu) */}
                        {pings.map(ping => (
                            <div key={ping.id} style={{
                                position: 'absolute',
                                left: `${ping.x - 20}px`,
                                top: `${ping.y - 20}px`,
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: '3px solid #bb86fc',
                                backgroundColor: 'rgba(187, 134, 252, 0.3)',
                                zIndex: 10000,
                                animation: 'pingAnimation 1s linear forwards',
                                pointerEvents: 'none'
                            }} />
                        ))}

                        {/* PROSTOKĄT ZAZNACZANIA */}
                        {isSelecting && selectionBox && (
                            <div style={{
                                position: 'absolute',
                                border: '1px solid #bb86fc',
                                backgroundColor: activeTool === 'fog' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(187, 134, 252, 0.2)',
                                left: selectionBox.x,
                                top: selectionBox.y,
                                width: selectionBox.width,
                                height: selectionBox.height,
                                pointerEvents: 'none',
                                zIndex: 9999
                            }} />
                        )}

                        {Array.isArray(tokensOnMap) && tokensOnMap.map(token => (
                            <div
                                key={token.id}
                                draggable={!token.isLocked && activeTool === 'select'}
                                onDragStart={() => !token.isLocked && activeTool === 'select' && setDraggedTokenId(token.id)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (activeTool !== 'select') return;
                                    if (e.shiftKey) {
                                        setSelectedTokenIds(prev => prev.includes(token.id) ? prev.filter(id => id !== token.id) : [...prev, token.id]);
                                    } else {
                                        setSelectedTokenIds([token.id]);
                                    }
                                }}
                                className={`vtt-map-token ${selectedTokenIds.includes(token.id) ? 'selected' : ''}`}
                                style={{
                                    left: `${token.x}px`,
                                    top: `${token.y}px`,
                                    width: `${(GRID_SIZE * (token.size || 1)) - 4}px`,
                                    height: `${(GRID_SIZE * (token.size || 1)) - 4}px`,
                                    backgroundImage: `url(${token.url})`,
                                    zIndex: 10,
                                    outline: selectedTokenIds.includes(token.id) ? '3px solid #bb86fc' : 'none'
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
                </div>

                {activeToolboxTab && (
                    <div className="vtt-toolbox-sidebar" style={{ position: 'relative', zIndex: 20, flexShrink: 0, height: '100%' }}>
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

            {copyNotification && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    backgroundColor: '#323232',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    border: '1px solid #444',
                    zIndex: 99999,
                    fontSize: '14px',
                    fontWeight: '500'
                }}>
                    Room code copied to clipboard!
                </div>
            )}

            {playerToKick && (
                <div className="vtt-manager-modal-overlay" onClick={() => setPlayerToKick(null)}>
                    <div className="vtt-manager-modal-window" style={{ width: '400px', height: 'auto', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ color: '#fff', margin: 0 }}>Kick Player</h3>
                        <p style={{ color: '#ccc', margin: 0, fontSize: '14px' }}>
                            Are you sure you want to kick <strong>{playerToKick.name}</strong> from the room?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button 
                                type="button" 
                                onClick={() => setPlayerToKick(null)}
                                style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                onClick={confirmKickPlayer}
                                style={{ padding: '8px 16px', background: '#cf6679', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Kick
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                position: 'absolute',
                bottom: '90px',
                left: '20px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1e1e1e',
                borderRadius: '8px',
                border: '1px solid #333',
                zIndex: 100,
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
                <button type="button" onClick={handleZoomIn} style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: '#fff', fontSize: '24px', padding: '10px 15px', cursor: 'pointer', lineHeight: '1' }}>+</button>
                <button type="button" onClick={handleZoomOut} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', padding: '10px 15px', cursor: 'pointer', lineHeight: '1' }}>-</button>
            </div>

            {/* KOMPAKTOWY PANEL IKON NARĘDZI (Z CZYSTYMI TOOLTIPAMI BEZ NAWIASÓW) */}
            <div style={{
                position: 'absolute',
                bottom: '90px',
                right: '20px',
                display: 'flex',
                gap: '4px',
                backgroundColor: '#1e1e1e',
                padding: '6px',
                borderRadius: '8px',
                border: '1px solid #333',
                zIndex: 100,
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
            }}>
                <button 
                    type="button" 
                    onClick={() => setActiveTool('select')} 
                    title="Wskaźnik"
                    style={{ 
                        background: activeTool === 'select' ? '#bb86fc' : 'transparent', 
                        color: activeTool === 'select' ? '#000' : '#aaa', 
                        border: 'none', 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '16px'
                    }}
                >
                    ↖
                </button>
                <button 
                    type="button" 
                    onClick={() => setActiveTool('ping')} 
                    title="Ping"
                    style={{ 
                        background: activeTool === 'ping' ? '#bb86fc' : 'transparent', 
                        color: activeTool === 'ping' ? '#000' : '#aaa', 
                        border: 'none', 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '4px', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '16px'
                    }}
                >
                    📍
                </button>
                {role === 'GM' && (
                    <button 
                        type="button" 
                        onClick={() => setActiveTool('fog')} 
                        title="Mgła Wojny"
                        style={{ 
                            background: activeTool === 'fog' ? '#bb86fc' : 'transparent', 
                            color: activeTool === 'fog' ? '#000' : '#aaa', 
                            border: 'none', 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '16px'
                        }}
                    >
                        🌫️
                    </button>
                )}
            </div>

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