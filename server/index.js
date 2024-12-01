const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(
  session({
    secret: 'hJf73#9LmXpz!4QaB@d6WrkTY$Xv2&CE', //random string but should change in future for better security
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, 
      httpOnly: true,
      maxAge: 60 * 60 * 1000, // 1 hour expiration
    },
  })
);

const mongoURI = 'mongodb+srv://dannyw0717:388VrMxIBbWhvzlN@cluster0.i9sex.mongodb.net/cryptoApp?retryWrites=true&w=majority';
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to Dannys MongoDB :)');
    app.listen(8080, () => {
      console.log('Server listening on port 8080');
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

  const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    likedCoins: [
      {
        id: String,
        name: String,
        current_price: Number,
        market_cap: Number,
        price_change_percentage_24h: Number,
        total_volume: Number,
        circulating_supply: Number
      },
    ],
  });

const User = mongoose.model('User', UserSchema);

let cachedCoins = null;
let cacheTimestamp = 0;

app.get('/api/coins', async (req, res) => {
  const { page = 1, perPage = 50, search = '' } = req.query;
  const now = Date.now();

  if (cachedCoins && now - cacheTimestamp < 60 * 1000) {
    console.log('Serving coins from cache');
    let filteredCoins = cachedCoins;

    if (search) {
      filteredCoins = cachedCoins.filter((coin) =>
        coin.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    return res.status(200).json({
      coins: filteredCoins.slice(start, end),
      totalPages: Math.ceil(filteredCoins.length / perPage),
    });
  }

  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets',
      {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: 250,
          page: 1,
        },
      }
    );

    cachedCoins = response.data;
    cacheTimestamp = now;

    let filteredCoins = cachedCoins;

    if (search) {
      filteredCoins = cachedCoins.filter((coin) =>
        coin.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const start = (page - 1) * perPage;
    const end = start + perPage;
    res.status(200).json({
      coins: filteredCoins.slice(start, end),
      totalPages: Math.ceil(filteredCoins.length / perPage),
    });
  } catch (error) {
    console.error('Error fetching coins from CoinGecko:', error.message);
    res.status(500).json({ message: 'Failed to fetch coins' });
  }
});

app.post('/login', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username, likedCoins: [] });
      await user.save();
    }

    req.session.username = username; 
    res.status(200).json({
      message: `Welcome, ${username}!`,
      likedCoins: user.likedCoins,
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Failed to log in' });
  }
});

app.get('/check-session', (req, res) => {
  if (req.session.username) {
    res.status(200).json({
      loggedIn: true,
      username: req.session.username,
    });
  } else {
    res.status(200).json({
      loggedIn: false,
    });
  }
});

app.post('/like/:id', async (req, res) => {
  const username = req.session.username;
  if (!username) return res.status(401).json({ message: 'User not logged in' });

  const coinId = req.params.id;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isAlreadyLiked = user.likedCoins.some((coin) => coin.id === coinId);
    if (!isAlreadyLiked) {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/markets',
        { params: { vs_currency: 'usd', ids: coinId } }
      );

      const coinData = response.data[0];
      user.likedCoins.push({
        id: coinId,
        name: coinData.name,
        current_price: coinData.current_price,
        market_cap: coinData.market_cap,
        price_change_percentage_24h: coinData.price_change_percentage_24h,
        total_volume: coinData.total_volume,
        circulating_supply: coinData.circulating_supply
      });

      await user.save();
    }

    res.status(200).json({ likedCoins: user.likedCoins });
  } catch (error) {
    console.error('Error liking coin:', error.message);
    res.status(500).json({ message: 'Failed to like coin' });
  }
});

app.delete('/like/:id', async (req, res) => {
  const username = req.session.username;
  if (!username) return res.status(401).json({ message: 'User not logged in' });

  const coinId = req.params.id;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.likedCoins = user.likedCoins.filter((coin) => coin.id !== coinId);
    await user.save();

    res.status(200).json({ likedCoins: user.likedCoins });
  } catch (error) {
    console.error('Error unliking coin:', error);
    res.status(500).json({ message: 'Failed to unlike coin' });
  }
});

app.get('/liked-coins', async (req, res) => {
  const username = req.session.username;
  if (!username) return res.status(401).json({ message: 'User not logged in' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user.likedCoins);
  } catch (error) {
    console.error('Error fetching liked coins:', error);
    res.status(500).json({ message: 'Failed to fetch liked coins' });
  }
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
