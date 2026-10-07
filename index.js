const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
var jwt = require('jsonwebtoken');
const cors = require('cors')
const app = express();
const port = 5000;


//middleware
app.use(cors())
app.use(express.json())

const verifyToken = (req,res, next) =>{
  const authorization = req.headers.authorization
    if(!authorization){
        return res.status(403).send({message: "unauthorized access"})
    }
    const token = authorization.split(' ')[1]
    if(!token){
        return res.status(403).send({message: 'unauthorized access'})
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) =>{
        if(err){
            return res.status(401).send({message: "forbidden access"})
        }
        req.token_email = decoded.email
        next()
    })
}

const client = new MongoClient(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-eqifd2k-shard-00-00.tbmejyb.mongodb.net:27017,ac-eqifd2k-shard-00-01.tbmejyb.mongodb.net:27017,ac-eqifd2k-shard-00-02.tbmejyb.mongodb.net:27017/?ssl=true&replicaSet=atlas-bvjx8p-shard-0&authSource=admin&appName=Cluster0`);


async function connectToMongoDB() {
  try {
    await client.connect();

    const empployee = client.db("employee-management")
    const UserCollection = empployee.collection("UserCollection")
    const EmployeeCollection = empployee.collection("EmployeeCollection")
    const DistrictCollection = empployee.collection("DistrictCollection")
    const UpazillaCollection = empployee.collection("UpazillaCollection")
    const PayrollCollection = empployee.collection("PayrollCollection")


    app.post("/getToken", (req, res) =>{
            const loggedUser = req.body;
            const token = jwt.sign(loggedUser, process.env.JWT_SECRET,{expiresIn: "1h"})
            res.send({token: token})
    })
    // ------------- districts & Upazilla ---------

    app.get("/district", async(req, res) =>{
      const result = await DistrictCollection.find().toArray()
      res.send(result)
    })

    app.get("/upazilla", async(req, res) =>{
      const result = await UpazillaCollection.find().toArray()
      res.send(result)
    })
    // ------------- userList -----------

    app.post("/user", async(req,res) =>{
      const query = req.body;
      query.role = "user"
      const result = await UserCollection.insertOne(query)
      res.send(result)
    })

    // ----------------- employee lists -----------

    app.get("/employee-stats", async(req,res) =>{
      const emplStates = await EmployeeCollection.aggregate([
        {
          $group : {
            _id: "employee_id",
            total: {$sum: 1}
          }
        }
      ]).toArray()
      res.send(emplStates)
    })
    app.get("/employees", verifyToken, async(req, res) =>{
      const result = await EmployeeCollection.find().toArray()
      res.send(result)
    })
    app.post("/new_empl", async(req,res) =>{
      const employee = req.body;
      const result = await EmployeeCollection.insertOne(employee)
      res.send(result)
    })

    app.get("/empl/:empl_id", async(req,res) =>{
      const {empl_id} = req.params
      const result = await EmployeeCollection.findOne({employee_id: empl_id})
      res.send(result)
    })

    app.patch("/empl/:empl_id", async(req,res) =>{
      const {empl_id} = req.params;
      const updatedDoc = req.body
      const result = await EmployeeCollection.updateOne({employee_id: empl_id}, { $set: updatedDoc })
      res.send(result)
    })

    app.delete("/empl/:empl_id", async(req, res) =>{
      const {emplId} = req.params;
      const result = await EmployeeCollection.deleteOne(emplId)
      res.send(result)
    })


    // ----------- employee payroll ----------

    app.get("/empl_payroll", async(req,res) =>{
      const result = await PayrollCollection.find().toArray()
      res.send(result)
    })

    app.get("/empl_payroll/:id", async(req,res) =>{
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await PayrollCollection.findOne(query)
      res.send(result)
    })

    app.post("/empl_pay", async(req,res) =>{
      const query = req.body;
      const result = await PayrollCollection.insertOne(query)
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