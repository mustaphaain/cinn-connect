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
    '/films/by-genre': {
      get: {
        summary: 'Films par genre (OMDb -> genres stockés en DB)',
        parameters: [
          { name: 'genres', in: 'query', required: true, schema: { type: 'string' }, description: 'Ex: Action,Sci-Fi,Science Fiction' },
          { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
          { name: 'offset', in: 'query', required: false, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/films/omdb/search': {
      get: {
        summary: 'Recherche OMDb (cache DB)',
        parameters: [
          { name: 's', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' }, 404: { description: 'Aucun résultat' } },
      },
    },
    '/films/omdb/movie/{imdbId}': {
      get: {
        summary: 'Fiche OMDb / imdbId (cache DB)',
        parameters: [{ name: 'imdbId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Introuvable' } },
      },
    },
    '/films/omdb/by-title': {
      get: {
        summary: 'Fiche OMDb par titre + année (cache DB)',
        parameters: [
          { name: 'title', in: 'query', required: true, schema: { type: 'string' } },
          { name: 'year', in: 'query', required: true, schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'OK' }, 404: { description: 'Introuvable' } },
      },
    },
  },
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
}
