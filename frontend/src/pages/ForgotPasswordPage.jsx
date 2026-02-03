import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [resetLink, setResetLink] = useState(''); // For development testing

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResetLink('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email,
      });

      if (response.data.success) {
        setSubmitted(true);
        // Store reset link if returned (development mode)
        if (response.data.resetLink) {
          setResetLink(response.data.resetLink);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Check Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>📧 Didn't receive the email?</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 space-y-1 text-left list-disc list-inside">
                <li>Check your spam/junk folder</li>
                <li>Wait a few minutes for the email to arrive</li>
                <li>Make sure you entered the correct email</li>
                <li>The link expires in 15 minutes</li>
              </ul>
            </div>
            
            {/* Development mode: Show reset link directly */}
            {resetLink && (
              <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800 font-semibold mb-2">
                  🔧 Development Mode - Reset Link:
                </p>
                <a 
                  href={resetLink}
                  className="text-sm text-primary hover:text-secondary break-all underline"
                >
                  Click here to reset password
                </a>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Try Another Email
              </button>
              <Link
                to="/login"
                className="block w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-lg hover:shadow-lg transition"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <Link
            to="/login"
            className="inline-flex items-center text-primary hover:text-secondary transition mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="your.email@college.edu"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg transform hover:scale-105'
              } transition-all`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          Remember your password?{' '}
          <Link to="/login" className="font-semibold text-primary hover:text-secondary transition">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;