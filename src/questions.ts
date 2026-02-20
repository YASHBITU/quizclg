export interface Question {
  id: number;
  text: string;
  options: string[];
  answer: string;
}

export const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What is a need?",
    options: ["A luxury choice", "A basic requirement for survival", "A trend", "A hobby"],
    answer: "A basic requirement for survival"
  },
  {
    id: 2,
    text: "What shapes a want?",
    options: ["Weather", "Government", "Culture and personality", "Luck"],
    answer: "Culture and personality"
  },
  {
    id: 3,
    text: "What is a desire?",
    options: ["A discounted product", "A random purchase", "A specific want backed by emotion and money", "A free sample"],
    answer: "A specific want backed by emotion and money"
  },
  {
    id: 4,
    text: "What comes first in the hierarchy?",
    options: ["Want", "Desire", "Need", "Brand"],
    answer: "Need"
  },
  {
    id: 5,
    text: "Marketers can create needs.",
    options: ["True", "False", "Sometimes", "Only online"],
    answer: "False"
  },
  {
    id: 6,
    text: "Which is a physical need?",
    options: ["Fame", "Belonging", "Food", "Power"],
    answer: "Food"
  },
  {
    id: 7,
    text: "Which is a social need?",
    options: ["Safety", "Knowledge", "Belonging", "Profit"],
    answer: "Belonging"
  },
  {
    id: 8,
    text: "Needs create what?",
    options: ["Discounts", "Market categories", "Logos", "Trends"],
    answer: "Market categories"
  },
  {
    id: 9,
    text: "What usually triggers action?",
    options: ["Comfort", "Advertisement", "Discomfort", "Fame"],
    answer: "Discomfort"
  },
  {
    id: 10,
    text: "A solution must be all except:",
    options: ["Accessible", "Affordable", "Functional", "Trendy"],
    answer: "Trendy"
  },
  {
    id: 11,
    text: "In the bunker case, the company is selling:",
    options: ["Cement", "Furniture", "Survival assurance", "Land"],
    answer: "Survival assurance"
  },
  {
    id: 12,
    text: "The want stage is called:",
    options: ["Profit zone", "Competition zone", "Luxury zone", "Discount zone"],
    answer: "Competition zone"
  },
  {
    id: 13,
    text: "Need + Culture equals:",
    options: ["Brand", "Desire", "Want", "Discount"],
    answer: "Want"
  },
  {
    id: 14,
    text: "A student prefers a KTM because of:",
    options: ["Safety and space", "Low fuel cost", "Sporty image and speed", "Family comfort"],
    answer: "Sporty image and speed"
  },
  {
    id: 15,
    text: "A family man prefers an SUV for:",
    options: ["Speed", "Racing", "Safety and comfort", "Style only"],
    answer: "Safety and comfort"
  },
  {
    id: 16,
    text: "In the RGB case, the basic laptop solves:",
    options: ["Identity", "Gaming status", "Assignments", "Fashion"],
    answer: "Assignments"
  },
  {
    id: 17,
    text: "The gaming rig fits:",
    options: ["Budget needs", "Identity and lifestyle", "Office work", "Basic survival"],
    answer: "Identity and lifestyle"
  },
  {
    id: 18,
    text: "Moving from “I like this” to “I am this” shows:",
    options: ["Need", "Discount", "Desire", "Supply"],
    answer: "Desire"
  },
  {
    id: 19,
    text: "Which is a driver of desire?",
    options: ["Scarcity", "Ego", "Status", "All of the above"],
    answer: "All of the above"
  },
  {
    id: 20,
    text: "A desire product usually has:",
    options: ["Low price", "No branding", "Premium pricing", "Free delivery only"],
    answer: "Premium pricing"
  },
  {
    id: 21,
    text: "Scarcity increases:",
    options: ["Logic", "Panic buying", "Production cost", "Transport"],
    answer: "Panic buying"
  },
  {
    id: 22,
    text: "Loyalty in desire products creates:",
    options: ["Random buyers", "One time users", "Fan like customers", "Cheaper goods"],
    answer: "Fan like customers"
  },
  {
    id: 23,
    text: "Needs help you:",
    options: ["Become a legend", "Enter the market", "Beat competitors", "Gain status"],
    answer: "Enter the market"
  },
  {
    id: 24,
    text: "Wants help you:",
    options: ["Beat competitors", "Survive", "Avoid branding", "Reduce cost only"],
    answer: "Beat competitors"
  },
  {
    id: 25,
    text: "Desires help you:",
    options: ["Lower price", "Create emotional connection and status", "Remove competition", "Stop marketing"],
    answer: "Create emotional connection and status"
  }
];
