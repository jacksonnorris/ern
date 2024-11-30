import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

axios.defaults.baseURL = 'http://localhost:8080';
axios.defaults.withCredentials = true;

function App() {
  const [username, setUsername] = useState('');
  const [likedCoins, setLikedCoins] = useState([]);
  const [coins, setCoins] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const coinsPerPage = 50; // Maybe Need to change because 50 is taking up too much space

  const fetchCoins = (page = 1) => {
    setLoading(true);
    axios
      .get(`/api/coins?page=${page}&perPage=${coinsPerPage}`)
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
        setLikedCoins(response.data.likedCoins);
        fetchCoins(); 
      })
      .catch((error) => {
        console.error('Login failed:', error.response?.data?.message || error.message);
      });
  };

  const logout = () => {
    axios
      .post('/logout')
      .then((response) => {
        console.log(response.data.message);
        setIsLoggedIn(false);
        setLikedCoins([]);
        setCoins([]);
      })
      .catch((error) => {
        console.error('Logout failed:', error.response?.data?.message || error.message);
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

  return (
    <div>
      {!isLoggedIn ? (
        <div>
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
        <div>
          <h1>Welcome, {username}!</h1>
          <button onClick={logout}>Logout</button>

          <h2>Liked Coins:</h2>
          <button onClick={fetchLikedCoins}>Fetch Liked Coins</button>
          <ul>
            {likedCoins.map((coin) => (
              <li key={coin.id}>
                {coin.name} - ${coin.price ? coin.price.toFixed(2) : 'N/A'}{' '}
                <button onClick={() => unlikeCoin(coin.id)}>Unlike</button>
              </li>
            ))}
          </ul>

          <h2>Available Coins:</h2>
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

          <div>
            <button
              onClick={() => fetchCoins(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => fetchCoins(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
