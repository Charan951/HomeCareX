// import { Router } from 'express';
// export const partnersRoutes = Router();
import { Router } from "express";
import { PartnersController } from "./partners.controller";

export const partnersRoutes = Router();

const controller = new PartnersController();

partnersRoutes.get("/", controller.getPartners);

export default partnersRoutes;
