import React, { useEffect, useRef, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn, CreditCard, ScanLine, ShieldCheck, Camera, X, User, Phone, UserCheck, ArrowLeft, CheckCircle2, MessageSquareCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api, setAuthToken, setAuthUser } from '../../services/api';
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
  },
  parent: {
    label:    'Parent Portal',
    badgeBg:  '#e0f2fe',
    badgeCol: '#1a3668',
    accentBg: '#1a3668',
    title:    'Parent Sign In',
    subtitle: 'Track your child\'s academic progress, fee billing, and real-time school bus location.',
    icon:     '👨‍👩‍👧',
    features: [
      { text: 'Child progress & academic report downloads', dot: '#34c57a' },
      { text: 'Real-time bus tracking & pickup verification', dot: '#4a9fe0' },
      { text: 'Fee balances & mobile money payments', dot: '#e0a24a' },
      { text: 'Direct messaging with teachers & staff', dot: '#34c57a' },
    ],
  },
};

export default function LoginPage({ portal, onLoginSuccess }) {
  const cfg = PORTAL_CONFIG[portal] || PORTAL_CONFIG.admin;

  // View state: 'login' | 'forgot' | 'signup'
  const [viewMode, setViewMode] = useState('login');

  // Sign In State
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [cardId,   setCardId]   = useState('');
  const [loginMethod, setLoginMethod] = useState('password');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  // Forgot Password via Phone SMS OTP State
  const [forgotPhone,       setForgotPhone]       = useState('');
  const [forgotOtp,         setForgotOtp]         = useState('');
  const [forgotNewPass,     setForgotNewPass]     = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotStep,        setForgotStep]        = useState(1); // 1: phone, 2: verify otp & new pass, 3: success
  const [generatedOtp,      setGeneratedOtp]      = useState('');

  // Sign Up State
  const [regFullName, setRegFullName] = useState('');
  const [regEmail,    setRegEmail]    = useState('');
  const [regPhone,    setRegPhone]    = useState('');
  const [regRole,     setRegRole]     = useState(portal || 'teacher');
  const [regPass,     setRegPass]     = useState('');
  const [regConfirm,  setRegConfirm]  = useState('');

  // General Form States
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

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

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
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

    try {
      if (loginMethod === 'password') {
        const result = await api.login({ email, password, portal });
        if (result.token) setAuthToken(result.token);
        const userObj = result.user || { email, role: portal };
        setAuthUser({
          ...userObj,
          fullName: userObj.fullName || userObj.full_name || userObj.name || email,
          name: userObj.fullName || userObj.name || email,
          role: userObj.role || portal,
        });
      } else if (loginMethod === 'card') {
        const result = await api.cardScan({ cardId, portal });
        if (result.token) setAuthToken(result.token);
        const userObj = result.user || { cardId, role: portal };
        setAuthUser({
          ...userObj,
          fullName: userObj.fullName || userObj.full_name || userObj.name || `Student ${cardId}`,
          name: userObj.fullName || userObj.name || `Student ${cardId}`,
          role: userObj.role || portal,
        });
      }
      setLoading(false);
      setSuccess(true);
      setTimeout(() => onLoginSuccess(), 900);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Authentication failed. Please check your credentials and try again.');
    }
  };

  // Step 1: Handle Request Phone SMS OTP
  const handleRequestSmsOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!forgotPhone.trim()) {
      setError('Please enter your registered phone number.');
      return;
    }

    setLoading(true);
    try {
      await api.requestSmsOtp({ phone: forgotPhone });
      setLoading(false);
      setForgotStep(2);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to dispatch SMS verification code. Please check your phone number.');
    }
  };

  // Step 2: Handle Verify SMS OTP Code & Reset Password
  const handleVerifyOtpAndReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!forgotOtp.trim()) {
      setError('Please enter the 6-digit SMS verification code sent to your phone.');
      return;
    }
    if (forgotOtp.trim().length !== 6) {
      setError('SMS verification code must be 6 digits.');
      return;
    }
    if (!forgotNewPass) {
      setError('Please enter a new password.');
      return;
    }
    if (forgotNewPass.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.verifyOtp({ phone: forgotPhone, identifier: forgotPhone, otp: forgotOtp.trim(), newPassword: forgotNewPass });
      setLoading(false);
      setForgotStep(3);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Verification failed. Please check the code sent to your phone.');
    }
  };

  // Handle Sign Up Submit
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!regFullName.trim()) { setError('Please enter your full name.'); return; }
    if (!regEmail.trim())    { setError('Please enter your email address.'); return; }
    if (!regPhone.trim())    { setError('Please enter your phone number.'); return; }
    if (!regPass)            { setError('Please create a password.'); return; }
    if (regPass.length < 6)  { setError('Password must be at least 6 characters long.'); return; }
    if (regPass !== regConfirm) { setError('Passwords do not match.'); return; }

    setLoading(true);

    try {
      const res = await api.registerUser({
        fullName: regFullName,
        email: regEmail,
        phone: regPhone,
        role: regRole,
        password: regPass
      });
      if (res.token) setAuthToken(res.token);
      const userPayload = {
        ...(res.user || {}),
        fullName: res.user?.fullName || res.user?.full_name || regFullName,
        name: regFullName,
        email: regEmail,
        role: regRole,
      };
      setAuthUser(userPayload);

      setLoading(false);
      setSuccess(true);
      setTimeout(() => onLoginSuccess(), 900);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Account registration failed. Please try again.');
    }
  };

  const chooseLoginMethod = (method) => {
    stopCamera();
    setLoginMethod(method);
    setError('');
  };

  const switchView = (mode) => {
    stopCamera();
    setError('');
    setForgotStep(1);
    setForgotPhone('');
    setForgotOtp('');
    setForgotNewPass('');
    setForgotConfirmPass('');
    setViewMode(mode);
  };

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-left">
        <div className="login-left__circles" />
        <div className="login-left__content">
          {/* School logo */}
          <div className="login-left__logo">
            <img className="login-left__logo-mark" src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Inspiration School - Bogoso logo" />
            <div className="login-left__logo-text">
              REMALJ
              <span>Carewell Inspiration School - Bogoso</span>
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
                {viewMode === 'signup' ? 'Account Created Successfully!' : 'Sign-in Successful!'}
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: 14 }}>
                Welcome back. Loading your portal…
              </p>
            </div>
          ) : viewMode === 'forgot' ? (
            /* Forgot Password View (Phone + SMS OTP) */
            <div className="animate-fade-up">
              <button type="button" onClick={() => switchView('login')} className="form-forgot" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                <ArrowLeft size={15} /> Back to Sign In
              </button>

              <div className="login-form__portal-badge" style={{ background: cfg.badgeBg, color: cfg.badgeCol }}>
                <span>📱</span> Phone SMS Reset
              </div>

              {forgotStep === 1 && (
                <>
                  <h2 className="login-form__title">Forgot Password?</h2>
                  <p className="login-form__subtitle">
                    Enter your registered phone number. We will send a 6-digit SMS verification code directly to your phone via SMSOnlineGH.
                  </p>

                  <form onSubmit={handleRequestSmsOtp} noValidate>
                    <div className="form-group">
                      <label className="form-label" htmlFor="forgot-phone">Phone Number</label>
                      <div className="form-input-wrap">
                        <Phone size={16} className="form-input-icon" />
                        <input
                          id="forgot-phone"
                          type="tel"
                          className="form-input"
                          placeholder="e.g. 024 111 2222 or 055 000 0000"
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>

                    {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

                    <button
                      type="submit"
                      className={`login-submit${loading ? ' login-submit--loading' : ''}`}
                      disabled={loading}
                      style={{ background: cfg.accentBg }}
                    >
                      {loading ? 'Dispatching SMS Code…' : 'Send SMS Verification Code'}
                    </button>
                  </form>
                </>
              )}

              {forgotStep === 2 && (
                <>
                  <h2 className="login-form__title">Verify Code & Reset</h2>
                  <p className="login-form__subtitle">
                    We sent a 6-digit SMS code to <strong>{forgotPhone}</strong>. Enter the SMS code and create your new password.
                  </p>

                  <div style={{ background: '#edf8f0', border: '1px solid #bbf7d0', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#166534', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MessageSquareCode size={16} /> SMS Code Sent! Check your phone for your 6-digit verification code.
                  </div>

                  <form onSubmit={handleVerifyOtpAndReset} noValidate>
                    <div className="form-group">
                      <label className="form-label" htmlFor="forgot-otp">6-Digit SMS Code</label>
                      <div className="form-input-wrap">
                        <ShieldCheck size={16} className="form-input-icon" />
                        <input
                          id="forgot-otp"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          className="form-input"
                          placeholder="e.g. 482910"
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                          autoFocus
                          style={{ letterSpacing: '0.15em', fontWeight: 800 }}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="forgot-new-pass">New Password</label>
                      <div className="form-input-wrap">
                        <Lock size={16} className="form-input-icon" />
                        <input
                          id="forgot-new-pass"
                          type={showPass ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Min. 6 characters"
                          value={forgotNewPass}
                          onChange={(e) => setForgotNewPass(e.target.value)}
                        />
                        <button type="button" className="form-input-action" onClick={() => setShowPass(!showPass)}>
                          {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="forgot-confirm-pass">Confirm New Password</label>
                      <div className="form-input-wrap">
                        <Lock size={16} className="form-input-icon" />
                        <input
                          id="forgot-confirm-pass"
                          type={showPass ? 'text' : 'password'}
                          className="form-input"
                          placeholder="Re-enter your new password"
                          value={forgotConfirmPass}
                          onChange={(e) => setForgotConfirmPass(e.target.value)}
                        />
                      </div>
                    </div>

                    {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

                    <button
                      type="submit"
                      className={`login-submit${loading ? ' login-submit--loading' : ''}`}
                      disabled={loading}
                      style={{ background: cfg.accentBg }}
                    >
                      {loading ? 'Updating Password…' : 'Verify Code & Reset Password'}
                    </button>
                  </form>
                </>
              )}

              {forgotStep === 3 && (
                <div className="card-access animate-fade-up" style={{ textAlign: 'center', padding: '24px 18px' }}>
                  <CheckCircle2 size={38} color="#16a34a" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: 18, marginBottom: 8 }}>Password Reset Successful!</h3>
                  <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 20 }}>
                    Your password has been updated. You can now sign in to your REMALJ Carewell account with your new password.
                  </p>
                  <button type="button" className="login-submit" style={{ background: cfg.accentBg }} onClick={() => switchView('login')}>
                    Sign In Now
                  </button>
                </div>
              )}
            </div>
          ) : viewMode === 'signup' ? (
            /* Sign Up View */
            <div className="animate-fade-up">
              <button type="button" onClick={() => switchView('login')} className="form-forgot" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                <ArrowLeft size={15} /> Back to Sign In
              </button>

              <div className="login-form__portal-badge" style={{ background: cfg.badgeBg, color: cfg.badgeCol }}>
                <span>📝</span> Account Registration
              </div>

              <h2 className="login-form__title">Create an Account</h2>
              <p className="login-form__subtitle">
                Register a new account to access the REMALJ Carewell portal system.
              </p>

              <form onSubmit={handleSignUpSubmit} noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-fullname">Full Name</label>
                  <div className="form-input-wrap">
                    <User size={16} className="form-input-icon" />
                    <input
                      id="reg-fullname"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Samuel Amponsah"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-email">Email Address</label>
                  <div className="form-input-wrap">
                    <Mail size={16} className="form-input-icon" />
                    <input
                      id="reg-email"
                      type="email"
                      className="form-input"
                      placeholder="e.g. s.amponsah@remaljcarewell.edu.gh"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-phone">Phone Number (for SMS alerts)</label>
                  <div className="form-input-wrap">
                    <Phone size={16} className="form-input-icon" />
                    <input
                      id="reg-phone"
                      type="tel"
                      className="form-input"
                      placeholder="e.g. 024 111 2222"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-role">Account Role / Portal</label>
                  <div className="form-input-wrap">
                    <UserCheck size={16} className="form-input-icon" />
                    <select
                      id="reg-role"
                      className="form-input"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      style={{ appearance: 'auto', cursor: 'pointer' }}
                    >
                      <option value="teacher">Staff / Teacher</option>
                      <option value="parent">Parent / Guardian</option>
                      <option value="student">Student</option>
                      <option value="admin">Administrator</option>
                      <option value="accountant">Accountant</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-pass">Create Password</label>
                  <div className="form-input-wrap">
                    <Lock size={16} className="form-input-icon" />
                    <input
                      id="reg-pass"
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Min. 6 characters"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                    />
                    <button type="button" className="form-input-action" onClick={() => setShowPass(!showPass)}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
                  <div className="form-input-wrap">
                    <Lock size={16} className="form-input-icon" />
                    <input
                      id="reg-confirm"
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="Re-enter your password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                    />
                  </div>
                </div>

                {error && <div className="form-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

                <button
                  type="submit"
                  className={`login-submit${loading ? ' login-submit--loading' : ''}`}
                  disabled={loading}
                  style={{ background: cfg.accentBg }}
                >
                  {loading ? 'Creating Account…' : 'Create Account & Sign In'}
                </button>
              </form>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-600)', marginTop: 16 }}>
                Already have an account?{' '}
                <button type="button" onClick={() => switchView('login')} className="form-forgot" style={{ fontWeight: 800 }}>
                  Sign In
                </button>
              </div>
            </div>
          ) : (
            /* Sign In View */
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

              <form onSubmit={handleLoginSubmit} noValidate>
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
                          placeholder={cfg.isStudent ? 'e.g. REMALJ-2026-001' : 'e.g. user@remaljcarewell.edu.gh'}
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
                      <button type="button" className="form-forgot" onClick={() => switchView('forgot')}>Forgot password?</button>
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
                        value={`REMALJ-CAREWELL-PORTAL-ACCESS:${portal.toUpperCase()}`}
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
                  <div className="form-error" style={{ marginBottom: 16 }}>
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

              {/* Sign Up prompt */}
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--gray-600)', marginTop: 24 }}>
                Don't have an account?{' '}
                <button type="button" onClick={() => switchView('signup')} className="form-forgot" style={{ fontWeight: 800 }}>
                  Sign Up
                </button>
              </div>

              <div className="login-footer" style={{ marginTop: 24 }}>
                REMALJ Carewell Inspiration School - Bogoso<br />
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
