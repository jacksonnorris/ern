import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

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

  const inactivityTimer = useRef(null);

  const coinsPerPage = 50;

  const autoLogout = () => {
    console.log('User inactive for 1 hour');
    logout();
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(autoLogout, 60 * 60 * 1000); // 1 hour
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
        console.log(response.data.message);
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
        console.log('Fetched liked coins:', response.data);
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
        console.log(response.data.message);
        setLikedCoins(response.data.likedCoins);
      })
      .catch((error) => {
        console.error('Error liking the coin:', error.response?.data?.message || error.message);
      });
  };

  const unlikeCoin = (coinId) => {
    axios
      .delete(`/like/${coinId}`)
      .then((response) => {
        console.log(response.data.message);
        setLikedCoins(response.data.likedCoins);
      })
      .catch((error) => {
        console.error('Error unliking the coin:', error.response?.data?.message || error.message);
      });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCoins(1, searchQuery);
    }, 300); // Delay to reduce API calls because of rate limit for the Gecko API

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
      {!isLoggedIn ? (
        <div className="login-container">
          <h1>Login</h1>
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <div className="dashboard-container">
          <header>
            <h1>Welcome, {username}!</h1>
            <button onClick={logout}>Logout</button>
          </header>

          <section>
            <h2>Liked Coins</h2>
            <button onClick={fetchLikedCoins}>Refresh Liked Coins</button>
            <ul>
              {likedCoins.map((coin) => (
                <li key={coin.id}>
                  {coin.name} - ${coin.price ? coin.price.toFixed(2) : 'N/A'}
                  <button onClick={() => unlikeCoin(coin.id)}>Unlike</button>
                </li>
              ))}
            </ul>
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
              <p>Loading...</p>
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
                      <td>{coin.name}</td>
                      <td>${coin.current_price ? coin.current_price.toFixed(2) : 'N/A'}</td>
                      <td>${coin.market_cap ? coin.market_cap.toLocaleString() : 'N/A'}</td>
                      <td>
                        <button onClick={() => likeCoin(coin.id)}>Like</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="pagination-controls">
              <button
                onClick={() => fetchCoins(currentPage - 1, searchQuery)}
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
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
