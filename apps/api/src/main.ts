import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db/knex';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cookieParser() as any);
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Health endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// POST /auth/check-jamb
app.post('/auth/check-jamb', async (req: Request, res: Response) => {
  try {
    const jambRegNoRaw = req.body?.jambRegNo;
    const jambRegNo = (jambRegNoRaw || '').toString().trim().toUpperCase();
    if (!jambRegNo) {
      return res.status(400).json({ message: 'jambRegNo is required' });
    }

    const row = await db('jamb_prelist').where({ jamb_reg_no: jambRegNo }).first();
    if (!row) {
      return res.json({ exists: false });
    }

    const biodata = {
      jambRegNo: row.jamb_reg_no,
      surname: row.surname,
      firstname: row.firstname,
      othernames: row.othernames,
      programmeCode: row.programme_code,
      departmentCode: row.department_code,
      session: row.session,
    };

    return res.json({ exists: true, biodata });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[check-jamb] error:', err?.message || err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

const port = Number(process.env.PORT || 4000);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Express API listening on http://localhost:${port}`);
});