const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARES
app.use(express.json());
app.use(
  cors({
    origin: [
      "https://stydy-flow.web.app",
      "https://stydy-flow.firebaseapp.com",
      "http://localhost:5173",
    ],
  })
);

// MongoDB  Connection String...

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5q2fm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// const uri = "mongodb://localhost:27017/";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });

    const studyTaskCollection = client
      .db("STUDY_FLOW_DB")
      .collection("studyTasks");
    const assignmentCollection = client
      .db("STUDY_FLOW_DB")
      .collection("assignments");

    const submittedAssignmentCollection = client
      .db("STUDY_FLOW_DB")
      .collection("submittedAssignments");

    const pendingAssignmentCollection = client
      .db("STUDY_FLOW_DB")
      .collection("pendingAssignments");

    // ---------------------

    // JWT TOKEN RELATED API

    app.post("/jwt", async (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Verify Token Middleware

    const verifyToken = (req, res, next) => {
      const bearerToken = req.headers.authorization;
      console.log(bearerToken);
      if (!bearerToken) {
        return res.status(401).send({ message: "Unauthorized Access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Unauthorized" });
        }
        req.decoded = decoded;

        next();
      });
    };

    // Study Tasks Related Api

    //TASK  GET API
    app.get("/myStudyTasks", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await studyTaskCollection.find(query).toArray();
      res.send(result);
    });

    // TASK  POST API

    app.post("/addStudyTask", async (req, res) => {
      const task = req.body;
      const result = await studyTaskCollection.insertOne(task);
      res.send(result);
    });

    // SPECIFIC TASK GET API
    app.get("/specificStudyTask/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await studyTaskCollection.findOne(filter);
      res.send(result);
    });

    // SPECIFIC TASK UPDATE

    app.patch("/updateStudyTask/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "completed",
        },
      };
      const result = await studyTaskCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // SPECIFIC TASK  DELETE API
    app.delete("/deleteStudyTask/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const result = await studyTaskCollection.deleteOne(filter);
      res.send(result);
    });

    // SENT  ASSIGNMENTS RELATED API

    // GET ASSIGNMENTS BY DIFFICULTY LEVEL
    app.get("/assignmentLevel", async (req, res) => {
      const currentPage = parseInt(req.query.currentPage);
      const itemsPerPage = parseInt(req.query.itemsPerPage);

      console.log("Pagination  query", currentPage, itemsPerPage);
      const difficultyLevel = req.query.difficultyLevel;
      const query = difficultyLevel ? { difficultyLevel } : {};
      // console.log(query);
      const result = await assignmentCollection
        .find(query)
        .skip(currentPage * itemsPerPage)
        .limit(itemsPerPage)
        .toArray();
      res.send(result);
    });

    app.get("/assignmentsCount", async (req, res) => {
      const count = await assignmentCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // SPECIFIC ASSIGNMENT GET API

    app.get("/specificAssignment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(filter);
      res.send(result);
    });

    //SPECIFIC ASSIGNMENT UPDATE

    app.patch("/updateAssignment/:id", async (req, res) => {
      const id = req.params.id;
      const assignment = req.body;
      console.log(assignment, id);

      const filter = { _id: new ObjectId(id) };

      const updatedDoc = {
        $set: {
          title: assignment.title,
          description: assignment.description,
          marks: assignment.marks,
          imageURL: assignment.imageURL,
          difficultyLevel: assignment.difficultyLevel,
          date: assignment.date,
        },
      };

      const result = await assignmentCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // ASSIGNMENT POST
    app.post("/addAssignment", async (req, res) => {
      const assignment = req.body;
      console.log(assignment);

      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });

    // USER ASSIGNMENT DELETE API

    app.delete("/deleteMyAssignment/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const verifiedEmail = req.decoded.email;
      console.log("User Posted Assignment ", email);
      console.log("Verified Email : ", verifiedEmail);
      if (email !== verifiedEmail) {
        return res.status(403).send({ message: "Unauthorized action." });
      }
      const query = { email: email };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result);
    });

    // SUBMITTED ASSIGNMENT  API

    //  MY SUBMITTED ASSIGNMENT GET API
    app.get("/mySubmittedAssignment", verifyToken, async (req, res) => {
      const email = req.query.email;
      // console.log("Submitted Assignment user : ", email);
      const query = { email: email };
      // console.log("Submitted Assignment query", query);
      const result = await submittedAssignmentCollection.find(query).toArray();
      res.send(result);
    });
    //  SUBMITTED ASSIGNMENT POST API
    app.post("/submitAssignment", async (req, res) => {
      const submittedAssignments = req.body;
      // console.log(submittedAssignments);
      const result = await submittedAssignmentCollection.insertOne(
        submittedAssignments
      );

      console.log(result);
      if (result.insertedId) {
        // If successful, insert into the second collection
        await pendingAssignmentCollection.insertOne(submittedAssignments);
      }

      res.send(result);
    });
    // GET SPECIFIC SUBMITTED ASSIGNMENT
    app.get("/specificSubmittedAssignment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await submittedAssignmentCollection.findOne(filter);
      res.send(result);
    });
    // UPDATE SPECIFIC SUBMITTED ASSIGNMENT
    app.patch("/updateSpecificSubmittedAssignment/:id", async (req, res) => {
      const id = req.params.id;
      const assignmentResult = req.body;

      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          obtainedMark: assignmentResult.obtainedMark,
          feedback: assignmentResult.feedback,
          status: assignmentResult.status,
        },
      };
      const result = await submittedAssignmentCollection.updateOne(
        filter,
        updatedDoc
      );

      console.log(result);
      if (result.modifiedCount > 0) {
        // Delete the assignment
        await pendingAssignmentCollection.deleteOne(filter);
      }
      res.send(result);
      console.log(result);
    });

    // DELETE ASSIGNMENT AFTER GETTING RESULT

    app.delete("/deleteMarkedAssignment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await submittedAssignmentCollection.deleteOne(filter);
      res.send(result);
    });

    // PENDING ASSIGNMENT APIS (NOT MARKED YET.)

    app.get("/pendingAssignments", verifyToken, async (req, res) => {
      const result = await pendingAssignmentCollection.find().toArray();
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SERVER IS STUDYING....");
});

app.listen(port, () => {
  console.log(`SERVER IS STUDYING ON PORT ${port}`);
});
