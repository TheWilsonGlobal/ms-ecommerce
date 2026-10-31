import {
  AUTH_AUDIENCE_DEFAULT,
  DB_POOL_MAX_DEFAULT,
  ELASTICSEARCH_INDEX_DEFAULT,
  ORDER_EXPIRATION_MINUTES_DEFAULT,
  OUTBOX_DEFAULTS,
  RATE_LIMIT_DEFAULTS,
  REDIS_DB_DEFAULT,
  SERVICE_PORT_DEFAULTS,
  STORAGE_DEFAULTS,
} from '../index'

describe('shared constants', () => {
  it('service ports match the values in .env.example', () => {
    expect(SERVICE_PORT_DEFAULTS).toEqual({
      gateway: 5460,
      admin: 5461,
      client: 5462,
      user: 5463,
      product: 5464,
      order: 5465,
      inventory: 5466,
      analytics: 5467,
    })
  })

  it('equal the values that used to live in .env / code literals', () => {
    expect(OUTBOX_DEFAULTS).toEqual({
      pollMs: 500,
      batch: 50,
      maxAttempts: 10,
      leaseMs: 60_000,
      sendTimeoutMs: 10_000,
    })
    expect(RATE_LIMIT_DEFAULTS).toEqual({
      ipPerMin: 300,
      authIpPerMin: 20,
      authEmailPerMin: 5,
      userReadPerMin: 120,
      userWritePerMin: 30,
      expensivePerMin: 20,
      adminPerMin: 10,
    })
    expect(AUTH_AUDIENCE_DEFAULT).toBe('authenticated')
    expect(DB_POOL_MAX_DEFAULT).toBe(3)
    expect(REDIS_DB_DEFAULT).toBe(0)
    expect(STORAGE_DEFAULTS).toEqual({
      provider: 'rustfs',
      bucket: 'ecommerce-uploads',
      region: 'us-east-1',
      useSSL: false,
    })
    expect(ELASTICSEARCH_INDEX_DEFAULT).toBe('products')
    expect(ORDER_EXPIRATION_MINUTES_DEFAULT).toBe(15)
  })

  it('keeps the outbox lease longer than the send timeout', () => {
    expect(OUTBOX_DEFAULTS.leaseMs).toBeGreaterThan(OUTBOX_DEFAULTS.sendTimeoutMs)
  })
})
