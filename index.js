// index.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs"; // <-- Added bcrypt import
import dotenv from "dotenv"; // <-- Added dotenv import

// Load environment variables from a .env file for local development
dotenv.config();

const { sign, verify } = jwt;

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection using an environment variable
mongoose
  .connect(process.env.MONGO_URI) // Removed deprecated options
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if the connection fails
  });

// Correct Mongoose schema and model for products and offers
const productSchema = new mongoose.Schema({});
const Product = mongoose.model("Product", productSchema);

const offerSchema = new mongoose.Schema({});
const Offer = mongoose.model("Offer", offerSchema);

// User schema with a secure password field
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});
const User = mongoose.model("User", userSchema);

// ======================= Products CRUD =======================
// Create multiple products
app.post("/products", async (req, res) => {
  try {
    const productsArray = req.body;
    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      return res.status(400).json({ error: "Request body must be an array of products" });
    }
    const result = await Product.insertMany(productsArray); // <-- Using Mongoose model
    res.status(201).json({ 
        message: "Products added successfully", 
        insertedCount: result.length,
        insertedIds: result.map(p => p._id)
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add products", details: err.message });
  }
});

// Get All Products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find({}); // <-- Using Mongoose model
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch products", details: err.message });
  }
});

// Get a single product by ID
app.get("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id); // <-- Using Mongoose model
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
    const result = await Product.findByIdAndUpdate(id, updateData, { new: true }); // <-- Using Mongoose model
    if (!result) {
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
    const result = await Product.findByIdAndDelete(id); // <-- Using Mongoose model
    if (!result) {
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
    const result = await Product.deleteMany({}); // <-- Using Mongoose model
    res.json({
      message: "All products deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete products", details: err.message });
  }
});

// ============================================================================
// Signup route with password hashing
app.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10); // <-- Password hashing
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
    const isMatch = await bcrypt.compare(password, user.password); // <-- Comparing password
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    const token = sign(
      { id: user._id },
      process.env.JWT_SECRET, // <-- Using env var for secret
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
    const decoded = verify(token, process.env.JWT_SECRET); // <-- Using env var for secret
    res.json({ message: "Protected data", userId: decoded.id });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// ======================= Offers CRUD =======================
// (Refactored to use Mongoose Models as well)

// Create multiple offers
app.post("/offers", async (req, res) => {
  try {
    const offersArray = req.body;
    if (!Array.isArray(offersArray) || offersArray.length === 0) {
      return res.status(400).json({ error: "Request body must be an array of offers" });
    }
    const result = await Offer.insertMany(offersArray);
    res.status(201).json({
      message: "Offers added successfully",
      insertedCount: result.length,
      insertedIds: result.map(o => o._id),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add offers", details: err.message });
  }
});

// Get all offers
app.get("/offers", async (req, res) => {
  try {
    const offers = await Offer.find({});
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch offers", details: err.message });
  }
});

// Get a single offer by ID
app.get("/offers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
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
    const result = await Offer.findByIdAndUpdate(id, updateData, { new: true });
    if (!result) {
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
    const result = await Offer.findByIdAndDelete(id);
    if (!result) {
      return res.status(404).json({ error: "Offer not found" });
    }
    res.json({ message: "Offer deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete offer", details: err.message });
  }
});

// Start server using the dynamic port from Render or default to 5000
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});