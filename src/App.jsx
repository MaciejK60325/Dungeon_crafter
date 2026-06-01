import { useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'

function App() {
  const [isLogin, setIsLogin] = useState(true);
  // NEW STATE: Global login status and logged user's data
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [userID, setUserID] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const API_URL = "http://127.0.0.1:8000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  // User Authorization
  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_URL}/login/?login=${username}&password=${password}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Authorization successful!", type: "success" });
        console.log("API response data:", data);
        
        // success
        setUser(data.user);
        setUserID(data.userID)
        console.log(data.userID)
        setIsLoggedIn(true);
      } else {
        // If error
        setMessage({ text: data.detail || "Login failed: Invalid credentials", type: "error" });
      }
    } catch (err) {
      // If server unreachable
      setMessage({ text: "Connection error: API server is offline", type: "error" });
      console.error("API Connection Error:", err);
    }
  };

  // API User Registration
  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setMessage({ text: "Validation error: Passwords do not match", type: "error" });
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
        setMessage({ text: "Registration completed successfully!", type: "success" });
        setIsLogin(true);
      } else {
        setMessage({ text: data.detail || "API error: Registration failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Critical error: No response from API server", type: "error" });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser('');
    setMessage({ text: 'Logged out successfully', type: 'success' });
  };

  if (isLoggedIn) {
    return <Dashboard userID={userID} username={user} onLogout={handleLogout} />;
  }

  // Render Login / Registration UI if not authenticated
  return (
    <div className="container">
      <div className="card">
        <h1>Dungeon Crafter</h1>
        <h2>{isLogin ? 'Login' : 'Registration'}</h2>

        <form onSubmit={handleSubmit}>

          {/* USERNAME - registration and login */}
          <input
            type="text"
            placeholder="Username / Nickname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          {/* EMAIL - registration only */}
          {!isLogin && (
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          {/* PASSWORD - always required */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* CONFIRM PASSWORD - registration */}
          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm password"
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
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p style={{ fontSize: '13px', marginTop: '15px' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage({ text: '', type: '' }); // clear error logs on toggle
            }}
            style={{ color: '#bb86fc', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Register here' : 'Login here'}
          </span>
        </p>
      </div>
    </div >
  )
}

export default App