"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// POST /votacao - registra um voto
app.post('/votacao', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_prato, voto, ip_usuario } = req.body;
    if (typeof id_prato !== 'number' || typeof voto !== 'boolean' || typeof ip_usuario !== 'string') {
        return res.status(400).json({ error: 'Campos inválidos' });
    }
    try {
        const votoCriado = yield prisma.votacao_tb.create({
            data: {
                id_prato,
                voto,
                data_voto: new Date(),
                ip_usuario,
            }
        });
        return res.json({ message: 'Voto registrado com sucesso', voto: votoCriado });
    }
    catch (error) {
        if (error instanceof library_1.PrismaClientKnownRequestError) {
            return res.status(409).json({ error: 'Você já votou neste prato hoje' });
        }
        console.error(error);
        return res.status(500).json({ error: 'Erro ao registrar voto' });
    }
}));
// GET /votacao - retorna resultado dos votos do dia para cada prato
app.get('/votacao', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resultado = yield prisma.$queryRawUnsafe(`
      SELECT
        p.id_prato,
        p.principal,
        COUNT(CASE WHEN v.voto = TRUE THEN 1 END) AS votos_sim,
        COUNT(CASE WHEN v.voto = FALSE THEN 1 END) AS votos_nao
      FROM prato_tb p
      LEFT JOIN votacao_tb v
        ON p.id_prato = v.id_prato
        AND DATE(v.data_voto) = CURRENT_DATE
      WHERE DATE(p.dia) = CURRENT_DATE
      GROUP BY p.id_prato, p.principal
      ORDER BY p.id_prato
    `);
        const resultadoConvertido = resultado.map(r => ({
            id_prato: r.id_prato,
            principal: r.principal,
            votos_sim: Number(r.votos_sim),
            votos_nao: Number(r.votos_nao),
        }));
        return res.json(resultadoConvertido);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar resultados' });
    }
}));
// GET /pratos - retorna todos os pratos
app.get('/pratos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pratos = yield prisma.prato_tb.findMany({
            orderBy: { id_prato: 'asc' },
        });
        return res.json(pratos);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao buscar pratos' });
    }
}));
// --- SIGNUP (sem bcrypt) ---
app.post('/signup', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    try {
        const novaCozinheira = yield prisma.cozinheira_tb.create({
            data: { nome, email, senha } // senha salva em texto plano (somente para fins didáticos)
        });
        res.status(201).json({ message: 'Usuária criada', id_usuario: novaCozinheira.id_usuario });
    }
    catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erro interno' });
    }
}));
// --- SIGNIN (sem jwt) ---
app.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }
    try {
        const cozinheira = yield prisma.cozinheira_tb.findUnique({ where: { email } });
        if (!cozinheira || cozinheira.senha !== senha) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        res.json({
            message: 'Login bem-sucedido',
            id_usuario: cozinheira.id_usuario,
            nome: cozinheira.nome,
            email: cozinheira.email
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao realizar login' });
    }
}));
// --- CRUD dos Pratos (sem autenticação) ---
// CREATE prato
app.post('/pratos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { dia, turno, principal, sobremesa, bebida, imagem, id_usuario } = req.body;
    if (!dia || !turno || !principal || !sobremesa || !bebida || !id_usuario) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }
    try {
        const prato = yield prisma.prato_tb.create({
            data: { dia, turno, principal, sobremesa, bebida, imagem, id_usuario }
        });
        res.status(201).json(prato);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao criar prato' });
    }
}));
// READ pratos (por cozinheira)
app.get('/pratos/usuario/:id_usuario', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id_usuario = Number(req.params.id_usuario);
    try {
        const pratos = yield prisma.prato_tb.findMany({ where: { id_usuario } });
        res.json(pratos);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pratos' });
    }
}));
// UPDATE prato
app.put('/pratos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id_prato = Number(req.params.id);
    const { dia, turno, principal, sobremesa, bebida, imagem, id_usuario } = req.body;
    try {
        const pratoExistente = yield prisma.prato_tb.findFirst({ where: { id_prato, id_usuario } });
        if (!pratoExistente)
            return res.status(404).json({ error: 'Prato não encontrado ou sem permissão' });
        const pratoAtualizado = yield prisma.prato_tb.update({
            where: { id_prato },
            data: { dia, turno, principal, sobremesa, bebida, imagem }
        });
        res.json(pratoAtualizado);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar prato' });
    }
}));
// DELETE prato
app.delete('/pratos/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id_prato = Number(req.params.id);
    const { id_usuario } = req.body;
    try {
        const pratoExistente = yield prisma.prato_tb.findFirst({ where: { id_prato, id_usuario } });
        if (!pratoExistente)
            return res.status(404).json({ error: 'Prato não encontrado ou sem permissão' });
        yield prisma.prato_tb.delete({ where: { id_prato } });
        res.json({ message: 'Prato excluído com sucesso' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao excluir prato' });
    }
}));
// Buscar pratos com filtro por data e nome
app.get('/pratos/buscar', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_usuario, data, nome } = req.query;
    try {
        const filtro = {};
        if (id_usuario)
            filtro.id_usuario = Number(id_usuario);
        if (data)
            filtro.dia = new Date(data);
        if (nome) {
            filtro.principal = {
                contains: nome,
                mode: 'insensitive'
            };
        }
        const pratos = yield prisma.prato_tb.findMany({ where: filtro });
        res.json(pratos);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar pratos' });
    }
}));
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
