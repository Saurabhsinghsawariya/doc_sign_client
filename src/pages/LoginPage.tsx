import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface ValidationErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('userToken');
    if (token) {
      navigate('/dashboard');
    }

    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    setError('');
    setValidationErrors({});
  }, [navigate]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) return;

    if (loginAttempts >= 5) {
      setError('Too many failed login attempts. Please wait a few minutes before trying again.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          email: email.trim().toLowerCase(),
          password,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem(
        'userInfo',
        JSON.stringify({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
        })
      );
      setLoginAttempts(0);
      navigate('/dashboard');
    } catch (err) {
      setLoginAttempts((prev) => prev + 1);

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (err.code === 'ECONNABORTED') {
          setError('Login timed out. Please check your connection and try again.');
        } else if (status === 401) {
          setError('Invalid email or password.');
        } else if (status === 429) {
          setError('Too many login attempts. Please wait and try again.');
        } else if (status === 403) {
          setError('Your account is locked. Contact support.');
        } else if (status && status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        }
      } else {
        setError('Unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Forgot password functionality would be implemented here. Please contact support for now.');
  };

  const getRemainingAttempts = (): number => Math.max(0, 5 - loginAttempts);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-2 sm:p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-10 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <span className="text-5xl sm:text-6xl mb-2 animate-bounce-slow select-none">🔐</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">Welcome Back</h2>
          <p className="text-gray-600 text-sm mt-2 text-center">Sign in to access your documents</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate autoComplete="on">
          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 transition ${
                validationErrors.email
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">⚠️ {validationErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className={`block w-full px-4 py-3 pr-12 border rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 transition ${
                  validationErrors.password
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center">⚠️ {validationErrors.password}</p>
            )}
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
              <span className="ml-2">Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-indigo-600 hover:underline"
              disabled={isLoading}
            >
              Forgot password?
            </button>
          </div>

          {/* Login Attempts */}
          {loginAttempts > 0 && loginAttempts < 5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-700 text-sm">⚠️ {getRemainingAttempts()} login attempt(s) remaining</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">🚨 {error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || loginAttempts >= 5}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg shadow transition duration-200"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-sm text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Create one here
          </Link>
        </div>

        <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700 text-center">
          🔒 Your login is secured with industry-standard encryption
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 text-center">
          💡 <strong>Demo:</strong> Use any valid email format and password to explore the app
        </div>
      </div>

      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: none; }
          }
          .animate-fade-in {
            animation: fade-in 0.8s ease-in-out both;
          }
          @keyframes bounce-slow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-12px); }
          }
          .animate-bounce-slow {
            animation: bounce-slow 2.2s infinite;
          }
        `}
      </style>
    </div>
  );
};

export default LoginPage;
