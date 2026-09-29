// export class PartnersController {}

import { Request, Response } from 'express';

export class PartnersController {
  getPartners = async (_req: Request, res: Response) => {
    return res.status(200).json({
      data: [],
    });
  };
}

export default PartnersController;
