import { ScheduledFollowUp, UserProfile } from '../types/UserProfile';
import { CustomerMemoryDB } from './CustomerMemoryDB';

export class FollowUpManager {
  constructor(private db: CustomerMemoryDB) {}

  public async shouldScheduleFollowUp(profile: UserProfile, lastMessageAgo: number): Promise<boolean> {
    // Não agendar se já tem follow-up pendente
    const pending = await this.db.getPendingFollowUps();
    if (pending.some(f => f.chatId === profile.chatId)) return false;

    // Não agendar se já tentou 3 vezes
    // (implementação simplificada - em produção verificaria no DB)

    // Agendar se conversa parou em estágio interessante
    const interestingStages = ['interesse', 'consideracao', 'decisao'];
    return interestingStages.includes(profile.conversationStage);
  }

  public createFollowUp(profile: UserProfile, hoursFromNow: number): ScheduledFollowUp {
    const scheduledFor = new Date(Date.now() + (hoursFromNow * 60 * 60 * 1000));
    const message = this.generateFollowUpMessage(profile, hoursFromNow);

    return {
      chatId: profile.chatId,
      scheduledFor,
      reason: `${hoursFromNow}h sem resposta`,
      message,
      attempt: 1,
      context: {
        lastTopic: profile.interests[0] || 'serviços',
        lastStage: profile.conversationStage
      }
    };
  }

  private generateFollowUpMessage(profile: UserProfile, hoursFromNow: number): string {
    const nome = profile.nome || 'oi';
    const pet = profile.petNome || 'seu pet';

    if (hoursFromNow <= 3) {
      return `${nome}! Conseguiu pensar melhor sobre aquilo que conversamos? 😊`;
    }

    if (hoursFromNow <= 24) {
      const interesse = profile.interests[0];
      if (interesse) {
        return `Oi! Passei aqui pra saber se ainda precisa de ${interesse} pro ${pet}! 💛`;
      }
      return `Oi! Conseguiu decidir? Qualquer coisa, estou aqui! 🐾`;
    }

    // 3+ dias
    return `Oi! Saudades! Se precisar de algo pro ${pet}, pode me chamar! ❤️`;
  }

  public async processPendingFollowUps(): Promise<ScheduledFollowUp[]> {
    return await this.db.getPendingFollowUps();
  }

  public async markAsExecuted(chatId: string): Promise<void> {
    await this.db.markFollowUpExecuted(chatId);
  }
}
