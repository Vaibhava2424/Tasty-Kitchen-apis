// index.js

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const { sign, verify } = jwt;

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const db = mongoose.connection;

// Removed all Mongoose schemas and models, as requested.
// We will now use the native MongoDB driver methods directly on the `db` object.

// ======================= Products CRUD =======================

// Create multiple products
app.post("/products", async (req, res) => {
  try {
    const productsArray = req.body;
    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      return res.status(400).json({ error: "Request body must be an array of products" });
    }
    // Using the native MongoDB driver's insertMany method
    const result = await db.collection("products").insertMany(productsArray);
    res.status(201).json({ 
      message: "Products added successfully", 
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add products", details: err.message });
  }
});

// Get All Products
app.get("/products", async (req, res) => {
  try {
    // Using the native MongoDB driver's find method
    const products = await db.collection("products").find().toArray();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});

// Get a single product by ID
app.get("/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { ObjectId } = mongoose.Types;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Invalid product ID" });
        }

        // Using native findOne with ObjectId
        const product = await db.collection("products").findOne({ _id: new ObjectId(id) });

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json(product);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch product", details: err.message });
    }
});

// Update Product
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { ObjectId } = mongoose.Types;

    const result = await db.collection("products").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product updated", updatedProduct: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
});

// Delete Product
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = mongoose.Types;

    const result = await db.collection("products").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete product", details: err.message });
  }
});

// Delete all products
app.delete("/products/all", async (req, res) => {
  try {
    const result = await db.collection("products").deleteMany({});
    res.json({
      message: "All products deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete products", details: err.message });
  }
});

// ======================= Offers CRUD =======================

// Create multiple offers
app.post("/offers", async (req, res) => {
  try {
    const offersArray = req.body;
    if (!Array.isArray(offersArray) || offersArray.length === 0) {
      return res.status(400).json({ error: "Request body must be an array of offers" });
    }
    const result = await db.collection("offers").insertMany(offersArray);
    res.status(201).json({
      message: "Offers added successfully",
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add offers", details: err.message });
  }
});

// Get all offers
app.get("/offers", async (req, res) => {
  try {
    const offers = await db.collection("offers").find().toArray();
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch offers", details: err.message });
  }
});

// Get a single offer by ID
app.get("/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = mongoose.Types;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid offer ID" });
    }

    const offer = await db.collection("offers").findOne({ _id: new ObjectId(id) });

    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    res.json(offer);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch offer", details: err.message });
  }
});

// Update offer
app.put("/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { ObjectId } = mongoose.Types;

    const result = await db.collection("offers").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    res.json({ message: "Offer updated", updatedOffer: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to update offer", details: err.message });
  }
});

// Delete offer
app.delete("/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = mongoose.Types;

    const result = await db.collection("offers").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Offer not found" });
    }

    res.json({ message: "Offer deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete offer", details: err.message });
  }
});

// User schema with a secure password field
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});
const User = mongoose.model("User", userSchema);

// Signup route with password hashing
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword, email });
    await newUser.save();
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

// Get all users
app.get("/all", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

// Login route with password comparison
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

// Protected route with JWT verification
app.get("/protected", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).json({ error: "Token missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(403).json({ error: "Token missing or malformed" });
  }
  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    res.json({ message: "Protected data", userId: decoded.id });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Start server using the dynamic port from Render or default to 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
