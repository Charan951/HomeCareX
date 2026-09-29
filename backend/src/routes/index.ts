// import { Router } from 'express';

// export const rootRouter = Router();

// // Routes will be registered here under /api/v1
// export default rootRouter;

// import { Router } from 'express';
// import { partnersRoutes } from '../modules/partners/partners.routes';

// export const rootRouter = Router();

// rootRouter.use('/admin/partners', partnersRoutes);

// export default rootRouter;


import { Router } from "express";
import { auditRoutes } from "../modules/audit/audit.routes";

export const rootRouter = Router();

rootRouter.use("/admin", auditRoutes);

export default rootRouter;
