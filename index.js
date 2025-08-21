// index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";

const { sign, verify } = jwt;

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/tasty-kitchen");

const db = mongoose.connection;

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});
const User = mongoose.model("User", userSchema);

// ======================= Products CRUD with schema =======================

//  Create multiple products
app.post("/products", async (req, res) => {
  try {
    const productsArray = req.body; // now an array of product objects
    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      return res.status(400).json({ error: "Request body must be an array of products" });
    }

    const result = await db.collection("products").insertMany(productsArray);

    res.status(201).json({
      message: "Products added successfully",
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add products", details: err.message });
  }
});

//  Get All Products
app.get("/products", async (req, res) => {
  try {
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

    // Check if the ID is a valid MongoDB ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    const product = await db.collection("products").findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch product", details: err.message });
  }
});

// ➡️ Update Product
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

    res.json({ message: "Product updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update product", details: err.message });
  }
});

// ➡️ Delete Product
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

// Add this route to your backend code
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

// ============================================================================

//  Signup route
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = new User({ username, password, email });
    await newUser.save();

    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

app.get("/all", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

//  Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = sign({ id: user._id }, "secretKey", { expiresIn: "30d" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong", details: err.message });
  }
});

//  Protected route
app.get("/protected", (req, res) => {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(403).json({ error: "Token missing" });
  }

  try {
    const decoded = verify(token, "secretKey");
    res.json({ message: "Protected data", userId: decoded.id });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ======================= Offers CRUD without schema =======================

// Create multiple offers
app.post("/offers", async (req, res) => {
  try {
    const offersArray = req.body; // Expecting an array of offers
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

    res.json({ message: "Offer updated" });
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

// Start server
// Start server using the dynamic port from Render or default to 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});