import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const features = [
    {
      icon: '📝',
      title: 'Digital Signatures',
      description: 'Create legally binding digital signatures with multiple input methods'
    },
    {
      icon: '🔒',
      title: 'Secure Storage',
      description: 'Bank-level encryption keeps your documents safe and accessible'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Upload, sign, and share documents in seconds, not hours'
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description: 'Sign documents anywhere, anytime, on any device'
    }
  ];



  useEffect(() => {
    // Check if user is already logged in - only run once on mount
    const token = localStorage.getItem('userToken');
    setIsLoggedIn(!!token);

    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    return () => {
      clearTimeout(timer);
    };
  }, []); // Empty dependency array - only run once on mount

  useEffect(() => {
    // Rotate features every 3 seconds
    const featureTimer = setInterval(() => {
      setCurrentFeature(prev => (prev + 1) % features.length);
    }, 3000);

    return () => {
      clearInterval(featureTimer);
    };
  }, [features.length]); // Only depend on features.length which is stable

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">📝</span>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                DocuSignify
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-indigo-600 transition font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 hover:text-indigo-600 transition font-medium"
              >
                Testimonials
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-indigo-600 transition font-medium"
              >
                Pricing
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {isLoggedIn ? (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-indigo-600 transition font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition transform hover:scale-105"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="mb-8">
              <span className="text-8xl sm:text-9xl animate-bounce-slow select-none">📝</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Sign Documents
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Digitally & Securely
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your document workflow with our powerful, secure, and intuitive digital signing platform. 
              <span className="font-semibold text-indigo-600"> Join thousands of professionals</span> who trust DocuSignify.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition duration-200 text-lg"
                  >
                    <span className="mr-2">🚀</span>
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/upload')}
                    className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-indigo-500 text-indigo-700 font-semibold rounded-xl shadow-lg transform hover:scale-105 transition duration-200 text-lg hover:bg-indigo-50"
                  >
                    <span className="mr-2">📄</span>
                    Upload Document
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition duration-200 text-lg"
                  >
                    <span className="mr-2">🚀</span>
                    Start Free Trial
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-4 bg-white border-2 border-indigo-500 text-indigo-700 font-semibold rounded-xl shadow-lg transform hover:scale-105 transition duration-200 text-lg hover:bg-indigo-50"
                  >
                    <span className="mr-2">👋</span>
                    Welcome Back
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-500 text-sm">
              <div className="flex items-center space-x-2">
                <span>🔒</span>
                <span>Bank-Level Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>⚡</span>
                <span>Lightning Fast</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>✅</span>
                <span>Legally Binding</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>🌍</span>
                <span>Global Compliance</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Powerful Features for
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Modern Teams</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to streamline your document signing process and boost productivity
            </p>
          </div>

          {/* Feature Showcase */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-2xl transition-all duration-500 cursor-pointer ${
                    currentFeature === index 
                      ? 'bg-indigo-50 border-2 border-indigo-200 shadow-lg transform scale-105' 
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <span className="text-4xl">{feature.icon}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">{features[currentFeature].icon}</span>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{features[currentFeature].title}</h3>
                    <p className="text-gray-600">{features[currentFeature].description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: '📋', title: 'Multiple Formats', desc: 'PDF, Word, Excel support' },
              { icon: '✍️', title: 'Draw Signatures', desc: 'Natural signature drawing' },
              { icon: '📤', title: 'Upload Images', desc: 'Use existing signatures' },
              { icon: '⌨️', title: 'Type Signatures', desc: 'Beautiful font options' },
              { icon: '📱', title: 'Mobile Optimized', desc: 'Perfect on any device' },
              { icon: '🔄', title: 'Real-time Sync', desc: 'Instant updates everywhere' },
              { icon: '📊', title: 'Analytics', desc: 'Track document status' },
              { icon: '🌐', title: 'Cloud Storage', desc: 'Access from anywhere' }
            ].map((item, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                <span className="text-3xl mb-3 block">{item.icon}</span>
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Simple,
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"> Transparent Pricing</span>
            </h2>
            <p className="text-xl text-gray-600">Choose the plan that's right for you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                period: 'Forever',
                features: ['5 documents/month', 'Basic signatures', 'Email support', 'Mobile app'],
                cta: 'Get Started',
                popular: false
              },
              {
                name: 'Professional',
                price: '$19',
                period: 'per month',
                features: ['Unlimited documents', 'Advanced signatures', 'Priority support', 'Team collaboration', 'Analytics'],
                cta: 'Start Free Trial',
                popular: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: 'Contact us',
                features: ['Everything in Pro', 'Custom integrations', 'Dedicated support', 'Advanced security', 'SLA guarantee'],
                cta: 'Contact Sales',
                popular: false
              }
            ].map((plan, index) => (
              <div key={index} className={`relative rounded-2xl p-8 ${plan.popular ? 'bg-indigo-600 text-white shadow-2xl transform scale-105' : 'bg-gray-50 text-gray-900'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className={`text-sm ${plan.popular ? 'text-indigo-200' : 'text-gray-600'}`}>
                      {plan.period && ` ${plan.period}`}
                    </span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <span className="mr-2">✅</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                    plan.popular 
                      ? 'bg-white text-indigo-600 hover:bg-gray-100' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Document Workflow?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of professionals who have streamlined their document signing process with DocuSignify
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg transform hover:scale-105 transition duration-200 text-lg"
              >
                <span className="mr-2">🚀</span>
                Access Your Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-xl shadow-lg transform hover:scale-105 transition duration-200 text-lg"
                >
                  <span className="mr-2">🚀</span>
                  Start Your Free Trial
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl shadow-lg transform hover:scale-105 transition duration-200 text-lg hover:bg-white hover:text-indigo-600"
                >
                  <span className="mr-2">👋</span>
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">📝</span>
                <span className="text-xl font-bold">DocuSignify</span>
              </div>
              <p className="text-gray-400">
                Secure, fast, and reliable document signing for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} DocuSignify. All rights reserved. Built with ❤️ Saurabh_Singh</p>
          </div>
        </div>
      </footer>

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
          html {
            scroll-behavior: smooth;
          }
        `}
      </style>
    </div>
  );
};

export default HomePage;