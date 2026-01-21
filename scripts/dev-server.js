#!/usr/bin/env node

/**
 * Надёжный скрипт запуска сервера с автоматическим восстановлением
 * Перезапускает сервер при ошибках и логирует все падения
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

// Каталог для логов
const LOGS_DIR = 'logs';
const ERROR_LOG = join(LOGS_DIR, 'errors.log');

// Создаём директорию для логов если её нет
if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true });
}

// Функция логирования
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}\n`;
  
  console.log(logMessage.trim());
  appendFileSync(ERROR_LOG, logMessage);
}

// Функция запуска сервера
function startServer() {
  log('🚀 Запуск сервера...', 'start');
  
  const serverProcess = spawn('node', [
    '--import',
    'tsx/esm',
    'server/index.js'
  ], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  // Обработка stdout
  serverProcess.stdout?.on('data', (data) => {
    process.stdout.write(data);
  });

  // Обработка stderr
  serverProcess.stderr?.on('data', (data) => {
    process.stderr.write(data);
  });

// Обработка завершения процесса
  serverProcess.on('close', (code) => {
    if (code !== 0) {
      log(`❌ Сервер завершился с кодом ${code}`, 'error');
    } else {
      log('✅ Сервер завершился корректно', 'info');
    }
  });

  // Обработка ошибок
  serverProcess.on('error', (error) => {
    log(`❌ Ошибка запуска сервера: ${error.message}`, 'error');
    
    // Перезапускаем через 3 секунды
    log('⏳ Перезапуск через 3 секунды...', 'restart');
    setTimeout(() => {
      startServer();
    }, 3000);
  });

  // Обработка необработанных исключений в процессе
  serverProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(`❌ Сервер упал с кодом ${code}`, 'error');
      log('🔄 Автоматический перезапуск...', 'restart');
      setTimeout(() => {
        startServer();
      }, 3000);
    }
  });

  return serverProcess;
}

// Обработка сигналов завершения
process.on('SIGINT', () => {
  log('👋 Получен SIGINT, завершаем работу...', 'shutdown');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('👋 Получен SIGTERM, завершаем работу...', 'shutdown');
  process.exit(0);
});

// Обработка необработанных исключений в главном процессе
process.on('uncaughtException', (error) => {
  log(`❌ Необработанное исключение: ${error.message}`, 'error');
  log(error.stack, 'error');
});

process.on('unhandledRejection', (reason) => {
  log(`❌ Необработанный rejection: ${reason}`, 'error');
});

// Запускаем сервер
log('📋 Скрипт надёжного запуска сервера инициализирован', 'info');
log('💡 Нажмите Ctrl+C для остановки', 'info');
log('📝 Логи сохраняются в logs/errors.log', 'info');

startServer();
