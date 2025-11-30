
const positiveWords: Record<string, number> = {

  "відмінний": 3, "відмінно": 3, "чудовий": 3, "чудово": 3, "прекрасний": 3, "прекрасно": 3,
  "блискучий": 3, "блискуче": 3, "геніальний": 3, "геніально": 3, "ідеальний": 3, "ідеально": 3,
  "неперевершений": 3, "бездоганний": 3, "бездоганно": 3, "фантастичний": 3, "фантастично": 3,
  "видатний": 3, "винятковий": 3, "винятково": 3, "унікальний": 3, "талановитий": 3,

  "добрий": 2, "добре": 2, "хороший": 2, "хорошо": 2, "гарний": 2, "гарно": 2,
  "якісний": 2, "якісно": 2, "ефективний": 2, "ефективно": 2, "професійний": 2, "професійно": 2,
  "вдалий": 2, "успішний": 2, "успішно": 2, "продуктивний": 2, "продуктивно": 2,
  "корисний": 2, "корисно": 2, "цікавий": 2, "цікаво": 2, "творчий": 2, "креативний": 2,
  "ініціативний": 2, "відповідальний": 2, "надійний": 2, "надійно": 2, "точний": 2, "точно": 2,
  "старанний": 2, "старанно": 2, "компетентний": 2, "грамотний": 2, "грамотно": 2,
  "хороші": 2, "гарні": 2, "навички": 1, "навичок": 1, "результат": 1, "результати": 1,
  "комунікація": 1, "мислення": 1, "підхід": 1,

  "нормальний": 1, "нормально": 1, "непоганий": 1, "непогано": 1, "задовільний": 1,
  "прийнятний": 1, "прийнятно": 1, "позитивний": 1, "позитивно": 1, "конструктивний": 1,
  "коректний": 1, "коректно": 1, "толерантний": 1, "ввічливий": 1, "ввічливо": 1,
  "дружній": 1, "дружньо": 1, "відкритий": 1, "комунікабельний": 1, "активний": 1, "активно": 1,
  "мотивований": 1, "зацікавлений": 1, "допомагає": 1, "підтримує": 1, "розвивається": 1,

  "подобається": 2, "вдячний": 2, "радий": 2, "рада": 2, "задоволений": 2, "задоволена": 2,
  "вражений": 2, "вражена": 2, "рекомендую": 2, "схвалюю": 2, "підтримую": 2,
  "досяг": 2, "досягла": 2, "досягнення": 2, "успіх": 2, "перемога": 2, "прогрес": 2,
  "покращення": 2, "зростання": 2, "розвиток": 2, "інновація": 2, "інноваційний": 2,
};

const negativeWords: Record<string, number> = {

  "жахливий": -3, "жахливо": -3, "катастрофічний": -3, "катастрофічно": -3,
  "неприйнятний": -3, "неприйнятно": -3, "недопустимий": -3, "недопустимо": -3,
  "провальний": -3, "критичний": -3, "критично": -3, "безвідповідальний": -3,
  "неефективний": -3, "некомпетентний": -3, "безграмотний": -3,

  "поганий": -2, "погано": -2, "погана": -2, "слабкий": -2, "слабко": -2, "слабкі": -2, "низький": -2,
  "недостатній": -2, "недостатньо": -2, "неякісний": -2, "неякісно": -2,
  "невдалий": -2, "невдало": -2, "неуспішний": -2, "непродуктивний": -2,
  "проблемний": -2, "проблематичний": -2, "складний": -2, "важкий": -2,
  "неорганізований": -2, "хаотичний": -2, "безладний": -2, "конфліктний": -2,
  "агресивний": -2, "пасивний": -2, "байдужий": -2, "ледачий": -2,
  "неуважний": -2, "неуважність": -2, "неточний": -2, "неакуратний": -2, "несвоєчасний": -2,
  "відсутній": -2, "відсутність": -2, "брак": -2, "нестача": -2,
  "помилок": -1, "помилки": -1, "помилка": -1,

  "сумнівний": -1, "сумнівно": -1, "необхідно": -1, "потрібно": -1,
  "варто": -1, "слід": -1, "бракує": -1, "недолік": -1, "недоліки": -1,
  "проблема": -1, "проблеми": -1, "проблем": -1, "труднощі": -1,
  "затримка": -1, "затримки": -1, "опізнення": -1, "забуває": -1,
  "ігнорує": -1, "уникає": -1, "відмовляється": -1, "небажання": -1,
  "багато": -0.5, "часті": -0.5,

  "незадоволений": -2, "незадоволена": -2, "розчарований": -2, "розчарована": -2,
  "засмучений": -2, "засмучена": -2, "стурбований": -2, "занепокоєний": -2,
  "провал": -2, "невдача": -2, "зниження": -2, "погіршення": -2, "регрес": -2,
  "конфлікт": -2, "суперечка": -2, "скарга": -2, "претензія": -2,
};

