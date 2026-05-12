const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');

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
  apis: [
    path.join(__dirname, '../Routes/*.js'),
    path.join(__dirname, '../Model/*.js'),
    path.join(__dirname, '../Controllers/*.js'),
  ],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
