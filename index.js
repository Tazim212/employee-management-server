const express = require('express');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const cors = require('cors')
const app = express();
const port = 5000;


//middleware
app.use(cors())
app.use(express.json())


const client = new MongoClient(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-eqifd2k-shard-00-00.tbmejyb.mongodb.net:27017,ac-eqifd2k-shard-00-01.tbmejyb.mongodb.net:27017,ac-eqifd2k-shard-00-02.tbmejyb.mongodb.net:27017/?ssl=true&replicaSet=atlas-bvjx8p-shard-0&authSource=admin&appName=Cluster0`);


async function connectToMongoDB() {
  try {
    await client.connect();

    const empployee = client.db("employee-management")
    const UserCollection = empployee.collection("UserCollection")
    const EmployeeCollection = empployee.collection("EmployeeCollection")

    // ------------- userList -----------

    app.post("/user", async(req,res) =>{
      const query = req.body;
      const result = await UserCollection.insertOne(query)
      res.send(result)
    })

    // ----------------- employee lists -----------

    app.get("/employees", async(req, res) =>{
      const result = await EmployeeCollection.find().toArray()
      res.send(result)
    })







    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}


connectToMongoDB()

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});