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

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date };
      const existingBooking = await bookingColletion.findOne(query);
  
      if (existingBooking) {
          return res.json({ success: false, booking: existingBooking });
      }
  
      try {
          const result = await bookingColletion.insertOne(booking);
          return res.json({ success: true, result });
      } catch (error) {
          console.error(error);
          return res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
  });

    // app.get('/services', async(req, res) => {
    //     const query ={}
    //     const result = await serviceCollection.find(query).toArray();
  
    //     res.send(result);
    // })

    app.get('/available', async (req, res) => {
      const date = req.query.date;
      const services = await serviceCollection.find().toArray();
      const query = { date: date };
      const booking = await bookingColletion.find(query).toArray();
  
      services.forEach(service => {
          const serviceBookings = booking.filter(book => book.treatment === service.name);
  
          const bookedSlot = serviceBookings.map(book => book.slot);
  
          const available = service.slots.filter(slot => !bookedSlot.includes(slot));
          service.slots = available;
      });
  
      // Send the response outside the forEach loop
      res.send(services);
  });


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