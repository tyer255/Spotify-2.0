import React, { useState } from 'react';
import { Mail, Lock, AlertCircle, Loader2, ChevronLeft } from 'lucide-react';
import { 
  auth, 
  loginWithGoogle 
} from '../../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { useUser } from '../../context/UserContext';

type AuthView = 'landing' | 'login' | 'signup';

export const AuthModal: React.FC = () => {
  const { firebaseUser, logoutUser, addAccount, switchAccount, savedAccounts } = useUser();
  const [viewHistory, setViewHistory] = useState<AuthView[]>(['landing']);
  const view = viewHistory[viewHistory.length - 1];

  const setView = (newView: AuthView) => {
    setViewHistory(prev => {
      if (prev[prev.length - 1] === newView) return prev;
      if (prev.length > 1 && prev[prev.length - 2] === newView) {
        return prev.slice(0, -1);
      }
      return [...prev, newView];
    });
  };

  const goBack = () => {
    if (showOtp) {
      setShowOtp(false);
      setError(null);
      return;
    }
    setViewHistory(prev => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
    setError(null);
  };
    const [showOtp, setShowOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const getReadableError = (err: any) => {
    const errorCode = err.code || '';
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/weak-password':
        return 'Your password is too weak. Please use at least 6 characters.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign in is not enabled. Please enable it in Firebase Console.';
      default:
        return err.message || 'An error occurred. Please try again.';
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (view === 'login') {
        // Attempt login to verify credentials
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Attempt signup
        await createUserWithEmailAndPassword(auth, email, password);
      }
      
      // Temporarily sign out so user context doesn't close modal before OTP
      await auth.signOut();
      
      // Generate Mock OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setShowOtp(true);
      
      // Show OTP in console and alert for testing
      console.log('Mock OTP Generated:', otp);
      alert(`MOCK EMAIL OTP SENT\n\nYour Verification Code is: ${otp}\n\n(Normally this would be sent to ${email})`);
      
    } catch (err: any) {
      setError(getReadableError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp !== generatedOtp) {
      setError('Incorrect OTP. Please try again.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Actually sign them in now
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(getReadableError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') {
        console.log("Google sign-in cancelled by user.");
      } else {
        setError('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setError('Verification email resent. Please check your inbox.');
    } catch (err: any) {
      setError('Failed to resend verification email. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (firebaseUser) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-zinc-400">
          Logged in as <strong className="text-white">{firebaseUser.email}</strong>
        </p>
        <div className="flex gap-2">
          <button
            onClick={addAccount}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 text-white py-3 px-6 rounded-full font-bold text-sm hover:bg-white/20 hover:scale-105 transition-all"
          >
            Add Account
          </button>
          <button
            onClick={logoutUser}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 text-white py-3 px-6 rounded-full font-bold text-sm hover:bg-zinc-700 hover:scale-105 transition-transform"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center min-h-[75vh] py-8 relative">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#1ed760]/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="mb-10 relative z-10">
          <svg viewBox="0 0 24 24" className="w-16 h-16 text-white" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.66 12.9c.42.18.6.78.3 1.14zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.261 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        
        <h1 className="text-[32px] font-bold text-white text-center mb-10 leading-tight drop-shadow-md relative z-10">
          Millions of songs.<br />Free on Spotiz.
        </h1>
        
        <div className="w-full space-y-3.5 flex flex-col items-center relative z-10">
          
          {savedAccounts && savedAccounts.length > 0 && (
            <div className="w-full mb-6 space-y-2">
              <p className="text-sm font-bold text-white/70 text-center mb-3">Saved Accounts</p>
              {savedAccounts.map(account => (
                <button
                  key={account.email}
                  onClick={() => switchAccount(account.email)}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 p-3 rounded-xl flex items-center gap-3 transition-colors"
                >
                  {account.avatar && account.avatar.trim() !== '' ? (
                    <img src={account.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center font-bold text-white">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col text-left flex-1 min-w-0">
                    <span className="text-white font-bold truncate">{account.name}</span>
                    <span className="text-white/60 text-xs truncate">{account.email}</span>
                  </div>
                </button>
              ))}
              <div className="h-4"></div>
            </div>
          )}

          <button 
            onClick={() => { setView('signup'); setError(null); }}
            className="w-full bg-[#1ed760]/90 backdrop-blur-md border border-[#1ed760]/40 shadow-[0_8px_32px_rgba(30,215,96,0.25)] text-black rounded-full py-[14px] font-bold hover:scale-105 active:scale-95 transition-all text-[15px] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10">Sign up free</span>
          </button>
          
          <button 
            onClick={handleGoogleAuth} 
            disabled={loading}
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-white rounded-full py-[14px] font-bold flex items-center justify-center relative hover:bg-white/10 hover:border-white/20 transition-all overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute left-6 flex items-center z-10">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <span className="text-[15px] relative z-10">Continue with Google</span>
          </button>
          
          <button 
            disabled 
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-white rounded-full py-[14px] font-bold flex items-center justify-center relative hover:bg-white/10 transition-all overflow-hidden group opacity-80"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute left-6 flex items-center z-10">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span className="text-[15px] relative z-10">Continue with Facebook</span>
            <span className="absolute right-4 text-[10px] uppercase tracking-wider bg-white/10 border border-white/10 backdrop-blur-md px-2 py-0.5 rounded text-white font-bold shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">Soon</span>
          </button>

          <button 
            disabled 
            className="w-full bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)] text-white rounded-full py-[14px] font-bold flex items-center justify-center relative hover:bg-white/10 transition-all overflow-hidden group opacity-80"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="absolute left-6 flex items-center z-10">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-white" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z" style={{display: 'none'}} />
                <path d="M16.365 14.542c-.015-3.018 2.505-4.475 2.62-4.543-1.428-2.07-3.64-2.355-4.417-2.39-1.89-.19-3.682 1.103-4.646 1.103-.956 0-2.42-1.077-3.957-1.047-2.003.028-3.85 1.15-4.877 2.912-2.083 3.571-.532 8.851 1.493 11.737.994 1.411 2.164 2.99 3.68 2.936 1.472-.056 2.03-.938 3.801-.938 1.761 0 2.274.938 3.824.908 1.579-.028 2.584-1.433 3.565-2.846 1.135-1.642 1.6-3.235 1.624-3.32-.036-.013-3.08-1.171-3.096-4.512zM14.975 7.15c.806-.967 1.35-2.31.199-3.639-1.127.045-2.534.741-3.362 1.693-.656.746-1.296 2.115-1.127 3.414 1.258.096 2.545-.601 3.29-1.468z" />
              </svg>
            </div>
            <span className="text-[15px] relative z-10">Continue with Apple</span>
            <span className="absolute right-4 text-[10px] uppercase tracking-wider bg-white/10 border border-white/10 backdrop-blur-md px-2 py-0.5 rounded text-white font-bold shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)]">Soon</span>
          </button>
        </div>

        <button 
          onClick={() => { setView('login'); setError(null); }}
          className="mt-8 text-white font-bold text-[15px] hover:text-neutral-300 transition-colors relative z-10"
        >
          Log in
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#121212]/80 sm:bg-white/5 backdrop-blur-2xl p-6 sm:p-10 rounded-3xl sm:border sm:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] max-w-md w-full mx-auto my-4 sm:my-8 relative overflow-hidden">
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#1ed760]/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#1ed760]/5 rounded-full blur-[80px] pointer-events-none"></div>

      <button 
        type="button"
        onClick={goBack} 
        className="absolute top-6 left-6 p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer z-10 bg-white/5 rounded-full backdrop-blur-md border border-white/5 hover:bg-white/10"
        title="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="text-center mb-8 mt-2 relative z-10">
        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md">
          {showOtp ? 'Verification Code' : view === 'login' ? 'Login into Spotiz' : 'Sign up for Spotiz'}
        </h2>
      </div>

      {error && (
        <div className="bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-xl p-4 mb-6 flex flex-col gap-2 relative z-10 shadow-[0_4px_16px_rgba(239,68,68,0.1)]">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-100">{error}</p>
          </div>
          {verificationSent && (
            <button 
              type="button" 
              onClick={handleResendVerification}
              className="text-xs text-[#1ed760] font-bold text-left ml-8 hover:underline"
            >
              Resend verification email
            </button>
          )}
        </div>
      )}

      {showOtp ? (
        <form onSubmit={handleOtpVerify} className="space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-white/90 ml-1">Enter OTP</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#1ed760]">
                <Lock className="h-5 w-5 text-neutral-400 group-focus-within:text-[#1ed760] transition-colors" />
              </div>
              <input
                type="text"
                value={enteredOtp || ''}
                onChange={(e) => setEnteredOtp(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-[#1ed760]/50 focus:bg-white/10 focus:ring-1 focus:ring-[#1ed760]/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] tracking-widest text-lg"
                required
              />
            </div>
            <p className="text-xs text-neutral-400 ml-1 mt-2">
              We sent a verification code to {email}.
            </p>
          </div>
          <button
            type="submit"
            disabled={loading || enteredOtp.length !== 6}
            className="w-full bg-[#1ed760]/90 backdrop-blur-md border border-[#1ed760]/40 shadow-[0_8px_32px_rgba(30,215,96,0.3)] text-black rounded-full py-4 font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center gap-2 text-[15px]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              Verify OTP
            </span>
          </button>
        </form>
      ) : (
        <form onSubmit={handleEmailAuth} className="space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-white/90 ml-1">Email address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#1ed760]">
                <Mail className="h-5 w-5 text-neutral-400 group-focus-within:text-[#1ed760] transition-colors" />
              </div>
              <input
                type="email"
                value={email || ''}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-[#1ed760]/50 focus:bg-white/10 focus:ring-1 focus:ring-[#1ed760]/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-white/90 ml-1">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#1ed760]">
                <Lock className="h-5 w-5 text-neutral-400 group-focus-within:text-[#1ed760] transition-colors" />
              </div>
              <input
                type="password"
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:border-[#1ed760]/50 focus:bg-white/10 focus:ring-1 focus:ring-[#1ed760]/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1ed760]/90 backdrop-blur-md border border-[#1ed760]/40 shadow-[0_8px_32px_rgba(30,215,96,0.3)] text-black rounded-full py-4 font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center gap-2 text-[15px]">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
              {view === 'login' ? 'Log In' : 'Sign Up'}
            </span>
          </button>
        </form>
      )}

      {!showOtp && (
        <div className="mt-8 text-center text-sm text-neutral-400 relative z-10">
          <p className="font-medium">
            {view === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setView(view === 'login' ? 'signup' : 'login');
                setError(null);
              }}
              className="text-white font-bold hover:text-[#1ed760] hover:underline transition-colors ml-1"
            >
              {view === 'login' ? 'Sign up for Spotiz' : 'Log in instead'}
            </button>
          </p>
        </div>
      )}
    </div>
  );
};
