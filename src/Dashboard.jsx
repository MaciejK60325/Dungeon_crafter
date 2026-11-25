import React, { useState, useEffect } from 'react';
import './Dashboard.css';

export default function Dashboard({userID, username, onLogout, onEnterRoom }) {
    const API_URL = "http://127.0.0.1:8000";

    const [rooms, setRooms] = useState([]);
    const [currentNav, setCurrentNav] = useState('rooms'); 
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [activeTab, setActiveTab] = useState('GM');
    const [selectedTags, setSelectedTags] = useState([]);

    const [localImages, setLocalImages] = useState({});
    const [joinCode, setJoinCode] = useState('');
    const [revealedCodes, setRevealedCodes] = useState([]);
    const [copyNotification, setCopyNotification] = useState(false);
    const [warningNotification, setWarningNotification] = useState('');

    const defaultRoomImage = 'assets/defaultRoomImage.png'
    // MODAL STATES
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [newRoomRole, setNewRoomRole] = useState('GM');
    const [newRoomTags, setNewRoomTags] = useState([]);
    const [newRoomImg, setNewRoomImg] = useState([defaultRoomImage, null]);
    const [isRefreshed, setIsRefreshed] = useState(false);

    // EDIT MODAL STATES
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editedRoomID, setEditedRoomID] = useState();
    const [editedRoomName, setEditedRoomName] = useState('');
    const [editedRoomTags, setEditedRoomTags] = useState('');
    const [editedRoomImg, setEditedRoomImg] = useState([defaultRoomImage, null]);
    const [editedRoomCode, setEditedRoomCode] = useState('');


    const availableTags = ["D&D 5e", "Cyberpunk", "Campaign", "One-Shot", "High Fantasy", "Dark Fantasy", "Dungeon Crawl", "sci-fi"];
    const [message, setMessage] = useState({ text: '', type: '' });

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

    const handleEditModalTagToggle = (tag) => {
        if (editedRoomTags.includes(tag)) {
            setEditedRoomTags(editedRoomTags.filter(t => t !== tag));
        } else {
            setEditedRoomTags([...editedRoomTags, tag]);
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

    const toggleRoomStatus = (roomId, e) => {
        e.preventDefault();
        setRooms(prev => prev.map(r => r.id === roomId && !r.isFriendRoom ? { ...r, isOpen: !r.isOpen } : r));
    };

    const copyRoomCode = (code, e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code || '');
        setCopyNotification(true);
        setTimeout(() => {
            setCopyNotification(false);
        }, 2000);
    };

    const handleTryEnterRoom = (room) => {
        if (!room.isOpen) {
            setWarningNotification(`Ten pokój [${room.name}] jest obecnie zamknięty przez GM-a!`);
            setTimeout(() => {
                setWarningNotification('');
            }, 3000);
            return;
        }
        onEnterRoom(room.room_code, room.role, room.name);
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

                    const i_url = defaultRoomImage
                    if(data[room].img != defaultRoomImage && data[room].img != null)
                        i_url = URL.createObjectURL(data[room].img)

                    const newRoomPayload = {
                        id: data[room].roomID,
                        name: data[room].roomName,
                        room_code: data[room].roomCode,
                        role: 'GM',
                        tags: t,
                        image_url: i_url,
                        isOpen: true
                    };
                    setRooms(prev => [...prev, newRoomPayload]);
                    setLocalImages(prev => ({ ...prev, [data[room].roomID]: i_url }))
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
                        image_url: data[room].img,
                        isOpen: true
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
        

        const generatedCode = generateRoomCode();

        try {
            const t_img = newRoomImg[0] != defaultRoomImage && newRoomImg != null ? newRoomImg[1] : newRoomImg[0]
            
            
            if (!newRoomName.trim()) return;

            const res = await fetch(`${API_URL}/rooms/`,{
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userID: userID,
                    roomName: newRoomName,
                    tags: newRoomTags.toString(),
                    roomCode: generatedCode,
                    img: t_img
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
        setNewRoomImg([defaultRoomImage, null]);
    };

    const handleEditRoomSubmit = async(e) =>
    {
        e.preventDefault();
        console.log("edit room");

        try{
            //const t_img = editedRoomImg[0] != defaultRoomImage && editedRoomImg != null ? editedRoomImg[1] : editedRoomImg[0]
            
            //if (!newRoomName.trim()) return;

            const res = await fetch(`${API_URL}/rooms/${editedRoomID}`,{
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userID: userID,
                    roomName: editedRoomName,
                    tags: editedRoomTags.toString(),
                    roomCode: editedRoomCode,
                    img: editedRoomImg
                })  
            })
            if(res.ok)
            {
                
            }
        }
        catch(err){
            console.error("API Connection Error:", err);
        }
        setIsRefreshed(false);
        setIsEditModalOpen(false);
    };
    
    const setEditedRoomValues = (room) =>{
        setIsEditModalOpen(true);
        setEditedRoomID(room.id);
        setEditedRoomName(room.name);
        setEditedRoomTags(room.tags);
        setEditedRoomImg(room.image_url);
        setEditedRoomCode(room.room_code);

    };

    const HandleJoinRoom = async () => {
        try{
            const res = await fetch(`${API_URL}/joinRoom/?roomCode=${joinCode}&userID=${userID}`,{
                method: "POST",
            });
            const data = await res.json();
            setIsRefreshed(false)
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
                    {isRefreshed===false && handleRefreshRooms()}
                    <aside className="filters-sidebar">

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
                            <span className={`tab ${activeTab === 'GM' ? 'active' : ''}`} onClick={() => setActiveTab('GM')}>[Your Rooms]</span>
                            <span className={`tab ${activeTab === 'Player' ? 'active' : ''}`} onClick={() => setActiveTab('Player')}>[Friend's rooms]</span>
                        </div>

                        {message.text && (
                            <div className={`message ${message.type}`} style={{ color: message.type === 'error' ? 'red' : 'green', margin: '10px 0' }}>
                            {message.text}
                            </div>
                        )}

                        <div className="rooms-grid">
                            {filteredRooms.map(room => (
                                <div key={room.id} className="room-card" style={{ position: 'relative' }}>
                                    {activeTab === 'GM' && (
                                        <button className="delete-room-btn" onClick={(e) => handleDeleteRoom(room.id, e)} title="Delete Room"></button>
                                    )}
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <h3 style={{ margin: 0 }}>[{room.name}]</h3>
                                        <span 
                                            onClick={(e) => activeTab =='GM' && toggleRoomStatus(room.id, e)} 
                                            title={
                                                room.isFriendRoom 
                                                    ? (room.isOpen ? "Status pokoju znajomego: Otwarty" : "Status pokoju znajomego: Zamknięty")
                                                    : (room.isOpen ? "Status: Otwarty (Kliknij, aby zamknąć)" : "Status: Zamknięty (Kliknij, aby otworzyć)")
                                            }
                                            style={{ 
                                                width: '10px', 
                                                height: '10px', 
                                                borderRadius: '50%', 
                                                backgroundColor: room.isOpen ? '#4caf50' : '#f44336', 
                                                cursor: activeTab === 'Player' ? 'default' : 'pointer',
                                                display: 'inline-block',
                                                boxShadow: room.isOpen ? '0 0 6px rgba(76, 175, 80, 0.6)' : '0 0 6px rgba(244, 67, 54, 0.6)'
                                            }}
                                        ></span>
                                    </div>

                                    <label className="room-image-label">
                                        <div className="room-image" style={{ backgroundImage: `url(${room.image_url || 'https://via.placeholder.com/300?text=Okładka+Pokoju'})`, backgroundColor: '#222', cursor: 'pointer' }}></div>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(room.id, e)} style={{ display: 'none' }} />
                                    </label>

                                    {room.image_url && room.image_url!= defaultRoomImage && <button className="remove-img-btn" onClick={(e) => handleRemoveImage(room.id, e)}>[Remove Image]</button>}

                                    <div className="room-tags" style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', margin: '5px 0' }}>
                                        {room.tags && room.tags.map(t => <span key={t} style={{ fontSize: '10px', background: 'var(--bg-main)', padding: '2px 6px', borderRadius: '3px', color: 'var(--color-accent)' }}>{t}</span>)}
                                    </div>

                                    <div className="code-display-container">
                                        <span>Kod pokoju:</span>
                                        <span className="code-value" onClick={(e) => copyRoomCode(room.room_code, e)} style={{ cursor: 'pointer' }} title="Click to copy">
                                            {revealedCodes.includes(room.id) ? room.room_code : '•••••'}
                                        </span>
                                        <button className={`eye-btn ${!revealedCodes.includes(room.id) ? 'hidden-mode' : ''}`} onClick={() => toggleCodeVisibility(room.id)}></button>
                                    </div>
                                    {activeTab === 'GM' && (<div className='room-actions'>
                                        <button 
                                        className="active-role" 
                                        style={{ 
                                            width: '100%', 
                                            opacity: room.isOpen ? 1 : 0.6, 
                                            borderColor: room.isOpen ? 'var(--color-accent)' : '#555' 
                                        }} 
                                        onClick={() => setEditedRoomValues(room)}
                                        >Edit Room</button>
                                    </div>)}
                                    <div className="room-actions">
                                        <button 
                                            className="active-role" 
                                            style={{ 
                                                width: '100%', 
                                                opacity: room.isOpen ? 1 : 0.6, 
                                                borderColor: room.isOpen ? 'var(--color-accent)' : '#555' 
                                            }} 
                                            onClick={() => handleTryEnterRoom(room)}
                                        >
                                            {room.isOpen ? `Enter Room (${room.role})` : 'Pokój Zamknięty'}
                                        </button>
                                    </div>
                                </div>
                            ))}

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

            {warningNotification && (
                <div style={{
                    position: 'fixed',
                    bottom: '30px',
                    right: '30px',
                    backgroundColor: '#5c1d1d',
                    color: '#fff',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    border: '1px solid #f44336',
                    zIndex: 99999,
                    fontSize: '14px',
                    fontWeight: '500'
                }}>
                    {warningNotification}
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
                            
                            <div className='form-group'>
                                <label>Room image</label>
                                <label className="room-image-label">
                                    <div className="room-image" style={{ backgroundImage: `url(${ newRoomImg[0] || 'https://via.placeholder.com/300?text=Click+to+upload'})`, backgroundColor: '#222' }}></div>
                                    <input type="file" accept="image/*" onChange={(e) => handleNewRoomImageUpload(e)} style={{ display: 'none' }} />
                                </label>
                                {(newRoomImg && newRoomImg[0]!=defaultRoomImage) && <button className="remove-img-btn" onClick={(e) => handleRemoveNewRoomImage(e)}>[Remove Image]</button>}
                            </div>

                            <div className="form-group">
                                <label>Select Tags</label>
                                <div className="tags-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
            {/* Room Edit Modal Window */}
            {isEditModalOpen && (
                <div className='modal-overlay'>
                    <div className="modal-content">
                        <h2>Edit Dungeon</h2>
                        <form onSubmit={handleEditRoomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Dungeon Name</label>
                                <input type="text" value={editedRoomName} onChange={(e) => setEditedRoomName(e.target.value)} required />
                            </div>
                            <div className='form-group'>
                                <label>Room image</label>
                                <label className="room-image-label">
                                    <div className="room-image" style={{ backgroundImage: `url(${editedRoomImg[0] || 'https://via.placeholder.com/300?text=Click+to+upload'})`, backgroundColor: '#222' }}></div>
                                    {/* <input type="file" accept="image/*" onChange={(e) => handleNewRoomImageUpload(e)} style={{ display: 'none' }} /> */}
                                </label>
                                {/* {(editedRoomImg && editedRoomImg[0]!=defaultRoomImage) && <button className="remove-img-btn" onClick={(e) => handleRemoveNewRoomImage(e)}>[Remove Image]</button>} */}
                            </div>
                            <div className="form-group">
                                <label>Select Tags</label>
                                <div className="tags-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    {availableTags.filter(t => t !== 'GM' && t !== 'Player').map(tag => (
                                        <label key={tag} className="tag-item">
                                            <input 
                                                type="checkbox" 
                                                checked={editedRoomTags.includes(tag)} 
                                                onChange={() => handleEditModalTagToggle(tag)} 
                                            />
                                            {tag}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="apply-btn">Edit Dungeon</button>
                            </div>
                        </form>
                    </div>
                </div>

            )}
        </div>
    );
}