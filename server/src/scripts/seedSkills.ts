import mongoose from "mongoose";
import { Skill } from "../skills/skills.model.js";
import { JobProfile } from "../skills/skills.model.js";

export const seedSkillsData = async () => {
  try {
    console.log("🌱 Seeding skills data...");

    const existingSkills = await Skill.countDocuments();
    if (existingSkills > 0) {
      console.log(`✅ Skills already exist (${existingSkills} found). Skipping seed.`);
      return;
    }

    const technicalSkills = [
      { name: "JavaScript", description: "Мова програмування для веб-розробки", category: "technical" },
      { name: "TypeScript", description: "Типізована надмножина JavaScript", category: "technical" },
      { name: "React", description: "Бібліотека для побудови користувацьких інтерфейсів", category: "technical" },
      { name: "Node.js", description: "Серверне середовище виконання JavaScript", category: "technical" },
      { name: "Python", description: "Універсальна мова програмування", category: "technical" },
      { name: "SQL", description: "Мова запитів до реляційних баз даних", category: "technical" },
      { name: "MongoDB", description: "NoSQL база даних", category: "technical" },
      { name: "Git", description: "Система контролю версій", category: "technical" },
      { name: "Docker", description: "Платформа контейнеризації", category: "technical" },
      { name: "AWS", description: "Amazon Web Services хмарна платформа", category: "technical" },
    ];

    const softSkills = [
      { name: "Комунікація", description: "Ефективна міжособистісна комунікація", category: "soft_skills" },
      { name: "Командна робота", description: "Співпраця в команді", category: "soft_skills" },
      { name: "Критичне мислення", description: "Аналітичне та логічне мислення", category: "soft_skills" },
      { name: "Адаптивність", description: "Гнучкість до змін", category: "soft_skills" },
      { name: "Тайм-менеджмент", description: "Управління часом", category: "soft_skills" },
      { name: "Презентаційні навички", description: "Публічні виступи та презентації", category: "soft_skills" },
    ];

    const managementSkills = [
      { name: "Лідерство", description: "Керівництво та мотивація команди", category: "management" },
      { name: "Делегування", description: "Розподіл завдань та відповідальності", category: "management" },
      { name: "Стратегічне планування", description: "Довгострокове планування", category: "management" },
      { name: "Управління проектами", description: "PM навички", category: "management" },
      { name: "Коучинг", description: "Розвиток співробітників", category: "management" },
    ];

    const languages = [
      { name: "Англійська", description: "Міжнародна мова", category: "language" },
      { name: "Українська", description: "Державна мова", category: "language" },
      { name: "Німецька", description: "Німецька мова", category: "language" },
    ];

    const tools = [
      { name: "Jira", description: "Система управління проектами", category: "tools" },
      { name: "Figma", description: "Інструмент дизайну", category: "tools" },
      { name: "Postman", description: "API тестування", category: "tools" },
      { name: "VS Code", description: "Редактор коду", category: "tools" },
    ];

    const domainSkills = [
      { name: "HR Analytics", description: "Аналітика людських ресурсів", category: "domain" },
      { name: "Рекрутмент", description: "Підбір персоналу", category: "domain" },
      { name: "Фінансовий аналіз", description: "Аналіз фінансових показників", category: "domain" },
    ];

    const allSkills = [
      ...technicalSkills,
      ...softSkills,
      ...managementSkills,
      ...languages,
      ...tools,
      ...domainSkills,
    ];

    const createdSkills = await Skill.insertMany(allSkills);
    console.log(`✅ Created ${createdSkills.length} skills`);

    const skillMap = new Map(createdSkills.map((s) => [s.name, s._id]));

    const jobProfiles = [
      {
        jobTitle: "Senior Software Engineer",
        department: "IT",
        requiredSkills: [
          { skillId: skillMap.get("JavaScript"), requiredLevel: 3, weight: 90, isMandatory: true },
          { skillId: skillMap.get("TypeScript"), requiredLevel: 3, weight: 85, isMandatory: true },
          { skillId: skillMap.get("React"), requiredLevel: 3, weight: 80, isMandatory: true },
          { skillId: skillMap.get("Node.js"), requiredLevel: 2, weight: 70, isMandatory: false },
          { skillId: skillMap.get("Git"), requiredLevel: 3, weight: 75, isMandatory: true },
          { skillId: skillMap.get("Англійська"), requiredLevel: 2, weight: 60, isMandatory: true },
          { skillId: skillMap.get("Командна робота"), requiredLevel: 3, weight: 70, isMandatory: true },
        ],
      },
      {
        jobTitle: "HR Manager",
        department: "HR",
        requiredSkills: [
          { skillId: skillMap.get("Комунікація"), requiredLevel: 4, weight: 95, isMandatory: true },
          { skillId: skillMap.get("Лідерство"), requiredLevel: 3, weight: 85, isMandatory: true },
          { skillId: skillMap.get("Рекрутмент"), requiredLevel: 3, weight: 90, isMandatory: true },
          { skillId: skillMap.get("HR Analytics"), requiredLevel: 2, weight: 70, isMandatory: false },
          { skillId: skillMap.get("Англійська"), requiredLevel: 2, weight: 65, isMandatory: true },
          { skillId: skillMap.get("Тайм-менеджмент"), requiredLevel: 3, weight: 75, isMandatory: true },
        ],
      },
      {
        jobTitle: "Project Manager",
        department: "IT",
        requiredSkills: [
          { skillId: skillMap.get("Управління проектами"), requiredLevel: 4, weight: 95, isMandatory: true },
          { skillId: skillMap.get("Лідерство"), requiredLevel: 3, weight: 90, isMandatory: true },
          { skillId: skillMap.get("Комунікація"), requiredLevel: 4, weight: 90, isMandatory: true },
          { skillId: skillMap.get("Стратегічне планування"), requiredLevel: 3, weight: 80, isMandatory: true },
          { skillId: skillMap.get("Jira"), requiredLevel: 3, weight: 70, isMandatory: true },
          { skillId: skillMap.get("Англійська"), requiredLevel: 3, weight: 75, isMandatory: true },
        ],
      },
    ];

    const createdProfiles = await JobProfile.insertMany(jobProfiles);
    console.log(`✅ Created ${createdProfiles.length} job profiles`);

    console.log("✅ Skills data seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding skills data:", error);
    throw error;
  }
};
