const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const admin = require('firebase-admin');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.x3yya.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express()
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());

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
  const doctorCollection = client.db("doctorPortal").collection("doctors");


  app.post('/addAppointment', (req, res) => {
    const appointment = req.body;
    appointmentsCollection.insertOne(appointment)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
  });


  app.post('/appointmentsByDate', (req, res) => {
    const date = req.body;
    const email = req.body.email;
    doctorCollection.find({ email: email })
      .toArray((err, doctors) => {
        const filter = { date: date.date }
        if (doctors.length === 0) {
          filter.email = email;
        }
        appointmentsCollection.find(filter)
          .toArray((err, documents) => {
            res.send(documents);
          })
      })
  });


  app.get('/allPatients', (req, res) => {
    appointmentsCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });


  //store uploaded image to mongodb

  app.post('/addADoctor', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString('base64');

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    };

    doctorCollection.insertOne({ name, email, image })
      .then(result => {
        res.send(result.insertedCount > 0)
      })
  });


  // when we upload a img to server

  // app.post('/addADoctor', (req, res) => {
  //   const file = req.files.file;
  //   const name = req.body.name;
  //   const email = req.body.email;

  //   file.mv(`${__dirname}/doctors/${file.name}`, err => {
  //     if(err){
  //       console.log(err);
  //       return res.status(500).send({msg: 'Failed to upload picture'});
  //     }
  //     doctorCollection.insertOne({name, email, img:file.name})
  //     .then(result => {
  //       res.send(result.insertedCount > 0)
  //     })
  //   })
  // });


  app.get('/doctors', (req, res) => {
    doctorCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      })
  });


  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;
    doctorCollection.find({ email: email })
      .toArray((err, doctors) => {
        res.send(doctors.length > 0)
      })
  });


  // store img to mongodb

  //   app.post('/addADoctor', (req, res) => {
  //     const file = req.files.file;
  //     const name = req.body.name;
  //     const email = req.body.email;
  //     const filePath = `${__dirname}/doctors/${file.name}`;

  //     file.mv(filePath, err => {
  //         if(err){
  //           console.log(err);
  //           res.status(500).send({msg: 'Failed to upload picture'});
  //         }
  //         const newImg = fs.readFileSync(filePath);
  //         const encImg = newImg.toString('base64');

  //         var image = {
  //           contentType: req.files.file.mimetype,
  //           size: req.files.file.size,
  //           img: Buffer(encImg, 'base64')
  //         };

  //         doctorCollection.insertOne({name, email, image})
  //         .then(result => {
  //             fs.remove(filePath, error => {
  //                 if(error){
  //                   console.log(error),
  //                   res.status(500).send({msg: 'Failed to upload picture'});
  //                 }
  //                 res.send(result.insertedCount > 0)
  //             })
  //         })
  //     })
  // });



  // secure api methods

  // app.get('/allPatients', (req, res) => {
  //   const bearer = req.headers.authorization;
  //   if (bearer && bearer.startsWith('Bearer ')) {
  //     const idToken = bearer.split(' ')[1];
  //     admin.auth().verifyIdToken(idToken)
  //       .then(function (decodedToken) {
  //         const tokenEmail = decodedToken.email;
  //         const queryEmail = req.query.email;
  //         // console.log( tokenEmail, queryEmail );
  //         if (tokenEmail == queryEmail) {
  //           appointmentsCollection.find({ email: queryEmail })
  //             .toArray((err, documents) => {
  //               res.send(documents);
  //             })
  //         }
  //       })
  //       .catch(function (error) {
  //         // Handle error
  //       });
  //   }
  // })


});

app.listen(process.env.PORT || port);