<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getServerInfo } from '@/api/settings.js'
import { isServerConfigured } from '@/utils/serverUrl.js'
import BottomNav from '@/components/BottomNav.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useToast } from '@/composables/useToast.js'

const router = useRouter()
const route = useRoute()
const { addToast } = useToast()

const searchQuery = ref('')
const openItems = ref(new Set())
const forwardingEmail = ref('')

const isAuthenticated = computed(() => !!localStorage.getItem('access_token'))

const sections = [
  {
    id: 'general',
    title: 'Общие вопросы',
    items: [
      {
        q: 'Что такое LetterCatcher?',
        a: 'LetterCatcher — это сервис умных уведомлений о важных письмах. Он анализирует вашу входящую почту с помощью ключевых слов и нейросети и мгновенно сообщает только о тех письмах, которые действительно требуют вашего внимания — через Telegram-бота, push-уведомления или в реальном времени на сайте и в приложении.<br><br>Больше не нужно постоянно проверять почту — LetterCatcher сделает это за вас.',
      },
      {
        q: 'Для кого подойдёт это решение?',
        a: `<ul class="list-disc pl-5 space-y-1">
          <li>Студенты, которые не хотят пропустить важное письмо от деканата или преподавателя</li>
          <li>Сотрудники, получающие много корпоративных рассылок, но ожидающие конкретное важное письмо</li>
          <li>Любой, кто хочет получать уведомления только о нужных письмах, не отвлекаясь на спам и рассылки</li>
          <li>Люди, которым хочется минимализма в почтовом сервисе</li>
        </ul>`,
      },
      {
        q: 'Сервис бесплатный?',
        a: 'Да, сервис полностью бесплатный.',
      },
      {
        q: 'Почему мне нужно настраивать пересылку?',
        a: `Пересылка — это самый безопасный способ подключения почты, если вы не разворачиваете приложение локально. LetterCatcher не запрашивает пароль от вашего почтового ящика и не получает к нему прямой доступ — вы просто пересылаете копии входящих писем на служебный адрес.<br><br>Кроме того, в настройках пересылки вашего почтового провайдера можно добавить фильтры — тогда на анализ будут отправляться только сообщения от конкретных адресов или по заданным условиям.<br><br>Если вы разворачиваете LetterCatcher локально (self-hosted), сервис может анализировать вашу почту напрямую, без настройки пересылки — в этом случае все данные остаются полностью на вашем устройстве.`,
      },
      {
        q: 'Мои письма в безопасности?',
        a: `LetterCatcher хранит содержимое обработанных писем в базе данных на сервере — это необходимо для работы истории, отложенных уведомлений и отображения писем на сайте и в приложении. Данные доступны только вам (через ваш аккаунт) и не передаются третьим лицам.<br><br>Ваш пароль от почты не используется — подключение работает через пересылку (см. раздел <a href="#forwarding" class="text-primary hover:underline">Подключение почты</a>), а не через доступ к вашему почтовому ящику.<br><br>При включённом AI-анализе (уровень чувствительности «Сбалансированный» или «Все подряд») для обработки писем используется Open Router. Модель не хранит ваши данные и не обучается на них.`,
      },
    ],
  },
  {
    id: 'registration',
    title: 'Регистрация и вход',
    items: [
      {
        q: 'Как зарегистрироваться?',
        a: `Есть два способа:
        <ol class="list-decimal pl-5 space-y-2 mt-2">
          <li>Через сайт или приложение — нажмите «Регистрация», введите email и пароль. На указанную почту придёт письмо для подтверждения — перейдите по ссылке в нём.</li>
          <li>Через Telegram — найдите нашего бота и отправьте ему команду <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/start</code>. Бот автоматически создаст вам аккаунт.</li>
        </ol>`,
      },
      {
        q: 'Я зарегистрировался через сайт. Могу ли я также получать уведомления в Telegram?',
        a: `Да! Привяжите Telegram к аккаунту:
        <ol class="list-decimal pl-5 space-y-1 mt-2">
          <li>Войдите на сайт или в приложение.</li>
          <li>Перейдите в настройки профиля.</li>
          <li>Нажмите «Привязать Telegram» — вы получите ссылку.</li>
          <li>Перейдите по ссылке — она откроет бота в Telegram.</li>
          <li>Нажмите «Старт» — аккаунты будут объединены.</li>
        </ol>
        <p class="mt-2">После этого уведомления будут приходить и на сайт / в приложение, и в Telegram.</p>`,
      },
      {
        q: 'Я начал пользоваться через Telegram-бот. Могу ли я войти на сайт?',
        a: `Да! Используйте кнопку «Войти через Telegram» на странице авторизации. Также можно привязать email и пароль для входа через сайт или приложение — отправьте боту команду <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/link</code> и следуйте инструкциям.`,
      },
      {
        q: 'Не приходит письмо для подтверждения email. Что делать?',
        a: `<ol class="list-decimal pl-5 space-y-1">
          <li>Проверьте папку «Спам» / «Нежелательная почта».</li>
          <li>Убедитесь, что email введён без ошибок.</li>
          <li>Нажмите «Отправить повторно» на сайте или в приложении (в настройках профиля).</li>
          <li>Если используете корпоративную почту — уточните, не блокирует ли ваш IT-отдел внешние рассылки.</li>
        </ol>`,
      },
    ],
  },
  {
    id: 'forwarding',
    title: 'Подключение почты',
    items: [
      {
        q: 'Как LetterCatcher получает доступ к моей почте?',
        a: 'LetterCatcher <strong>не запрашивает ваш пароль</strong> от почты. Вместо этого вы настраиваете автоматическую пересылку входящих писем на служебный адрес LetterCatcher. Оригиналы писем остаются у вас — вы пересылаете только копии.',
      },
      {
        q: 'На какой адрес пересылать?',
        showForwardingEmail: true,
        a: `<p>Служебный email также отображается:</p>
        <ul class="list-disc pl-5 space-y-1 mt-1">
          <li>В настройках сайта / приложения после входа</li>
          <li>В приветственном сообщении Telegram-бота (команда <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/start</code>)</li>
        </ul>`,
      },
      {
        q: 'Как настроить пересылку в Gmail?',
        a: `<ol class="list-decimal pl-5 space-y-1">
          <li>Откройте Gmail на компьютере (mail.google.com).</li>
          <li>Нажмите шестерёнку справа сверху → «Все настройки».</li>
          <li>Перейдите на вкладку «Пересылка и POP/IMAP».</li>
          <li>Нажмите «Добавить адрес пересылки».</li>
          <li>Введите служебный email LetterCatcher и нажмите «Далее» → «Продолжить».</li>
          <li>На служебный адрес придёт письмо с кодом подтверждения — дождитесь, пока система его обработает (обычно до 1 минуты).</li>
          <li>После подтверждения выберите «Пересылать копии входящей почты на [адрес]» и сохраните изменения.</li>
        </ol>
        <div class="mt-3 rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
          <strong>Совет:</strong> Если хотите пересылать не все письма, а только определённые (например, от конкретного отправителя), создайте фильтр: в поиске Gmail нажмите стрелку вниз → укажите условие → «Создать фильтр» → отметьте «Переслать на: [адрес LetterCatcher]».
        </div>`,
      },
      {
        q: 'Как настроить пересылку в Яндекс.Почте?',
        a: `<ol class="list-decimal pl-5 space-y-1">
          <li>Откройте Яндекс.Почту (mail.yandex.ru).</li>
          <li>Нажмите шестерёнку → «Все настройки» → «Правила обработки писем».</li>
          <li>Нажмите «Создать правило».</li>
          <li>В условии оставьте «Применять ко всем письмам» (или задайте нужное условие).</li>
          <li>В действиях выберите «Переслать по адресу» и введите служебный email LetterCatcher.</li>
          <li>Нажмите «Создать правило».</li>
          <li>Яндекс отправит письмо-подтверждение — дождитесь обработки.</li>
        </ol>`,
      },
      {
        q: 'Как настроить пересылку в Mail.ru?',
        a: `<ol class="list-decimal pl-5 space-y-1">
          <li>Откройте Mail.ru (e.mail.ru).</li>
          <li>Перейдите в «Настройки» (шестерёнка) → «Все настройки» → «Фильтры».</li>
          <li>Нажмите «Добавить пересылку».</li>
          <li>Введите служебный email LetterCatcher и включите фильтр.</li>
          <li>Дождитесь подтверждения пересылки.</li>
          <li>После подтверждения пересылка заработает автоматически.</li>
        </ol>
        <div class="mt-3 rounded-lg bg-blue-50 px-3 py-2.5 text-xs text-blue-700">
          <strong>Альтернатива:</strong> «Добавить фильтр» → условие «Все письма» → действие «Переслать копию на» → укажите адрес LetterCatcher.
        </div>`,
      },
      {
        q: 'Как настроить пересылку в Outlook / Office 365?',
        a: `<p class="font-medium mb-2">Для личного Outlook.com:</p>
        <ol class="list-decimal pl-5 space-y-1">
          <li>Откройте outlook.live.com → Настройки (шестерёнка) → «Все параметры».</li>
          <li>«Почта» → «Пересылка».</li>
          <li>Включите «Разрешить пересылку».</li>
          <li>Введите служебный email LetterCatcher.</li>
          <li>Рекомендуем отметить «Сохранять копии пересланных сообщений».</li>
          <li>Сохраните.</li>
        </ol>
        <p class="font-medium mb-2 mt-4">Для корпоративного Office 365:</p>
        <ol class="list-decimal pl-5 space-y-1">
          <li>Откройте Outlook Web (outlook.office.com).</li>
          <li>Шестерёнка → «Все параметры Outlook».</li>
          <li>«Почта» → «Пересылка».</li>
          <li>Если пересылка заблокирована — обратитесь к вашему IT-администратору.</li>
        </ol>`,
      },
      {
        q: 'Я настроил пересылку, но уведомления не приходят. Что проверить?',
        a: `<ol class="list-decimal pl-5 space-y-1">
          <li>Убедитесь, что ваш email привязан к аккаунту LetterCatcher и подтверждён. На сайте / в приложении: проверьте в профиле. В боте: отправьте <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/profile</code>.</li>
          <li>Email, указанный в профиле, должен совпадать с тем, с которого вы пересылаете почту.</li>
          <li>Проверьте, что пересылка действительно работает — отправьте себе тестовое письмо.</li>
          <li>Убедитесь, что режим «Не беспокоить» выключен.</li>
          <li>Проверьте ключевые слова и уровень чувствительности — возможно, письмо не прошло фильтр.</li>
        </ol>`,
      },
    ],
  },
  {
    id: 'keywords',
    title: 'Ключевые слова',
    items: [
      {
        q: 'Что такое ключевые слова (триггеры)?',
        a: `Триггерные слова — это слова или фразы, по которым LetterCatcher определяет, что письмо важное. Если триггерное слово встречается в теме или тексте письма, система обращает на него внимание.
        <p class="mt-2">Примеры: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">дедлайн</code>, <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">зачёт</code>, <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">экзамен</code>, <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">оплата</code>, <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">срочно</code></p>
        <p class="mt-2">Добавить триггер:</p>
        <ul class="list-disc pl-5 space-y-1 mt-1">
          <li>На сайте / в приложении: Настройки → Триггерные слова → Добавить</li>
          <li>В боте: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/add</code> → введите слово</li>
        </ul>`,
      },
      {
        q: 'Что такое стоп-слова?',
        a: `Стоп-слова — противоположность триггеров. Если в письме есть стоп-слово, оно будет проигнорировано, даже если содержит триггеры.
        <p class="mt-2">Примеры: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">реклама</code>, <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">рассылка</code>, <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">unsubscribe</code>, <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">newsletter</code></p>
        <p class="mt-2">Добавить стоп-слово:</p>
        <ul class="list-disc pl-5 space-y-1 mt-1">
          <li>На сайте / в приложении: Настройки → Стоп-слова → Добавить</li>
          <li>В боте: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/stop &lt;слово&gt;</code></li>
        </ul>`,
      },
      {
        q: 'Как удалить слово?',
        a: `<ul class="list-disc pl-5 space-y-1">
          <li>На сайте / в приложении: нажмите крестик рядом со словом в списке</li>
          <li>В боте: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/remove &lt;слово&gt;</code></li>
        </ul>`,
      },
    ],
  },
  {
    id: 'sensitivity',
    title: 'Чувствительность AI',
    items: [
      {
        q: 'Что значат уровни чувствительности?',
        a: `LetterCatcher использует нейросеть для анализа писем. Уровень чувствительности определяет, когда она подключается:
        <div class="mt-3 space-y-3">
          <div class="rounded-lg border border-gray-200 p-3">
            <p class="font-medium text-gray-900">Только суперважные <span class="text-xs text-gray-400">(low)</span></p>
            <p class="mt-1 text-sm text-gray-600">Нейросеть не используется. Уведомления приходят только при срабатывании ваших ключевых слов. Минимум уведомлений — максимум тишины.</p>
          </div>
          <div class="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
            <p class="font-medium text-gray-900">Сбалансированный <span class="text-xs text-gray-400">(medium) — по умолчанию</span></p>
            <p class="mt-1 text-sm text-gray-600">Нейросеть подключается, только если сработало ключевое слово. Она оценивает, действительно ли письмо важное, и отсеивает ложные срабатывания.</p>
          </div>
          <div class="rounded-lg border border-gray-200 p-3">
            <p class="font-medium text-gray-900">Все подряд <span class="text-xs text-gray-400">(high)</span></p>
            <p class="mt-1 text-sm text-gray-600">Нейросеть анализирует каждое входящее письмо, даже если ключевые слова не сработали. Больше уведомлений, но ничего не пропустите.</p>
          </div>
        </div>
        <p class="mt-3">Изменить:</p>
        <ul class="list-disc pl-5 space-y-1 mt-1">
          <li>На сайте / в приложении: Настройки → Чувствительность AI</li>
          <li>В боте: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/sensitivity</code></li>
        </ul>`,
      },
    ],
  },
  {
    id: 'dnd',
    title: 'Режим «Не беспокоить»',
    items: [
      {
        q: 'Что делает режим «Не беспокоить» (DND)?',
        a: `Когда DND включён, LetterCatcher продолжает анализировать почту, но не отправляет уведомления. Все важные письма сохраняются и будут доставлены, как только вы выключите режим.
        <p class="mt-2">Это удобно на время сна, экзамена, отдыха — вы ничего не пропустите, но вас не будут отвлекать.</p>
        <p class="mt-2">Включить/выключить:</p>
        <ul class="list-disc pl-5 space-y-1 mt-1">
          <li>На сайте / в приложении: Настройки → Не беспокоить</li>
          <li>В боте: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/dnd</code></li>
        </ul>`,
      },
    ],
  },
  {
    id: 'history',
    title: 'История и статистика',
    items: [
      {
        q: 'Где посмотреть обработанные письма?',
        a: `<ul class="list-disc pl-5 space-y-1">
          <li>На сайте / в приложении: раздел «Почта» (главная страница)</li>
          <li>В боте: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/history</code></li>
        </ul>
        <p class="mt-2">Показываются последние обработанные письма с пометкой: важное или обычное.</p>`,
      },
      {
        q: 'Что показывает статистика?',
        a: `<ul class="list-disc pl-5 space-y-1">
          <li>Всего обработано писем</li>
          <li>Из них отмечены как важные</li>
          <li>Записей в AI-кэше (анализ повторных писем берётся из кэша для скорости)</li>
        </ul>
        <p class="mt-2">Посмотреть:</p>
        <ul class="list-disc pl-5 space-y-1 mt-1">
          <li>На сайте / в приложении: раздел «Статистика»</li>
          <li>В боте: <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/stats</code></li>
        </ul>`,
      },
    ],
  },
  {
    id: 'other',
    title: 'Прочее',
    items: [
      {
        q: 'Уведомления приходят с задержкой. Почему?',
        a: 'С учётом задержки пересылки со стороны вашего почтового провайдера, уведомление может прийти через 1–2 минуты после получения оригинального письма. Это нормально.',
      },
      {
        q: 'Могу ли я использовать сервис только через сайт / приложение, без Telegram?',
        a: 'Да. При регистрации через сайт или приложение Telegram не обязателен. Уведомления будут приходить в реальном времени на открытой вкладке сайта / в приложении и через push-уведомления (если вы их разрешите).',
      },
      {
        q: 'Могу ли я использовать только Telegram, без сайта?',
        a: `Да. Напишите <code class="rounded bg-gray-100 px-1.5 py-0.5 text-xs">/start</code> боту — и всё настроено. Сайт и приложение не обязательны.`,
      },
      {
        q: 'У меня не работает / я нашёл ошибку. Куда писать?',
        a: 'Свяжитесь с нами по email, указанному на сайте, или создайте issue в репозитории проекта на GitHub.',
      },
    ],
  },
]

