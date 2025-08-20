import express, { json } from 'express';
import { config } from 'dotenv';
import { connect, Schema, model } from 'mongoose';
import cors from 'cors';
import { sign } from 'jsonwebtoken';

const app = express();
config();

app.use(json());
app.use(cors());

app.listen(3001, () => {
    console.log(`Server is running on port 3001`);
});

connect(process.env.MONGO_URI,{
    useNewUrlParser: true,})
.then(() => console.log("MongoDB connected"))
.catch(err => {console.error("MongoDB connection error:", err)
process.exit(1)});


const userSchema = new Schema({
    name:String,
    email:String,
})

const User = model("User", userSchema);

app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal server error");
    }
});

app.post('/users',async(req,res) =>{
    const {name, email} = req.body;
    try{
        const user = new User({name, email});
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({error: "Internal server error"});
    }
})

const authenticateMiddleware = async (req, res, next) => {
    // Middleware logic for authentication
    const {name, email, password} = req.body
    const userDetails = await User.find({name})
    console.log(userDetails) // checking the name which is present or not in db
    if(userDetails.length == 0){
        const payload = {
            name:name,
            email:email,
            password:password
        }
        const token = sign(payload,"MY_SECRET_CODE")
        res.send({
            jwtToken: token
        })
    }else{
        res.send("User is already registered");
    }
    next();
}

app.post('/register',authenticateMiddleware, (req, res) => {
    
})

export default app; 