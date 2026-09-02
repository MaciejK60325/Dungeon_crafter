import { useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'
import Battlemap from './Battlemap'

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);
  const [userID, setUserID] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Forgot Password Flow States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [stepReset, setStepReset] = useState(1); // 1: Send Request, 2: Enter Token & New Pass
  const [resetMail, setResetMail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const API_URL = "http://127.0.0.1:8000";

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
        setMessage({ text: "Authorization successful!", type: "success" });
        setUser(data.user);
        setUserID(data.userID);
        setIsLoggedIn(true);
      } else {
        setMessage({ text: data.detail || "Login failed: Invalid credentials", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Connection error: API server is offline", type: "error" });
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setMessage({ text: "Validation error: Passwords do not match", type: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: username, password: password, mail: email })
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

  const handleRequestReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: username, mail: resetMail })
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Reset code sent to your email!", type: "success" });
        setStepReset(2);
      } else {
        setMessage({ text: data.detail || "Request failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Connection error: API server is offline", type: "error" });
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/reset-password-confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mail: resetMail, token: resetToken, new_password: newPassword })
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Password changed successfully! You can now log in.", type: "success" });
        setIsForgotPassword(false);
        setStepReset(1);
        setIsLogin(true);
      } else {
        setMessage({ text: data.detail || "Invalid code", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Connection error: API server is offline", type: "error" });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser('');
    setActiveRoom(null);
    setMessage({ text: 'Logged out successfully', type: 'success' });
  };

  const handleEnterRoom = (roomId, role, roomName) => {
    setActiveRoom({ roomId, role, roomName });
  };

  const handleLeaveRoom = () => {
    setActiveRoom(null);
  };

  if (isLoggedIn && activeRoom) {
    return (
      <Battlemap
        roomId={activeRoom.roomId}
        role={activeRoom.role}
        roomName={activeRoom.roomName}
        username={username}
        onLeave={handleLeaveRoom}
      />
    );
  }

  if (isLoggedIn) {
    return (
      <Dashboard
        userID={userID}
        username={user}
        onLogout={handleLogout}
        onEnterRoom={handleEnterRoom}
      />
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1>Dungeon Crafter</h1>
        <h2>{isForgotPassword ? 'Reset Password' : (isLogin ? 'Login' : 'Registration')}</h2>
        
        {!isForgotPassword ? (
          <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Username / Nickname" value={username} onChange={(e) => setUsername(e.target.value)} required />
            {!isLogin && <input type="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} required />}
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {!isLogin && <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />}
            
            {message.text && <div className={`message ${message.type}`} style={{ color: message.type === 'error' ? 'red' : 'green', margin: '10px 0' }}>{message.text}</div>}
            
            <button type="submit">{isLogin ? 'Sign In' : 'Create Account'}</button>
          </form>
        ) : (
          stepReset === 1 ? (
            <form onSubmit={handleRequestReset}>
              <input type="text" placeholder="Your Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              <input type="email" placeholder="Your Account Email" value={resetMail} onChange={(e) => setResetMail(e.target.value)} required />
              
              {message.text && <div className={`message ${message.type}`} style={{ color: message.type === 'error' ? 'red' : 'green', margin: '10px 0' }}>{message.text}</div>}
              
              <button type="submit">Send Reset Code</button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset}>
              <input type="text" placeholder="Enter 6-digit Code" value={resetToken} onChange={(e) => setResetToken(e.target.value)} required />
              <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              
              {message.text && <div className={`message ${message.type}`} style={{ color: message.type === 'error' ? 'red' : 'green', margin: '10px 0' }}>{message.text}</div>}
              
              <button type="submit">Confirm New Password</button>
            </form>
          )
        )}

        <div style={{ fontSize: '13px', marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          {!isForgotPassword ? (
            <>
              <div>
                <span style={{ color: '#888' }}>{isLogin ? "Don't have an account? " : 'Already have an account? '}</span>
                <span onClick={() => { setIsLogin(!isLogin); setMessage({ text: '', type: '' }); }} style={{ color: '#bb86fc', cursor: 'pointer', textDecoration: 'underline' }}>
                  {isLogin ? 'Register' : 'Login'}
                </span>
              </div>
              {isLogin && (
                <span onClick={() => { setIsForgotPassword(true); setStepReset(1); setMessage({ text: '', type: '' }); }} style={{ color: '#bb86fc', cursor: 'pointer', textDecoration: 'underline' }}>
                  Forgot password?
                </span>
              )}
            </>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <span onClick={() => { setIsForgotPassword(false); setStepReset(1); setMessage({ text: '', type: '' }); }} style={{ color: '#bb86fc', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to Login
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;