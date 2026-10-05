import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { earningsService } from './earnings.service';
import type { ExportQuery, LedgerQuery } from './earnings.validation';

export const getEarningsSummary = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  const partnerId = typeof req.query.partnerId === 'string' ? req.query.partnerId : undefined;
  sendSuccess(res, await earningsService.getSummary(sub, partnerId));
});

/** req.query was already parsed and replaced by validate(ledgerQuerySchema, 'query'). */
export const getEarningsLedger = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  sendSuccess(res, await earningsService.getLedger(sub, req.query as unknown as LedgerQuery));
});

export const exportEarnings = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  const { csv, filename } = await earningsService.exportCsv(sub, req.query as unknown as ExportQuery);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv);
});