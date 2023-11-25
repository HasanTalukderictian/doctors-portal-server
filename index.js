const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config()
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

//DoctorsPortal
//Bookings



app.use(cors())
app.use(express.json())



const verifyJwt = (req, res, next) => {
  console.log('hitting VerifyJwt');

  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'unauthorized access' });
  }
  // bearer token
  const token = authorization.split(' ')[1];

  // console.log('token inside verify jwt', token);
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ error: true, message: 'unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}



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
    const usersCollection = client.db("DoctorsPortal").collection("users");

    app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, email: booking.email };
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

    app.post('/jwt', async (req, res) => {
      const users = req.body;
      console.log(users);
      const token = jwt.sign(users, process.env.ACCESS_TOKEN,  { expiresIn: '1000h' });
      res.send({token});
    })
    


    // for user create 
    app.post('/users', async(req, res)=> {

      const user = req.body;
   
      const result = await usersCollection.insertOne(user);
      res.send(result);

    })

    app.put('/users/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email }
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      }
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.send(user);
    })

    // app.get('/booking', async(req, res) => {
    //   const patient = req.query.email;
    //   const query = { patient: patient}
    //   const bookings = await bookingColletion.find(query).toArray();
    //   res.send(bookings);
    // })



    app.get('/booking', verifyJwt, async (req, res) => {
      // console.log(req.headers.authorization)
      const email = req.query.email;
      const query = { email: email };
      const bookings = await bookingColletion.find(query).toArray();
      res.send(bookings);
    });


    app.delete('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await bookingColletion.deleteOne(query);
      res.send(result);

    })



    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
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