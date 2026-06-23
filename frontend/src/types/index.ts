export type DocumentStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'AWAITING_REVIEW'
  | 'REVIEWED'
  | 'EXPORTED'
  | 'FAILED'

export interface Document {
  id: string
  userId: string
  originalFilename: string
  uploadTime: string
  status: DocumentStatus
  pageCount?: number
}

export interface Page {
  id: string
  documentId: string
  imagePath: string
  pageNumber: number
}

export interface WordResult {
  word: string
  confidence: number
  correctedWord?: string
  suggestionFromProfile?: string
}

export interface OcrResult {
  id: string
  pageId: string
  rawText: string
  confidence: number
  words: WordResult[]
}

export interface PageReview {
  page: Page
  ocrResult: OcrResult
}

export interface DocumentReview {
  document: Document
  pages: PageReview[]
}

export interface Correction {
  id: string
  userId: string
  originalWord: string
  correctedWord: string
  frequency: number
}

export interface ExportFile {
  id: string
  documentId: string
  fileType: 'TXT' | 'PDF' | 'MD'
  filePath: string
  createdAt: string
}

export interface ApiError {
  message: string
  status: number
}
