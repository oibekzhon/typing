export function calculateWpm(correctChars, elapsedMs) {
  if (!elapsedMs || elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return (correctChars / 5) / minutes;
}

export function calculateRawWpm(totalTypedChars, elapsedMs) {
  if (!elapsedMs || elapsedMs <= 0) return 0;
  const minutes = elapsedMs / 60000;
  return (totalTypedChars / 5) / minutes;
}

export function calculateAccuracy(correctChars, totalTypedChars) {
  if (!totalTypedChars) return 100;
  return (correctChars / totalTypedChars) * 100;
}

export function calculateConsistency(wpmHistory) {
  if (!wpmHistory || wpmHistory.length === 0) return 100;
  const average = wpmHistory.reduce((sum, value) => sum + value, 0) / wpmHistory.length;
  if (average === 0) return 0;
  const variance = wpmHistory.reduce((sum, value) => sum + (value - average) ** 2, 0) / wpmHistory.length;
  const stdDev = Math.sqrt(variance);
  const score = 100 - (stdDev / average) * 100;
  return Math.max(0, Math.min(100, score));
}

export function formatSeconds(totalSeconds) {
  return Math.max(0, totalSeconds).toFixed(1);
}

export const LANGUAGE_PACKS = {
  english: {
    label: 'English',
    sentences: [
      'The quick brown fox jumps over the lazy dog near the bright river.',
      'A calm morning helps creative people think clearly and work faster.',
      'Strong habits make every new challenge easier to manage and enjoy.',
      'Technology keeps changing the way teams learn, build, and share ideas.',
      'Reading a little each day improves focus, memory, and confidence over time.',
      'Friendly communication is often the secret behind successful teamwork.',
      'Every small improvement eventually creates a much bigger result.',
      'The best projects begin with clear purpose and careful planning.',
      'Fresh air, good sleep, and steady effort power great performance.',
      'Learning by practice is more effective than memorizing facts alone.',
      'Bright ideas become useful products when people stay disciplined and patient.',
      'A good keyboard rhythm can improve confidence and typing speed together.',
      'Careful attention to details reduces mistakes and saves much time.',
      'Modern tools help people solve problems faster and with more clarity.',
      'Success grows from consistency, not from occasional bursts of effort.'
    ]
  },
  uzbek: {
    label: 'O‘zbek',
    sentences: [
      'Bugun havo juda yorqin bo‘lib, odamlar ko‘proq ishlashga tayyor.',
      'Yaxshi o‘qish va doimiy amaliyot natijani tezroq ko‘rsatadi.',
      'Har bir kichik muvaffaqiyat kelajakdagi yirik yutug‘ga tayyorlaydi.',
      'Teknikalar yordamida bilimlarni tezroq va aniqroq o‘rganish mumkin.',
      'Insonlar o‘z maqsadlarini aniq belgilasa, ish ko‘proq samarali bo‘ladi.',
      'Kuchli odatlar farqni yaratadi va qiyinchiliklarni yengil qiladi.',
      'Yaxshi reja bilan har bir vazifa osonroq va tezroq bajariladi.',
      'Maqsadga erishish uchun doimiy mehnat va sabr kerak bo‘ladi.',
      'Hamma kishi o‘z fikrini aniq ifoda etsa, hamkorlik yaxshilanadi.',
      'O‘quv jarayoni muntazam bo‘lsa, natija barqaror bo‘ladi.',
      'Yangi bilimlarni amalda qo‘llash eng yaxshi ta’limdir.',
      'Katta g‘oyalar kichik kundalik ishlar bilan boshlanadi.',
      'Tepakchi va to‘g‘ri fikrlash ishda muvaffaqiyatni oshiradi.',
      'Muvaffaqiyatning asosi doimiy harakat va ishonchdir.',
      'Kundalik mashg‘ulotlar insonning bilim va ko‘nikmasini yuksaltiradi.'
    ]
  },
  russian: {
    label: 'Русский',
    sentences: [
      'Утренний свет помогает собраться с мыслями и начать день продуктивно.',
      'Чёткая цель и спокойный план делают любую работу легче и быстрее.',
      'Регулярные упражнения улучшают память, скорость и уверенность в себе.',
      'Хорошие привычки помогают справляться с задачами без лишнего стресса.',
      'Небольшие успехи постепенно ведут к большим результатам и росту.',
      'Технологии ускоряют обучение, общение и решение сложных задач.',
      'Качественный текст и понятная речь повышают доверие и уважение.',
      'Постоянная практика помогает лучше понимать даже сложные темы.',
      'Сильная команда рождается из уважения, дисциплины и ясной коммуникации.',
      'Каждый новый навык становится важной частью успешной карьеры.',
      'Чтение и анализ информации развивают мышление и внимание.',
      'Уверенность приходит не сразу, а через спокойную и регулярную работу.',
      'Сложные задачи легче решать, когда есть понятный план действий.',
      'Инновации становятся полезными, когда люди заботятся о деталях.',
      'Медленный, но постоянный прогресс часто важнее быстрых импульсов.'
    ]
  },
  turkish: {
    label: 'Türkçe',
    sentences: [
      'Sabahın aydınlığı düşünceleri netleştirir ve günü verimli başlatır.',
      'Net hedefler ve düzenli planlar her işi daha kolay hale getirir.',
      'Düzenli çalışma hafızayı, hız ve özgüveni birlikte geliştirir.',
      'Küçük başarılar büyük sonuçlara giden sağlam bir yol açar.',
      'Teknoloji öğrenmeyi, iletişimi ve iş yapma şeklini değiştirir.',
      'Günlük okuma alışkanlığı dikkat ve odaklanmayı güçlendirir.',
      'İyi iletişim ekip içinde güven ve uyum kazandırır.',
      'Süreklilik, nadir anlık çabadan daha güvenilir bir başarı sağlar.',
      'Hedefe ulaşmak için sabır, plan ve düzen şarttır.',
      'Yalnızca ezberlemek yerine uygulamalı öğrenmek daha etkilidir.',
      'Güzel fikirler, disiplinli çalışma ile gerçekten değerli sonuçlara dönüşür.',
      'Dikkatli detay kontrolü hataları azaltır ve zamanı korur.',
      'Yeni beceriler düzenli pratikle hızla daha güçlü hale gelir.',
      'Günlük küçük adımlar uzun vadede büyük gelişim yaratır.',
      'İyi bir ritim, hem güveni hem yazma hızını artırır.'
    ]
  },
  german: {
    label: 'Deutsch',
    sentences: [
      'Der klare Morgen hilft dabei, die Gedanken zu sammeln und produktiv zu starten.',
      'Ein guter Plan macht selbst schwierige Aufgaben einfacher und schneller.',
      'Regelmäßiges Üben verbessert Konzentration, Gedächtnis und Selbstvertrauen.',
      'Kleine Erfolge fördern langfristig große Fortschritte und Motivation.',
      'Technologie verändert die Art, wie wir lernen, kommunizieren und arbeiten.',
      'Tägliches Lesen stärkt Fokus, Klarheit und sprachliche Genauigkeit.',
      'Gute Kommunikation baut Vertrauen und macht Teams erfolgreicher.',
      'Beständigkeit ist oft wirksamer als sporadische Anstrengung.',
      'Ein stabiles Ziel und eine klare Routine führen zu besseren Ergebnissen.',
      'Erfahrung entsteht durch praktisches Lernen und regelmäßige Wiederholung.',
      'Gute Ideen brauchen Zeit, Disziplin und geduldige Umsetzung.',
      'Sorgfältigkeit bei Details reduziert Fehler und spart viel Energie.',
      'Der richtige Rhythmus verbessert Selbstvertrauen und Schreibgeschwindigkeit.',
      'Schrittweise Verbesserungen schaffen langfristig eine starke Grundlage.',
      'Modernes Werkzeug hilft, Probleme schneller und verständlicher zu lösen.'
    ]
  },
  french: {
    label: 'Français',
    sentences: [
      'Le matin clair aide à mieux réfléchir et à commencer la journée sereinement.',
      'Un bon plan rend même les tâches complexes plus simples et plus rapides.',
      'La pratique régulière améliore la mémoire, la concentration et la confiance.',
      'Chaque petit succès ouvre la voie vers des résultats bien plus grands.',
      'La technologie change notre façon d’apprendre, de créer et de communiquer.',
      'Lire un peu chaque jour renforce la clarté et la concentration mentale.',
      'Une bonne communication favorise la confiance et la coopération.',
      'La régularité est souvent plus efficace que les efforts irréguliers.',
      'Des objectifs clairs et des habitudes solides permettent d’avancer sans stress.',
      'Les idées utiles prennent vie quand elles sont testées et améliorées.',
      'La patience et la discipline sont essentielles pour créer une vraie progression.',
      'Les détails bien soignés évitent les erreurs et économisent beaucoup de temps.',
      'Un bon rythme de travail aide à gagner en précision et en vitesse.',
      'Les meilleurs résultats viennent souvent d’une amélioration constante.',
      'Les outils modernes simplifient les tâches quand ils sont utilisés avec soin.'
    ]
  },
  spanish: {
    label: 'Español',
    sentences: [
      'La mañana tranquila ayuda a pensar con claridad y trabajar con calma.',
      'Un buen plan hace que cada tarea sea más simple y más eficaz.',
      'La práctica constante mejora la memoria, la rapidez y la confianza.',
      'Cada pequeño avance crea una base sólida para resultados mayores.',
      'La tecnología cambia la forma en que aprendemos, creamos y compartimos.',
      'Leer un poco cada día fortalece la atención y la concentración.',
      'Una comunicación clara mejora la confianza y el trabajo en equipo.',
      'La constancia suele producir mejores resultados que los esfuerzos aislados.',
      'Los objetivos bien definidos hacen que el trabajo sea más ordenado.',
      'La creatividad florece cuando se combina con disciplina y paciencia.',
      'Las mejoras pequeñas suelen transformar un proyecto completo.',
      'Prestar atención a los detalles reduce errores y ahorra tiempo.',
      'Un buen ritmo de trabajo favorece tanto la velocidad como la precisión.',
      'El aprendizaje práctico es más útil que repetir información sin sentido.',
      'La calma y la disciplina son claves para avanzar con seguridad.'
    ]
  },
  italian: {
    label: 'Italiano',
    sentences: [
      'La mattina serena aiuta a pensare con chiarezza e iniziare bene la giornata.',
      'Un buon piano rende ogni compito più semplice e più rapido da svolgere.',
      'La pratica costante migliora memoria, velocità e fiducia in sé stessi.',
      'Ogni piccolo progresso costruisce una base più solida per il futuro.',
      'La tecnologia cambia il modo in cui impariamo, lavoriamo e comunichiamo.',
      'Leggere ogni giorno rafforza attenzione, lucidità e curiosità.',
      'Una comunicazione chiara crea fiducia e migliora il lavoro di squadra.',
      'La costanza produce risultati più duraturi rispetto a sforzi occasionali.',
      'Obiettivi chiari e abitudini sane aiutano a fare progressi reali.',
      'Le idee migliori nascono quando si combina creatività e disciplina.',
      'I dettagli curati riducono errori e fanno risparmiare tempo prezioso.',
      'Un buon ritmo di lavoro aumenta sia precisione sia velocità.',
      'L’apprendimento pratico è più efficace della semplice memorizzazione.',
      'La pazienza e la regolarità sono fondamentali per costruire grandi risultati.',
      'Le piccole migliorie quotidiane trasformano lentamente un buon lavoro in qualcosa di eccellente.'
    ]
  },
  portuguese: {
    label: 'Português',
    sentences: [
      'A manhã tranquila ajuda a pensar com clareza e começar o dia melhor.',
      'Um bom plano torna cada tarefa mais simples, rápida e organizada.',
      'A prática constante melhora memória, velocidade e confiança.',
      'Cada pequena conquista fortalece a base para resultados maiores.',
      'A tecnologia muda a forma como aprendemos, criamos e compartilhamos ideias.',
      'Ler um pouco todos os dias melhora foco, atenção e entendimento.',
      'Uma comunicação clara gera confiança e melhora o trabalho em equipe.',
      'A consistência costuma trazer resultados mais fortes do que esforços isolados.',
      'Metas claras e hábitos bons ajudam a manter o progresso constante.',
      'Boas ideias tornam-se úteis quando são testadas com disciplina.',
      'O cuidado com os detalhes reduz erros e economiza muito tempo.',
      'Um ritmo de trabalho equilibrado aumenta precisão e velocidade.',
      'Aprender na prática é mais valioso do que memorizar apenas teorias.',
      'Paciência e regularidade são fundamentais para alcançar objetivos reais.',
      'Pequenos passos diários transformam grandes sonhos em progresso concreto.'
    ]
  },
  arabic: {
    label: 'العربية',
    sentences: [
      'يساعد الصباح الهادئ على التفكير بوضوح وبدء اليوم بطريقة منتجة.',
      'الخطة الجيدة تجعل أي مهمة أسهل وأسرع في التنفيذ.',
      'الممارسة المنتظمة تحسن الذاكرة والسرعة والثقة بالنفس.',
      'كل نجاح صغير يبني قاعدة أقوى للنتائج الكبيرة في المستقبل.',
      'تغير التكنولوجيا طريقة التعلم والعمل والتواصل بين الناس.',
      'قراءة القليل يوميًا تعزز التركيز والفهم بشكل ملحوظ.',
      'التواصل الواضح يزيد الثقة ويحسن التعاون بين الفريق.',
      'الاستمرارية عادةً تؤدي إلى نتائج أقوى من الجهود المتقطعة.',
      'الأهداف الواضحة والعادات الجيدة تسهل التقدم المستمر.',
      'تتحول الأفكار الرائعة إلى نتائج قيمة عند تطبيقها بجدية.',
      'الصبر والانضباط يساعدان على بناء تقدم حقيقي وثابت.',
      'الاهتمام بالتفاصيل يقلل الأخطاء ويوفر الكثير من الوقت.',
      'إيقاع العمل الجيد يحسن الدقة والسرعة معًا.',
      'التعلم العملي أكثر فائدة من الحفظ فقط دون تطبيق.',
      'الخطوات الصغيرة اليومية تحول الطموح إلى تقدم ملموس.'
    ]
  }
};

const SENTENCE_CONNECTORS = {
  english: ['Meanwhile,', 'At the same time,', 'In practice,', 'As a result,', 'Together,', 'For this reason,'],
  uzbek: ['Shu bilan birga,', 'Amalda,', 'Natijada,', 'Birgalikda,', 'Shu sababli,', 'Bundan tashqari,'],
  russian: ['Тем временем,', 'На практике,', 'В результате,', 'Вместе с тем,', 'По этой причине,', 'Кроме того,'],
  turkish: ['Bu arada,', 'Uygulamada,', 'Sonuç olarak,', 'Bununla birlikte,', 'Bu nedenle,', 'Ayrıca,'],
  german: ['Gleichzeitig,', 'In der Praxis,', 'Dadurch,', 'Zusammen,', 'Aus diesem Grund,', 'Außerdem,'],
  french: ['Pendant ce temps,', 'En pratique,', 'Ainsi,', 'Ensemble,', 'Pour cette raison,', 'De plus,'],
  spanish: ['Mientras tanto,', 'En la práctica,', 'Como resultado,', 'Juntos,', 'Por esta razón,', 'Además,'],
  italian: ['Nel frattempo,', 'In pratica,', 'Di conseguenza,', 'Insieme,', 'Per questo motivo,', 'Inoltre,'],
  portuguese: ['Enquanto isso,', 'Na prática,', 'Como resultado,', 'Juntos,', 'Por esse motivo,', 'Além disso,'],
  arabic: ['في الوقت نفسه،', 'عمليًا،', 'ونتيجة لذلك،', 'معًا،', 'لهذا السبب،', 'بالإضافة إلى ذلك،'],
};

function expandSentencePack(language, sentences) {
  const connectors = SENTENCE_CONNECTORS[language] || SENTENCE_CONNECTORS.english;
  const expanded = [...sentences];
  const seen = new Set(expanded);

  for (let first = 0; first < sentences.length && expanded.length < 100; first += 1) {
    for (let second = 0; second < sentences.length && expanded.length < 100; second += 1) {
      if (first === second) continue;
      const left = sentences[first].replace(/[.!؟。]+$/u, '');
      const right = sentences[second].replace(/[.!؟。]+$/u, '');
      const connector = connectors[(first + second) % connectors.length];
      const combined = `${left}; ${connector.toLowerCase()} ${right}.`;
      if (!seen.has(combined)) {
        seen.add(combined);
        expanded.push(combined);
      }
    }
  }

  return expanded.slice(0, 100);
}

Object.entries(LANGUAGE_PACKS).forEach(([language, pack]) => {
  pack.sentences = expandSentencePack(language, pack.sentences);
});

export function createSampleText(language = 'english') {
  const pack = LANGUAGE_PACKS[language] || LANGUAGE_PACKS.english;
  const sentence = pack.sentences[Math.floor(Math.random() * pack.sentences.length)];
  return sentence;
}

export function getLanguageOptions() {
  return Object.entries(LANGUAGE_PACKS).map(([value, meta]) => ({
    value,
    label: meta.label,
  }));
}

const QUOTE_TEXTS = [
  'The future depends on what you do today.',
  'Great things are done by a series of small things brought together.',
  'Success is the sum of small efforts repeated day in and day out.',
  'The secret of getting ahead is getting started.',
  'It always seems impossible until it is done.',
  'Well begun is half done.',
  'Believe you can and you are halfway there.',
  'What we learn with pleasure we never forget.',
  'A journey of a thousand miles begins with a single step.',
  'The best way out is always through.'
];

function addPunctuation(text) {
  return text
    .replace(/\.$/, ', and every detail matters.')
    .replace(/\.$/, '!');
}

function addNumbers(text) {
  return `${text} Remember 3 simple steps, 5 minutes, and 100 percent focus.`;
}

export function createTypingText(language = 'english', options = {}) {
  const { punctuation = false, numbers = false, quote = false, uppercase = false, wordCount = 0 } = options;
  let text = quote
    ? QUOTE_TEXTS[Math.floor(Math.random() * QUOTE_TEXTS.length)]
    : createSampleText(language);

  if (punctuation) text = addPunctuation(text);
  if (numbers) text = addNumbers(text);

  text = text.toLowerCase();
  if (!numbers) text = text.replace(/\d/g, '');
  if (!punctuation && !quote) text = text.replace(/[^\p{L}\s]/gu, '');
  if (!punctuation && quote) text = text.replace(/[\d]/g, '');
  text = text.replace(/\s+/g, ' ').trim();
  if (uppercase) text = text.replace(/^\s*\p{L}/u, (letter) => letter.toUpperCase());

  if (wordCount > 0) {
    const words = [];
    while (words.length < wordCount) {
      words.push(...text.split(/\s+/));
    }
    text = words.slice(0, wordCount).join(' ');
  }

  return text;
}