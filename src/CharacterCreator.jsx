
import React, { useEffect, useState } from 'react';
import './CharacterCreator.css';



const API_URL = 'http://127.0.0.1:8000';

export default function CharacterCreator({ userID }) {
    const AVAILABLE_RACES = [
        "Dragonborn",
        "Dwarf",
        "Elf",
        "Gnome",
        "Half-Elf",
        "Halfling",
        "Half-Orc",
        "Human",
        "Tiefling"
    ];

    const AVAILABLE_CLASSES = [
        "Barbarian",
        "Bard",
        "Cleric",
        "Druid",
        "Fighter",
        "Monk",
        "Paladin",
        "Ranger",
        "Rogue",
        "Sorcerer",
        "Warlock",
        "Wizard"
    ];
    const [characters, setCharacters] = useState([]);

    const [name, setName] = useState('');
    const [race, setRace] = useState('');
    const [prof, setProf] = useState('');

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [message, setMessage] = useState({
        text: '',
        type: ''
    });

    // Pobieranie postaci użytkownika
    const fetchCharacters = async () => {
        try {
            const res = await fetch(
                `${API_URL}/users/${userID}/characters/`
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.detail || 'Failed to load characters');
            }

            setCharacters(data);
        } catch (err) {
            setMessage({
                text: err.message || 'API connection error',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCharacters();
    }, [userID]);

    // Tworzenie nowej postaci
    const handleCreateCharacter = async (e) => {
        e.preventDefault();

        if (!name.trim() || !race.trim() || !prof.trim()) {
            return;
        }

        setCreating(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch(
                `${API_URL}/users/${userID}/characters/`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: name.trim(),
                        race: race.trim(),
                        prof: prof.trim(),
                        user_id: Number(userID)
                    })
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.detail || 'Character creation failed'
                );
            }

            setCharacters(prev => [...prev, data]);

            setName('');
            setRace('');
            setProf('');

            setMessage({
                text: 'Character successfully created!',
                type: 'success'
            });

        } catch (err) {
            setMessage({
                text: err.message || 'API connection error',
                type: 'error'
            });
        } finally {
            setCreating(false);
        }
    };

    // Usuwanie postaci
    const handleDeleteCharacter = async (charID) => {
        try {
            const res = await fetch(
                `${API_URL}/users/${userID}/characters/${charID}/`,
                {
                    method: 'DELETE'
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || 'Character deletion failed');
            }

            setCharacters(prev =>
                prev.filter(character => character.charID !== charID)
            );

            setMessage({
                text: 'Character deleted successfully!',
                type: 'success'
            });

        } catch (err) {
            setMessage({
                text: err.message || 'API connection error',
                type: 'error'
            });
        }
    };

    if (loading) {
        return <div className="characters-container">Loading characters...</div>;
    }

    return (
        <div className="characters-container">

            <div className="characters-header">
                <h1>[CHARACTER MANAGEMENT]</h1>
                <p>Create and manage your adventurers.</p>
            </div>

            {message.text && (
                <div className={`character-message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="characters-layout">

                {/* Character list */}
                <section className="character-list">
                    <h2>[YOUR CHARACTERS]</h2>

                    {characters.length === 0 ? (
                        <div className="empty-characters">
                            <span className="empty-icon">⚔</span>
                            <h3>No characters found</h3>
                            <p>Create your first adventurer!</p>
                        </div>
                    ) : (
                        <div className="character-cards">
                            {characters.map(character => (
                                <div
                                    className="character-card"
                                    key={character.charID}
                                >
                                    <div className="character-card-info">
                                        <h3>{character.name}</h3>
                                        <p>Race: {character.race}</p>
                                        <p>Profession: {character.prof}</p>
                                    </div>

                                    <button
                                        className="delete-character-btn"
                                        onClick={() =>
                                            handleDeleteCharacter(character.charID)
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Character creation form */}
                <section className="character-creation">
                    <h2>[CREATE CHARACTER]</h2>

                    <form onSubmit={handleCreateCharacter}>

                        <div className="character-form-group">
                            <label>Character Name</label>
                            <input
                                type="text"
                                placeholder="Enter character name..."
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="character-form-group">
                            <label>Race</label>
                            <select
                                value={race}
                                onChange={(e) => setRace(e.target.value)}
                                required
                            >
                                <option value="">-- Select Race --</option>
                                {AVAILABLE_RACES.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="character-form-group">
                            <label>Class</label>
                            <select
                                value={prof}
                                onChange={(e) => setProf(e.target.value)}
                                required
                            >
                                <option value="">-- Select Class --</option>
                                {AVAILABLE_CLASSES.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="create-character-btn"
                            disabled={creating}
                        >
                            {creating ? 'Creating...' : 'Create Character'}
                        </button>

                    </form>
                </section>

            </div>
        </div>
    );
}
