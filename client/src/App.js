import axios from 'axios';
import './App.css';

const coinCall = () => {
  axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1').then((data) => {
    console.log(data);
  })
}

function App() {
  return (
    <div className="App">
      <header className="App-header">

        <button onClick={coinCall}>Make API Call</button>

      </header>
    </div>
  );
}

export default App;
