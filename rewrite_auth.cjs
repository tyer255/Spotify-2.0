const fs = require('fs');
let code = fs.readFileSync('src/components/Auth/AuthModal.tsx', 'utf8');

// 1. Add new state variables
const stateVarsRegex = /const \[email, setEmail\] = useState\(''\);/;
const newStateVars = `  const [showOtp, setShowOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [email, setEmail] = useState('');`;
code = code.replace(stateVarsRegex, newStateVars);

// 2. Modify goBack
const goBackRegex = /const goBack = \(\) => \{[\s\S]*?setError\(null\);\n  \};/;
const newGoBack = `const goBack = () => {
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
  };`;
code = code.replace(goBackRegex, newGoBack);

// 3. Update getReadableError
const errorRegex = /const getReadableError = \([\s\S]*?return 'An error occurred\. Please try again\.';\n    \}\n  \};/;
const newError = `const getReadableError = (err: any) => {
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
  };`;
code = code.replace(errorRegex, newError);

// 4. Update handleEmailAuth
const handleAuthRegex = /const handleEmailAuth = async \([\s\S]*?setLoading\(false\);\n    \}\n  \};/;
const newHandleAuth = `const handleEmailAuth = async (e: React.FormEvent) => {
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
      alert(\`MOCK EMAIL OTP SENT\\n\\nYour Verification Code is: \${otp}\\n\\n(Normally this would be sent to \${email})\`);
      
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
  };`;
code = code.replace(handleAuthRegex, newHandleAuth);

// 5. Update form rendering
const formRegex = /<form onSubmit=\{handleEmailAuth\} className="space-y-5 relative z-10">[\s\S]*?<\/form>/;
const newForm = `{showOtp ? (
        <form onSubmit={handleOtpVerify} className="space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-white/90 ml-1">Enter OTP</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-[#1ed760]">
                <Lock className="h-5 w-5 text-neutral-400 group-focus-within:text-[#1ed760] transition-colors" />
              </div>
              <input
                type="text"
                value={enteredOtp}
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
                value={email}
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
                value={password}
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
      )}`;
code = code.replace(formRegex, newForm);

// 6. Update the title logic if OTP is shown
const titleRegex = /<h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md">[\s\S]*?<\/h2>/;
const newTitle = `<h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md">
          {showOtp ? 'Verification Code' : view === 'login' ? 'Login into Spotify 2.0' : 'Sign up for Spotify 2.0'}
        </h2>`;
code = code.replace(titleRegex, newTitle);

// 7. Hide the "Already have an account?" text when OTP is shown
const footerRegex = /<div className="mt-8 text-center text-sm text-neutral-400 relative z-10">[\s\S]*?<\/div>/;
const newFooter = `{!showOtp && (
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
              {view === 'login' ? 'Sign up for Spotify 2.0' : 'Log in instead'}
            </button>
          </p>
        </div>
      )}`;
code = code.replace(footerRegex, newFooter);

fs.writeFileSync('src/components/Auth/AuthModal.tsx', code);
