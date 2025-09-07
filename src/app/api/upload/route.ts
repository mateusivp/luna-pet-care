import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getStorage } from 'firebase-admin/storage'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { v4 as uuidv4 } from 'uuid'

// Inicializar Firebase Admin se ainda não foi inicializado
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  })
}

const storage = getStorage()

// Configurações de upload
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
}

const ALL_ALLOWED_TYPES = [...ALLOWED_TYPES.images, ...ALLOWED_TYPES.documents, ...ALLOWED_TYPES.videos]

interface UploadResult {
  url: string
  fileName: string
  fileSize: number
  fileType: string
  path: string
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    // Obter dados do formulário
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'general'
    const isPublic = formData.get('public') === 'true'
    
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo é obrigatório' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de arquivo não permitido. Tipos aceitos: ${ALL_ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const fileExtension = file.name.split('.').pop()
    const uniqueFileName = `${uuidv4()}.${fileExtension}`
    
    // Definir caminho do arquivo
    const filePath = isPublic 
      ? `public/${folder}/${uniqueFileName}`
      : `users/${decodedToken.uid}/${folder}/${uniqueFileName}`

    // Converter arquivo para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Firebase Storage
    const bucket = storage.bucket()
    const fileRef = bucket.file(filePath)

    // Definir metadados
    const metadata = {
      contentType: file.type,
      metadata: {
        uploadedBy: decodedToken.uid,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        folder,
        isPublic: isPublic.toString(),
      },
    }

    // Fazer upload
    await fileRef.save(buffer, {
      metadata,
      public: isPublic,
    })

    // Gerar URL de acesso
    let downloadURL: string
    
    if (isPublic) {
      // Para arquivos públicos, gerar URL pública
      await fileRef.makePublic()
      downloadURL = `https://storage.googleapis.com/${bucket.name}/${filePath}`
    } else {
      // Para arquivos privados, gerar URL assinada (válida por 7 dias)
      const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 dias
      })
      downloadURL = signedUrl
    }

    const result: UploadResult = {
      url: downloadURL,
      fileName: uniqueFileName,
      fileSize: file.size,
      fileType: file.type,
      path: filePath,
    }

    return NextResponse.json({
      message: 'Arquivo enviado com sucesso',
      file: result,
    })

  } catch (error: any) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Listar arquivos do usuário
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder')
    const fileType = searchParams.get('type') // 'images', 'documents', 'videos'
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Definir prefixo de busca
    const prefix = folder 
      ? `users/${decodedToken.uid}/${folder}/`
      : `users/${decodedToken.uid}/`

    const bucket = storage.bucket()
    const [files] = await bucket.getFiles({
      prefix,
      maxResults: limit,
    })

    // Filtrar e formatar arquivos
    let filteredFiles = files
    
    if (fileType && ALLOWED_TYPES[fileType as keyof typeof ALLOWED_TYPES]) {
      const allowedTypes = ALLOWED_TYPES[fileType as keyof typeof ALLOWED_TYPES]
      filteredFiles = files.filter(file => {
        const metadata = file.metadata
        return allowedTypes.includes(metadata.contentType || '')
      })
    }

    const fileList = await Promise.all(
      filteredFiles.map(async (file) => {
        const metadata = file.metadata
        
        // Gerar URL assinada para arquivos privados
        const [signedUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 60 * 60 * 1000, // 1 hora
        })

        return {
          name: file.name.split('/').pop(),
          path: file.name,
          url: signedUrl,
          size: parseInt(metadata.size || '0'),
          contentType: metadata.contentType,
          uploadedAt: metadata.metadata?.uploadedAt,
          folder: metadata.metadata?.folder,
          originalName: metadata.metadata?.originalName,
        }
      })
    )

    return NextResponse.json({
      files: fileList,
      total: fileList.length,
      folder: folder || 'all',
    })

  } catch (error: any) {
    console.error('Erro ao listar arquivos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

// Deletar arquivo
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    
    const { filePath } = await request.json()
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Caminho do arquivo é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o arquivo pertence ao usuário
    if (!filePath.startsWith(`users/${decodedToken.uid}/`)) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      )
    }

    const bucket = storage.bucket()
    const file = bucket.file(filePath)

    // Verificar se o arquivo existe
    const [exists] = await file.exists()
    if (!exists) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      )
    }

    // Deletar arquivo
    await file.delete()

    return NextResponse.json({
      message: 'Arquivo deletado com sucesso',
      filePath,
    })

  } catch (error: any) {
    console.error('Erro ao deletar arquivo:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}