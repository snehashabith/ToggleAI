import React, { useState } from 'react';
import { auth, googleProvider,db } from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import './Login.css';
import { doc,setDoc } from '@firebase/firestore';
//import { createDeflate } from 'node:zlib';

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
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User created:', userCredential.user);
        const user = userCredential.user;
        const sendEmailVerification = await user.sendEmailVerification();
        console.log('Verification email sent:', sendEmailVerification);


        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            createdAt: new Date()});

      } else {
        // Sign in
        const handleGoogleLogin = async () => {
  if (loading) return; // prevent double clicks
  setLoading(true);
  setError('');

  try {
    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google user:", result.user);

  } catch (err) {
    if (err.code === "auth/popup-closed-by-user") {
      setError("Login cancelled. Please try again.");
    } else {
      setError(err.message);
    }
  } finally {
    setLoading(false);
  }
};
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Hero Section */}
        <div className="login-hero">
          <h1 className="login-title">ToggleAI</h1>
          <p className="login-subtitle">Your intelligent AI companion</p>
        </div>

        {/* Form Section */}
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

        {/* Footer */}
        <div className="login-footer">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
