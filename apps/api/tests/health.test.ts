import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { registerHealthRoutes } from '../src/routes/health';

describe('API Integration Tests', () => {
  let app: ReturnType<typeof Fastify>;

  beforeAll(async () => {
    app = Fastify();
    await registerHealthRoutes(app);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(['ok', 'degraded', 'error']).toContain(body.status);
    });

    it('should include database status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('db');
      expect(['ok', 'error']).toContain(body.db);
    });

    it('should include redis status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('redis');
      expect(['ok', 'error']).toContain(body.redis);
    });

    it('should include queue status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('queue');
      expect(body.queue).toHaveProperty('waiting');
      expect(body.queue).toHaveProperty('active');
      expect(typeof body.queue.waiting).toBe('number');
      expect(typeof body.queue.active).toBe('number');
    });
  });
});