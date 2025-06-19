// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Limpando dados antigos...')

  // Exclui os pratos primeiro (pois têm FK para cozinheira)
  await prisma.prato_tb.deleteMany()

  // Depois exclui as cozinheiras
  await prisma.cozinheira_tb.deleteMany()

  console.log('Inserindo novos dados...')

  // Cria 1 cozinheira
  const cozinheira = await prisma.cozinheira_tb.create({
    data: {
      nome: 'Maria da Cozinha',
      email: 'maria@example.com',
      senha: 'senha123',
    },
  })

  // Lista de pratos
  const pratos = [
    { principal: 'Lasanha de Carne', sobremesa: 'Pudim', bebida: 'Suco de Laranja' },
    { principal: 'Feijoada', sobremesa: 'Mousse de Maracujá', bebida: 'Refrigerante' },
    { principal: 'Estrogonofe', sobremesa: 'Gelatina', bebida: 'Água' },
    { principal: 'Macarrão ao molho branco', sobremesa: 'Sorvete', bebida: 'Suco de Uva' },
    { principal: 'Arroz carreteiro', sobremesa: 'Doce de leite', bebida: 'Coca-Cola' },
    { principal: 'Frango grelhado', sobremesa: 'Bolo de chocolate', bebida: 'Chá gelado' },
    { principal: 'Escondidinho de carne seca', sobremesa: 'Torta de limão', bebida: 'Suco de manga' },
  ]

  const turnos = ['Manhã', 'Tarde', 'Noturno']

  // Começar da segunda-feira desta semana
  const hoje = new Date()
  const diaDaSemana = hoje.getDay()
  const diasParaSegunda = diaDaSemana === 0 ? 1 : (1 - diaDaSemana)
  const segunda = new Date(hoje)
  segunda.setDate(hoje.getDate() + diasParaSegunda)
  segunda.setHours(0, 0, 0, 0)

  for (let i = 0; i < pratos.length; i++) {
    const prato = pratos[i]

    const dataPrato = new Date(segunda)
    dataPrato.setDate(segunda.getDate() + i)

    const turno = turnos[Math.floor(Math.random() * turnos.length)]

    await prisma.prato_tb.create({
      data: {
        dia: dataPrato,
        turno,
        principal: prato.principal,
        sobremesa: prato.sobremesa,
        bebida: prato.bebida,
        imagem: 'https://www.gastronomia.com.br/wp-content/uploads/2024/01/comida-com-f-feijoada-falafel-fondue-e-muito-mais.jpg',
        id_usuario: cozinheira.id_usuario,
      },
    })
  }

  console.log('Seed reinserido com sucesso!')
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect().finally(() => process.exit(1))
  })