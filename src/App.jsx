import { useState } from 'react'
import './App.css'

function App() {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const API_URL = "http://127.0.0.1:8000";

  // Główna funkcja - wysłanie formularza
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/login/?login=${username}&password=${password}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Autoryzacja pomyślna!", type: "success" });
        console.log("Dane z API:", data);
      } else {
        // Jeśli API zwróci błąd (np. złe hasło)
        setMessage({ text: data.detail || "Błąd logowania: Nieprawidłowe dane", type: "error" });
      }
    } catch (err) {
      // Jeśli serwer w ogóle nie odpowiada
      setMessage({ text: "Błąd połączenia: Serwer API jest niedostępny", type: "error" });
      console.error("API Connection Error:", err);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setMessage({ text: "Walidacja: Hasła nie są identyczne", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          login: username,
          password: password,
          mail: email
        })
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Rejestracja zakończona sukcesem", type: "success" });
        setIsLogin(true);
      } else {
        setMessage({ text: data.detail || "Błąd API: Rejestracja nie powiodła się", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Błąd krytyczny: Brak odpowiedzi z serwera API", type: "error" });
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Dungeon Crafter</h1>
        <h2>{isLogin ? 'Logowanie' : 'Rejestracja'}</h2>

        <form onSubmit={handleSubmit}>

          {/* NICK - rejestracja I logowanie */}
          <input
            type="text"
            placeholder="Nazwa użytkownika / Nick"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {/* EMAIL - rejestracja */}
          {!isLogin && (
            <input
              type="email"
              placeholder="Twój email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

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
            <div className={`message ${message.type}`} style={{ color: message.type === 'error' ? 'red' : 'green', margin: '10px 0' }}>
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
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage({ text: '', type: '' }); // czyszczenie błędów po przełaczeniu
            }}
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