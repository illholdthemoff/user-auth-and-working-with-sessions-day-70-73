const path = require('path');

const express = require('express');
const session = require("express-session"); // hhtp server side framwork used to create and manage a session middleware
const mongodbStore = require("connect-mongodb-session"); // allows us to store sessions onto the mongo database.

const db = require('./data/database');
const demoRoutes = require('./routes/demo');

const MongoDBStore = mongodbStore(session); // specifies that this session is what we want to store. Stores as a class, a constructor function.

const app = express();

const sessionStore = new MongoDBStore({ // instantiation of the MongoDBStore constructor
uri: "mongodb://0.0.0.0:27017", // DOUBLE CHECK THIS, PROBABLY WRONG LIKE THE OTHE RTIMES!!!
databaseName: "auth-demo", // the name of the database to store in.
collection: "sessions" // which collection within  the database to store in.
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: "super-secret",
  resave: false,
  saveUninitialized: false,
  store: sessionStore
})); // generates a middleware for our funnel, as well as a set of key value pairs for configuring it. Secret is something you use to secure the session, typically you would want it to be more complex. resave says whether or not the session is updated in a database when the data in it changes. saveUninitialized will only save if actual data has been placed in. Store controls where the session data should be stored.

app.use(demoRoutes);

app.use(function(error, req, res, next) {
  res.render('500');
})

db.connectToDatabase().then(function () {
  app.listen(3000);
});
