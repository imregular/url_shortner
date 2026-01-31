import { useState } from 'react';
import { shortenUrl, getUrlStats } from './api';

function App() {
  const [longUrl, setLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setStats(null);

    if (!longUrl.trim()) {
      setError('Please enter a URL');
      return;
    }

    try {
      new URL(longUrl);
    } catch {
      setError('Please enter a valid URL (include http:// or https://)');
      return;
    }

    setIsLoading(true);

    try {
      const data = await shortenUrl(longUrl, customCode || null);
      setResult(data);
      setLongUrl('');
      setCustomCode('');
    } catch (err) {
      setError(err.message || 'Failed to shorten URL. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.data.shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleViewStats = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getUrlStats(result.data.shortCode);
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch stats');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl">
        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-8 shadow-2xl animate-slide-up border-blue-500/20">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
            URL Shortener
          </h1>
          <p className="text-center text-gray-300 mb-8">
            Transform long URLs into short, shareable links
          </p>

          <div className="space-y-4">
            {/* Long URL Input */}
            <div>
              <label htmlFor="longUrl" className="block text-sm font-medium text-gray-300 mb-2">
                Enter your long URL
              </label>
              <input
                type="text"
                id="longUrl"
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value)}
                placeholder="https://example.com/very/long/url"
                className="w-full px-4 py-3 bg-black/30 border border-blue-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Custom Code Input */}
            <div>
              <label htmlFor="customCode" className="block text-sm font-medium text-gray-300 mb-2">
                Custom short code (optional)
              </label>
              <input
                type="text"
                id="customCode"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="my-custom-link"
                className="w-full px-4 py-3 bg-black/30 border border-blue-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave empty to generate a hash-based code
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Shorten URL'
              )}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mt-6 animate-fade-in">
            <div className="glass rounded-2xl p-6 border-red-500/30">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/20 rounded-full p-2">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-red-200 font-medium flex-1">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && !stats && (
          <div className="mt-6 animate-slide-up">
            <div className="glass rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-green-500/20 rounded-full p-3">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-center mb-2 text-white">
                URL Shortened Successfully!
              </h2>
              <p className="text-center text-gray-300 mb-6">
                Your short link is ready to share
              </p>

              {/* Short URL Display */}
              <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-400 mb-1">Short URL</p>
                <a
                  href={result.data.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-lg break-all transition-colors"
                >
                  {result.data.shortUrl}
                </a>
              </div>

              {/* Original URL */}
              <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-400 mb-1">Original URL</p>
                <p className="text-gray-300 text-sm break-all">{result.data.longUrl}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-blue-500/30 hover:border-blue-400/50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>

                <button
                  onClick={handleViewStats}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Stats
                </button>
              </div>

              <button
                onClick={() => setResult(null)}
                className="w-full mt-4 text-gray-400 hover:text-white transition-colors py-2 text-sm"
              >
                Create another short link
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="mt-6 animate-slide-up">
            <div className="glass rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">URL Statistics</h2>
                <button
                  onClick={() => setStats(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Click Count */}
                <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/30 rounded-lg p-3">
                      <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Total Clicks</p>
                      <p className="text-3xl font-bold text-white">{stats.data.clickCount}</p>
                    </div>
                  </div>
                </div>

                {/* Created Date */}
                <div className="bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-500/30 rounded-lg p-3">
                      <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Created</p>
                      <p className="text-sm font-semibold text-white">{formatDate(stats.data.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* URL Details */}
              <div className="space-y-4">
                <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Short Code</p>
                  <p className="text-white font-mono text-lg">{stats.data.shortCode}</p>
                </div>

                <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Original URL</p>
                  <a
                    href={stats.data.longUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 break-all transition-colors"
                  >
                    {stats.data.longUrl}
                  </a>
                </div>
              </div>

              <button
                onClick={() => setStats(null)}
                className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-blue-500/30 hover:border-blue-400/50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-400 text-sm">
          <p>Built with React + Tailwind CSS</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
