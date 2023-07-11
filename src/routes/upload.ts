/* eslint-disable camelcase */
import { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { extname, resolve } from 'node:path'
import { pipeline } from 'node:stream'; // permite aguardar o processo de uplaod finalizar
import { URL } from 'node:url'
import { promisify } from 'node:util'

const pump = promisify(pipeline)

export async function uploadRoutes(app: FastifyInstance) {
  // para amazenamento de uplaod use amazon s3

  app.post('/upload', async (request, reply) => {
    const uplaod = await request.file({
      limits: {
        fileSize: 5_242_880, // 5mb
      },
    })

    if (!uplaod) {
      return reply.status(400).send('Sem nada')
    }

    const mimeTypeRegex = /^(image|video)\/[a-zA-Z]+/
    const isValidFileFormat = mimeTypeRegex.test(uplaod.mimetype)

    if (!isValidFileFormat) {
      return reply.status(400).send('Invalido')
    }

    const fileId = randomUUID()
    const extension = extname(uplaod.filename)

    const fileName = fileId.concat(extension)

    // salando aos poucos o doc
    const writeStream = createWriteStream(
      resolve(__dirname, '../../uploads/', fileName),
    )

    await pump(uplaod.file, writeStream)

    const fullUrl = request.protocol.concat('://').concat(request.hostname)
    const fileUrl = new URL(`/uploads/${fileName}`, fullUrl).toString()

    return reply.status(200).send(fileUrl)
  })
}
