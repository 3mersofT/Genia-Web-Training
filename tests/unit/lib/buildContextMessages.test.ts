import { buildContextMessages } from '@/lib/buildContextMessages';

describe('buildContextMessages', () => {
  it('devrait garder tous les messages si la conversation est courte', () => {
    const messages = [
      { role: 'assistant', content: 'Bonjour !' },
      { role: 'user', content: 'Salut' },
      { role: 'assistant', content: 'Comment puis-je aider ?' },
    ];

    const result = buildContextMessages(messages, 'test');
    expect(result).toHaveLength(3);
  });

  it('devrait garder les messages avec des mots-clés d\'exercice', () => {
    const messages: any[] = [];

    // Créer 30 messages de remplissage
    for (let i = 0; i < 30; i++) {
      messages.push({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Message générique ${i}`,
      });
    }

    // Ajouter un exercice au milieu (index 5)
    messages[5] = {
      role: 'assistant',
      content: 'Voici un exercice : essaie de créer un prompt pour résumer un article.',
      methodStep: 'I',
    };

    // Ajouter la réponse de l'étudiant (index 6)
    messages[6] = {
      role: 'user',
      content: 'Résume cet article en 3 points clés',
    };

    const result = buildContextMessages(messages, 'Mon nouvel essai');

    // L'exercice (index 5) doit être dans le résultat
    const hasExercise = result.some(m => m.content.includes('Voici un exercice'));
    expect(hasExercise).toBe(true);

    // La réponse de l'étudiant (index 6) doit être dans le résultat
    const hasStudentResponse = result.some(m => m.content.includes('Résume cet article'));
    expect(hasStudentResponse).toBe(true);
  });

  it('devrait garder les messages avec des exemples', () => {
    const messages: any[] = [];
    for (let i = 0; i < 30; i++) {
      messages.push({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Message ${i}`,
      });
    }

    messages[3] = {
      role: 'assistant',
      content: 'Voici un exemple de prompt efficace : ✅ "Agis en tant que..."',
      methodStep: 'E',
    };

    const result = buildContextMessages(messages, 'test');
    const hasExample = result.some(m => m.content.includes('Voici un exemple'));
    expect(hasExample).toBe(true);
  });

  it('devrait toujours garder les 12 derniers messages', () => {
    const messages: any[] = [];
    for (let i = 0; i < 30; i++) {
      messages.push({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Message ${i}`,
      });
    }

    const result = buildContextMessages(messages, 'test');

    // Les 12 derniers messages (18-29) doivent être présents
    const lastMessage = result[result.length - 1];
    expect(lastMessage.content).toBe('Message 29');
  });

  it('devrait filtrer les messages système', () => {
    const messages = [
      { role: 'system', content: 'System message' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Hi' },
    ];

    const result = buildContextMessages(messages, 'test');
    const hasSystem = result.some(m => m.content === 'System message');
    expect(hasSystem).toBe(false);
  });

  it('devrait ajouter un indicateur quand des messages sont sautés', () => {
    const messages: any[] = [];
    for (let i = 0; i < 40; i++) {
      messages.push({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Message ${i}`,
      });
    }

    // Ajouter un exercice important très tôt
    messages[2] = {
      role: 'assistant',
      content: 'À ton tour, essaie de formuler un prompt',
      methodStep: 'I',
    };

    const result = buildContextMessages(messages, 'test');
    const hasSkipIndicator = result.some(m => m.content.includes('omis'));
    expect(hasSkipIndicator).toBe(true);
  });

  it('devrait ne pas dépasser maxMessages', () => {
    const messages: any[] = [];
    for (let i = 0; i < 50; i++) {
      messages.push({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: `Message ${i}`,
      });
    }

    const result = buildContextMessages(messages, 'test', 20);

    // Le résultat ne doit pas dépasser 20 + les indicateurs de coupure
    const nonSystemMessages = result.filter(m => !m.content.includes('omis'));
    expect(nonSystemMessages.length).toBeLessThanOrEqual(20);
  });
});
