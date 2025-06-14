'use strict';

/**
 * error-404 controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::error-404.error-404');
