const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();
// const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cors = require("cors");
const port = process.env.PORT || 5050;

// middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.082e3cj.mongodb.net/?retryWrites=true&w=majority`;

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
    await client.connect();

    const managementUserCollection = client
      .db("managementDB")
      .collection("user");

    const managementAddAssetCollection = client
      .db("managementDB")
      .collection("addAsset");

    const managementRequestDataCollection = client
      .db("managementDB")
      .collection("request");

    const managementCustomRequestCollection = client
      .db("managementDB")
      .collection("customRequest");

    const adminAddUserCollection = client
      .db("managementDB")
      .collection("adminAdd");

    //auth related api
    // app.post("/jwt", logger, async (req, res) => {
    //   const user = req.body;
    //   console.log("user for token", user);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "1h",
    //   });
    //   res
    //     .cookie("token", token, {
    //       httpOnly: true,
    //       secure: process.env.NODE_ENV === "production",
    //       sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    //     })
    //     .send({ success: true });
    // });

    // management related api
    app.post("/users", async (req, res) => {
      const brandName = req.body;
      const result = await managementUserCollection.insertOne(brandName);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const cursor = managementUserCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // email dhore get
    app.get("/userProfile/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      // const query= {email:email}
      const cursor = await managementUserCollection.findOne({ email: email });
      res.send(cursor);
    });

    // user payment
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;
      if (!price || amount < 1) {
        return;
      }
      const { client_secret } = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send(client_secret);
    });

    // employee limit
    app.patch("/admin/extend-employee-limit/:email", async (req, res) => {
      const email = req.params.email;
      const limit = req.body.limit;
      const query = { email: email };
      const updatedDoc = {
        $set: {
          employeeLimit: limit,
        },
      };
      const result = await managementUserCollection.updateOne(
        query,
        updatedDoc
      );
      res.send(result);
    });

    //
    app.get("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const cursor = await managementUserCollection.findOne(filter);
      res.send(cursor);
    });

    //update
    app.put("/users/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateData = req.body;
      const options = { upsert: true };
      const product = {
        $set: {
          name: updateData.name,
          image: updateData.image,
          date: updateData.date,
        },
      };
      const result = await managementUserCollection.updateOne(
        filter,
        product,
        options
      );
      res.send(result);
      console.log(result);
    });

    // admin user added
    app.post("/adminAdd", async (req, res) => {
      const brandName = req.body;
      const result = await adminAddUserCollection.insertOne(brandName);
      res.send(result);
    });

    // admin get kore data paiche
    app.get("/adminAdd", async (req, res) => {
      const cursor = adminAddUserCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // admin deleted
    app.delete("/adminAdd/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await adminAddUserCollection.deleteOne(query);
      console.log(result);
      res.send(result);
    });

    // asset add the product
    app.post("/assetAdd", async (req, res) => {
      const brandName = req.body;
      const result = await managementAddAssetCollection.insertOne(brandName);
      res.send(result);
    });

    app.get("/assetAdd", async (req, res) => {
      const cursor = managementAddAssetCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //

    app.get("/assetAdd/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const cursor = await managementAddAssetCollection.findOne(query);
      res.send(cursor);
    });

    // deleted
    app.delete("/assetAdd/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await managementAddAssetCollection.deleteOne(query);
      res.send(result);
    });

    //update
    app.put("/assetUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateData = req.body;
      const options = { upsert: true };
      const product = {
        $set: {
          name: updateData.name,
          type: updateData.type,
          productQuantity: updateData.productQuantity,
          date: updateData.date,
          stock: updateData.stock,
          assetType: updateData.assetType,
        },

        // name, type, productQuantity, date, stock, assetType
      };
      const result = await managementAddAssetCollection.updateOne(
        filter,
        product,
        options
      );
      res.send(result);
      console.log(result);
    });

    // request data
    app.post("/userRequest", async (req, res) => {
      const brandName = req.body;
      const result = await managementRequestDataCollection.insertOne(brandName);
      res.send(result);
    });

    app.get("/userRequest", async (req, res) => {
      const cursor = managementRequestDataCollection.find();
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    });

    //
    app.put("/userRequest/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      // Include approvedDate in the update document if status is 'Approve'
      const updateDoc = {
        $set: {
          status: item.status,
        },
      };

      if (item.status === "Approve") {
        updateDoc.$set.approvedDate = new Date().toISOString();
      }

      try {
        const result = await managementRequestDataCollection.updateOne(
          filter,
          updateDoc
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating asset:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // deleted request
    app.delete("/userRequest/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await managementRequestDataCollection.deleteOne(query);
      res.send(result);
    });

    // custom request
    app.post("/requestsCustom", async (req, res) => {
      const brandName = req.body;
      const result = await managementCustomRequestCollection.insertOne(
        brandName
      );
      res.send(result);
    });

    app.get("/requestsCustom", async (req, res) => {
      const cursor = managementCustomRequestCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.put("/requestsCustom/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDoc = {
        $set: {
          status: item.status,
        },
      };
      if (item.status === "Approve") {
        updateDoc.$set.approvedDate = new Date().toISOString();
      }
      try {
        const result = await managementCustomRequestCollection.updateOne(
          filter,
          updateDoc
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating asset:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
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
  res.send("Asset Management System server is running");
});

app.listen(port, () => {
  console.log(`Asset Management System server is running PORT: ${port}`);
});
