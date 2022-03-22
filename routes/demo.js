const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  let sessionInputData = req.session.inputData; // grabbing the input data as used below

  if (!sessionInputData) {
    // checking if there is no/falsy inputdata and then initializing it if there isnt
    sessionInputData = {
      hasError: false,
      email: "",
      confirmEmail: "",
      password: "",
    };
  }

  req.session.inputData = null; // clearing the inputdata after pre-populating the fields, so that if you refresh the page or click away and come back, it will be empty again, but not whiel youre still on the page. ONLY KEEPS DATA UNTIL REDIRECT IS FINISHED

  res.render("signup", { inputData: sessionInputData }); // sent into template
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredConfirmEmail = userData["confirm-email"]; // not using . notation because confirm-email has a - in it, therefore not allowing it.
  const enteredPassword = userData.password;

  if (
    !enteredEmail ||
    !enteredConfirmEmail ||
    !enteredPassword ||
    enteredPassword.trim() < 6 ||
    enteredEmail !== enteredConfirmEmail ||
    !enteredEmail.includes("@")
  ) {
    // checking for invalid inputs. trim() removes excess whitespace.
    // console.log("Incorrect data");

    req.session.inputData = {
      // storing session data, so that in the event of a signup fuckup like mispelling confirm email or too short password it doesnt just clear all the data when reloading the page.
      hasError: true,
      message: "Invalid inpout - please chekc your data",
      email: enteredEmail,
      confirmEmail: enteredConfirmEmail,
      password: enteredPassword,
    };

    req.session.save(function () {
      return res.redirect("/signup"); // only redirecting after the above has been saved
    });
    return;
  }

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail }); // checking if the user signing up alredy exists

  if (existingUser) {
    console.log("User exists already");
    return res.redirect("/signup"); // redirecting if the user exists.
  }

  const hashedPassword = await bcrypt.hash(enteredPassword, 12); //hashes the password with random shit, and the number is the strength of it

  const user = {
    email: enteredEmail,
    password: hashedPassword,
  };

  await db.getDb().collection("users").insertOne(user); // signifies that we want to connect to the database, create a collection called users, which will then be actually created when we add data to it, which we are also doing ehre via the insertOne method

  res.redirect("/login");
});

router.post("/login", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredPassword = userData.password;

  const existingUser = await db
    .getDb()
    .collection("users")
    .findOne({ email: enteredEmail }); // determining whether the login attempt is from an existing user or not by checking their entered email against those in the database.

  if (!existingUser) {
    console.log("Could not log in, not existing user");
    return res.redirect("/login");
  }

  const passwordsAreEqual = await bcrypt.compare(
    enteredPassword,
    existingUser.password
  ); // checking if the password entered matches that in the database by throwing the same algorithm used when storing it initially at the entered one.

  if (!passwordsAreEqual) {
    console.log("Wrong password DUMPASS");
    return res.redirect("/login");
  }

  // console.log("user authenticated");

  req.session.user = { id: existingUser._id, email: existingUser.email }; // this session property is provided by the express-session package which manges the sessions for us. Every request (whether logged in or not) has a session. Here we are adding the user, which is not present by default. We are storing the ID and email to be used in the sessions collection on the database.
  req.session.isAuthenticated = true; // redundant, since this only exists if the user is already authenticated.
  req.session.save(function () {
    // using save here because while the below is true, it might not be saved in time to authenticate the user, so they might be temporarily denied access to the admin page.

    res.redirect("/admin"); // something to note is that when this is called it saves the relevant data to the database. It has been moved back inside this callback function since we only want it to fire once the session data has been saved.
  });
});

router.get("/admin", function (req, res) {
  // check the user 'ticket' to see if it matches with that of valid admin access

  if (!req.session.isAuthenticated) {
    // checking if user does not have an active session. Alternatively we could tpye if (!req.session.user) instead and get the same effect.
    return res.status(401).render("401"); // telling the browser and rendering a page that the user was denied access.
  }

  res.render("admin");
});

router.post("/logout", function (req, res) {
  req.session.user = null; // effectively clears the user session without actually deleting it. Doing it this way can be useful, as deleting the entire session is generally not recommended. See the picture in notes file for details
  req.session.isAuthenticated = false; // revoking user auth
  res.redirect("/"); // not using the above method checking for authentication because the main page does not require authentication to view.
});

module.exports = router;
