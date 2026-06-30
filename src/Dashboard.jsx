import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard({ userID, username, onLogout }) {
    const API_URL = "http://127.0.0.1:8000";

    // NAVIGATION & THEME STATES
    const [currentNav, setCurrentNav] = useState('rooms'); // 'home', 'rooms', 'assets', 'settings', 'room-view'
    const [isDarkMode, setIsDarkMode] = useState(true);

    // ROOMS STATES
    const [activeTab, setActiveTab] = useState('GM');
    const [rooms, setRooms] = useState([
        // test room
        //{ id: 101, name: "test", room_code: "X8R2PL", role: "GM", tags: ["GM", "D&D 5e"] }
    ]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [loading, setLoading] = useState(false);

    const [localImages, setLocalImages] = useState({});
    const [joinCode, setJoinCode] = useState('');
    const [revealedCodes, setRevealedCodes] = useState([]);

    // ACTIVE ROOM & WORKSPACE STATES
    const [activeRoom, setActiveRoom] = useState(null);
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState(null);

    // MODAL STATES
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomRole, setNewRoomRole] = useState('GM');
    const [newRoomTags, setNewRoomTags] = useState([]);
    const [newRoomImg, setNewRoomImg] = useState();
    const [isRefreshed, setIsRefreshed] = useState(false);

    const availableTags = ["D&D 5e", "Campaign", "One-Shot", "High Fantasy", "Dark Fantasy", "Dungeon Crawl"];
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (!isDarkMode) {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }, [isDarkMode]);

    // FETCH ROOMS
    useEffect(() => {
        if (currentNav !== 'rooms') return;

        const fetchRooms = async () => {
            setLoading(true);
            try {
                const endpoint = activeTab === 'GM' ? '/rooms/mine' : '/rooms/friends';
                const res = await fetch(`${API_URL}${endpoint}?username=${username}`);
                if (res.ok) {
                    const data = await res.json();
                    setRooms(data);
                }
            } catch (err) {
                console.log("Backend offline, używam lokalnych pokoi testowych.");
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [activeTab, currentNav, username]);

    const generatePhasmoCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    };

    const handleEnterRoom = (room, role) => {
        setActiveRoom({ ...room, currentRole: role });
        setCurrentNav('room-view');
    };

    const handleTagChange = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleModalTagToggle = (tag) => {
        if (newRoomTags.includes(tag)) {
            setNewRoomTags(newRoomTags.filter(t => t !== tag));
        } else {
            setNewRoomTags([...newRoomTags, tag]);
        }
    };

    const handleImageUpload = (roomId, e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setLocalImages(prev => ({ ...prev, [roomId]: imageUrl }));
        }
    };
    const handleNewRoomImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setNewRoomImg(imageUrl);
        }
    }

    const handleRemoveImage = (roomId, e) => {
        e.preventDefault();
        setLocalImages(prev => {
            const updated = { ...prev };
            delete updated[roomId];
            return updated;
        });
    };
    const handleRemoveNewRoomImage = (e) =>{
        e.preventDefault();
        setNewRoomImg();
    }

    const handleDeleteRoom = async (roomId, e) => {
        e.preventDefault();

        try{
            const res = await fetch(`${API_URL}/rooms/?roomID=${roomId}`, {
                method: 'DELETE'
            });
        }
        catch(err){
            setMessage({ text: "Critical error: No response from API server", type: "error" });
            console.error("API Connection Error:", err);
        }
        setIsRefreshed(false)
        //setRooms(prev => prev.filter(room => room.id !== roomId));
    };

    const toggleCodeVisibility = (roomId) => {
        if (revealedCodes.includes(roomId)) {
            setRevealedCodes(revealedCodes.filter(id => id !== roomId));
        } else {
            setRevealedCodes([...revealedCodes, roomId]);
        }
    };

    const handleRefreshRooms = async () =>{     
        setIsRefreshed(true)
        try{
            const res = await fetch(`${API_URL}/rooms/?userID=${userID}`, {
                method: "GET"
            });
            const data = await res.json()

            if(res.ok){
                setRooms([])
                setLocalImages({})
                for(const room in data)
                {
                    const t = data[room].tags.split(",")

                    const newRoomPayload = {
                        id: data[room].roomID,
                        name: data[room].roomName,
                        room_code: data[room].roomCode,
                        role: 'GM',
                        tags: t,
                        image_url: data[room].img
                    };
                    setRooms(prev => [...prev, newRoomPayload]);
                    (e) => handleImageUpload(data[room].roomID, e)
                }
            }else {
                setMessage({ text: data.detail || "API error: Registration failed", type: "error" });
            }
        }
        catch(err)
        {
            setMessage({ text: "Critical error: No response from API server", type: "error" });
            console.error("API Connection Error:", err);
        }

        try{
            const res = await fetch(`${API_URL}/friendRooms/?userID=${userID}`, {
                method: "GET"
            });
            const data = await res.json()

            if(res.ok)
            {
                for(const room in data)
                {
                    const t = data[room].tags.split(",")

                    const newRoomPayload = {
                        id: data[room].roomID,
                        name: data[room].roomName,
                        room_code: data[room].roomCode,
                        role: 'Player',
                        tags: t,
                        image_url: data[room].img
                    };
                    setRooms(prev => [...prev, newRoomPayload]);
                } 
            }else {
                setMessage({ text: data.detail || "API error: Registration failed", type: "error" });
            }
        }
        catch(err)
        {
            setMessage({ text: "Critical error: No response from API server", type: "error" });
            console.error("API Connection Error:", err);
        }
    }

    const handleCreateRoomSubmit = async (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;

        const generatedCode = generatePhasmoCode();

        try {
            const res = await fetch(`${API_URL}/rooms/`,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userID: userID,
                    roomName: newRoomName,
                    tags: newRoomTags.toString(),
                    roomCode: generatedCode,
                    img: newRoomImg
                })  
            })
            const data = await res.json();

            if (res.ok) {
                
            } else {
                setMessage({ text: data.detail || "API error: Registration failed", type: "error" });
            }
        }
        catch(err)
        {
            setMessage({ text: "Critical error: No response from API server", type: "error" });
            console.error("API Connection Error:", err);
        }

        setIsRefreshed(false)
        
        // setRooms(prev => [...prev, newRoomPayload]);
        setNewRoomName('');
        setNewRoomRole('GM');
        setNewRoomTags([]);
        setIsModalOpen(false);
        setNewRoomImg();
    };

    const HandleJoinRoom = async () => {
        try{
            const res = await fetch(`${API_URL}/joinRoom/?roomCode=${joinCode}&userID=${userID}`,{
                method: "POST",
            });
            const data = await res.json();
        }
        catch(err)
        {
            setMessage({ text: "Critical error: No response from API server", type: "error" });
            console.error("API Connection Error:", err);
        }   
    }


    const filteredRooms = rooms.filter(room => {
        if(room.role != activeTab) return false
        if (selectedTags.length === 0) return true;
        return room.tags && selectedTags.every(tag => room.tags.includes(tag));
    });

    return (
        <div className="dashboard-container">
            {currentNav !== 'room-view' && (
                <header className="top-nav">
                    <div className="nav-left">
                        <span className={currentNav === 'home' ? 'active-tab' : ''} onClick={() => setCurrentNav('home')}>[Home]</span>
                        <span className={currentNav === 'rooms' ? 'active-tab' : ''} onClick={() => setCurrentNav('rooms')}>[Rooms]</span>
                        <span className={currentNav === 'assets' ? 'active-tab' : ''} onClick={() => setCurrentNav('assets')}>[Assets]</span>
                        <span className={currentNav === 'settings' ? 'active-tab' : ''} onClick={() => setCurrentNav('settings')}>[Settings]</span>
                    </div>
                    <div className="nav-right">
                        <span className="profile-name">[{username}]</span>
                        <button onClick={onLogout} className="logout-btn">Log out</button>
                    </div>
                </header>
            )}

            {/* 1. ROOM VIEWING INTERFACE */}
            {currentNav === 'rooms' && (
                <div className="main-layout">
                    {isRefreshed===false && handleRefreshRooms()}
                    <aside className="filters-sidebar">
                        <h3>filters:</h3>
                        <h4>tags:</h4>
                        <div className="tags-container">
                            {availableTags.map(tag => (
                                <label key={tag} className="tag-item">
                                    <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => handleTagChange(tag)} />
                                    {tag}
                                </label>
                            ))}
                        </div>
                        <button className="apply-btn">Apply Filters</button>
                    </aside>

                    <main className="rooms-content">
                        <div className="tabs-header">
                            <span className={`tab ${activeTab === 'GM' ? 'active' : ''}`} onClick={() => setActiveTab('GM')}>[Your Rooms]</span>
                            <span className={`tab ${activeTab === 'Player' ? 'active' : ''}`} onClick={() => setActiveTab('Player')}>[Friend's room]</span>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`} style={{ color: message.type === 'error' ? 'red' : 'green', margin: '10px 0' }}>
                            {message.text}
                            </div>
                        )}
                        {loading && <p style={{ textAlign: 'center', color: 'var(--color-accent)' }}>Loading scrolls...</p>}

                        <div className="rooms-grid">
                            {filteredRooms.map(room => {
                                const hasCustomImage = localImages[room.id] || room.image_url;
                                return (
                                    <div key={room.id} className="room-card" style={{ position: 'relative' }}>
                                        {activeTab === 'GM' && (
                                            <button className="delete-room-btn" onClick={(e) => handleDeleteRoom(room.id, e)} title="Delete this room"></button>
                                        )}
                                        <h3>[{room.name}]</h3>

                                        <label className="room-image-label">
                                            <div className="room-image" style={{ backgroundImage: `url(${localImages[room.id] || room.image_url || 'https://via.placeholder.com/300?text=Click+to+upload'})`, backgroundColor: '#222' }}></div>
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(room.id, e)} style={{ display: 'none' }} />
                                        </label>

                                        {hasCustomImage && <button className="remove-img-btn" onClick={(e) => handleRemoveImage(room.id, e)}>[Remove Image]</button>}

                                        <div className="room-tags" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', margin: '5px 0' }}>
                                            {room.tags && room.tags.map(t => <span key={t} style={{ fontSize: '10px', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '3px', color: 'var(--color-accent)' }}>{t}</span>)}
                                        </div>

                                        {room.room_code && (
                                            <div className="code-display-container">
                                                <span>Code:</span>
                                                <span className="code-value">{revealedCodes.includes(room.id) ? room.room_code : '•••••'}</span>
                                                <button className={`eye-btn ${!revealedCodes.includes(room.id) ? 'hidden-mode' : ''}`} onClick={() => toggleCodeVisibility(room.id)}></button>
                                            </div>
                                        )}

                                        {/* SECURE ACTION SECTION - SHOWS BUTTON DEPENDING ON ROOM ROLE */}
                                        <div className="room-actions">
                                            {room.role === 'GM' ? (
                                                <button className="active-role" style={{ width: '100%' }} onClick={() => handleEnterRoom(room, 'GM')}>
                                                    Enter as GM
                                                </button>
                                            ) : (
                                                <button className="active-role" style={{ width: '100%' }} onClick={() => handleEnterRoom(room, 'Player')}>
                                                    Enter as Player
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {activeTab === 'GM' && (
                                <div className="room-card create-room-card" onClick={() => setIsModalOpen(true)}>
                                    <h3>[create a new room]</h3>
                                    <div className="plus-sign">+</div>
                                </div>
                            )}

                            {activeTab === 'Player' && (
                                <div className="room-card join-room-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <h3>[join a room]</h3>
                                    <div className="join-input-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                        <input type="text" placeholder="Enter 6-digit code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} maxLength={6} style={{ background: 'var(--bg-main)', border: '1px solid var(--color-border)', color: 'var(--color-accent)', padding: '10px', textAlign: 'center', fontSize: '16px', borderRadius: '4px', width: '100%', boxSizing: 'border-box', letterSpacing: '2px' }} />
                                        <button onClick={() => HandleJoinRoom()} className="apply-btn" style={{ margin: '5px 0 0 0' }}>Enter Room</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            )}

            {/* 2. PLACEHOLDER HOME */}
            {currentNav === 'home' && (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <h2>[Dungeon Crafter Home]</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Main page preview. Description and showcase will be handled here later.</p>
                </div>
            )}

            {/* 3. PLACEHOLDER ASSETS */}
            {currentNav === 'assets' && (
                <div style={{ textAlign: 'center', marginTop: '100px' }}>
                    <h2>[Global Assets Store]</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Manage tokens and grid maps globally.</p>
                </div>
            )}

            {/* 4. SETTINGS */}
            {currentNav === 'settings' && (
                <div style={{ padding: '4px' }}>
                    <div className="settings-panel">
                        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: 'var(--color-accent)' }}>[Settings]</h2>
                        <div className="theme-switch-container">
                            <div>
                                <h4 style={{ margin: 0 }}>Interface Theme</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    Toggle between dungeon darkness and daylight illumination.
                                </p>
                            </div>
                            <button className="theme-toggle-btn" onClick={() => setIsDarkMode(!isDarkMode)}>
                                {isDarkMode ? '[Dark Theme]' : '[Light Theme]'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. ROOM INTERFACE */}
            {currentNav === 'room-view' && activeRoom && (
                <div className="room-workspace" style={{
                    height: '100vh',
                    width: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#0a0a0a',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    zIndex: 2000,
                    overflow: 'hidden'
                }}>

                    {/* ROOM TOP BAR */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 20px',
                        background: 'var(--bg-card)',
                        borderBottom: '1px solid var(--color-border)',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '14px' }}>
                            Dungeon: <strong style={{ color: 'var(--color-accent)' }}>{activeRoom.name}</strong>
                            <span style={{ color: 'var(--text-muted)', marginLeft: '10px' }}>[{activeRoom.currentRole} mode]</span>
                        </span>
                        <button className="cancel-btn" style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 'bold' }} onClick={() => { setCurrentNav('rooms'); setActiveWorkspaceTab(null); }}>
                            Leave Room
                        </button>
                    </div>

                    {/* MAIN WORK AREA: MAP + SIDE POPUP */}
                    <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

                        {/* CENTRAL BATTLE AREA */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            color: '#333',
                            flexDirection: 'column',
                            userSelect: 'none'
                        }}>
                            <p style={{ fontSize: '26px', letterSpacing: '2px', fontWeight: 'bold', margin: 0 }}>
                                [ BATTLEMAP CANVAS ]
                            </p>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '5px' }}>
                                Grid system, fog of war, and tokens rendering area.
                            </p>
                        </div>

                        {/* ACTIVE PANEL (for lower tabs) */}
                        {activeWorkspaceTab && (
                            <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                right: '20px',
                                width: '320px',
                                maxHeight: '70%',
                                background: 'var(--bg-card)',
                                border: '2px solid var(--color-accent)',
                                boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                zIndex: 2100
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 15px',
                                    borderBottom: '1px solid var(--color-border)',
                                    background: 'rgba(0,0,0,0.2)'
                                }}>
                                    <span style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '13px', color: 'var(--color-accent)', letterSpacing: '1px' }}>
                                        {activeWorkspaceTab}
                                    </span>
                                    <button
                                        style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}
                                        onClick={() => setActiveWorkspaceTab(null)}
                                    >
                                        [x]
                                    </button>
                                </div>

                                {/* Content depends on the selected card */}
                                <div style={{ padding: '15px', overflowY: 'auto', flex: 1, fontSize: '13px' }}>
                                    {activeWorkspaceTab === 'scenes' && <p style={{ color: 'var(--text-muted)' }}>List of global campaign scenes and environments.</p>}
                                    {activeWorkspaceTab === 'maps' && <p style={{ color: 'var(--text-muted)' }}>Battlemaps manager. Drag and drop background layouts here.</p>}
                                    {activeWorkspaceTab === 'props' && <p style={{ color: 'var(--text-muted)' }}>Objects, furniture, chests, and dungeon debris tokens.</p>}
                                    {activeWorkspaceTab === 'mounts' && <p style={{ color: 'var(--text-muted)' }}>Vehicles, horses, ships, and layered mounts grid overlays.</p>}
                                    {activeWorkspaceTab === 'characters' && <p style={{ color: 'var(--text-muted)' }}>Player characters (PCs) and monsters/NPCs tokens vault.</p>}
                                    {activeWorkspaceTab === 'attachments' && <p style={{ color: 'var(--text-muted)' }}>Spell effects, status rings, auras, and area-of-effect templates.</p>}
                                    {activeWorkspaceTab === 'notes' && <p style={{ color: 'var(--text-muted)' }}>Secret GM logbooks, room descriptions, and system rules.</p>}
                                    {activeWorkspaceTab === 'search' && (
                                        <input
                                            type="text"
                                            placeholder="Search across all assets..."
                                            style={{ width: '100%', background: 'var(--bg-main)', border: '1px solid var(--color-border)', color: 'var(--text-primary)', padding: '8px', borderRadius: '4px', boxSizing: 'border-box' }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* BOTTOM NAVIGATION DOCK */}
                    <div style={{
                        background: 'var(--bg-card)',
                        borderTop: '2px solid var(--color-border)',
                        padding: '10px 15px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '12px',
                        alignItems: 'center',
                        boxShadow: '0 -4px 10px rgba(0,0,0,0.3)'
                    }}>
                        {[
                            {
                                id: 'scenes',
                                label: 'Scenes',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z" />
                                    </svg>
                                )
                            },
                            {
                                id: 'maps',
                                label: 'Maps',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                                        <line x1="9" y1="3" x2="9" y2="18" />
                                        <line x1="15" y1="6" x2="15" y2="21" />
                                    </svg>
                                )
                            },
                            {
                                id: 'props',
                                label: 'Props',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                )
                            },
                            {
                                id: 'mounts',
                                label: 'Mounts',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                        <line x1="4" y1="22" x2="4" y2="15" />
                                    </svg>
                                )
                            },
                            {
                                id: 'characters',
                                label: 'Characters',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2a5 5 0 0 0-5 5v3a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z" />
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    </svg>
                                )
                            },
                            {
                                id: 'attachments',
                                label: 'Attachments',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                                    </svg>
                                )
                            },
                            {
                                id: 'notes',
                                label: 'Notes',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                        <polyline points="10 9 9 9 8 9" />
                                    </svg>
                                )
                            },
                            {
                                id: 'search',
                                label: 'Search',
                                icon: (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                )
                            }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveWorkspaceTab(activeWorkspaceTab === tab.id ? null : tab.id)}
                                title={tab.label}
                                style={{
                                    background: activeWorkspaceTab === tab.id ? 'var(--color-accent)' : 'var(--bg-main)',
                                    border: `1px solid ${activeWorkspaceTab === tab.id ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                    color: activeWorkspaceTab === tab.id ? '#121212' : 'var(--text-primary)',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                    width: '44px',
                                    height: '44px',
                                    boxShadow: activeWorkspaceTab === tab.id ? '0 0 8px var(--color-accent-dim)' : 'none'
                                }}
                                onMouseEnter={(e) => {
                                    if (activeWorkspaceTab !== tab.id) {
                                        e.currentTarget.style.borderColor = 'var(--color-accent)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (activeWorkspaceTab !== tab.id) {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {tab.icon}
                            </button>
                        ))}
                    </div>

                </div>
            )}

            {/* CREATE ROOM MODAL */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Construct New Dungeon</h2>
                        <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Dungeon / Room Name</label>
                                <input type="text" placeholder="e.g. Underdark Lair" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required />
                            </div>
                            <div className='form-group'>
                                <label>Room image</label>
                                <label className="room-image-label">
                                    <div className="room-image" style={{ backgroundImage: `url(${ newRoomImg || 'https://via.placeholder.com/300?text=Click+to+upload'})`, backgroundColor: '#222' }}></div>
                                    <input type="file" accept="image/*" onChange={(e) => handleNewRoomImageUpload(e)} style={{ display: 'none' }} />
                                </label>
                                {newRoomImg && <button className="remove-img-btn" onClick={(e) => handleRemoveNewRoomImage(e)}>[Remove Image]</button>}
                            </div>
                            <div className="form-group">
                                <label>Select Tags / Attributes</label>
                                <div className="tags-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {availableTags.filter(t => t !== 'GM' && t !== 'Player').map(tag => (
                                        <label key={tag} className="tag-item">
                                            <input type="checkbox" checked={newRoomTags.includes(tag)} onChange={() => handleModalTagToggle(tag)} />
                                            {tag}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Abandon</button>
                                <button type="submit" className="create-confirm-btn">Summon Room</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}