const intensifiers: Record<string, number> = {
  "дуже": 1.5, "надзвичайно": 2, "вкрай": 2, "досить": 1.3, "занадто": 1.5,
  "абсолютно": 2, "повністю": 1.8, "цілком": 1.5, "зовсім": 1.5, "взагалі": 1.3,
  "особливо": 1.4, "явно": 1.3, "очевидно": 1.3, "значно": 1.5, "суттєво": 1.5,
};

const negations = [
  "не", "ні", "ніколи", "жодного", "без", "немає", "відсутній", "відсутня"
];


export function analyzeUkrainianSentiment(text: string): {
  score: number;
  comparative: number;
  positive: string[];
  negative: string[];
  sentiment: "positive" | "negative" | "neutral";
} {
  if (!text || text.trim().length === 0) {
    return { score: 0, comparative: 0, positive: [], negative: [], sentiment: "neutral" };
  }

  const normalizedText = text.toLowerCase().trim();
  const words = normalizedText.split(/\s+/);

  let score = 0;
  const positive: string[] = [];
  const negative: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    if (!currentWord) continue;
    
    const word = currentWord.replace(/[.,!?;:()]/g, "");
    if (!word) continue;

    const prevWord = i > 0 ? words[i - 1] : undefined;
    const hasNegation = prevWord && negations.includes(prevWord);

    let multiplier = 1;
    if (prevWord && intensifiers[prevWord]) {
      multiplier = intensifiers[prevWord];
    }

    if (positiveWords[word]) {
      let wordScore = positiveWords[word] * multiplier;
      if (hasNegation) {
        wordScore = -wordScore;
        negative.push(word);
      } else {
        positive.push(word);
      }
      score += wordScore;
    }

    if (negativeWords[word]) {
      let wordScore = negativeWords[word] * multiplier;
      if (hasNegation) {
        wordScore = -wordScore;
        positive.push(word);
      } else {
        negative.push(word);
      }
      score += wordScore;
    }
  }

  const comparative = words.length > 0 ? score / words.length : 0;

  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (score > 0.5) sentiment = "positive";
  else if (score < -0.5) sentiment = "negative";

  return {
    score: Math.round(score * 100) / 100,
    comparative: Math.round(comparative * 100) / 100,
    positive,
    negative,
    sentiment,
  };
}


export function getUkrainianSentiment(text: string): "positive" | "negative" | "neutral" {
  const result = analyzeUkrainianSentiment(text);
  return result.sentiment;
}


export function analyzeMixedSentiment(text: string, englishAnalyzer: any): {
  score: number;
  sentiment: "positive" | "negative" | "neutral";
  language: "uk" | "en" | "mixed";
} {

  const cyrillicChars = (text.match(/[а-яА-ЯіїєґІЇЄҐ]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = cyrillicChars + latinChars;

  if (totalChars === 0) {
    return { score: 0, sentiment: "neutral", language: "mixed" };
  }

  const cyrillicRatio = cyrillicChars / totalChars;

  let ukScore = 0;
  let enScore = 0;
  let language: "uk" | "en" | "mixed" = "mixed";

  if (cyrillicRatio > 0.7) {
    const ukResult = analyzeUkrainianSentiment(text);
    ukScore = ukResult.score;
    language = "uk";
  }

  else if (cyrillicRatio < 0.3) {
    const enResult = englishAnalyzer.analyze(text);
    enScore = enResult.score;
    language = "en";
  }

  else {
    const ukResult = analyzeUkrainianSentiment(text);
    const enResult = englishAnalyzer.analyze(text);
    ukScore = ukResult.score * cyrillicRatio;
    enScore = enResult.score * (1 - cyrillicRatio);
  }

  const finalScore = ukScore + enScore;
  let sentiment: "positive" | "negative" | "neutral" = "neutral";
  if (finalScore > 0.5) sentiment = "positive";
  else if (finalScore < -0.5) sentiment = "negative";

  return {
    score: Math.round(finalScore * 100) / 100,
    sentiment,
    language,
  };
}
