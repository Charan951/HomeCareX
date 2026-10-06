import { Router } from 'express';
import { catalogController } from './catalog.controller';

/** Public, no auth. Mounted at the API root: GET /categories, GET /services, GET /services/:idOrSlug. */
export const catalogRoutes = Router();
catalogRoutes.get('/categories', catalogController.categories);
catalogRoutes.get('/services', catalogController.services);
catalogRoutes.get('/services/:idOrSlug', catalogController.service);

export default catalogRoutes;
