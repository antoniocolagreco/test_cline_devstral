import { Buffer } from 'buffer'

export default interface Image {
    id: number
    buffer: Buffer
    mimeType: string
}
