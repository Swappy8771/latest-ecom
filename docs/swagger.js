const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce API',
      version: '1.0.0',
      description: 'Backend API for Multi-vendor E-Commerce Platform',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Local Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./routes/*.js', './models/*.js'], // points to files with Swagger comments
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;