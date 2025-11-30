

import { analyzeUkrainianSentiment, analyzeMixedSentiment } from "./ukrainian-sentiment.js";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

console.log("\n🧪 Тестування аналізу тональності української мови\n");
console.log("=".repeat(70));

const testComments = [

  {
    text: "Відмінна робота! Дуже професійний підхід до завдань.",
    expected: "positive",
  },
  {
    text: "Співробітник показав чудові результати, завжди відповідальний та ініціативний.",
    expected: "positive",
  },
  {
    text: "Кандидат має хороші навички комунікації та креативне мислення.",
    expected: "positive",
  },
  {
    text: "Непоганий результат, але є куди рости.",
    expected: "positive",
  },

  {
    text: "Погана організація роботи, часті затримки проєктів.",
    expected: "negative",
  },
  {
    text: "Співробітник демонструє низьку ефективність та неуважність до деталей.",
    expected: "negative",
  },
  {
    text: "Дуже слабкі навички, багато помилок у роботі.",
    expected: "negative",
  },
  {
    text: "Кандидат не відповідає вимогам вакансії, недостатній досвід.",
    expected: "negative",
  },

  {
    text: "Співробітник виконує поставлені завдання в строк.",
    expected: "neutral",
  },
  {
    text: "Кандидат має досвід роботи з технологіями React та Node.js.",
    expected: "neutral",
  },

  {
    text: "Не поганий результат, але не відмінний.",
    expected: "neutral",
  },
  {
    text: "Немає проблем з комунікацією, завжди на зв'язку.",
    expected: "positive",
  },

  {
    text: "Надзвичайно талановитий розробник з винятковими навичками.",
    expected: "positive",
  },
  {
    text: "Вкрай неефективний підхід до вирішення завдань.",
    expected: "negative",
  },
];

console.log("\n📊 Аналіз тестових коментарів:\n");

let correct = 0;
let total = testComments.length;

testComments.forEach((test, index) => {
  const result = analyzeUkrainianSentiment(test.text);
  const isCorrect = result.sentiment === test.expected;
  
  if (isCorrect) correct++;
  
  const status = isCorrect ? "✅" : "❌";
  const sentimentEmoji = 
    result.sentiment === "positive" ? "😊" : 
    result.sentiment === "negative" ? "😞" : "😐";
  
  console.log(`${status} Тест ${index + 1}:`);
  console.log(`   Текст: "${test.text}"`);
  console.log(`   Очікувано: ${test.expected} | Отримано: ${result.sentiment} ${sentimentEmoji}`);
  console.log(`   Бал: ${result.score} | Слова: +[${result.positive.join(", ")}] -[${result.negative.join(", ")}]`);
  console.log();
});

console.log("=".repeat(70));
console.log(`\n📈 Результати: ${correct}/${total} (${Math.round(correct/total*100)}% точність)\n`);

console.log("\n🌐 Тестування комбінованого аналізу (EN + UK):\n");

const mixedTests = [
  {
    text: "Great work on the project! Відмінна робота!",
    desc: "Змішаний (EN + UK)",
  },
  {
    text: "This is excellent. Дуже гарний результат.",
    desc: "Змішаний позитивний",
  },
  {
    text: "Poor quality. Погана якість роботи.",
    desc: "Змішаний негативний",
  },
  {
    text: "Відмінна робота над проєктом, професійний підхід!",
    desc: "Повністю українська",
  },
  {
    text: "Excellent job, very professional approach to tasks.",
    desc: "Повністю англійська",
  },
];

mixedTests.forEach((test, index) => {
  const result = analyzeMixedSentiment(test.text, sentiment);
  const sentimentEmoji = 
    result.sentiment === "positive" ? "😊" : 
    result.sentiment === "negative" ? "😞" : "😐";
  
  console.log(`${index + 1}. ${test.desc}:`);
  console.log(`   "${test.text}"`);
  console.log(`   Результат: ${result.sentiment} ${sentimentEmoji} (Бал: ${result.score}, Мова: ${result.language})`);
  console.log();
});

console.log("=".repeat(70));
console.log("\n✨ Тестування завершено!\n");
