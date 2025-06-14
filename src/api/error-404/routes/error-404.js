'use strict';

/**
 * error-404 router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::error-404.error-404');
