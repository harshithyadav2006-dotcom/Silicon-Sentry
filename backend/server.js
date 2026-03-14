const express = require("express");
const cors = require("cors");

const complaintRoutes = require("./routes/complaintRoutes");
const authRoutes = require("./routes/authRoutes");
const speechRoutes = require("./routes/speechRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "SiliconSentry backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/speech", speechRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
