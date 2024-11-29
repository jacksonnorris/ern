const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello from our server!')
})

app.listen(8080, () => {
    console.log('server listening on port 8080')
})


// like a coin
app.post('/like/:id', (req, res) => {
    res.send("you have liked a coin");
})