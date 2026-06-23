import client from './client'
import type { Document, DocumentReview } from '../types'

export async function uploadDocument(file: File, userId: string): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  form.append('userId', userId)
  const res = await client.post('/documents/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function fetchDocuments(userId: string): Promise<Document[]> {
  const res = await client.get('/documents', { params: { userId } })
  return res.data
}

export async function fetchDocument(id: string): Promise<Document> {
  const res = await client.get(`/documents/${id}`)
  return res.data
}

export async function fetchDocumentReview(id: string): Promise<DocumentReview> {
  const res = await client.get(`/documents/${id}/review`)
  return res.data
}

export async function saveCorrections(
  id: string,
  corrections: { pageId: string; wordIndex: number; correctedWord: string; originalWord: string }[],
  userId: string
): Promise<{ count: number }> {
  const res = await client.post(`/documents/${id}/corrections`, { corrections, userId })
  return res.data
}

export async function approveDocument(id: string): Promise<Document> {
  const res = await client.post(`/documents/${id}/approve`)
  return res.data
}

export async function exportDocument(id: string, format: 'pdf' | 'txt' | 'md'): Promise<void> {
  const res = await client.get(`/documents/${id}/export/${format}`, {
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([res.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `document.${format}`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
