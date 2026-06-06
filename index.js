const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config();

const uri = process.env.MONGODB_URI

const app = express();

const PORT = process.env.PORT

app.use(cors())
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
  const header = req?.headers.authorization
  console.log(header)
  if (!header) {
    return res.status(401).json({ message: "Unauthorization" })
  }

  try {
    const { payload } = await jwtVerify(header, JWKS);
    console.log(payload)
    next()
  } catch (error) {
    return res.status(403).json({ message: "Forbidden" })
  }
}

async function run() {
  try {
    // await client.connect();

    const db = client.db('petHouse')
    const petCollection = db.collection('pet')
    const adoptCollection = db.collection("adoption")


    app.get('/pet', async (req, res) => {
      const result = await petCollection.find().toArray()
      res.send(result);
    })

    app.get('/pet/:id', verifyToken, async (req, res) => {
      const { id } = req.params
      const result = await petCollection.findOne({ _id: new ObjectId(id) })
      res.send(result)
    })


    app.get("/pets", async (req, res) => {
      const { search = "", species = "", sort = "" } = req.query;

      const query = {};

      if (search) {
        query.petName = {
          $regex: search,
          $options: "i",
        };
      }

      if (species) {
        query.species = {
          $in: species.split(","),
        };
      }

      const sortOption =
        sort === "asc"
          ? { adoptioFee: 1 }
          : sort === "desc"
            ? { adoptioFee: -1 }
            : {};

      const result = await petCollection.find(query).sort(sortOption).toArray();
      res.send(result);
    });

    app.get("/pets/:userId", async (req, res) => {
      const { userId } = req.params;
      console.log("userId", userId)
      const result = await petCollection.find({ userId: userId }).toArray();
      res.send(result);
    })


    app.post('/pet', async (req, res) => {
      const petData = req.body;
      console.log(petData)
      const result = await petCollection.insertOne(petData)

      res.send(result)
    })

    app.patch("/status-change/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      const result = await petCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      res.send(result)
    })


    app.patch("/pet/:id", async (req, res) => {
      const { id } = req.params;
      const updateData = req.body;
      const result = await petCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      )
      res.send(result)
    })

     app.delete("/pet/:listingId", async (req, res) => {
      const { listingId } = req.params;
      const result = await petCollection.deleteOne({ _id: new ObjectId(listingId) })
      res.send(result)
    })

     app.post("/adoption", async (req, res) => {
      const adoptionData = req.body;
      const result = await adoptCollection.insertOne(adoptionData);
      res.send(result)
    })


    app.get('/adoption/:petId', async (req, res) => {
      const { petId } = req.params
      const result = await adoptCollection.find({ petId }).toArray();
      res.send(result)
    })

    app.get('/my-requests/:email', async (req, res) => {
      const { email } = req.params;
      const result = await adoptCollection.find({ userEmail: email }).toArray();
      res.send(result)
    })




    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Server is running')
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})