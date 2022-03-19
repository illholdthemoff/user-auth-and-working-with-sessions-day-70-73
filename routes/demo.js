const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../data/database");

const router = express.Router();

router.get("/", function (req, res) {
  res.render("welcome");
});

router.get("/signup", function (req, res) {
  res.render("signup");
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post("/signup", async function (req, res) {
  const userData = req.body;
  const enteredEmail = userData.email;
  const enteredConfirmEmail = userData["confirm-email"]; // not using . notation because confirm-email has a - in it, therefore not allowing it.
  const enteredPassword = userData.password;

  if (!enteredEmail || !enteredConfirmEmail || !enteredPassword || enteredPassword.trim() < 6 || enteredEmail !== enteredConfirmEmail || !enteredEmail.includes("@")) { // checking for invalid inputs. trim() removes excess whitespace.
    console.log("Incorrect data");
    return res.redirect("/signup");
  }

  const existingUser = await db.getDb().collection("users").findOne({email: enteredEmail}); // checking if the user signing up alredy exists

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

  console.log("user authenticated");
  res.redirect("/admin");
});

router.get("/admin", function (req, res) {
  // check the user 'ticket' to see if it matches with that of valid admin access
  res.render("admin");

});

router.post("/logout", function (req, res) {});

module.exports = router;
