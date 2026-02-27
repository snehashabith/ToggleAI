import React, { useState } from 'react';
import { auth, googleProvider, db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore'; 
import './Login.css';

// default savings template used for new accounts
const DEFAULT_SAVINGS = {
  tokensUsed: 0,
  costSaved: 0,
  queriesProcessed: 0,
  timeFreed: 0,
  createdAt: new Date(),
};

async function ensureSavingsRecord(uid) {
  const ref = doc(db, 'savings', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, DEFAULT_SAVINGS);
  }
}


function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserLocalPersistence);
      
      if (isSignUp) {
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        
        await sendEmailVerification(user);
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          createdAt: new Date(),
          photoURL: '',
          provider: 'password'
        }, { merge: true });
        // ensure savings record exists for new user
        await ensureSavingsRecord(user.uid);

      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date(),
        ...(!userDocSnap.exists() && { createdAt: new Date() }),
        provider: 'google'
      }, { merge: true });
      
      await ensureSavingsRecord(user.uid);

    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };;;

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-hero">
          <h1 className="login-title">ToggleAI</h1>
          <p className="login-subtitle">Your intelligent AI companion</p>
        </div>

        <div className="login-form-section">
          <h2 className="form-title">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleEmailAuth} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength="6"
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
            >
              {loading
                ? 'Loading...'
                : isSignUp
                ? 'Create Account'
                : 'Sign In'}
            </button>
          </form>

          <div className="divider">or continue with</div>

          <button
            className="google-btn primary-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
            type="button"
          >
            <span className="google-icon">🔷</span>
            Sign in with Google
          </button>

          <div className="auth-toggle">
            <p>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                className="toggle-btn"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>

        
        <div className="login-footer">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
