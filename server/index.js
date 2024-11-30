const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');

const app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(
  session({
    secret: 'hJf73#9LmXpz!4QaB@d6WrkTY$Xv2&CE', // Random Key (should use a env file in the future)
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, 
  })
);

let cachedCoins = null;
let cacheTimestamp = 0;

const userPreferences = {};

app.get('/api/coins', async (req, res) => {
  const { page = 1, perPage = 50 } = req.query;
  const now = Date.now();

  if (cachedCoins && now - cacheTimestamp < 60 * 1000) {
    console.log('Serving coins from cache');
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return res.status(200).json({
      coins: cachedCoins.slice(start, end),
      totalPages: Math.ceil(cachedCoins.length / perPage),
    });
  }

  try {
    console.log(`Fetching coins from CoinGecko: Page ${page}, Per Page ${perPage}`);
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets',
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250, 
          page: 1, // Always fetch the first page for caching
        },
      }
    );

    cachedCoins = response.data;
    cacheTimestamp = now;

    const start = (page - 1) * perPage;
    const end = start + perPage;
    res.status(200).json({
      coins: cachedCoins.slice(start, end),
      totalPages: Math.ceil(cachedCoins.length / perPage),
    });
  } catch (error) {
    console.error('Error fetching coins from CoinGecko:', error.message);
    if (error.response) {
      console.error('CoinGecko API Response:', error.response.data);
    }
    res.status(500).json({ message: 'Failed to fetch coins' });
  }
});

app.post('/login', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username required' });
  }

  req.session.username = username;
  if (!userPreferences[username]) {
    userPreferences[username] = { likedCoins: [] };
  }

  res.status(200).json({
    message: `Welcome, ${username}!`,
    likedCoins: userPreferences[username].likedCoins,
  });
});

app.post('/like/:id', async (req, res) => {
  const username = req.session.username;
  if (!username) return res.status(401).json({ message: 'User not logged in' });

  const coinId = req.params.id;
  const likedCoins = userPreferences[username].likedCoins;

  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets',
      { params: { vs_currency: 'usd', ids: coinId } }
    );

    const coinData = response.data[0];
    if (!likedCoins.some((coin) => coin.id === coinId)) {
      likedCoins.push({
        id: coinId,
        name: coinData.name,
        price: coinData.current_price,
      });
    }

    res.status(200).json({ likedCoins });
  } catch (error) {
    console.error('Error liking coin:', error.message);
    res.status(500).json({ message: 'Failed to like coin' });
  }
});

app.get('/liked-coins', (req, res) => {
  const username = req.session.username;
  if (!username) return res.status(401).json({ message: 'User not logged in' });

  res.status(200).json(userPreferences[username].likedCoins);
});

app.delete('/like/:id', (req, res) => {
  const username = req.session.username;
  if (!username) return res.status(401).json({ message: 'User not logged in' });

  const coinId = req.params.id;
  const likedCoins = userPreferences[username].likedCoins;

  userPreferences[username].likedCoins = likedCoins.filter(
    (coin) => coin.id !== coinId
  );

  res.status(200).json({ likedCoins: userPreferences[username].likedCoins });
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Failed to destroy session:', err);
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

app.listen(8080, () => {
  console.log('Server listening on port 8080');
});
