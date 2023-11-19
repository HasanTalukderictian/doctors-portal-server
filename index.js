const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config()

const { MongoClient, ServerApiVersion } = require('mongodb');

//DoctorsPortal
//Bookings

app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://potralDoctor:fgY1bgeYoc59kzA0@cluster0.vtmwivk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const bookingColletion = client.db("DoctorsPortal").collection("bookings");
    const serviceCollection = client.db("DoctorsPortal").collection("services");

    app.post('/bookings/:id', async(req, res) => {
        const id = req.body.id;
        const booking = req.body;
        console.log(booking);
        const result = await bookingColletion.insertOne(booking);
        res.send(result);
    })

    app.get('/services', async(req, res) => {
        const query ={}
        const result = await serviceCollection.find(query).toArray();
  
        res.send(result);
    })


    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})