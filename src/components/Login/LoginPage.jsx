import React, { useEffect, useRef, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn, CreditCard, ScanLine, ShieldCheck, Camera, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
    demoEmail: 'staff@remaljcarewell.edu.gh',
    demoPass:  'staff2024',
  },
  admin: {
    label:    'Admin Portal',
    badgeBg:  '#f3e8ff',
    badgeCol: '#4a1d6e',
    accentBg: '#4a1d6e',
    title:    'Administrator Sign In',
    subtitle: 'Manage student onboarding, admissions applications, and institutional operations.',
    icon:     '⚡',
    features: [
      { text: 'Onboard new students & create accounts', dot: '#7c3ac8' },
      { text: 'Manage complete student roster & records', dot: '#34c57a' },
      { text: 'Review admissions & applications', dot: '#e0a24a' },
      { text: 'Class & staff assignments', dot: '#4a9fe0' },
    ],
    demoEmail: 'admin@remaljcarewell.edu.gh',
    demoPass:  'admin2024',
  },
  accountant: {
    label:    'Account Portal',
    badgeBg:  '#e0f2fe',
    badgeCol: '#0f3a4b',
    accentBg: '#0f3a4b',
    title:    'Accountant Sign In',
    subtitle: 'Process student fee payments, monitor owing balances, and dispatch reminders.',
    icon:     '💰',
    features: [
      { text: 'Record student fee payments (MoMo, Bank)', dot: '#0284c7' },
      { text: 'Send payment reminder notices to parents', dot: '#e0a24a' },
      { text: 'Monitor revenue billed & debt balances', dot: '#34c57a' },
      { text: 'Student & assigned teacher ledger view', dot: '#7c3ac8' },
    ],
    demoEmail: 'accountant@remaljcarewell.edu.gh',
    demoPass:  'accountant2024',
  },
  student: {
    label:    'Student Portal',
    badgeBg:  '#fff1e8',
    badgeCol: '#5e2d0e',
    accentBg: '#5e2d0e',
    title:    'Student Sign In',
    subtitle: 'Sign in with your official Student ID or scan your Student Card to view timetable, grades & assignments.',
    icon:     '📚',
    isStudent: true,
    idLabel:  'Student ID',
    features: [
      { text: 'Personal academic timetable & schedule', dot: '#c8703a' },
      { text: 'Published grades & coursework', dot: '#34c57a' },
      { text: 'Assignment submissions & staff messaging', dot: '#4a9fe0' },
      { text: 'e-Library digital resources', dot: '#e0a24a' },
    ],
    demoEmail: 'REMALJ-2026-001',
    demoPass:  'student2024',
  },
};

