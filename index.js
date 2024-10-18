const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 5000;

// MIDDLEWARES
app.use(express.json());
app.use(cors());

// MongoDB  Connection String...

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5q2fm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const uri = "mongodb://localhost:27017/";

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

    const studyTaskCollection = client.db("STUDY_FLOW_DB").collection("tasks");
    const assignmentCollection = client
      .db("STUDY_FLOW_DB")
      .collection("assignments");
    // Study Tasks Related Api

    //task get api
    app.get("/tasks", async (req, res) => {
      const email = req.query.email;
      // console.log("email from client", email);
      const query = { email: email };
      console.log(query);

      const result = await studyTaskCollection.find(query).toArray();
      res.send(result);
    });

    // task  post api

    app.post("/tasks", async (req, res) => {
      const task = req.body;
      const result = await studyTaskCollection.insertOne(task);
      res.send(result);
    });

    // specific task get api
    app.get("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await studyTaskCollection.findOne(filter);
      res.send(result);
    });

    app.patch("/tasks/:id", async (req, res) => {
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

    // specific task  delete api

    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;

      const filter = { _id: new ObjectId(id) };
      const result = await studyTaskCollection.deleteOne(filter);
      res.send(result);
    });

    //  ASSIGNMENTS RELATED API

    // GET API

    app.get("/assignments", async (req, res) => {
      const difficultyLevel = req.query.difficultyLevel;
      const query = difficultyLevel ? { difficultyLevel } : {};
      // console.log(query);
      const result = await assignmentCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(filter);
      res.send(result);
    });

    // PATCH

    app.patch("/assignments/:id", async (req, res) => {
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

    // POST API
    app.post("/assignments", async (req, res) => {
      const assignment = req.body;
      console.log(assignment);

      const result = await assignmentCollection.insertOne(assignment);
      res.send(result);
    });

    // Get assignments by difficulty level

    // Delete assignment
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
