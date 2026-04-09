import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn } from 'lucide-react';
import './Login.css';

const PORTAL_CONFIG = {
  teacher: {
    label:    'Staff Portal',
    badgeBg:  '#edf8f0',
    badgeCol: '#204d2d',
    accentBg: '#204d2d',
    title:    'Staff Sign In',
    subtitle: 'Access your classes, grades, transport dashboard and more.',
    icon:     '👨‍🏫',
    features: [
      { text: 'Class & student management',         dot: '#34c57a' },
      { text: 'Live bus tracking for all routes',   dot: '#4a9fe0' },
      { text: 'Grade entry & report generation',    dot: '#e0a24a' },
      { text: 'Parent communication tools',         dot: '#34c57a' },
    ],
    demoEmail: 'amponsah@says.edu.gh',
    demoPass:  'staff2024',
  },
  parent: {
    label:    'Parent Portal',
    badgeBg:  '#ddeeff',
    badgeCol: '#1a3668',
    accentBg: '#1a3668',
    title:    'Parent Sign In',
    subtitle: "Track your child's progress, fees, events and school bus in real time.",
    icon:     '👨‍👩‍👦',
    features: [
      { text: "Live bus tracking for your child",  dot: '#4a9fe0' },
      { text: 'Real-time academic progress',       dot: '#34c57a' },
      { text: 'Fee payments & receipts',           dot: '#e0a24a' },
      { text: 'Teacher messages & notices',        dot: '#c87a34' },
    ],
    demoEmail: 'edwards@parent.says.edu.gh',
    demoPass:  'parent2024',
  },
};

export default function LoginPage({ portal, onLoginSuccess }) {
  const cfg = PORTAL_CONFIG[portal];

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim())    { setError('Please enter your email address.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }

    setLoading(true);
    // Simulate auth (accept demo credentials OR any non-empty input)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => onLoginSuccess(), 900);
    }, 1400);
  };

  const fillDemo = () => {
    setEmail(cfg.demoEmail);
    setPassword(cfg.demoPass);
    setError('');
  };

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-left">
        <div className="login-left__circles" />
        <div className="login-left__content">
          {/* Logo */}
          <div className="login-left__logo">
            <div className="login-left__logo-mark">S</div>
            <div className="login-left__logo-text">
              Says International School
              <span>Academic Excellence · Accra, Ghana</span>
            </div>
          </div>

          <div className="login-left__badge">
            <span>{cfg.icon}</span> {cfg.label}
          </div>

          <h1 className="login-left__title">
            Empowering<br />Every Learner.
          </h1>
          <p className="login-left__subtitle">
            Sign in to your {cfg.label.toLowerCase()} to manage academics, track the school bus, and stay connected with the Says International School community.
          </p>

          <div className="login-left__features">
            {cfg.features.map((f) => (
              <div className="login-left__feature" key={f.text}>
                <div className="login-left__feature-dot" style={{ background: f.dot }} />
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-right">
        <div className="login-form-wrap">
          {success ? (
            <div className="login-success animate-fade-up">
              <div className="login-success__icon">✅</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--gray-900)' }}>
                Sign-in successful!
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                Welcome back. Loading your portal…
              </p>
            </div>
          ) : (
            <>
              {/* Portal badge */}
              <div className="login-form__portal-badge" style={{ background: cfg.badgeBg, color: cfg.badgeCol }}>
                <span>{cfg.icon}</span> {cfg.label}
              </div>

              <h2 className="login-form__title">{cfg.title}</h2>
              <p className="login-form__subtitle">{cfg.subtitle}</p>

              <form onSubmit={handleSubmit} noValidate>
                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor={`${portal}-email`}>Email Address</label>
                  <div className="form-input-wrap">
                    <Mail size={16} className="form-input-icon" />
                    <input
                      id={`${portal}-email`}
                      type="email"
                      className="form-input"
                      placeholder={`e.g. ${cfg.demoEmail}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor={`${portal}-password`}>Password</label>
                  <div className="form-input-wrap">
                    <Lock size={16} className="form-input-icon" />
                    <input
                      id={`${portal}-password`}
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="form-input-action"
                      onClick={() => setShowPass(!showPass)}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember + Forgot */}
                <div className="form-row">
                  <label className="form-checkbox-wrap">
                    <input
                      type="checkbox"
                      className="form-checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span className="form-checkbox-label">Remember me</span>
                  </label>
                  <button type="button" className="form-forgot">Forgot password?</button>
                </div>

                {/* Error */}
                {error && (
                  <div className="form-error">
                    ⚠ {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className={`login-submit${loading ? ' login-submit--loading' : ''}`}
                  disabled={loading}
                  style={{ background: cfg.accentBg }}
                >
                  {loading ? (
                    <>
                      <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn size={15} /> Sign In <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <div className="login-divider">or</div>

              {/* Google SSO */}
              <button className="login-sso" onClick={fillDemo}>
                <span style={{ fontSize: 18 }}>🔑</span>
                Use demo credentials
              </button>

              <div className="login-footer">
                Having trouble signing in?{' '}
                <a>Contact the school administrator</a>
                <br />
                <span style={{ marginTop: 8, display: 'block' }}>
                  © 2024 Says International School — All rights reserved.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
