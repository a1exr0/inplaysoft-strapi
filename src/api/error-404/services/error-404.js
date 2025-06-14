'use strict';

/**
 * error-404 service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::error-404.error-404');
