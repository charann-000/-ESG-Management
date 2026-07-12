require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/dbconfig");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Failed to start server:", error);
});

