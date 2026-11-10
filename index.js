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

const verifyAdmin = async(req, res, next) =>{
      const email = req.decoded_email;
      const query = {email}
      const user = await UserCollection.findOne(query)
      if(!user || user?.role !== "admin" ){
        return res.status(403).send({message: "forbidden access"})
      }
      next()
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
    const PerformanceCollection = empployee.collection("PerformanceCollection")
    const PromotionCollection = empployee.collection("PromotionCollection")
    const AttendenceCollection = empployee.collection("AttendenceCollection")
    const OvertimeCollection = empployee.collection("OvertimeCollection")
    const LeaveCollection = empployee.collection("LeaveCollection")
    const AttCorrectionCollection = empployee.collection("AttCorrectionCollection")


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

    app.get("/users/role", async(req, res) =>{
      const {email} = req.query;
      const query = {}
      if(email){
        query.email = email
      }
      const result = await UserCollection.find(query)
      res.send({role: result?.role || "user"})
    })
    
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

    app.get("/empl/:empl_id", async(req,res) =>{
      const {empl_id} = req.params
      const result = await EmployeeCollection.findOne({employee_id: empl_id})
      res.send(result)
    })

    app.post("/new_empl", async(req,res) =>{
      const employee = req.body;
      const result = await EmployeeCollection.insertOne(employee)
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

    app.patch("/empl_pay/:id", async(req,res) =>{
      const id = req.params.id
      const objId = {_id: new ObjectId(id)}
      const {status} = req.body
      const result = await PayrollCollection.updateOne(
        objId,  
        {
          $set: {
          status: status
        }   
      }
    )
      res.send(result)
    })

    app.get("/payroll_stat", async(req,res) =>{
      const payrollStat = await PayrollCollection.aggregate([
       {
        $facet: {          
         "pending":  [
          {    
          $match: {status: "Pending"}
        }
        ],
         "processing":  [
          {    
          $match: {status: "Processing"}
        }
        ],
         "paid":  [
          {    
          $match: {status: "Paid"}
        }
        ],
        "total": [
          {
            $match: {status: "Paid"}
          },
          {
             $group: {
               _id: null, 
                total: {
                    $sum: {
                      $subtract: [
                           {
                              $add: [
                                  "$basic_salary",
                                  "$home_allowance",
                                  "$meal_allowance",
                                  "$tour_allowance",
                                  ],
                            },
                           {
                              $add: ["$income_tax", "$health_insurance"],
                           },
                         ],
                      },
                   },   
                }, 
          },
        ],
        "payrollDash": [
          {
            $group: {
              _id: null,
              totalAllowance: {
                  $sum: {              
                        $add: [
                          "$home_allowance",
                           "$meal_allowance",
                           "$tour_allowance"
                        ]                    
                  }
                },  
              averageBasic: {
                $avg: {$sum: [["$basic_salary"]]}
              }      
            }
          }
        ]
        }
       }
          ]).toArray()
      res.send(payrollStat)
    })

    app.get("/dept_payroll", async(req,res) =>{
      const deptPayroll = await PayrollCollection.aggregate([
        {
             $group: {
               _id: {department: "$employee_department", salaryMonth: "$salary_month"}, 
                total: {
                    $sum: {
                      $subtract: [
                           {
                              $add: [
                                  "$basic_salary",
                                  "$home_allowance",
                                  "$meal_allowance",
                                  "$tour_allowance",
                                  ],
                            },
                           {
                              $add: ["$income_tax", "$health_insurance"],
                           },
                         ],
                      },
                   },   
                }, 
          },
          {
            $sort: {
                "_id.salary_month": 1,
            },
        },
      ]).toArray()
      res.send(deptPayroll)
    })

    // ----------------------- employee attendence ----------------

    app.get("/attendence", async(req, res) =>{
      const result = await AttendenceCollection.find().toArray()
      res.send(result)
    })
    app.post("/daily_attend", async(req,res) =>{
      const attendence = req.body;
      attendence.shift = "General";
      attendence.break = Number(60)
      const result = await AttendenceCollection.insertOne(attendence)
      res.send(result)
    })

    // ----------------------- employee reviews --------------------

    app.get("/all_review", async(req,res) =>{
      const result = await PerformanceCollection.find().toArray()
      res.send(result)
    })
    
    app.get("/empl_review", async(req, res) =>{
      const result = await EmployeeCollection.aggregate(
        [
          {
            $lookup: {
              from: "PerformanceCollection",
              localField: "employee_name",
              foreignField: "employee_name",
              as: "reviewInfo"
            }
          },
            {
           $addFields: {
              reviewStatus: {
              $ifNull: [{ $arrayElemAt: ["$reviewInfo.status", 0] }, "Not Completed"],
            },
           }
          },
        ]
      ).toArray()
      res.send(result)
    })

    app.get("/empl_reviews", async(req, res) =>{
      const {status} = req.query;
      const query = {}
      if(status){
        query.status = status
      }
      const result = await PerformanceCollection.find(query).toArray()
      res.send(result)
    })
    
    app.post("/empl_reviews", async(req,res) =>{
      const reviews = req.body;
      reviews.created_at = new Date()
      reviews.status = "Completed"
      const result = await PerformanceCollection.insertOne(reviews)
      res.send(result)
    })

    // ------------ promotion api-----------

    app.get("/promotion", async(req,res) =>{
      const result = await PromotionCollection.find().toArray()
      res.send(result)
    })
    
    app.post("/promotion", async(req,res) =>{
      const promotion = req.body;
      const result = await PromotionCollection.insertOne(promotion)
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