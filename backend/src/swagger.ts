export const openApiSpec = {
  openapi: '3.0.0',
  info: { title: 'CinéConnect API', version: '1.0.0' },
  servers: [{ url: 'http://localhost:3001' }],
  paths: {
    '/health': { get: { summary: 'Santé', responses: { 200: { description: 'OK' } } } },
    '/auth/register': { post: { summary: 'Inscription', responses: { 201: { description: 'Créé' } } } },
    '/auth/login': { post: { summary: 'Connexion', responses: { 200: { description: 'OK' } } } },
    '/users/me': { get: { summary: 'Profil', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
    '/reviews/me': { get: { summary: 'Mes avis', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
    '/friends': { get: { summary: 'Amis', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
    '/messages': { get: { summary: 'Chat', security: [{ bearerAuth: [] }], responses: { 200: { description: 'OK' } } } },
  },
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
}
