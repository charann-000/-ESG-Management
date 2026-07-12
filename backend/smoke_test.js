const http = require("http");
const app = require("./src/app");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");

const PORT = 5001; // use different port for testing

const runSmokeTests = async () => {
  let server;
  try {
    console.log("Starting smoke tests...");
    await connectDB();
    
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(PORT, resolve));
    console.log(`Test server running on port ${PORT}`);

    const baseUrl = `http://localhost:${PORT}`;

    // Test GET /
    let res = await fetch(`${baseUrl}/`);
    let json = await res.json();
    console.log("GET / :", json.success ? "PASS" : "FAIL");

    // Test GET /health
    res = await fetch(`${baseUrl}/health`);
    json = await res.json();
    console.log("GET /health :", json.status === "healthy" ? "PASS" : "FAIL");

    // Test GET /api-docs
    res = await fetch(`${baseUrl}/api-docs/`);
    console.log("GET /api-docs :", res.status === 200 ? "PASS" : "FAIL");

    // Test POST /api/auth/login (fail case)
    res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "invalid@example.com", password: "wrong" })
    });
    json = await res.json();
    console.log("POST /api/auth/login (invalid) :", res.status === 401 && !json.success ? "PASS" : "FAIL");

  } catch (error) {
    console.error("Smoke tests failed:", error);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    console.log("Smoke tests finished.");
    process.exit(0);
  }
};

runSmokeTests();
