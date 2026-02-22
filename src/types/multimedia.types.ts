export type MultimediaBlockType = 'video' | 'image' | 'code' | 'playground' | 'attachment'

export type VideoProvider = 'youtube' | 'vimeo' | 'self-hosted'

export type SupportedLanguage = 'python' | 'javascript' | 'typescript' | 'json' | 'bash'

export type AttachmentFileType = 'pdf' | 'docx' | 'zip' | 'json'

export interface VideoContent {
  type: 'video'
  id: string
  url: string
  provider: VideoProvider
  title?: string
  caption?: string
  durationSeconds?: number
  thumbnail?: string
  autoplay?: boolean
  startTime?: number
}

export interface ImageContent {
  type: 'image'
  id: string
  url: string
  alt: string
  caption?: string
  width?: number
  height?: number
  thumbnail?: string
  priority?: boolean
}

export interface CodeBlockContent {
  type: 'code'
  id: string
  code: string
  language: SupportedLanguage
  title?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  filename?: string
}

export interface PlaygroundContent {
  type: 'playground'
  id: string
  title?: string
  description?: string
  starterPrompt: string
  context?: string
  expectedOutput?: string
}

export interface AttachmentContent {
  type: 'attachment'
  id: string
  url: string
  filename: string
  fileType: AttachmentFileType
  fileSize?: number
  description?: string
  iconUrl?: string
}

export type MultimediaBlock =
  | VideoContent
  | ImageContent
  | CodeBlockContent
  | PlaygroundContent
  | AttachmentContent
