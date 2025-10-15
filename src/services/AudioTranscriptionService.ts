import Groq from 'groq-sdk';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

/**
 * Serviço de transcrição de áudios usando Groq API
 */
export class AudioTranscriptionService {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
    console.log('🎙️ AudioTranscriptionService inicializado com Groq');
  }

  /**
   * Transcreve áudio do WhatsApp
   *
   * @param audioUrl URL do áudio no WAHA
   * @param audioId ID do áudio para cache
   * @returns Texto transcrito
   */
  public async transcribeAudio(audioUrl: string, audioId: string): Promise<string> {
    try {
      console.log(`🎙️ Baixando áudio: ${audioId}`);

      // Cria diretório temporário se não existir
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Baixa o áudio
      const audioPath = path.join(tempDir, `${audioId}.ogg`);
      const response = await axios.get(audioUrl, {
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      fs.writeFileSync(audioPath, response.data);
      console.log(`💾 Áudio salvo: ${audioPath}`);

      // Transcreve com Groq
      console.log(`🎙️ Transcrevendo áudio com Groq...`);
      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-large-v3',
        language: 'pt', // Português
        response_format: 'text',
      });

      // Remove arquivo temporário
      fs.unlinkSync(audioPath);
      console.log(`🗑️ Arquivo temporário removido`);

      const text = typeof transcription === 'string' ? transcription : transcription.text;
      console.log(`✅ Transcrição completa: "${text.substring(0, 50)}..."`);

      return text;
    } catch (error: any) {
      console.error('❌ Erro ao transcrever áudio:', error.message);
      throw new Error(`Falha na transcrição: ${error.message}`);
    }
  }

  /**
   * Verifica se é uma mensagem de áudio
   */
  public isAudioMessage(message: any): boolean {
    return message.type === 'audio' ||
           message.type === 'voice' ||
           message.type === 'ptt'; // Push to talk (áudio do WhatsApp)
  }

  /**
   * Extrai URL do áudio da mensagem
   */
  public getAudioUrl(message: any): string | null {
    // WAHA pode retornar diferentes formatos
    if (message.media?.url) {
      return message.media.url;
    }
    if (message.mediaUrl) {
      return message.mediaUrl;
    }
    if (message._data?.mediaUrl) {
      return message._data.mediaUrl;
    }
    return null;
  }

  /**
   * Gera respostas humanas para quando recebe áudio
   */
  public getAudioAcknowledgment(): string {
    const responses = [
      'deixa eu ouvir aqui',
      'peraí que to ouvindo',
      'to ouvindo',
      'deixa eu escutar',
      'um segundo que to ouvindo seu audio',
      'ouvindo aqui',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
