import { useState } from 'react'
import './App.css'

function App() {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });


  const handleSubmit = (e) => {
    e.preventDefault();

    setMessage({ text: '', type: '' });

    if (!isLogin && password !== confirmPassword) {
      setMessage({ text: "Hasła nie są takie same", type: "error" });
      return;
    }

    // sukces
    setMessage({
      text: isLogin ? "Logowanie udane" : "Konto stworzone pomyślnie",
      type: "success"
    });
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Dungeon Crafter</h1>
        <h2>{isLogin ? 'Logowanie' : 'Rejestracja'}</h2>

        <form onSubmit={handleSubmit}>

          {/* NICK - rejestracja */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Nazwa użytkownika / Nick"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          {/* EMAIL - zawsze */}
          <input
            type="email"
            placeholder="Twój email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* HASŁO - zawsze */}
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* POWTÓRZ HASŁO - rejestracja */}
          {!isLogin && (
            <input
              type="password"
              placeholder="Powtórz hasło"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <button type="submit">
            {isLogin ? 'Zaloguj' : 'Stwórz konto'}
          </button>
        </form>

        <p style={{ fontSize: '13px', marginTop: '15px' }}>
          {isLogin ? 'Nie masz konta? ' : 'Masz już konto? '}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#bb86fc', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
          </span>
        </p>
      </div>
    </div >
  )
}

export default App