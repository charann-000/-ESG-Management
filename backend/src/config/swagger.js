const swaggerJsdoc = require("swagger-jsdoc");
const env = require("./env");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "EcoSphere ESG Management API",
      version: "1.0.0",
      description: "API documentation for the EcoSphere ESG Management Platform.",
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
        description: "Development server",
      },
      {
        url: env.frontendUrl,
        description: "Frontend URL (Reference)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
