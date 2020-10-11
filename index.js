const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x3yya.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express()
app.use(bodyParser.json());
app.use(cors());


const port = 5000

app.get('/', (req, res) => {
  res.send("Hello from db, it's working!")
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentsCollection = client.db("doctorPortal").collection("appointments");

  app.post('/addAppointment', (req, res) => {
    const appointment = req.body;
    appointmentsCollection.insertOne(appointment)
    .then(result => {
    res.send(result.insertedCount > 0);
    })
  });

  app.post('/appointmentsByDate', (req, res) => {
    const date = req.body;
    // console.log(req.query.email);
    // console.log(date.date);
    appointmentsCollection.find({date: date.date, email: req.query.email})
    .toArray((err, documents) => {
        res.send(documents);
    })
  });

  app.get('/allPatients', (req, res) => {
    // appointmentsCollection.find({})
    appointmentsCollection.find({email: req.query.email})
    .toArray((err, documents) => {
      res.send(documents);
    })
  })

});

app.listen(process.env.PORT || port);