export default function LoginPage({ portal, onLoginSuccess }) {
  const cfg = PORTAL_CONFIG[portal] || PORTAL_CONFIG.admin;

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [cardId,   setCardId]   = useState('');
  const [loginMethod, setLoginMethod] = useState('password');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);

  const stopCamera = () => {
    if (scanTimerRef.current) window.clearInterval(scanTimerRef.current);
    scanTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  const startCamera = async () => {
    setError('');
    setCameraStatus('Requesting camera access…');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera scanning is not supported in this browser. Please enter your card ID.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      setCameraStatus('Point the camera at your school card barcode or QR code.');

      window.setTimeout(async () => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13'] });
          scanTimerRef.current = window.setInterval(async () => {
            if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
            const results = await detector.detect(video);
            if (results[0]?.rawValue) {
              setCardId(results[0].rawValue);
              setCameraStatus('Card detected. You can now continue.');
              stopCamera();
            }
          }, 450);
        }
      }, 0);
    } catch (cameraError) {
      setCameraStatus('');
      setError(cameraError.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access and try again.'
        : 'We could not start the camera. Please enter your card ID instead.');
    }
  };

  useEffect(() => () => stopCamera(), []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (loginMethod === 'password') {
      if (!email.trim())    { setError(`Please enter your ${cfg.idLabel || 'email address'}.`); return; }
      if (!password.trim()) { setError('Please enter your password.'); return; }
    } else if (!cardId.trim()) {
      setError('Please scan your school card or enter its ID.');
      return;
    }

    setLoading(true);
    // Simulate auth (accept demo credentials OR any non-empty input)
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => onLoginSuccess(), 900);
    }, 1400);
  };

  const fillDemo = () => {
    setLoginMethod('password');
    setEmail(cfg.demoEmail);
    setPassword(cfg.demoPass);
    setError('');
  };

  const chooseLoginMethod = (method) => {
    stopCamera();
    setLoginMethod(method);
    setError('');
  };

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-left">
        <div className="login-left__circles" />
        <div className="login-left__content">
          {/* School logo */}
          <div className="login-left__logo">
            <img className="login-left__logo-mark" src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Inspirational School logo" />
            <div className="login-left__logo-text">
              REMALJ Carewell
              <span>Inspirational School · Bogoso</span>
            </div>
          </div>

          <div className="login-left__badge">
            <span>{cfg.icon}</span> {cfg.label}
          </div>

          <h1 className="login-left__title">
            Empowering<br />Every Learner.
          </h1>
          <p className="login-left__subtitle">
            Sign in to your {cfg.label.toLowerCase()} to manage academics, track school transport, and stay connected with the REMALJ Carewell community.
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

              {cfg.isStudent && (
                <div className="login-methods" role="tablist" aria-label="Sign-in method">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={loginMethod === 'password'}
                    className={`login-method${loginMethod === 'password' ? ' login-method--active' : ''}`}
                    onClick={() => chooseLoginMethod('password')}
                  >
                    <Lock size={15} /> Student ID & password
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={loginMethod === 'card'}
                    className={`login-method${loginMethod === 'card' ? ' login-method--active' : ''}`}
                    onClick={() => chooseLoginMethod('card')}
                  >
                    <CreditCard size={15} /> Student card
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={loginMethod === 'qr'}
                    className={`login-method${loginMethod === 'qr' ? ' login-method--active' : ''}`}
                    onClick={() => chooseLoginMethod('qr')}
                  >
                    <ScanLine size={15} /> QR code
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {loginMethod === 'password' ? (
                  <>
                    <div className="form-group">
                      <label className="form-label" htmlFor={`${portal}-email`}>{cfg.idLabel || 'Email Address'}</label>
                      <div className="form-input-wrap">
                        {cfg.isStudent ? <CreditCard size={16} className="form-input-icon" /> : <Mail size={16} className="form-input-icon" />}
                        <input
                          id={`${portal}-email`}
                          type={cfg.isStudent ? 'text' : 'email'}
                          className="form-input"
                          placeholder={cfg.isStudent ? 'e.g. REMALJ-2026-001' : `e.g. ${cfg.demoEmail}`}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          autoComplete={cfg.isStudent ? 'username' : 'email'}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor={`${portal}-password`}>Password</label>
                      <div className="form-input-wrap">
                        <Lock size={16} className="form-input-icon" />
                        <input id={`${portal}-password`} type={showPass ? 'text' : 'password'} className="form-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                        <button type="button" className="form-input-action" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-row">
                      <label className="form-checkbox-wrap">
                        <input type="checkbox" className="form-checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                        <span className="form-checkbox-label">Remember me</span>
                      </label>
                      <button type="button" className="form-forgot">Forgot password?</button>
                    </div>
                  </>
                ) : loginMethod === 'card' ? (
                  <div className="card-access animate-fade-up">
                    <div className="card-access__icon"><ScanLine size={27} /></div>
                    <div>
                      <h3>Tap or scan your school card</h3>
                      <p>Use a card reader, scan the barcode with your camera, or type the card ID below.</p>
                    </div>
                    {!cameraOpen ? (
                      <button type="button" className="card-camera-button" onClick={startCamera}>
                        <Camera size={16} /> Scan card with camera
                      </button>
                    ) : (
                      <div className="card-camera">
                        <video ref={videoRef} className="card-camera__video" playsInline muted />
                        <div className="card-camera__guide" aria-hidden="true" />
                        <button type="button" className="card-camera__close" onClick={stopCamera} aria-label="Close camera">
                          <X size={16} />
                        </button>
                      </div>
                    )}
                    {cameraStatus && <div className="card-camera__status">{cameraStatus}</div>}
                    <div className="form-group">
                      <label className="form-label" htmlFor={`${portal}-card`}>School card ID</label>
                      <div className="form-input-wrap">
                        <CreditCard size={16} className="form-input-icon" />
                        <input id={`${portal}-card`} type="text" className="form-input" placeholder="Scan card or enter ID" value={cardId} onChange={(e) => setCardId(e.target.value)} autoComplete="off" autoFocus />
                      </div>
                    </div>
                    <div className="card-access__security"><ShieldCheck size={15} /> Card details are securely verified before access is granted.</div>
                  </div>
                ) : (
                  <div className="qr-access animate-fade-up">
                    <div className="qr-access__code" aria-label="QR code for mobile sign-in">
                      <QRCodeSVG
                        value={`REMALJ-CAREWELL-PORTAL-ACCESS:${portal.toUpperCase()}:DEMO`}
                        size={164}
                        level="M"
                        includeMargin
                        fgColor="#204d2d"
                      />
                    </div>
                    <div className="qr-access__copy">
                      <h3>Scan to sign in securely</h3>
                      <p>Open the REMALJ Carewell School app, then use its QR scanner to approve this {cfg.label.toLowerCase()} sign-in.</p>
                      <span><ShieldCheck size={14} /> This code is unique to this sign-in session.</span>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="form-error">
                    ⚠ {error}
                  </div>
                )}

                {/* Submit */}
                {loginMethod !== 'qr' && (
                  <button
                    type="submit"
                    className={`login-submit${loading ? ' login-submit--loading' : ''}`}
                    disabled={loading}
                    style={{ background: cfg.accentBg }}
                  >
                    {loading ? (
                      <>
                        <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        {loginMethod === 'card' ? 'Verifying card…' : 'Signing in…'}
                      </>
                    ) : (
                      <>
                        {loginMethod === 'card' ? <CreditCard size={15} /> : <LogIn size={15} />}
                        {loginMethod === 'card' ? 'Access with card' : 'Sign In'} <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                )}
              </form>

              <div className="login-divider">or</div>

              {/* Google SSO */}
              <button className="login-sso" onClick={fillDemo}>
                <span style={{ fontSize: 18 }}>🔑</span>
                Use demo credentials
              </button>

              <div className="login-footer">
                REMALJ Carewell Inspirational School<br />
                P.O. Box 139, Bogoso
                <br />
                <span style={{ marginTop: 8, display: 'block' }}>
                  Prestea Huni-Valley Municipality, Bogoso – Anikoko<br />
                  Opposite Shining Star Hotel
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
