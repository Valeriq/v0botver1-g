import { useState } from "react";
import { Link } from "wouter";
import { TelegramLoginButton } from "@/components/TelegramLoginButton";
import { 
  Bot, 
  Mail, 
  Sparkles, 
  Shield, 
  Zap, 
  Brain, 
  Target,
  ChevronDown,
  ChevronUp,
  Github,
  Globe,
  MessageCircle,
  Users
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Telegram Bot",
    description: "Управляйте рассылками прямо из Telegram — загрузка контактов, запуск кампаний, просмотр статистики"
  },
  {
    icon: Brain,
    title: "AI Генерация",
    description: "Персонализированные письма на основе GPT-4 с учётом информации о компании и контакте"
  },
  {
    icon: Mail,
    title: "Gmail Интеграция",
    description: "Автоматическая отправка через Gmail с отслеживанием ответов в реальном времени"
  },
  {
    icon: Target,
    title: "Smart Targeting",
    description: "Загрузка CSV с контактами, классификация ответов AI, приоритизация лидов"
  },
  {
    icon: Users,
    title: "Мульти-воркспейс",
    description: "Отдельные рабочие пространства для каждого пользователя с личными контактами и кампаниями"
  },
  {
    icon: Shield,
    title: "Безопасность",
    description: "OAuth авторизация Google, изолированные данные, никаких хранимых паролей"
  },
  {
    icon: Zap,
    title: "Быстрый старт",
    description: "Развёртывание за 5 минут через Docker Compose или Render.com"
  },
  {
    icon: Globe,
    title: "Open Source",
    description: "Полностью открытый код на GitHub — вносите изменения, предлагуйте улучшения"
  }
];

const stats = [
  { value: "100%", label: "Open Source" },
  { value: "5 мин", label: "Время развёртывания" },
  { value: "GPT-4", label: "AI Модель" },
  { value: "24/7", label: "Автоматизация" }
];

const faqData = [
  {
    question: "Что такое AI Cold Email Bot?",
    answer: "AI Cold Email Bot — это автоматизированная система для холодных рассылок с интеграцией Telegram и AI. Она генерирует персонализированные письма, отправляет их через Gmail и классифицирует ответы с помощью AI."
  },
  {
    question: "Как начать использовать?",
    answer: "Создайте Telegram бота через @BotFather, получите API ключ OpenAI, настройте OAuth в Google Cloud Console, и запустите проект через Docker Compose или Render.com."
  },
  {
    question: "Нужен ли OpenAI API?",
    answer: "Да, для генерации писем и классификации ответов нужен OpenAI API ключ. Базовый функционал (контакты, кампании) работает без AI."
  },
  {
    question: "Как подключить Gmail?",
    answer: "Настройте OAuth 2.0 в Google Cloud Console, добавьте Client ID и Secret в .env, затем авторизуйте аккаунт через специальную ссылку."
  },
  {
    question: "Сколько стоит использование?",
    answer: "Проект полностью бесплатный и open source. Вы платите только за OpenAI API (~$0.002 за письмо) и хостинг при необходимости."
  },
  {
    question: "Можно ли использовать локально?",
    answer: "Да, проект полностью работает локально через Docker Compose с PostgreSQL и Redis. Все данные хранятся на вашем сервере."
  }
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-zinc-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left hover:text-white transition-colors"
      >
        <span className="font-medium">{question}</span>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      {isOpen && (
        <div className="pb-4 text-zinc-400 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const [activeTab, setActiveTab] = useState("docker");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white rounded flex items-center justify-center">
              <Mail className="h-5 w-5 text-zinc-900" />
            </div>
            <span className="font-bold text-lg">AI Cold Email Bot</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">Возможности</a>
            <a href="#faq" className="text-sm text-zinc-400 hover:text-white transition-colors">FAQ</a>
            <a 
              href="https://github.com/Valeriq/v0botver1-g" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
            <TelegramLoginButton />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-300 mb-6">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            Open Source AI Email Automation
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            AI-агент для автоматизации
            <span className="text-white"> холодных рассылок</span>
          </h1>
          
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Telegram бот с AI генерацией писем, Gmail интеграцией и автоматической 
            классификацией ответов. Полностью бесплатный и open source.
          </p>

          {/* Command Block */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden max-w-xl mx-auto">
            <div className="flex border-b border-zinc-800">
              {["docker", "render", "manual"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab 
                      ? "bg-zinc-800 text-white" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab === "docker" ? "Docker" : tab === "render" ? "Render" : "Manual"}
                </button>
              ))}
            </div>
            <div className="p-4">
              <code className="text-sm text-zinc-300 font-mono">
                {activeTab === "docker" && (
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-500">$</span>
                    docker-compose up -d
                  </span>
                )}
                {activeTab === "render" && (
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-500">#</span>
                    Connect GitHub repo to Render Blueprint
                  </span>
                )}
                {activeTab === "manual" && (
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-500">$</span>
                    pnpm install && pnpm dev
                  </span>
                )}
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Возможности</h2>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            Всё необходимое для автоматизации холодных рассылок
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-zinc-300" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-300 mb-6">
            <Shield className="h-4 w-4 text-green-500" />
            Приватность
          </div>
          <h2 className="text-3xl font-bold mb-4">Создан с заботой о приватности</h2>
          <p className="text-zinc-400 max-w-xl mx-auto">
            Все данные хранятся на вашем сервере. Мы не собираем и не храним 
            ваши контакты, письма или любую другую информацию.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="divide-y divide-zinc-800">
            {faqData.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Начните прямо сейчас</h2>
          <p className="text-zinc-400 mb-8">
            Запустите своего AI ассистента для email рассылок за 5 минут
          </p>
          <div className="flex items-center justify-center gap-4">
            <TelegramLoginButton />
            <a 
              href="https://github.com/Valeriq/v0botver1-g"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              <Github className="h-5 w-5" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 bg-white rounded flex items-center justify-center">
                <Mail className="h-4 w-4 text-zinc-900" />
              </div>
              <span className="font-semibold">AI Cold Email Bot</span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <a href="https://github.com/Valeriq/v0botver1-g" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                GitHub
              </a>
              <span>© 2024</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}