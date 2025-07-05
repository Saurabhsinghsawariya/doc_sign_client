import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear form on mount
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setValidationErrors({});
  }, []);

  // Password strength calculation
  useEffect(() => {
    const calculatePasswordStrength = (pwd: string): number => {
      let strength = 0;
      if (pwd.length >= 8) strength += 1;
      if (/[a-z]/.test(pwd)) strength += 1;
      if (/[A-Z]/.test(pwd)) strength += 1;
      if (/[0-9]/.test(pwd)) strength += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;
      return strength;
    };

    setPasswordStrength(calculatePasswordStrength(password));
  }, [password]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Name validation
    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (name.trim().length > 50) {
      errors.name = 'Name must be less than 50 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 3) {
      errors.password = 'Password is too weak. Include uppercase, lowercase, numbers, and special characters';
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
        { 
          name: name.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      // Store user data
      localStorage.setItem('userToken', response.data.token);
      localStorage.setItem('userInfo', JSON.stringify({
        _id: response.data._id,
        name: response.data.name,
        email: response.data.email,
      }));

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ECONNABORTED') {
          setError('Registration timed out. Please check your connection and try again.');
        } else if (err.response?.status === 409) {
          setError('An account with this email already exists. Please use a different email or try logging in.');
        } else if (err.response?.status === 400) {
          setError(err.response.data?.message || 'Invalid registration data. Please check your information.');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(err.response?.data?.message || 'Registration failed. Please try again.');
        }
      } else {
        setError('An unexpected error occurred. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = (): string => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = (): string => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Good';
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-2 sm:p-6">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-10 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <span className="text-5xl sm:text-6xl mb-2 animate-bounce-slow select-none">📝</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center">Create Account</h2>
          <p className="text-gray-600 text-sm mt-2 text-center">Join DocuSignify to manage your documents</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} autoComplete="on" noValidate>
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 transition sm:text-base ${
                  validationErrors.name 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                disabled={isLoading}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {validationErrors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 transition sm:text-base ${
                  validationErrors.email 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                }`}
                disabled={isLoading}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`block w-full px-4 py-3 pr-12 border rounded-lg shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 transition sm:text-base ${
                    validationErrors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  disabled={isLoading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-600 min-w-[60px]">
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                </div>
              )}
              
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {validationErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full px-4 py-3 pr-12 border rounded-lg shadow-sm placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 transition sm:text-base ${
                    validationErrors.confirmPassword 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : confirmPassword && password === confirmPassword
                        ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
              
              {/* Password Match Indicator */}
              {confirmPassword && (
                <div className="mt-1 flex items-center">
                  {password === confirmPassword ? (
                    <span className="text-sm text-green-600 flex items-center">
                      <span className="mr-1">✅</span>
                      Passwords match
                    </span>
                  ) : (
                    <span className="text-sm text-red-600 flex items-center">
                      <span className="mr-1">❌</span>
                      Passwords don't match
                    </span>
                  )}
                </div>
              )}
              
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {validationErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* General Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm flex items-center">
                <span className="mr-2">🚨</span>
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 focus:ring-opacity-75 text-base flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-sm text-center mt-6">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-medium text-indigo-600 hover:text-indigo-500 transition underline-offset-4 hover:underline"
          >
            Sign in here
          </Link>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            🔒 Your information is encrypted and secure. We never share your data with third parties.
          </p>
        </div>
      </div>

      <style>
        {`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: none; }
          }
          .animate-fade-in {
            animation: fade-in 0.8s cubic-bezier(.4,0,.2,1) both;
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

export default RegisterPage;