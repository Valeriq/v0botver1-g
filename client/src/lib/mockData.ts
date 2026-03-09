// Mock data for development without backend

export const mockContacts = [
  { id: '1', email: 'ivan.petrov@techcorp.ru', firstName: 'Иван', lastName: 'Петров', company: 'TechCorp', status: 'active' },
  { id: '2', email: 'maria.smirnova@startup.io', firstName: 'Мария', lastName: 'Смирнова', company: 'StartupIO', status: 'active' },
  { id: '3', email: 'alex.kozlov@bigcompany.com', firstName: 'Александр', lastName: 'Козлов', company: 'BigCompany', status: 'bounced' },
  { id: '4', email: 'elena.novikova@agency.ru', firstName: 'Елена', lastName: 'Новикова', company: 'Digital Agency', status: 'active' },
  { id: '5', email: 'dmitry.volkov@fintech.com', firstName: 'Дмитрий', lastName: 'Волков', company: 'FinTech Solutions', status: 'unsubscribed' },
  { id: '6', email: 'anna.sidorova@ecommerce.ru', firstName: 'Анна', lastName: 'Сидорова', company: 'E-Shop', status: 'active' },
  { id: '7', email: 'sergey.ivanov@logistics.com', firstName: 'Сергей', lastName: 'Иванов', company: 'Logistics Pro', status: 'active' },
  { id: '8', email: 'olga.pavlova@media.io', firstName: 'Ольга', lastName: 'Павлова', company: 'Media Group', status: 'active' },
];

export const mockEmails = [
  { id: '1', contactId: '1', contactEmail: 'ivan.petrov@techcorp.ru', subject: 'Сотрудничество в сфере AI-решений', status: 'opened', sentAt: '2026-03-08T10:30:00Z', direction: 'outbound' },
  { id: '2', contactId: '1', contactEmail: 'ivan.petrov@techcorp.ru', subject: 'Re: Сотрудничество в сфере AI-решений', status: 'replied', sentAt: '2026-03-08T14:15:00Z', direction: 'inbound' },
  { id: '3', contactId: '2', contactEmail: 'maria.smirnova@startup.io', subject: 'Предложение о партнёрстве', status: 'delivered', sentAt: '2026-03-07T09:00:00Z', direction: 'outbound' },
  { id: '4', contactId: '4', contactEmail: 'elena.novikova@agency.ru', subject: 'Автоматизация email-маркетинга', status: 'replied', sentAt: '2026-03-06T11:20:00Z', direction: 'outbound' },
  { id: '5', contactId: '4', contactEmail: 'elena.novikova@agency.ru', subject: 'Re: Автоматизация email-маркетинга', status: 'replied', sentAt: '2026-03-06T16:45:00Z', direction: 'inbound' },
  { id: '6', contactId: '6', contactEmail: 'anna.sidorova@ecommerce.ru', subject: 'Интеграция CRM-системы', status: 'sent', sentAt: '2026-03-08T08:00:00Z', direction: 'outbound' },
  { id: '7', contactId: '3', contactEmail: 'alex.kozlov@bigcompany.com', subject: 'Внедрение AI в бизнес-процессы', status: 'bounced', sentAt: '2026-03-05T12:00:00Z', direction: 'outbound' },
];

export const mockThreads: Record<string, { contactId: string; contactEmail: string; contactName: string; leadStatus?: 'new' | 'taken' | 'replied' | 'closed'; emails: Array<{ id: string; from: string; to: string; subject: string; body: string; sentAt: string; direction: 'outbound' | 'inbound'; status: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced'; isAIGenerated?: boolean }> }> = {
  '1': {
    contactId: '1',
    contactEmail: 'ivan.petrov@techcorp.ru',
    contactName: 'Иван Петров',
    leadStatus: 'new',
    emails: [
      {
        id: 'e1',
        from: 'ai@coldbot.ai',
        to: 'ivan.petrov@techcorp.ru',
        subject: 'Сотрудничество в сфере AI-решений',
        body: `Здравствуйте, Иван!

Меня зовут Александр, я представляю ColdBot.ai — платформу для автоматизации email-аутрича с использованием AI.

Мы помогаем компаниям автоматизировать холодные рассылки, при этом сохраняя персонализацию каждого письма. Наш AI сам ведёт диалог с потенциальными клиентами.

Хотел бы обсудить возможность пилотного проекта для TechCorp. У вас есть 15 минут на этой неделе для короткого звонка?

С уважением,
Александр
ColdBot.ai`,
        sentAt: '2026-03-08T10:30:00Z',
        direction: 'outbound',
        status: 'opened',
        isAIGenerated: true,
      },
      {
        id: 'e2',
        from: 'ivan.petrov@techcorp.ru',
        to: 'ai@coldbot.ai',
        subject: 'Re: Сотрудничество в сфере AI-решений',
        body: `Александр, добрый день!

Спасибо за письмо. Это интересно — мы как раз ищем способы оптимизировать наши продажи.

Когда вам удобно созвониться? Могу предложить четверг в 14:00 или пятницу утром.

Иван Петров
Директор по развитию TechCorp`,
        sentAt: '2026-03-08T14:15:00Z',
        direction: 'inbound',
        status: 'replied',
      },
    ],
  },
  '4': {
    contactId: '4',
    contactEmail: 'elena.novikova@agency.ru',
    contactName: 'Елена Новикова',
    leadStatus: 'taken',
    emails: [
      {
        id: 'e3',
        from: 'ai@coldbot.ai',
        to: 'elena.novikova@agency.ru',
        subject: 'Автоматизация email-маркетинга',
        body: `Елена, здравствуйте!

Обратил внимание на Digital Agency — отличные кейсы в сфере performance-маркетинга.

Хочу предложить рассмотреть интеграцию AI для автоматизации ваших email-кампаний. ColdBot.ai позволяет:
- Персонализировать рассылки в масштабе
- Автоматически вести диалоги с лидами
- Экономить до 80% времени менеджеров

Интересно обсудить?

Александр
ColdBot.ai`,
        sentAt: '2026-03-06T11:20:00Z',
        direction: 'outbound',
        status: 'replied',
        isAIGenerated: true,
      },
      {
        id: 'e4',
        from: 'elena.novikova@agency.ru',
        to: 'ai@coldbot.ai',
        subject: 'Re: Автоматизация email-маркетинга',
        body: `Александр, привет!

Да, это актуально. У нас сейчас много ручной работы с рассылками.

Можете прислать презентацию с тарифами? И как быстро можно начать пилот?

--
Елена Новикова
Директор Digital Agency
+7 (999) 123-45-67`,
        sentAt: '2026-03-06T16:45:00Z',
        direction: 'inbound',
        status: 'replied',
      },
    ],
  },
};

export const mockDashboardStats = {
  sent: 1247,
  opened: 892,
  replied: 156,
  leads: 23,
};

export const mockRecentEmails = [
  { id: 'r1', to: 'test1@company.ru', subject: 'AI-решения для бизнеса', sentAt: '2026-03-08T10:00:00Z' },
  { id: 'r2', to: 'test2@startup.io', subject: 'Партнёрское предложение', sentAt: '2026-03-08T09:30:00Z' },
  { id: 'r3', to: 'test3@corp.com', subject: 'Автоматизация продаж', sentAt: '2026-03-08T09:00:00Z' },
];
