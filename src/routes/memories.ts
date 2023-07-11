import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function memoriesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    await req.jwtVerify() // aqui estamos aplicando o validacao de autenticacao em todo arquivo
  })

  app.get('/memories', async (req, rep) => {
    const memories = await prisma.memory.findMany({
      where: {
        userId: req.user.sub,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return memories.map((memory) => {
      return {
        id: memory.id,
        coverUrl: memory.coverUrl,
        excerpt: memory.content.substring(0, 115).concat(' ... '),
      }
    })
  })

  app.get('/memories/:id', async (req, rep) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(req.params)

    const memory = await prisma.memory.findFirstOrThrow({
      where: {
        id,
      },
    })

    if (!memory.isPublic && memory.userId !== req.user.sub) {
      return rep.status(401).send()
    }

    return memory
  })

  app.post('/memories', async (req) => {
    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false),
    })

    const { content, isPublic, coverUrl } = bodySchema.parse(req.body)

    const memory = await prisma.memory.create({
      data: {
        content,
        coverUrl,
        isPublic,
        userId: req.user.sub,
      },
    })

    return memory
  })

  app.put('/memories/:id', async (req, rep) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const bodySchema = z.object({
      content: z.string(),
      coverUrl: z.string(),
      isPublic: z.coerce.boolean().default(false),
    })

    const { content, isPublic, coverUrl } = bodySchema.parse(req.body)
    const { id } = paramsSchema.parse(req.params)

    const memory = await prisma.memory.findFirstOrThrow({
      where: {
        id,
      },
    })

    if (memory.userId !== req.user.sub) {
      return rep.status(401).send()
    }

    const memoryD = await prisma.memory.update({
      where: {
        id,
      },
      data: {
        content,
        coverUrl,
        isPublic,
      },
    })

    return memoryD
  })

  app.delete('/memories/:id', async (req, rep) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = paramsSchema.parse(req.params)

    const memoryD = await prisma.memory.findFirstOrThrow({
      where: {
        id,
      },
    })

    if (memoryD.userId !== req.user.sub) {
      return rep.status(401).send()
    }

    const memory = await prisma.memory.delete({
      where: {
        id,
      },
    })

    return memory
  })
}
