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