// ============================================
// SERVICE WORKER - РАБОТА ОФЛАЙН И КЭШИРОВАНИЕ
// ============================================
// Service Worker - это скрипт, который работает в фоне браузера
// Позволяет приложению работать офлайн и загружаться быстрее

const CACHE_NAME = 'kristina-notes-v1'; // Имя кэша (версия приложения)
const urlsToCache = [
  // Список файлов, которые нужно сохранить для офлайн-работы
  // Используем относительные пути - работают и локально, и на GitHub Pages
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './Кристина фото.jpg',
  './Я люблю тебя Кристина.mp3'
];

// ============================================
// УСТАНОВКА SERVICE WORKER
// ============================================
// Событие "install" срабатывает при первой установке
self.addEventListener('install', (event) => {
  console.log('Service Worker: Установка...');
  
  // event.waitUntil() - ждёт, пока операция завершится
  // caches.open() - открывает кэш с указанным именем
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Кэширование файлов...');
        // cache.addAll() - добавляет все файлы в кэш
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Установка завершена!');
        // self.skipWaiting() - активирует новый Service Worker сразу
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Ошибка кэширования:', error);
      })
  );
});

// ============================================
// АКТИВАЦИЯ SERVICE WORKER
// ============================================
// Событие "activate" срабатывает при активации
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Активация...');
  
  event.waitUntil(
    // caches.keys() - получает список всех кэшей
    caches.keys().then((cacheNames) => {
      return Promise.all(
        // Удаляем старые кэши (если версия изменилась)
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Активация завершена!');
      // self.clients.claim() - берёт контроль над всеми страницами
      return self.clients.claim();
    })
  );
});

// ============================================
// ОБРАБОТКА ЗАПРОСОВ (FETCH)
// ============================================
// Событие "fetch" срабатывает при каждом запросе файла
self.addEventListener('fetch', (event) => {
  // event.respondWith() - перехватывает запрос и отвечает сам
  event.respondWith(
    // caches.match() - ищет файл в кэше
    caches.match(event.request)
      .then((response) => {
        // Если файл найден в кэше - возвращаем его
        if (response) {
          console.log('Service Worker: Файл из кэша:', event.request.url);
          return response;
        }
        
        // Если файла нет в кэше - загружаем из интернета
        console.log('Service Worker: Загрузка из сети:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Проверяем, что ответ валидный
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Клонируем ответ (поток можно прочитать только один раз)
            const responseToCache = response.clone();
            
            // Сохраняем в кэш для будущего использования
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Если нет интернета и файла нет в кэше
            // Можно вернуть заглушку или страницу "Офлайн"
            console.log('Service Worker: Офлайн режим');
          });
      })
  );
});

