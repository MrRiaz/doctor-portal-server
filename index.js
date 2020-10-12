const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const admin = require('firebase-admin');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x3yya.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express()
app.use(bodyParser.json());
app.use(cors());

const serviceAccount = require("./doctors-portal8-firebase-adminsdk-flhud-51bb31f65e.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://doctors-portal8.firebaseio.com"
});


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
    appointmentsCollection.find({ date: date.date, email: req.query.email })
      .toArray((err, documents) => {
        res.send(documents);
      })
  });


  app.get('/allPatients', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          console.log( tokenEmail, queryEmail );
          if (tokenEmail == queryEmail) {
            appointmentsCollection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.send(documents);
              })
          }
        })
        .catch(function (error) {
          // Handle error
        });
    }
  })



  // app.get('/allPatients', (req, res) => {
  //   console.log(req.headers.authorization);
  //   // appointmentsCollection.find({})
  //   appointmentsCollection.find({email: req.query.email})
  //   .toArray((err, documents) => {
  //     res.send(documents);
  //   })
  // })

});

app.listen(process.env.PORT || port);