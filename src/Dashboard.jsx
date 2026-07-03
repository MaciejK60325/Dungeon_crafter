import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard({ username, onLogout, onEnterRoom }) {
    const [rooms, setRooms] = useState([]);
    const [currentNav, setCurrentNav] = useState('rooms'); 
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState('your-rooms');
    const [selectedTags, setSelectedTags] = useState([]);
    const [joinCode, setJoinCode] = useState('');
    const [revealedCodes, setRevealedCodes] = useState([]);

    // MODAL STATES
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomRole, setNewRoomRole] = useState('GM');
    const [newRoomTags, setNewRoomTags] = useState([]);

    const availableTags = ["GM", "Player", "D&D 5e", "Cyberpunk", "Campaign", "One-Shot", "High Fantasy", "Dark Fantasy", "Dungeon Crawl"];

    useEffect(() => {
        if (!isDarkMode) document.body.classList.add('light-theme');
        else document.body.classList.remove('light-theme');
    }, [isDarkMode]);

    const generateRoomCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
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
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, image_url: imageUrl } : r));
        }
    };

    const handleRemoveImage = (roomId, e) => {
        e.preventDefault();
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, image_url: '' } : r));
    };

    const handleDeleteRoom = (roomId, e) => {
        e.preventDefault();
        setRooms(prev => prev.filter(room => room.id !== roomId));
    };

    const toggleCodeVisibility = (roomId) => {
        if (revealedCodes.includes(roomId)) {
            setRevealedCodes(revealedCodes.filter(id => id !== roomId));
        } else {
            setRevealedCodes([...revealedCodes, roomId]);
        }
    };

    const handleCreateRoomSubmit = (e) => {
        e.preventDefault();
        if (!newRoomName.trim()) return;

        const generatedCode = generateRoomCode();
        const newRoom = {
            id: Date.now(),
            name: newRoomName,
            room_code: generatedCode,
            role: newRoomRole,
            tags: [newRoomRole, ...newRoomTags], 
            image_url: '',
            isFriendRoom: false 
        };

        setRooms(prev => [...prev, newRoom]);
        setNewRoomName('');
        setNewRoomRole('GM');
        setNewRoomTags([]);
        setIsModalOpen(false);
        setActiveTab('your-rooms');
    };

    const handleJoinByCodeSubmit = (e) => {
        e.preventDefault();
        if (!joinCode.trim()) return;
        
        const codeToJoin = joinCode.toUpperCase();

        const friendRoom = {
            id: Date.now(),
            name: `Dungeon [${codeToJoin}]`,
            room_code: codeToJoin,
            role: "Player", 
            tags: ["Player", "D&D 5e"], 
            image_url: '',
            isFriendRoom: true 
        };
        
        setRooms(prev => [...prev, friendRoom]);
        setJoinCode('');
        setActiveTab('friends-rooms'); 
    };

    const filteredRooms = rooms.filter(room => {
        const matchesTab = activeTab === 'your-rooms' ? !room.isFriendRoom : room.isFriendRoom;
        if (!matchesTab) return false;
        if (selectedTags.length === 0) return true;
        return room.tags && selectedTags.every(tag => room.tags.includes(tag));
    });

    return (
        <div className="dashboard-container">
            {/* Navigation Header */}
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

            {/* Placeholder screens for other nav tabs */}
            {currentNav !== 'rooms' && (
                <div style={{ padding: '40px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    <h2>[{currentNav.toUpperCase()}] Screen Content Placeholder</h2>
                </div>
            )}

            {/* Core Rooms Grid Dashboard View */}
            {currentNav === 'rooms' && (
                <div className="main-layout">
                    <aside className="filters-sidebar">
                        <h3>Join by Code:</h3>
                        <form onSubmit={handleJoinByCodeSubmit} className="join-room-card" style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                type="text" 
                                placeholder="KOD..." 
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value)}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', textTransform: 'uppercase', textAlign: 'center', fontWeight: 'bold' }}
                            />
                            <button type="submit" className="apply-btn" style={{ padding: '8px', marginTop: 0, width: 'auto' }}>Join</button>
                        </form>

                        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', width: '100%', margin: '15px 0' }} />

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
                    </aside>

                    <main className="rooms-content">
                        <div className="tabs-header">
                            <span className={`tab ${activeTab === 'your-rooms' ? 'active' : ''}`} onClick={() => setActiveTab('your-rooms')}>[Your Rooms]</span>
                            <span className={`tab ${activeTab === 'friends-rooms' ? 'active' : ''}`} onClick={() => setActiveTab('friends-rooms')}>[Friend's rooms]</span>
                        </div>

                        <div className="rooms-grid">
                            {filteredRooms.map(room => (
                                <div key={room.id} className="room-card" style={{ position: 'relative' }}>
                                    {!room.isFriendRoom && (
                                        <button className="delete-room-btn" onClick={(e) => handleDeleteRoom(room.id, e)} title="Delete Room"></button>
                                    )}
                                    <h3>[{room.name}]</h3>

                                    <label className="room-image-label">
                                        <div className="room-image" style={{ backgroundImage: `url(${room.image_url || 'https://via.placeholder.com/300?text=Okładka+Pokoju'})`, backgroundColor: '#222', cursor: 'pointer' }}></div>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(room.id, e)} style={{ display: 'none' }} />
                                    </label>

                                    {room.image_url && <button className="remove-img-btn" onClick={(e) => handleRemoveImage(room.id, e)}>[Remove Image]</button>}

                                    <div className="room-tags" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', margin: '5px 0' }}>
                                        {room.tags && room.tags.map(t => <span key={t} style={{ fontSize: '10px', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '3px', color: 'var(--color-accent)' }}>{t}</span>)}
                                    </div>

                                    <div className="code-display-container">
                                        <span>Kod pokoju:</span>
                                        <span className="code-value">{revealedCodes.includes(room.id) ? room.room_code : '•••••'}</span>
                                        <button className={`eye-btn ${!revealedCodes.includes(room.id) ? 'hidden-mode' : ''}`} onClick={() => toggleCodeVisibility(room.id)}></button>
                                    </div>

                                    <div className="room-actions">
                                        <button className="active-role" style={{ width: '100%' }} onClick={() => onEnterRoom(room.room_code, room.role, room.name)}>
                                            Enter Room ({room.role})
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {activeTab === 'your-rooms' && (
                                <div className="room-card create-room-card" onClick={() => setIsModalOpen(true)}>
                                    <h3>[create a new room]</h3>
                                    <div className="plus-sign">+</div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            )}

            {/* Room Creation Modal Window */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Construct New Dungeon</h2>
                        <form onSubmit={handleCreateRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Dungeon Name</label>
                                <input type="text" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} required />
                            </div>
                            
                            <div className="form-group">
                                <label>Your Role</label>
                                <div className="role-selector">
                                    <button type="button" className={`role-btn ${newRoomRole === 'GM' ? 'selected' : ''}`} onClick={() => setNewRoomRole('GM')}>Game Master</button>
                                    <button type="button" className={`role-btn ${newRoomRole === 'Player' ? 'selected' : ''}`} onClick={() => setNewRoomRole('Player')}>Player</button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Select Tags</label>
                                <div className="tags-container">
                                    {availableTags.filter(t => t !== 'GM' && t !== 'Player').map(tag => (
                                        <label key={tag} className="tag-item">
                                            <input 
                                                type="checkbox" 
                                                checked={newRoomTags.includes(tag)} 
                                                onChange={() => handleModalTagToggle(tag)} 
                                            />
                                            {tag}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="apply-btn">Create Dungeon</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}