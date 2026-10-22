import type { Request, Response } from 'express';
import * as leads from '../services/lead.service';
import { leadInputSchema, leadListQuerySchema, leadStatusSchema } from '../validators/lead.schema';

export async function createLead(req: Request, res: Response) {
  const input = leadInputSchema.parse(req.body);
  const result = await leads.createLead(input, req.get('user-agent'));
  res.status(result.stored ? 201 : 202).json(result);
}

export async function listLeads(req: Request, res: Response) {
  const query = leadListQuerySchema.parse(req.query);
  res.set('Cache-Control', 'no-store').json(await leads.listLeads(query));
}

export async function updateLead(req: Request<{ id: string }>, res: Response) {
  const data = leadStatusSchema.parse(req.body);
  res.json(await leads.updateLead(req.params.id, data));
}
