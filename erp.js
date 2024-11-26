const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 5000;
const JWT_SECRET = "chavesegura";


app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb://127.0.0.1:27017/erp_vendas", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Erro ao conectar ao MongoDB:"));
db.once("open", () => {
  console.log("Conectado ao MongoDB");
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const SaleSchema = new mongoose.Schema({
  orderId: String,
  amount: Number,
  timeAgo: String,
});
const ProductSchema = new mongoose.Schema({
  name: String,
  image: String,
});

const User = mongoose.model("User", UserSchema);
const Sale = mongoose.model("Sale", SaleSchema);
const Product = mongoose.model("Product", ProductSchema);

app.post("/register", async (req, res) => {
  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword });

  try {
    await user.save();
    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (error) {
    res.status(400).json({ error: "Erro ao registrar usuário" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid)
    return res.status(401).json({ error: "Senha incorreta" });

  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.get("/metrics", async (req, res) => {
  const totalSales = await Sale.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalOrders = await Sale.countDocuments();

  res.json({
    totalSales: totalSales[0]?.total || 0,
    totalOrders,
  });
});

app.get("/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.get("/recent-sales", async (req, res) => {
  const sales = await Sale.find().sort({ _id: -1 }).limit(5);
  res.json(sales);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
