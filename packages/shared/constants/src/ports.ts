/**
 * Listen ports for every service in this repo. Identical in every environment, so
 * they live in code. The matching env var (API_GATEWAY_PORT, USER_SERVICE_PORT, ...)
 * still overrides each one; Render and docker-compose set them explicitly.
 */
export const SERVICE_PORT_DEFAULTS = {
  /** API_GATEWAY_PORT */
  gateway: 5460,
  /** ADMIN_PORT */
  admin: 5461,
  /** CLIENT_PORT */
  client: 5462,
  /** USER_SERVICE_PORT */
  user: 5463,
  /** PRODUCT_SERVICE_PORT */
  product: 5464,
  /** ORDER_SERVICE_PORT */
  order: 5465,
  /** INVENTORY_SERVICE_PORT */
  inventory: 5466,
  /** ANALYTICS_SERVICE_PORT */
  analytics: 5467,
} as const
