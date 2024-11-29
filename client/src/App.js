import axios from 'axios';
import './App.css';

const host = "http://localhost:8080";

const coinCall = () => {
  axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1').then((data) => {
    console.log(data);
  })
}

const likeCoin = () => {
  axios.post(`${host}/like/1`);
}

function getCookie(cookie_name) {
  let name = cookie_name + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

const create_UUID = () => {
  var dt = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (
    c
  ) {
    var r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}

const generateCookie = () => {
  let cookie = getCookie("UUID");
  if (cookie == "") {
    let cookie_id = create_UUID();
    let cookie_expiration = 365;

    const d = new Date();
    d.setTime(d.getTime() + cookie_expiration * 24 * 60 * 60 * 1000);
    let expires = ";expires=" + d.toUTCString();
    document.cookie =
      "UUID" +
      "=" +
      cookie_id +
      ";" +
      cookie_expiration +
      ";path=/" +
      expires;
  }
}

function App() {
  return (
    <div className="App">
      <header className="App-header">

        <button onClick={coinCall}>Make API Call</button>

        <button onClick={likeCoin}>Like a Coin</button>

        <button onClick={generateCookie}>Generate a cookie</button>

      </header>
    </div>
  );
}

export default App;
