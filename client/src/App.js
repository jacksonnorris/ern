import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import logo from './CryptoTrackerLogo.png'

axios.defaults.baseURL = 'http://localhost:8080';
axios.defaults.withCredentials = true;

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likedCoins, setLikedCoins] = useState([]);
  const [coins, setCoins] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const inactivityTimer = useRef(null);
  const coinsPerPage = 25;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const autoLogout = () => {
    console.log('User inactive for 1 hour');
    logout();
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(autoLogout, 60 * 60 * 1000);
  };

  useEffect(() => {
    if (isLoggedIn) {
      window.addEventListener('mousemove', resetInactivityTimer);
      window.addEventListener('keypress', resetInactivityTimer);
      resetInactivityTimer();

      return () => {
        window.removeEventListener('mousemove', resetInactivityTimer);
        window.removeEventListener('keypress', resetInactivityTimer);
        if (inactivityTimer.current) {
          clearTimeout(inactivityTimer.current);
        }
      };
    }
  }, [isLoggedIn]);

  const fetchCoins = (page = 1, query = '') => {
    setLoading(true);
    axios
      .get(`/api/coins?page=${page}&perPage=${coinsPerPage}&search=${query}`)
      .then((response) => {
        setCoins(response.data.coins);
        setTotalPages(response.data.totalPages);
        setCurrentPage(page);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching coins:', error.message);
        setLoading(false);
      });
  };

  const login = () => {
    axios
      .post('/login', { username })
      .then((response) => {
        setIsLoggedIn(true);
        fetchCoins();
        setLikedCoins(response.data.likedCoins);
      })
      .catch((error) => {
        console.error('Login failed:', error.response?.data?.message || error.message);
      });
  };

  const logout = () => {
    axios
      .post('/logout')
      .then(() => {
        setIsLoggedIn(false);
        setUsername('');
        setLikedCoins([]);
        setCoins([]);
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  };

  const fetchLikedCoins = () => {
    axios
      .get('/liked-coins')
      .then((response) => {
        setLikedCoins(response.data);
      })
      .catch((error) => {
        console.error('Error fetching liked coins:', error.response?.data?.message || error.message);
      });
  };

  const likeCoin = (coinId) => {
    axios
      .post(`/like/${coinId}`)
      .then((response) => {
        setLikedCoins(response.data.likedCoins);
      })
      .catch((error) => {
        console.error('Error liking coin:', error.response?.data?.message || error.message);
      });
  };

  const unlikeCoin = (coinId) => {
    axios
      .delete(`/like/${coinId}`)
      .then((response) => {
        setLikedCoins(response.data.likedCoins);
      })
      .catch((error) => {
        console.error('Error unliking coin:', error.response?.data?.message || error.message);
      });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCoins(1, searchQuery);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    axios
      .get('/check-session')
      .then((response) => {
        if (response.data.loggedIn) {
          setUsername(response.data.username);
          setIsLoggedIn(true);
          fetchLikedCoins();
          fetchCoins();
        }
      })
      .catch((error) => {
        console.error('Error checking session:', error);
      });
  }, []);

  return (
    <div className="app-container">
      <button 
        className="theme-toggle" 
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {!isLoggedIn ? (
        <div className="login-page">
          <div className="login-split">
            <div className="brand-side">
              <div className="brand-content">
              <div className="logo">
                <img src={logo} alt="CryptoTracker Logo" className="crypto-logo" />
                <h1>CryptoTracker</h1>
              </div>
                <div className="brand-description">
                  <h2>Track Your Crypto Portfolio</h2>
                  <p>Welcome to CryptoTracker, where real-time cryptocurrency tracking meets simplicity. Stay ahead of the market with live price updates, customizable watchlists, and comprehensive market data, all in one place!</p>
                  <p>Current features include: </p>
                  <ul className="feature-list">
                    <li>Personalized watchlists</li>
                    <li>Track market caps, volume, and supply in real time</li>
                    <li>Live and reliable price updates with 24h trends</li>
                    <li>Simple interface for beginners and experts</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="login-side">
              <div className="login-form">
                <h2>Login</h2>
                <p>Enter your username to continue</p>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="login-input"
                  />
                </div>
                <button className="login-button" onClick={login}>
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-container">
          <header>
            <div className="header-left">
              <img src={logo} alt="CryptoTracker Logo" className="dashboard-logo" />
              <h1>Welcome, {username}!</h1>
            </div>
            <button className="danger" onClick={logout}>Logout</button>
          </header>

          <section>
            <h2>Liked Coins</h2>
            <button className="primary" onClick={fetchLikedCoins}>Refresh Liked Coins</button>
            {likedCoins.length === 0 ? (
              <p>No liked coins yet</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Market Cap</th>
                    <th>24h Change</th>
                    <th>Volume</th>
                    <th>Supply</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {likedCoins.map((coin) => (
                    <tr key={coin.id}>
                      <td className="name">{coin.name}</td>
                      <td className="price">${coin.current_price ? coin.current_price.toFixed(2) : 'N/A'}</td>
                      <td className="mcap">${coin.market_cap ? coin.market_cap.toLocaleString() : 'N/A'}</td>
                      <td className={coin.price_change_percentage_24h >= 0 ? 'positive-change' : 'negative-change'}>
                        {coin.price_change_percentage_24h ? `${coin.price_change_percentage_24h.toFixed(2)}%` : 'N/A'}
                      </td>
                      <td className="vol">${coin.total_volume ? coin.total_volume.toLocaleString() : 'N/A'}</td>
                      <td className="supply">{coin.circulating_supply ? coin.circulating_supply.toLocaleString() : 'N/A'}</td>
                      <td>
                        <button className="danger" onClick={() => unlikeCoin(coin.id)}>Unlike</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section>
            <h2>Available Coins</h2>
            <input
              type="text"
              placeholder="Search for a coin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-bar"
            />
            {loading ? (
              <div className="loading"></div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Market Cap</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin) => (
                    <tr key={coin.id}>
                      <td className="name">{coin.name}</td>
                      <td className="price">${coin.current_price ? coin.current_price.toFixed(2) : 'N/A'}</td>
                      <td className="mcap">${coin.market_cap ? coin.market_cap.toLocaleString() : 'N/A'}</td>
                      <td>
                        <button className="primary" onClick={() => likeCoin(coin.id)}>Like</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="pagination-controls">
              <button
                className="primary"
                onClick={() => fetchCoins(currentPage - 1, searchQuery)}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                className="primary"
                onClick={() => fetchCoins(currentPage + 1, searchQuery)}
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;