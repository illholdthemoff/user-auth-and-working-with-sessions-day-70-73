const mongodb = require("mongodb");

const MongoClient = mongodb.MongoClient;

let database;

async function connectToDatabase() {
  const client = await MongoClient.connect("mongodb://0.0.0.0:27017"); // remember this has to be this way as opposed to whatever else he has as the baseline for whatever reason i forget
  database = client.db("auth-demo");
}

function getDb() {
  if (!database) {
    throw { message: "You must connect first!" };
  }
  return database;
}

module.exports = {
  connectToDatabase: connectToDatabase,
  getDb: getDb,
};
