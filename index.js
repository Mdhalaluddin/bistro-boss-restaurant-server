const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const post = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

 


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3x6azjv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db('bistroBD').collection('users');
    const menuCollection = client.db('bistroBD').collection('menu');
    const reviewsCollection = client.db('bistroBD').collection('reviews');
    const cartCollection = client.db('bistroBD').collection('carts');


    // middlewares
    const verifyToken = (req, res, next)=>{
      console.log(req.headers);
      if(!req.headers.authorization){
        return res.status(401).send({message: 'forbidden access'});
      }
      const token = req.headers.authorization.split(' ')[1]; 
      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded)=>{
        if(err){
          return res.status(401).send({message: 'forbidden access'})
        }
        req.decoded = decoded;
        next();
      })
    } 
    // jwt
    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      
      const token = jwt.sign(user, process.env.JWT_TOKEN,{
        expiresIn: '1h'
      }) 
      res.send({token})
    })

    // users api
    app.get('/users', async(req, res)=>{
      
      const result = await userCollection.find().toArray()
      res.send(result)
    })
    // user date
    app.post('/users', async(req, res)=>{
      const user = req.body;
      console.log('new user', user);
      const query = {email: user.email} 
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
       return res.send({message: 'user already existing', instatedId: null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    })
    app.delete('/users/:id', async(req, res)=>{
      const id = req.params.id;
      const query= {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query);
      res.send(result);
    })
    app.patch('/users/admin/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)}
      const updateDoc ={
        $set: {
          role: 'admin'
        }
      }
      const result= await userCollection.updateOne(filter, updateDoc);
      res.send(result)
    })
    // menus data 
    app.get('/menu', async(req, res)=>{
        const result = await menuCollection.find().toArray();
        res.send(result)
    })
    
    app.get('/reviews', async(req, res)=>{
        const result = await reviewsCollection.find().toArray();
        res.send(result)
    })
    // add to cart
    app.get('/carts', async(req, res)=>{
      const email = req.query.email;
      const query = {email: email}
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.post('/carts', async(req, res)=>{
      const user = req.body;
      console.log('new food cart and user', user);
      const result = await cartCollection.insertOne(user);
      res.send(result)
    });
    app.delete('/carts/:id', async(req, res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('boss is sitting')
})
app.listen(post,()=>{
    console.log(`Bistro boss is sitting on post ${post}`)
})

