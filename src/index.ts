import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';

// Tipagem correta do app
const app: express.Application = express();
const prisma = new PrismaClient();
const port: number = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Tipagem do corpo da requisição
interface VotacaoRequestBody {
  id_prato: number;
  voto: boolean;
  ip_usuario: string;
}

// POST /votacao - registra um voto
app.post('/votacao', async (req: Request, res: Response) => {
  const { id_prato, voto, ip_usuario } = req.body as VotacaoRequestBody;

  if (typeof id_prato !== 'number' || typeof voto !== 'boolean' || typeof ip_usuario !== 'string') {
    return res.status(400).json({ error: 'Campos inválidos' });
  }

  try {
    const votoCriado = await prisma.votacao_tb.create({
      data: {
        id_prato,
        voto,
        data_voto: new Date(),
        ip_usuario,
      },
    });

    return res.json({ message: 'Voto registrado com sucesso' });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Você já votou neste prato hoje' });
    }

    console.error(error);
    return res.status(500).json({ error: 'Erro ao registrar voto' });
  }
});

// GET /votacao - retorna resultado dos votos do dia
app.get('/votacao', async (req: Request, res: Response) => {
  try {
    const resultado = await prisma.$queryRawUnsafe<any[]>(`
      SELECT
        p.id_prato,
        p.principal,
        COUNT(CASE WHEN v.voto = TRUE THEN 1 END) AS votos_sim,
        COUNT(CASE WHEN v.voto = FALSE THEN 1 END) AS votos_nao
      FROM prato_tb p
      LEFT JOIN votacao_tb v ON p.id_prato = v.id_prato AND v.data_voto = CURRENT_DATE
      GROUP BY p.id_prato, p.principal
      ORDER BY p.id_prato
    `);

    return res.json(resultado);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar resultados' });
  }
});

// GET /pratos - retorna todos os pratos
app.get('/pratos', async (_req: Request, res: Response) => {
  try {
    const pratos = await prisma.$queryRawUnsafe<any[]>(`
      SELECT * FROM prato_tb
      ORDER BY id_prato ASC
    `);

    return res.json(pratos);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar pratos' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