const filteredSections = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return sections

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.q.toLowerCase().includes(query) ||
          item.a.replace(/<[^>]*>/g, '').toLowerCase().includes(query),
      ),
    }))
    .filter((section) => section.items.length > 0)
})

function itemKey(sectionId, index) {
  return `${sectionId}-${index}`
}

function toggle(key) {
  const next = new Set(openItems.value)
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  openItems.value = next
}

function isOpen(key) {
  return openItems.value.has(key)
}

async function copyForwardingEmail() {
  try {
    await navigator.clipboard.writeText(forwardingEmail.value)
    addToast('Скопировано', 'success')
  } catch {
    addToast('Не удалось скопировать', 'error')
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else if (isAuthenticated.value) {
    router.push('/')
  } else {
    router.push('/login')
  }
}

onMounted(async () => {
  if (isServerConfigured()) {
    try {
      const info = await getServerInfo()
      if (info.forwarding_email) {
        forwardingEmail.value = info.forwarding_email
      }
    } catch {
      // Server info unavailable
    }
  }

  await nextTick()
  const hash = route.hash
  if (hash) {
    const el = document.querySelector(hash)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50" :class="isAuthenticated ? 'pb-16' : 'pb-8'">
    <!-- Header -->
    <div class="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
        <button
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100"
          @click="goBack"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-lg font-bold text-gray-900">Частые вопросы</h1>
      </div>
    </div>

    <div class="mx-auto max-w-2xl px-4 py-4">
      <!-- Search -->
      <div class="relative mb-6">
        <svg
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          class="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Поиск по вопросам..."
        />
        <button
          v-if="searchQuery"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          @click="searchQuery = ''"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- No results -->
      <div v-if="filteredSections.length === 0" class="mt-12 text-center">
        <p class="text-sm text-gray-400">Ничего не найдено</p>
        <button class="mt-2 text-sm text-primary hover:underline" @click="searchQuery = ''">
          Сбросить поиск
        </button>
      </div>

      <!-- Sections -->
      <div class="space-y-6">
        <section
          v-for="section in filteredSections"
          :key="section.id"
          :id="section.id"
          class="scroll-mt-20"
        >
          <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {{ section.title }}
          </h2>

          <div class="overflow-hidden rounded-xl bg-white shadow-sm">
            <div
              v-for="(item, index) in section.items"
              :key="index"
              :class="index > 0 ? 'border-t border-gray-100' : ''"
            >
              <!-- Question -->
              <button
                class="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50"
                @click="toggle(itemKey(section.id, index))"
              >
                <span class="flex-1">{{ item.q }}</span>
                <svg
                  class="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200"
                  :class="isOpen(itemKey(section.id, index)) ? 'rotate-180' : ''"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Answer -->
              <div
                class="faq-answer-wrapper"
                :class="isOpen(itemKey(section.id, index)) ? 'open' : ''"
              >
                <div>
                  <div class="px-4 pb-4 text-sm leading-relaxed text-gray-600">
                    <!-- Forwarding email block -->
                    <div v-if="item.showForwardingEmail" class="mb-3">
                      <div
                        v-if="forwardingEmail"
                        class="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-3"
                      >
                        <code class="flex-1 break-all text-sm font-medium text-gray-900">{{ forwardingEmail }}</code>
                        <button
                          class="shrink-0 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
                          title="Скопировать"
                          @click.stop="copyForwardingEmail"
                        >
                          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                      <p v-else class="italic text-gray-400">
                        Адрес отображается после входа в аккаунт (в настройках профиля)
                      </p>
                    </div>

                    <!-- Answer HTML -->
                    <div v-html="item.a"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <BottomNav v-if="isAuthenticated" />
    <ToastContainer />
  </div>
</template>

<style scoped>
.faq-answer-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
}
.faq-answer-wrapper.open {
  grid-template-rows: 1fr;
}
.faq-answer-wrapper > div {
  overflow: hidden;
}
</style>
