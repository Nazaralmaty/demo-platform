/*!
 * 1English · содержание курса.
 *
 * КАК ЭТО УСТРОЕНО. Уровней четыре, в каждом 14 уроков. Пустой урок — это
 * нормальное состояние: он виден в списке, но внутрь не пускает, пока к нему
 * не привязали видео или задания. Врать кнопкой «Смотреть» на пустом уроке
 * хуже, чем честно показать, что материала ещё нет.
 *
 * КУДА ЧТО ВСТАВЛЯТЬ.
 *   1. Ролики урока     → window.VIDEOS, пара [теория, практика] на урок.
 *   2. Тема и материалы → window.CONTENT, один объект на урок.
 * Больше нигде править не нужно: экраны собирают курс из этих двух таблиц.
 *
 * Урок разделён на две секции, в них пять шагов, других шагов у урока нет:
 *   Теория   — видеоурок с правилом и разбором            (шаг read);
 *   Практика — видеоурок на практику                      (шаг prac),
 *              чтение: текст с флип-картами слов урока      (text),
 *              задание: вопросы с тап-ответом, без клавиатуры (task),
 *              словарь: слова карточками                   (words).
 *
 * Типы заданий:
 *   choice — вопрос и 3 варианта, a — индекс верного;
 *   order  — собрать предложение из плиток, a — верный порядок строкой.
 *
 * Правильный ответ пока лежит рядом с вопросом: это прототип на одном
 * устройстве. Когда включится Supabase, поля a и why уезжают на сервер
 * (backend/schema.sql) и в браузер не приходят.
 */

/* ══════════════════════════════════════════════════════════════════════
   1. УРОВНИ
   ══════════════════════════════════════════════════════════════════ */
window.LEVELS = [
  { id:'beginner',        code:'A1',  title:'Beginner',
    tagline:'Начинаю с нуля',
    taglineKk:'Нөлден бастаймын',
    about:'Знаете отдельные слова, но фразу собрать трудно. Первые 14 уроков — про себя: кто вы, что у вас есть, что делаете каждый день.',
    aboutKk:'Жеке сөздерді білесіз, бірақ сөйлем құрау қиын. Алғашқы 14 сабақ — өзіңіз туралы: кімсіз, не бар, күнде не істейсіз.' },

  { id:'elementary',      code:'A1+', title:'Elementary',
    tagline:'Собираю первые фразы',
    taglineKk:'Алғашқы сөйлемдерді құраймын',
    about:'Простые фразы уже получаются, но в них теряются мелочи: артикли, окончания, порядок слов. 14 уроков на то, чтобы речь перестала рассыпаться.',
    aboutKk:'Қарапайым сөйлем шығады, бірақ ішінде ұсақ нәрсе жоғалады: артикль, жалғау, сөз реті. 14 сабақ — сөзіңіз шашырамауы үшін.' },

  { id:'pre-intermediate', code:'A2', title:'Pre-Intermediate',
    tagline:'Говорю простыми фразами',
    taglineKk:'Қарапайым сөйлеммен сөйлеймін',
    about:'Настоящее время даётся, а прошедшее и планы разваливаются. 14 уроков про вчера, сейчас, сравнение и завтра.',
    aboutKk:'Осы шақ шығады, ал өткен шақ пен жоспар шашырайды. 14 сабақ — кеше, қазір, салыстыру және ертең туралы.' },

  { id:'intermediate',    code:'B1',  title:'Intermediate',
    tagline:'Держу разговор',
    taglineKk:'Әңгімені ұстап тұрамын',
    about:'Говорите, но спотыкаетесь на временах и звучите проще, чем думаете. 14 уроков про времена, условия, пассив и оттенки смысла.',
    aboutKk:'Сөйлейсіз, бірақ шақтарға сүрінесіз және ойыңыздан қарапайым естілесіз. 14 сабақ — шақтар, шарт, ырықсыз етіс және мағына реңктері.' }
];

window.LESSONS_PER_LEVEL = 14;

/* ══════════════════════════════════════════════════════════════════════
   2. ВИДЕО
   Ролики на YouTube закрытые (unlisted): по ссылке открываются, в поиске
   их нет. Плееру нужен только id — хвост ссылки после youtu.be/ или после
   watch?v=. Из https://youtu.be/3ZkombMruHM берётся 3ZkombMruHM.

   У урока два ролика, и лежат они парой [теория, практика]. На YouTube
   теория подписана «Grammar Lesson 1», практика — «Grammar Lesson 2».
   Пустая строка значит «ролик ещё не привязан»: его шаг закрыт, второй
   ролик урока при этом работает.

   Это казахские ролики — основная группа казахоязычная.
   ══════════════════════════════════════════════════════════════════ */
window.VIDEOS = {
  /* Beginner · Bastau */
  b1:  ['L8WgzJV_scE', 'rGaqiSrDJKA'], b2:  ['3HmW8IpNklA', 'pyqn323rv2Q'],
  b3:  ['URro5v8CSDc', 'l3AowtVng70'], b4:  ['_2oHr01yM6k', '2JukjUYj2-8'],
  b5:  ['IOQQRXshMWc', 'w7jJHmWGj74'], b6:  ['2sonvmOHQTw', '91_3H-adkN8'],
  b7:  ['mbrIxyMD7Sk', 'cISqphU3BTU'], b8:  ['sWBsaaukLaA', '64-bU7A9vZA'],
  b9:  ['pPEe3QWKZhU', 'DIW5heyt3Ok'], b10: ['Yw_o8147K3Y', 'BLG3UOkkLEI'],
  b11: ['bd9HWP0ez1k', 'i4mNTsBkiuI'], b12: ['_DyS_uSyxmg', 'M-OmCZteTog'],
  b13: ['2V0JpHx9FWk', 'Ha1OnkE9Gkg'], b14: ['Msu8vzdP1O0', 'PtwWgIZuLIk'],

  /* Elementary · Damu */
  e1:  ['7z4MJCFSix4', 'VB0EqXnRn-0'], e2:  ['XPuWHkfg99s', 'lyWAizWGFFM'],
  e3:  ['aQNj9qhgvAg', 'OQbeZ86dD4A'], e4:  ['nzQN_a2-VVo', 'jMmiCCQgPw0'],
  e5:  ['n19e3R4Jw9s', 'nh6Exmr5g2A'], e6:  ['nG9vh6UKAgM', 'OhpkcMVuVBM'],
  e7:  ['ZU2iWhI-2Ug', 'bJkHYyhOK5E'], e8:  ['iAaIsoa6qA0', 'ZxQvwtLOR4s'],
  e9:  ['24l0QWry0pA', 'U37AocSjufk'], e10: ['KX5tV5YPdFo', 'sG9HKHUcfl4'],
  e11: ['cLjdX1JomeY', 'FrKD2mi6CYE'], e12: ['oydLkS7aBXg', '1u3ZmMdqnR8'],
  e13: ['Vrs1ZkgcF98', 'J56U3DELZg0'], e14: ['VV9eRYoauPs', 'noxRjUgiczA'],

  /* Pre-Intermediate · Junior */
  p1:  ['-mQ7Todec64', 'fAVWTIrpjwI'], p2:  ['aZT6zsf__Ao', 'Hc9C13nbyws'],
  p3:  ['Z_xCsqhqvTA', 'bHAv8ILcvLc'], p4:  ['Tx8_jm3-ROQ', '5nJxHW7CB54'],
  p5:  ['DjEzWiSGoQo', 'HH1MWqxaHfc'], p6:  ['YR-9XEvoRXo', 'iogBqQx8UxQ'],
  p7:  ['v_4Dxi8IqcE', 's4jXSmhyz-M'], p8:  ['bJbuRNukN1s', 'BNnTlyw-3F4'],
  p9:  ['wfjq6Wr_q-w', 'uue0eLuP8As'], p10: ['9g-ccy6M2BA', 'xkXQtq0yHYU'],
  p11: ['afwpLGNC4Wo', 'rji0gJA5CSg'], p12: ['7EBbJMhOSpQ', 'ZioSsdYCM20'],
  p13: ['m7-2Sx1woug', '6lBnqmp3WgQ'], p14: ['pghgZl9NFDE', '3F4jLhrtjPQ'],

  /* Intermediate · Senior. Пока по одному ролику, и это теория: i1 на
     YouTube подписан «Grammar Lesson 1». Практика ещё не привязана. */
  i1:  ['pMv5TQ42BnE', ''],            i2:  ['1yxW3WnVWYk', ''],
  i3:  ['raf6-vUKkew', ''],            i4:  ['W6a_AVRPBjk', ''],
  i5:  ['fHPzEkE0Qf8', ''],            i6:  ['3pDvuCgDxEA', ''],
  i7:  ['20nkd_BSRoA', ''],            i8:  ['6ddhFDYoPcM', ''],
  i9:  ['C7dPPQFeN14', ''],            i10: ['CtS9EsXm_jE', ''],
  i11: ['c22jopxcXyM', ''],            i12: ['7DsgzGiygao', ''],
  i13: ['Kz7BYCq-888', ''],            i14: ['r92FIW9JEhY', ''],
};

/* ══════════════════════════════════════════════════════════════════════
   2b. ВИДЕО НА РУССКОМ
   Русская группа смотрит свои ролики, устроены они так же: пара
   [теория, практика]. Русского ролика нет — на его месте играет
   казахский из таблицы выше, и шаг из-за этого не пропадает.
   ══════════════════════════════════════════════════════════════════ */
window.VIDEOS_RU = {
  /* Beginner · Bastau */
  b1: ['ZbN4pRHz2yk', 'zpKu49rt4fo'],   b2: ['gVTRgYXBfJk', 'iOXRaFOKAPc'],
  b3: ['mIVMsgsXorY', 'pAi-OxO9oRQ'],   b4: ['fwHBcK_gOwE', 'wDoOHS9bpWI'],
  b5: ['PcUWO7WfeZk', 'pO3kKzbK8mk'],   b6: ['wSAqBbVVnjg', 'y_X-4GvZSIM'],
  b7: ['N546ZD8XHCE', 'SA2UkLNcHRU'],   b8: ['WkhGZrCS7b4', 'CQK3b-ETTHw'],
  b9: ['xtbaxHfLM00', 'lkwHwFo8RF8'],   b10:['e1XsmzWib60', '9B-VoS1sTO0'],
  b11:['U7ii7sI-RSU', 'taHIPKTGC-c'],   b12:['cTYVH3V9YEU', '1Y4DqYupsQg'],
  b13:['C2O7Hn1EN-Q', '93ZfINFs28I'],   b14:['F2yAqY5R60w', 'NihM3ay4jGE'],
};

/* Мультик урока (Forest English): mp4 лежит здесь же, в media/cartoon/, и
   играет в практике над видеоуроком. Шагов не добавляет: практика отмечается
   той же кнопкой. Исходники мультика — в vault, cartoon-english/<id>/. */
window.CARTOONS = {
  b1: { src: 'media/cartoon/b1.mp4', poster: 'media/cartoon/b1.jpg' },
  b2: { src: 'media/cartoon/b2.mp4', poster: 'media/cartoon/b2.jpg' },
  b3: { src: 'media/cartoon/b3.mp4', poster: 'media/cartoon/b3.jpg' },
  b4: { src: 'media/cartoon/b4.mp4', poster: 'media/cartoon/b4.jpg' },
  b5: { src: 'media/cartoon/b5.mp4', poster: 'media/cartoon/b5.jpg' },
  b6: { src: 'media/cartoon/b6.mp4', poster: 'media/cartoon/b6.jpg' },
  b7: { src: 'media/cartoon/b7.mp4', poster: 'media/cartoon/b7.jpg' },
  b8: { src: 'media/cartoon/b8.mp4', poster: 'media/cartoon/b8.jpg' },
  b9: { src: 'media/cartoon/b9.mp4', poster: 'media/cartoon/b9.jpg' },
  b10: { src: 'media/cartoon/b10.mp4', poster: 'media/cartoon/b10.jpg' },
  b11: { src: 'media/cartoon/b11.mp4', poster: 'media/cartoon/b11.jpg' },
  b12: { src: 'media/cartoon/b12.mp4', poster: 'media/cartoon/b12.jpg' },
  b13: { src: 'media/cartoon/b13.mp4', poster: 'media/cartoon/b13.jpg' },
  b14: { src: 'media/cartoon/b14.mp4', poster: 'media/cartoon/b14.jpg' }
};

/* Ролики урока на нужном языке: { theory, practice }. Одна функция на
   платформу, дашборд и проверки — иначе каждый считал бы шаги по-своему.
   Строка вместо пары читается как одна теория. */
window.lessonVideos = function (id, lang) {
  function pair(v) {
    if (!v) return ['', ''];
    return (typeof v === 'string') ? [v, ''] : [v[0] || '', v[1] || ''];
  }
  var kz = pair((window.VIDEOS || {})[id]);
  var ru = lang === 'ru' ? pair((window.VIDEOS_RU || {})[id]) : ['', ''];
  return { theory: ru[0] || kz[0], practice: ru[1] || kz[1] };
};

/* ══════════════════════════════════════════════════════════════════════
   3. МАТЕРИАЛЫ УРОКОВ
   Ключ — id урока из таблицы выше. Урока здесь нет — значит он пустой,
   и в списке он показан без темы, а его шаги закрыты.

   Урок двуязычный. Русское поле обязательное, казахское лежит рядом: у
   строки это хвост Kk (rule → ruleKk), у перевода это пара ru + kk.
   Казахского нет — покажется русский, урок из-за этого не ломается.

   g у слова — группа для игровых арен: act (действие), thing (предмет),
   sign (признак), time (время), word (служебное). Её читает words_bridge.js.

   Заготовка для нового урока:

   x1: {
     title:'Тема', subtitle:'Одной фразой, зачем это', subtitleKk:'Сол қазақша',
     rule:'Правило в двух предложениях, без терминов.',
     ruleKk:'Сол ереже қазақша.',
     examples:[ {en:'', ru:'', kk:''} ],
     words:[ {en:'', ru:'', kk:'', ex:'', g:'thing'} ],
     tasks:[
       {t:'choice', q:'Вопрос с ___ на месте пропуска', opts:['','',''], a:0,
        why:'Почему так', whyKk:'Неге олай'},
       {t:'order',  ru:'Фраза по-русски', kk:'Сол сөйлем қазақша',
        words:['I','can'], a:'I can'}
     ]
   }
   ══════════════════════════════════════════════════════════════════ */
window.CONTENT = {

  /* Beginner · Bastau. Разбор, слова и задания сняты с самих роликов:
     слайды урока плюс расшифровка речи преподавателя. */
  b1: {
    title:'Sound Combinations in Real Life', subtitle:'Читать сочетания звуков', subtitleKk:'Дыбыс тіркестерін оқу',
    rule:'Две согласные рядом читаются обе, гласную между ними не вставляем: bread, spoon, tree. Две гласные рядом дают один звук: train — «трэйн», sheep — долгое «и», book — короткое «у».',
    ruleKk:'Қатар тұрған екі дауыссыздың екеуі де айтылады, арасына дауысты дыбыс қоспаймыз: bread, spoon, tree. Ал қатар тұрған екі дауысты бір ғана дыбыс береді: train — «трэйн», sheep — созылыңқы «и», book — қысқа «у».',
    examples:[
      {en:'I like fresh bread.', ru:'Я люблю свежий хлеб.', kk:'Мен балғын нанды жақсы көремін.'},
      {en:'We have fresh fruit on a plate.', ru:'У нас на тарелке свежие фрукты.', kk:'Табақта балғын жеміс тұр.'},
      {en:'Look at that tall tree.', ru:'Посмотри на то высокое дерево.', kk:'Анау биік ағашқа қара.'},
      {en:'The train comes in the rain.', ru:'Поезд приходит под дождём.', kk:'Пойыз жаңбырда келеді.'},
    ],
    words:[
      {en:'bread', ru:'хлеб', kk:'нан', ex:'I like fresh bread.', g:'thing'},
      {en:'spoon', ru:'ложка', kk:'қасық', ex:'I stir my tea with a spoon.', g:'thing'},
      {en:'fruit', ru:'фрукты', kk:'жеміс', ex:'We have fresh fruit on a plate.', g:'thing'},
      {en:'tree', ru:'дерево', kk:'ағаш', ex:'Look at that tall tree.', g:'thing'},
      {en:'flowers', ru:'цветы', kk:'гүлдер', ex:'Let’s smell the flowers.', g:'thing'},
      {en:'train', ru:'поезд', kk:'пойыз', ex:'I go home by train.', g:'thing'},
      {en:'book', ru:'книга', kk:'кітап', ex:'I want to buy a book.', g:'thing'},
      {en:'blue', ru:'голубой', kk:'көк', ex:'The sky is blue today.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'I like fresh ___.', opts:['bread', 'tree', 'train'], a:0,
       why:'Свежим называют хлеб; дерево и поезд свежими не бывают.',
       whyKk:'Балғын деп нанды айтады; ағаш пен пойыз балғын болмайды.'},
      {t:'choice', q:'We have fresh fruit on a ___.', opts:['plate', 'spoon', 'book'], a:0,
       why:'Фрукты кладут на тарелку, ложка и книга для этого не нужны.',
       whyKk:'Жемісті табаққа салады, қасық пен кітап оған керек емес.'},
      {t:'choice', q:'A big ___ sails on the sea.', opts:['sheep', 'ship', 'shop'], a:1,
       why:'По морю плывёт корабль — ship с коротким «и»; sheep с долгим «и» это овца.',
       whyKk:'Теңізде кеме жүзеді — ship, «и» қысқа айтылады; созып айтсаң, sheep — қой болып кетеді.'},
      {t:'choice', q:'The train comes in the ___.', opts:['rain', 'brain', 'train'], a:0,
       why:'Все три слова звучат с одним и тем же «эй», поэтому выбираем по смыслу: поезд идёт в дождь.',
       whyKk:'Үш сөз де бірдей «эй» дыбысымен айтылады, сондықтан мағынасына қарап таңдаймыз: пойыз жаңбырда жүреді.'},
      {t:'order', ru:'Я хочу купить книгу.', kk:'Мен кітап сатып алғым келеді.',
       words:['I', 'want', 'to', 'buy', 'a', 'book'], a:'I want to buy a book'},
      {t:'order', ru:'Я мешаю чай ложкой.', kk:'Мен шәйді қасықпен араластырамын.',
       words:['I', 'stir', 'my', 'tea', 'with', 'a', 'spoon'], a:'I stir my tea with a spoon'},
    ]
  },

  b2: {
    title:'Numbers, Colors', subtitle:'Сказать, что ты видишь', subtitleKk:'Көргеніңді айту',
    rule:'На вопрос What do you see? отвечают по порядку: число, цвет, предмет — I see one red apple. Если предметов больше одного, к предмету добавляется -s: four blue books.',
    ruleKk:'What do you see? деген сұраққа рет-ретімен жауап береміз: сан, түс, зат — I see one red apple. Зат біреуден көп болса, зат атауына -s жалғанады: four blue books.',
    examples:[
      {en:'What do you see?', ru:'Что ты видишь?', kk:'Не көріп тұрсың?'},
      {en:'I see one red apple.', ru:'Я вижу одно красное яблоко.', kk:'Мен бір қызыл алма көріп тұрмын.'},
      {en:'I see four blue books.', ru:'Я вижу четыре синие книги.', kk:'Мен төрт көк кітап көріп тұрмын.'},
      {en:'I see ten green trees.', ru:'Я вижу десять зелёных деревьев.', kk:'Мен он жасыл ағаш көріп тұрмын.'},
    ],
    words:[
      {en:'see', ru:'видеть', kk:'көру', ex:'What do you see?', g:'act'},
      {en:'red', ru:'красный', kk:'қызыл', ex:'Five red chairs are here.', g:'sign'},
      {en:'yellow', ru:'жёлтый', kk:'сары', ex:'I see eight yellow balls.', g:'sign'},
      {en:'blue', ru:'синий', kk:'көк', ex:'Nine blue bikes are here.', g:'sign'},
      {en:'green', ru:'зелёный', kk:'жасыл', ex:'I see six green notebooks.', g:'sign'},
      {en:'one', ru:'один', kk:'бір', ex:'I see one red apple.', g:'word'},
      {en:'ten', ru:'десять', kk:'он', ex:'Ten green trees are here.', g:'word'},
      {en:'apple', ru:'яблоко', kk:'алма', ex:'This apple is red.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'___ do you see?', opts:['What', 'Who', 'Where'], a:0,
       why:'Спрашиваем про вещи, а не про человека или место.',
       whyKk:'Сұрақ зат туралы, адам немесе орын туралы емес.'},
      {t:'choice', q:'I see one red ___.', opts:['apple', 'apples', 'an apple'], a:0,
       why:'Число one уже говорит, что предмет один: ни -s, ни артикль не нужны.',
       whyKk:'one саны заттың біреу екенін көрсетеді, сондықтан -s те, артикль де керек емес.'},
      {t:'choice', q:'I see four blue ___.', opts:['book', 'books', 'the books'], a:1,
       why:'После four предметов много, поэтому у слова book появляется -s.',
       whyKk:'four дегеннен кейін зат көп, сондықтан book сөзіне -s жалғанады.'},
      {t:'choice', q:'There are ___ chairs here.', opts:['five red', 'red five', 'five reds'], a:0,
       why:'Порядок такой: сколько, какого цвета, что именно; цвет при этом -s не получает.',
       whyKk:'Реті осылай: қанша, қандай түсті, не; түске -s жалғанбайды.'},
      {t:'order', ru:'Я вижу три зелёных киви.', kk:'Мен үш жасыл киви көріп тұрмын.',
       words:['I', 'see', 'three', 'green', 'kiwis'], a:'I see three green kiwis'},
      {t:'order', ru:'Я вижу девять синих велосипедов и десять зелёных деревьев.', kk:'Мен тоғыз көк велосипед пен он жасыл ағаш көріп тұрмын.',
       words:['I', 'see', 'nine', 'blue', 'bikes', 'and', 'ten', 'green', 'trees'], a:'I see nine blue bikes and ten green trees'},
    ]
  },

  b3: {
    title:'Countable and Uncountable Nouns', subtitle:'Считаемое и несчитаемое', subtitleKk:'Саналатын және саналмайтын',
    rule:'Считаемое идёт с числом, во множественном получает -s: a chair, three chairs; про него спрашивают how many. Несчитаемое по штукам не считают — water, sugar, bread; про него спрашивают how much, а счёт идёт через меру: a bottle of water, a cup of tea.',
    ruleKk:'Саналатын зат санмен тұрады, көпше түрде -s жалғанады: a chair, three chairs; оған how many деп сұраймыз. Саналмайтын затты дана-дана санамайды — water, sugar, bread; оған how much деп сұраймыз, ал санағанда өлшеммен айтамыз: a bottle of water, a cup of tea.',
    examples:[
      {en:'an apple, two apples', ru:'яблоко, два яблока', kk:'бір алма, екі алма'},
      {en:'a chair, three chairs', ru:'стул, три стула', kk:'бір орындық, үш орындық'},
      {en:'a bottle of water', ru:'бутылка воды', kk:'бір бөтелке су'},
      {en:'How many apples? How much sugar?', ru:'Сколько яблок? Сколько сахара?', kk:'Неше алма? Қанша қант?'},
    ],
    words:[
      {en:'apple', ru:'яблоко', kk:'алма', ex:'I have two apples.', g:'thing'},
      {en:'book', ru:'книга', kk:'кітап', ex:'I have four books.', g:'thing'},
      {en:'chair', ru:'стул', kk:'орындық', ex:'There are three chairs here.', g:'thing'},
      {en:'water', ru:'вода', kk:'су', ex:'She drinks water every day.', g:'thing'},
      {en:'sugar', ru:'сахар', kk:'қант', ex:'We need sugar for tea.', g:'thing'},
      {en:'bread', ru:'хлеб', kk:'нан', ex:'I eat a slice of bread.', g:'thing'},
      {en:'many', ru:'много (о том, что считают)', kk:'көп (саналатын затпен)', ex:'How many apples do you want?', g:'word'},
      {en:'much', ru:'много (о том, что не считают)', kk:'көп (саналмайтын затпен)', ex:'How much tea do you drink?', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'How ___ apples do you have?', opts:['much', 'many', 'old'], a:1,
       why:'Яблоки можно посчитать по штукам, поэтому здесь many.',
       whyKk:'Алманы дана-дана санауға болады, сондықтан мұнда many.'},
      {t:'choice', q:'How ___ sugar do you need?', opts:['many', 'much', 'long'], a:1,
       why:'Сахар не считают по штукам, для таких слов идёт much.',
       whyKk:'Қантты дана-дана санамайды, ондай сөздерге much қойылады.'},
      {t:'choice', q:'There are three ___ in the room.', opts:['chair', 'chairs', 'water'], a:1,
       why:'После числа больше одного у считаемого слова появляется -s.',
       whyKk:'Бірден үлкен саннан кейін саналатын сөзге -s жалғанады.'},
      {t:'choice', q:'I drink two ___ of tea every morning.', opts:['cup', 'cups', 'tea'], a:1,
       why:'Чай по штукам не считают, считают чашки — поэтому -s получает cup, а не tea.',
       whyKk:'Шайды дана-дана санамайды, кесені санайды — сондықтан -s шайға емес, cup сөзіне жалғанады.'},
      {t:'order', ru:'Мне нужна бутылка воды.', kk:'Маған бір бөтелке су керек.',
       words:['I', 'need', 'a', 'bottle', 'of', 'water'], a:'I need a bottle of water'},
      {t:'order', ru:'Сколько у тебя книг?', kk:'Сенде неше кітап бар?',
       words:['How', 'many', 'books', 'do', 'you', 'have'], a:'How many books do you have'},
    ]
  },

  b4: {
    title:'Food, Drink', subtitle:'Сделать заказ в кафе', subtitleKk:'Кафеде тапсырыс беру',
    rule:'В кафе не говори «I want» — звучит грубо. Говори «I’d like», а дальше ставь «a» перед тем, что считают по штукам: a sandwich, и «some» перед тем, что наливают: some tea.',
    ruleKk:'Кафеде «I want» деме — дөрекі естіледі. «I’d like» деп айт, одан кейін дана-данамен саналатын нәрсеге «a» қой: a sandwich, ал құйылатын нәрсеге «some» келеді: some tea.',
    examples:[
      {en:'What would you like?', ru:'Что вы будете?', kk:'Не аласыз?'},
      {en:'I’d like some green tea, please.', ru:'Мне, пожалуйста, зелёный чай.', kk:'Маған көк шай берсеңіз.'},
      {en:'I’d like a chicken sandwich.', ru:'Я бы хотел сэндвич с курицей.', kk:'Менің тауық етті сэндвич алғым келеді.'},
      {en:'Anything else? No, thank you.', ru:'Что-нибудь ещё? Нет, спасибо.', kk:'Тағы бірдеңе қалайсыз ба? Жоқ, рахмет.'},
    ],
    words:[
      {en:'water', ru:'вода', kk:'су', ex:'I’d like some water.', g:'thing'},
      {en:'tea', ru:'чай', kk:'шай', ex:'Green tea, please.', g:'thing'},
      {en:'coffee', ru:'кофе', kk:'кофе', ex:'I’d like some coffee.', g:'thing'},
      {en:'ice cream', ru:'мороженое', kk:'балмұздақ', ex:'I’d like some ice cream.', g:'thing'},
      {en:'soup', ru:'суп', kk:'сорпа', ex:'The soup is hot.', g:'thing'},
      {en:'salad', ru:'салат', kk:'салат', ex:'I’d like a salad.', g:'thing'},
      {en:'sandwich', ru:'сэндвич', kk:'сэндвич', ex:'A chicken sandwich, please.', g:'thing'},
      {en:'cake', ru:'торт', kk:'торт', ex:'A piece of cake, please.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'___ like some tea, please.', opts:['I’d', 'I’m', 'I'], a:0,
       why:'I’d — это короткое «I would», с него и начинается вежливая просьба.',
       whyKk:'I’d дегеніміз «I would» сөзінің қысқа түрі, сыпайы өтініш содан басталады.'},
      {t:'choice', q:'I’d like ___ coffee.', opts:['a', 'some', 'an'], a:1,
       why:'Кофе наливают, по штукам его не считают — поэтому «some».',
       whyKk:'Кофе құйылады, оны данамен санамайды — сондықтан «some».'},
      {t:'choice', q:'I’d like ___ chicken sandwich.', opts:['some', 'a', 'an'], a:1,
       why:'Сэндвич один, его можно посчитать, и слово начинается с согласного звука — «a».',
       whyKk:'Сэндвич біреу, оны санауға болады, әрі сөз дауыссыз дыбыстан басталады — «a».'},
      {t:'choice', q:'What ___ you like?', opts:['would', 'are', 'do'], a:0,
       why:'Официант вежливо спрашивает про заказ, а такой вопрос строится с «would».',
       whyKk:'Даяшы тапсырысты сыпайы сұрайды, ондай сұрақ «would» арқылы жасалады.'},
      {t:'order', ru:'Я бы хотел мороженое.', kk:'Менің балмұздақ алғым келеді.',
       words:['I’d', 'like', 'some', 'ice', 'cream'], a:'I’d like some ice cream'},
      {t:'order', ru:'Я бы хотел кусок торта.', kk:'Менің бір тілім торт алғым келеді.',
       words:['I’d', 'like', 'a', 'piece', 'of', 'cake'], a:'I’d like a piece of cake'},
    ]
  },

  b5: {
    title:'Plural, Singular', subtitle:'Один предмет и много', subtitleKk:'Бір зат және көп зат',
    rule:'Когда предметов больше одного, в конце слова появляется -s: an apple — three apples. После s, ch, sh, x пишем -es, буква y после согласной меняется на i и даёт -ies, а child, man, foot меняются целиком.',
    ruleKk:'Зат біреуден көп болса, сөздің соңына -s жалғанады: an apple — three apples. s, ch, sh, x әріптерінен кейін -es жазылады, дауыссыздан кейінгі y әрпі i-ге ауысып -ies болады, ал child, man, foot сөздері мүлдем басқаша өзгереді.',
    examples:[
      {en:'One apple, three apples.', ru:'Одно яблоко, три яблока.', kk:'Бір алма, үш алма.'},
      {en:'I read two books.', ru:'Я читаю две книги.', kk:'Мен екі кітап оқимын.'},
      {en:'Three buses stop here.', ru:'Здесь останавливаются три автобуса.', kk:'Мұнда үш автобус тоқтайды.'},
      {en:'My sister has three children.', ru:'У моей сестры трое детей.', kk:'Менің әпкемнің үш баласы бар.'},
    ],
    words:[
      {en:'apple', ru:'яблоко', kk:'алма', ex:'Three apples are on the table.', g:'thing'},
      {en:'book', ru:'книга', kk:'кітап', ex:'I read two books.', g:'thing'},
      {en:'car', ru:'машина', kk:'көлік', ex:'We see three cars.', g:'thing'},
      {en:'friend', ru:'друг', kk:'дос', ex:'My friend lives here.', g:'thing'},
      {en:'bus', ru:'автобус', kk:'автобус', ex:'Two buses stop here.', g:'thing'},
      {en:'city', ru:'город', kk:'қала', ex:'I know two big cities.', g:'thing'},
      {en:'child', ru:'ребёнок', kk:'бала', ex:'One child, two children.', g:'thing'},
      {en:'window', ru:'окно', kk:'терезе', ex:'The room has two windows.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'Three ___ are on the table.', opts:['apple', 'apples', 'an apple'], a:1,
       why:'Перед словом стоит число больше одного, значит нужна форма множественного числа.',
       whyKk:'Сөздің алдында біреуден үлкен сан тұр, сондықтан көпше түрі керек.'},
      {t:'choice', q:'Two ___ stop near the school.', opts:['bus', 'buss', 'buses'], a:2,
       why:'Слово кончается на s, после такого конца ставят -es, иначе его не выговорить.',
       whyKk:'Сөз s дыбысына бітеді, ондай сөзге -es жалғанады.'},
      {t:'choice', q:'I know two big ___.', opts:['citys', 'cities', 'city'], a:1,
       why:'Перед y стоит согласная, поэтому y меняется на i и получается -ies.',
       whyKk:'y әрпінің алдында дауыссыз тұр, сондықтан y әрпі i-ге ауысып, -ies болады.'},
      {t:'choice', q:'My sister has three ___.', opts:['childs', 'children', 'childrens'], a:1,
       why:'У слова child своя форма для многих, её просто запоминают и -s к ней не добавляют.',
       whyKk:'child сөзінің көпше түрі бөлек, оны жаттап аламыз да, үстіне -s жалғамаймыз.'},
      {t:'order', ru:'У меня много друзей.', kk:'Менің достарым көп.',
       words:['I', 'have', 'many', 'friends'], a:'I have many friends'},
      {t:'order', ru:'В комнате два окна.', kk:'Бөлмеде екі терезе бар.',
       words:['There', 'are', 'two', 'windows', 'in', 'the', 'room'], a:'There are two windows in the room'},
    ]
  },

  b6: {
    title:'Some, Any', subtitle:'Говорить о количестве', subtitleKk:'Мөлшер жайлы айту',
    rule:'Some говорим в утверждении, any — в отрицании и в вопросе: I have some books, I don’t have any money. Если предмет считают поштучно, рядом ставим many и a few, если не считают — much и a little.',
    ruleKk:'Хабарлы сөйлемде some, болымсыз сөйлем мен сұрақта any қолданамыз: I have some books, I don’t have any money. Зат данамен саналса — many, a few, саналмаса — much, a little.',
    examples:[
      {en:'I have some books.', ru:'У меня есть несколько книг.', kk:'Менде бірнеше кітап бар.'},
      {en:'I don’t have any money.', ru:'У меня нет денег.', kk:'Менде ақша жоқ.'},
      {en:'Do you have any questions?', ru:'У вас есть вопросы?', kk:'Сұрақтарыңыз бар ма?'},
      {en:'How many students are in your class?', ru:'Сколько учеников в твоём классе?', kk:'Сыныбыңда қанша оқушы бар?'},
    ],
    words:[
      {en:'some', ru:'несколько, немного', kk:'біраз, бірнеше', ex:'I have some books.', g:'word'},
      {en:'any', ru:'никакой, какой-нибудь', kk:'ешқандай, қандай да бір', ex:'I don’t have any money.', g:'word'},
      {en:'many', ru:'много (о счётном)', kk:'көп (саналатын зат)', ex:'I have many friends.', g:'word'},
      {en:'much', ru:'много (о несчётном)', kk:'көп (саналмайтын зат)', ex:'We don’t have much energy.', g:'word'},
      {en:'a few', ru:'несколько', kk:'бірнеше', ex:'I have a few questions.', g:'word'},
      {en:'a little', ru:'немного', kk:'азғана', ex:'I need a little sugar.', g:'word'},
      {en:'water', ru:'вода', kk:'су', ex:'I need some water.', g:'thing'},
      {en:'money', ru:'деньги', kk:'ақша', ex:'I don’t have any money.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'We need to buy ___ apples.', opts:['some', 'any', 'much'], a:0,
       why:'Обычное утверждение, здесь ставим some.',
       whyKk:'Жай хабарлы сөйлем, сондықтан some қойылады.'},
      {t:'choice', q:'Do you have ___ questions?', opts:['some', 'any', 'much'], a:1,
       why:'В вопросе вместо some ставят any.',
       whyKk:'Сұрақта some емес, any тұрады.'},
      {t:'choice', q:'How ___ students are in your class?', opts:['much', 'many', 'a little'], a:1,
       why:'Учеников можно посчитать, а для счётного идёт many.',
       whyKk:'Оқушыны санап шығуға болады, саналатын затқа many келеді.'},
      {t:'choice', q:'I have ___ free time today.', opts:['a few', 'a little', 'many'], a:1,
       why:'Время не считают по штукам, поэтому a little.',
       whyKk:'Уақыт данамен саналмайды, сол үшін a little.'},
      {t:'order', ru:'У меня есть несколько книг.', kk:'Менде бірнеше кітап бар.',
       words:['books', 'some', 'I', 'have'], a:'I have some books'},
      {t:'order', ru:'У меня нет денег.', kk:'Менде ақша жоқ.',
       words:['any', 'I', 'money', 'have', 'don’t'], a:'I don’t have any money'},
    ]
  },

  b7: {
    title:'Subject Pronouns', subtitle:'Описывать людей на фото', subtitleKk:'Суреттегі адамдарды сипаттау',
    rule:'Чтобы не повторять имя, ставим вместо него местоимение: he — про мужчину, she — про женщину, it — про предмет или погоду, they — про нескольких. Местоимение стоит в начале, перед действием.',
    ruleKk:'Атын қайталамау үшін оның орнына есімдік қоямыз: he — ер адам, she — әйел адам, it — зат пен ауа райы, they — бірнеше адам. Есімдік сөйлемнің басында, әрекеттің алдында тұрады.',
    examples:[
      {en:'He is grilling some barbecue.', ru:'Он жарит барбекю.', kk:'Ол барбекю пісіріп жатыр.'},
      {en:'She is reading a book.', ru:'Она читает книгу.', kk:'Ол кітап оқып отыр.'},
      {en:'It is a beautiful day.', ru:'Прекрасный день.', kk:'Керемет күн.'},
      {en:'They are sitting on the bench.', ru:'Они сидят на скамейке.', kk:'Олар орындықта отыр.'},
    ],
    words:[
      {en:'I', ru:'я', kk:'мен', ex:'I visit my friend.', g:'word'},
      {en:'he', ru:'он', kk:'ол (ер адам туралы)', ex:'He is grilling some barbecue.', g:'word'},
      {en:'she', ru:'она', kk:'ол (әйел адам туралы)', ex:'She is reading a book.', g:'word'},
      {en:'it', ru:'оно (о предмете, о погоде)', kk:'ол (зат, ауа райы туралы)', ex:'It is a beautiful day.', g:'word'},
      {en:'we', ru:'мы', kk:'біз', ex:'We drink tea together.', g:'word'},
      {en:'they', ru:'они', kk:'олар', ex:'They are sitting on the bench.', g:'word'},
      {en:'father', ru:'отец', kk:'әке', ex:'This is my father.', g:'thing'},
      {en:'mother', ru:'мама', kk:'ана', ex:'My mother is reading a book.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'This is my father. ___ is grilling some barbecue.', opts:['He', 'She', 'It'], a:0,
       why:'Отец — мужчина, о нём говорят he.',
       whyKk:'Әке — ер адам, ол туралы he дейді.'},
      {t:'choice', q:'That is my mother. ___ is reading a book.', opts:['He', 'She', 'They'], a:1,
       why:'О женщине говорят she.',
       whyKk:'Әйел адам туралы she дейді.'},
      {t:'choice', q:'The sun is shining. ___ is a beautiful day.', opts:['He', 'It', 'They'], a:1,
       why:'По-казахски и о человеке, и о погоде говорят «ол», а по-английски о погоде и предметах — it.',
       whyKk:'Қазақша адам да, ауа райы да «ол», ал ағылшынша ауа райы мен зат — it.'},
      {t:'choice', q:'My grandparents are on the bench. ___ are talking.', opts:['He', 'We', 'They'], a:2,
       why:'Людей несколько, поэтому they, и рядом стоит are.',
       whyKk:'Адам бірнешеу, сондықтан they, қасында are тұрады.'},
      {t:'order', ru:'Она читает книгу.', kk:'Ол кітап оқып отыр.',
       words:['She', 'is', 'reading', 'a', 'book'], a:'She is reading a book'},
      {t:'order', ru:'Они сидят на скамейке.', kk:'Олар орындықта отыр.',
       words:['They', 'are', 'sitting', 'on', 'the', 'bench'], a:'They are sitting on the bench'},
    ]
  },

  b8: {
    title:'Object Pronouns', subtitle:'Сказать «меня» и «его»', subtitleKk:'«Мені», «оны» деп айту',
    rule:'Перед глаголом стоят I, he, she, we, they — это мы уже знаем. Но если местоимение стоит после глагола, оно меняет форму: I → me, he → him, she → her, we → us, they → them. You и it остаются такими же.',
    ruleKk:'Етістіктің алдында I, he, she, we, they тұрады — оны біз білеміз. Ал есімдік етістіктен кейін тұрса, түрі өзгереді: I → me, he → him, she → her, we → us, they → them. You мен it өзгермейді.',
    examples:[
      {en:'I know her very well.', ru:'Я её хорошо знаю.', kk:'Мен оны жақсы білемін.'},
      {en:'She loves it very much.', ru:'Она очень его любит.', kk:'Ол оны қатты жақсы көреді.'},
      {en:'Anna often calls him.', ru:'Анна часто ему звонит.', kk:'Анна оған жиі қоңырау шалады.'},
      {en:'He plays with them.', ru:'Он играет с ними.', kk:'Ол олармен ойнайды.'},
    ],
    words:[
      {en:'me', ru:'меня, мне', kk:'мені, маған', ex:'They wave to me.', g:'word'},
      {en:'you', ru:'тебя, тебе', kk:'сені, саған', ex:'I can see you.', g:'word'},
      {en:'him', ru:'его, ему (о мужчине)', kk:'оны, оған (ер адам туралы)', ex:'Anna often calls him.', g:'word'},
      {en:'her', ru:'её, ей (о женщине)', kk:'оны, оған (әйел адам туралы)', ex:'I know her very well.', g:'word'},
      {en:'it', ru:'его, её (о предмете или животном)', kk:'оны (зат не жануар туралы)', ex:'She loves it very much.', g:'word'},
      {en:'us', ru:'нас, нам', kk:'бізді, бізге', ex:'She gives a task to us.', g:'word'},
      {en:'them', ru:'их, им', kk:'оларды, оларға', ex:'He plays with them.', g:'word'},
      {en:'give', ru:'дать, давать', kk:'беру', ex:'Can you give us some water?', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'I like these shoes. I want to buy ___.', opts:['them', 'they', 'their'], a:0,
       why:'После глагола buy ставим форму them, а не they.',
       whyKk:'Buy етістігінен кейін they емес, them тұрады.'},
      {t:'choice', q:'Anna has a cute dog. She loves ___ very much.', opts:['he', 'it', 'its'], a:1,
       why:'О животном говорят it, и эта форма не меняется.',
       whyKk:'Жануар туралы it дейді, оның түрі өзгермейді.'},
      {t:'choice', q:'Your brother is calling. Please answer ___.', opts:['his', 'he', 'him'], a:2,
       why:'Отвечают брату, а после глагола he превращается в him.',
       whyKk:'Ағаға жауап береміз, ал етістіктен кейін he — him болады.'},
      {t:'choice', q:'We are thirsty. Can you give ___ some water?', opts:['our', 'us', 'we'], a:1,
       why:'Воду дают нам, а на месте того, кому дают, стоит us.',
       whyKk:'Суды бізге береді, ал кімге беретінін білдіретін орында us тұрады.'},
      {t:'order', ru:'Они машут мне.', kk:'Олар маған қол бұлғайды.',
       words:['They', 'wave', 'to', 'me'], a:'They wave to me'},
      {t:'order', ru:'Она даёт нам задание.', kk:'Ол бізге тапсырма береді.',
       words:['She', 'gives', 'a', 'task', 'to', 'us'], a:'She gives a task to us'},
    ]
  },

  b9: {
    title:'Adjectives', subtitle:'Сравнивать две вещи', subtitleKk:'Екі затты салыстыру',
    rule:'Когда сравниваешь два предмета, к короткому слову добавляй -er: cheap — cheaper, big — bigger. Перед длинным словом ставь more: more expensive. Второй предмет идёт после than.',
    ruleKk:'Екі затты салыстырғанда қысқа сөзге -er жалғанады: cheap — cheaper, big — bigger. Ұзын сөздің алдына more қойылады: more expensive. Салыстырылатын екінші зат than-нан кейін тұрады.',
    examples:[
      {en:'The café is cheaper than the cinema.', ru:'Кафе дешевле кино.', kk:'Кафе кинотеатрдан арзанырақ.'},
      {en:'Model A is more expensive than model B.', ru:'Модель A дороже модели B.', kk:'A моделі B моделінен қымбатырақ.'},
      {en:'This phone is thinner and lighter.', ru:'Этот телефон тоньше и легче.', kk:'Бұл телефон жұқалау әрі жеңілірек.'},
      {en:'My English is getting better.', ru:'Мой английский становится лучше.', kk:'Менің ағылшыным жақсарып келеді.'},
    ],
    words:[
      {en:'cheaper', ru:'дешевле', kk:'арзанырақ', ex:'The café is cheaper.', g:'sign'},
      {en:'more expensive', ru:'дороже', kk:'қымбатырақ', ex:'This laptop is more expensive.', g:'sign'},
      {en:'better', ru:'лучше', kk:'жақсырақ', ex:'My English is getting better.', g:'sign'},
      {en:'bigger', ru:'больше', kk:'үлкенірек', ex:'The screen on model B is bigger.', g:'sign'},
      {en:'lighter', ru:'легче по весу', kk:'жеңілірек', ex:'This phone is thinner and lighter.', g:'sign'},
      {en:'closer', ru:'ближе', kk:'жақынырақ', ex:'The new café is closer.', g:'sign'},
      {en:'longer', ru:'дольше', kk:'ұзағырақ', ex:'The battery life is longer.', g:'sign'},
      {en:'than', ru:'чем', kk:'қарағанда', ex:'Model A is cheaper than model B.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'This café is ___ than the cinema.', opts:['cheap', 'cheaper', 'more cheap'], a:1,
       why:'Cheap — короткое слово, при сравнении к нему добавляют -er.',
       whyKk:'Cheap — қысқа сөз, салыстырғанда оған -er жалғанады.'},
      {t:'choice', q:'Model B is ___ than model A.', opts:['expensive', 'more expensive', 'expensiver'], a:1,
       why:'Expensive — длинное слово, перед ним ставят more.',
       whyKk:'Expensive — ұзын сөз, оның алдына more қойылады.'},
      {t:'choice', q:'This summer is hotter ___ last year.', opts:['than', 'then', 'from'], a:0,
       why:'Второй предмет сравнения вводят словом than.',
       whyKk:'Салыстырылатын екінші зат than арқылы қосылады.'},
      {t:'choice', q:'My English is getting ___.', opts:['gooder', 'better', 'more good'], a:1,
       why:'У good нет формы с -er, вместо неё стоит better.',
       whyKk:'Good сөзінің -er түрі жоқ, оның орнына better тұрады.'},
      {t:'order', ru:'Кафе ближе к моему дому.', kk:'Кафе менің үйіме жақынырақ.',
       words:['The', 'café', 'is', 'closer', 'to', 'my', 'house'], a:'The café is closer to my house'},
      {t:'order', ru:'Новый телефон легче моего старого.', kk:'Жаңа телефон менің ескісінен жеңілірек.',
       words:['The', 'new', 'phone', 'is', 'lighter', 'than', 'my', 'old', 'one'], a:'The new phone is lighter than my old one'},
    ]
  },

  b10: {
    title:'Superlative', subtitle:'Говорить «самый…»', subtitleKk:'«Ең…» деп айту',
    rule:'Здесь мы уже не сравниваем двоих, а выделяем одного из всех. Перед словом ставим the: короткое слово берёт -est (the tallest, the cheapest), а длинному нужен the most (the most comfortable).',
    ruleKk:'Мұнда біз екеуін салыстырмаймыз, бәрінің ішінен біреуін бөліп айтамыз. Сөздің алдына the қоямыз: қысқа сөз -est жалғауын алады (the tallest, the cheapest), ұзын сөзге the most керек (the most comfortable).',
    examples:[
      {en:'Ali is the tallest student in our class.', ru:'Али — самый высокий ученик в нашем классе.', kk:'Әли — сыныбымыздағы ең ұзын бойлы оқушы.'},
      {en:'But that one is the most comfortable.', ru:'А вот та пара самая удобная.', kk:'Ал анау тұрғаны ең ыңғайлысы.'},
      {en:'Paris is one of the most beautiful cities.', ru:'Париж — один из самых красивых городов.', kk:'Париж — ең әдемі қалалардың бірі.'},
      {en:'This is the best day of my life.', ru:'Это лучший день в моей жизни.', kk:'Бұл — өмірімдегі ең жақсы күн.'},
    ],
    words:[
      {en:'tallest', ru:'самый высокий (о человеке)', kk:'ең ұзын бойлы', ex:'Ali is the tallest student.', g:'sign'},
      {en:'kindest', ru:'самый добрый', kk:'ең мейірімді', ex:'Maria is the kindest person here.', g:'sign'},
      {en:'talkative', ru:'разговорчивый', kk:'көп сөйлейтін', ex:'My friend Sara is the most talkative.', g:'sign'},
      {en:'cheapest', ru:'самый дешёвый', kk:'ең арзан', ex:'This pair is the cheapest.', g:'sign'},
      {en:'comfortable', ru:'удобный', kk:'ыңғайлы', ex:'That one is the most comfortable.', g:'sign'},
      {en:'funniest', ru:'самый смешной', kk:'ең күлкілі', ex:'My teacher is the funniest person.', g:'sign'},
      {en:'best', ru:'самый лучший', kk:'ең жақсы', ex:'This is the best day.', g:'sign'},
      {en:'delicious', ru:'вкусный', kk:'дәмді', ex:'Pizza is the most delicious food.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'Ali is the ___ student in our class.', opts:['tall', 'taller', 'tallest'], a:2,
       why:'Он выше всех в классе, а не выше одного человека.',
       whyKk:'Ол бір адамнан емес, сыныптағы бәрінен ұзын.'},
      {t:'choice', q:'My English teacher is the ___ person.', opts:['funny', 'funnier', 'funniest'], a:2,
       why:'После the нужна форма «самый», иначе получится просто «смешной».',
       whyKk:'The-дан кейін «ең» мағынасындағы түрі керек, әйтпесе жай «күлкілі» болып қалады.'},
      {t:'choice', q:'But that one is the ___ comfortable.', opts:['most', 'more', 'much'], a:0,
       why:'Слово comfortable длинное, к таким словам -est не добавляют.',
       whyKk:'Comfortable сөзі ұзын, ондай сөздерге -est жалғанбайды.'},
      {t:'choice', q:'Paris is ___ the most beautiful cities.', opts:['one of', 'one', 'the one'], a:0,
       why:'Красивых городов много, Париж — один из них, поэтому one of.',
       whyKk:'Әдемі қала көп, Париж соның бірі, сондықтан one of керек.'},
      {t:'order', ru:'Мария здесь самая добрая.', kk:'Мұндағы ең мейірімді адам — Мария.',
       words:['Maria', 'is', 'the', 'kindest', 'person', 'here'], a:'Maria is the kindest person here'},
      {t:'order', ru:'Пицца для меня самая вкусная еда.', kk:'Мен үшін пицца — ең дәмді тамақ.',
       words:['Pizza', 'is', 'the', 'most', 'delicious', 'food', 'for', 'me'], a:'Pizza is the most delicious food for me'},
    ]
  },

  b11: {
    title:'My House', subtitle:'Описать комнаты дома', subtitleKk:'Үй бөлмелерін сипаттау',
    rule:'Когда говорим, что есть в комнате, начинаем с «There is» про один предмет и «There are» про несколько. А какая сама комната — говорим прямо: The kitchen is sunny and bright.',
    ruleKk:'Бөлмеде не бар екенін айтқанда бір зат болса «There is», бірнешеу болса «There are» деп бастаймыз. Бөлменің өзі қандай екенін тура айтамыз: The kitchen is sunny and bright.',
    examples:[
      {en:'There is a big sofa, a TV and a piano.', ru:'Здесь большой диван, телевизор и пианино.', kk:'Мұнда үлкен диван, теледидар және фортепиано бар.'},
      {en:'There are many books in my bedroom.', ru:'В моей спальне много книг.', kk:'Менің жатын бөлмемде кітап көп.'},
      {en:'The kitchen is sunny and bright.', ru:'Кухня солнечная и светлая.', kk:'Ас үй күнгей әрі жарық.'},
      {en:'I like to walk in the garden in the morning.', ru:'Утром я люблю гулять в саду.', kk:'Таңертең бақта серуендегенді ұнатамын.'},
    ],
    words:[
      {en:'living room', ru:'гостиная', kk:'қонақ бөлме', ex:'There is a TV in the living room.', g:'thing'},
      {en:'kitchen', ru:'кухня', kk:'ас үй', ex:'There is a fridge in the kitchen.', g:'thing'},
      {en:'bedroom', ru:'спальня', kk:'жатын бөлме', ex:'My bedroom is quiet.', g:'thing'},
      {en:'bathroom', ru:'ванная', kk:'жуынатын бөлме', ex:'The bathroom is clean.', g:'thing'},
      {en:'garden', ru:'сад', kk:'бақ', ex:'We play football in the garden.', g:'thing'},
      {en:'sofa', ru:'диван', kk:'диван', ex:'Your sofa is big and comfortable.', g:'thing'},
      {en:'comfortable', ru:'удобный', kk:'жайлы', ex:'This chair is very comfortable.', g:'sign'},
      {en:'quiet', ru:'тихий', kk:'тыныш', ex:'My room is quiet in the evening.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'Mom cooks breakfast in the ___.', opts:['kitchen', 'bedroom', 'garden'], a:0,
       why:'Еду готовят там, где плита и посуда.',
       whyKk:'Тамақты плита мен ыдыс тұрған бөлмеде пісіреді.'},
      {t:'choice', q:'Your sofa is so big and ___.', opts:['comfortable', 'sunny', 'loud'], a:0,
       why:'Про диван говорят, каково на нём сидеть.',
       whyKk:'Диван туралы айтқанда оның отыруға қандай екенін айтады.'},
      {t:'choice', q:'___ a big mirror in the bathroom.', opts:['There is', 'There are', 'They are'], a:0,
       why:'Зеркало одно, поэтому нужна форма единственного числа.',
       whyKk:'Айна біреу, сондықтан жекеше түрі керек.'},
      {t:'choice', q:'There ___ many chairs in the kitchen.', opts:['is', 'are', 'be'], a:1,
       why:'Стульев несколько, а для множественного числа берём «are».',
       whyKk:'Орындық бірнешеу, көпше түрде «are» алынады.'},
      {t:'order', ru:'В спальне есть стол и много книг.', kk:'Жатын бөлмеде үстел және көп кітап бар.',
       words:['There', 'is', 'a', 'desk', 'and', 'many', 'books'], a:'There is a desk and many books'},
      {t:'order', ru:'Спальня тихая, и там я могу заниматься.', kk:'Жатын бөлме тыныш, сонда мен сабақ оқи аламын.',
       words:['The', 'bedroom', 'is', 'quiet', 'and', 'I', 'can', 'study', 'there'], a:'The bedroom is quiet and I can study there'},
    ]
  },

  b12: {
    title:'Wh- Questions', subtitle:'Задавать вопросы с wh', subtitleKk:'Wh-сөздермен сұрақ қою',
    rule:'Вопрос начинается с вопросительного слова: what, when, where, who, why, how. Сразу за ним идёт остальная часть вопроса: When will we go on holiday?',
    ruleKk:'Сұрақ сұрау сөзінен басталады: what, when, where, who, why, how. Одан кейін сұрақтың қалған бөлігі тұрады: When will we go on holiday?',
    examples:[
      {en:'What’s the weather like today?', ru:'Какая сегодня погода?', kk:'Бүгін ауа райы қандай?'},
      {en:'When will the weather be sunny?', ru:'Когда будет солнечно?', kk:'Ауа райы қашан ашық болады?'},
      {en:'Where are we going on holiday this summer?', ru:'Куда мы поедем отдыхать этим летом?', kk:'Биыл жазда демалысқа қайда барамыз?'},
      {en:'How often do we go camping?', ru:'Как часто мы ездим в поход?', kk:'Біз қаншалықты жиі жорыққа шығамыз?'},
    ],
    words:[
      {en:'what', ru:'что, какой', kk:'не, қандай', ex:'What is the weather like?', g:'word'},
      {en:'when', ru:'когда', kk:'қашан', ex:'When will we go on holiday?', g:'word'},
      {en:'where', ru:'где, куда', kk:'қайда', ex:'Where are we going this summer?', g:'word'},
      {en:'who', ru:'кто', kk:'кім', ex:'Who will travel with us?', g:'word'},
      {en:'why', ru:'почему', kk:'неге', ex:'Why do we love holidays?', g:'word'},
      {en:'how long', ru:'как долго', kk:'қанша уақыт', ex:'How long will we stay here?', g:'word'},
      {en:'weather', ru:'погода', kk:'ауа райы', ex:'The weather is sunny today.', g:'thing'},
      {en:'holiday', ru:'отдых, каникулы', kk:'демалыс', ex:'We go on holiday in summer.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'___ is the weather like today?', opts:['What', 'Where', 'Who'], a:0,
       why:'Мы спрашиваем про саму погоду — солнце, дождь, ветер.',
       whyKk:'Ауа райының өзін сұраймыз — күн, жаңбыр, жел.'},
      {t:'choice', q:'___ will we go on holiday?', opts:['Why', 'When', 'Who'], a:1,
       why:'Речь о времени поездки, а не о причине.',
       whyKk:'Сапардың себебі емес, уақыты туралы айтылып тұр.'},
      {t:'choice', q:'___ will travel with us?', opts:['What', 'Where', 'Who'], a:2,
       why:'Спрашиваем про людей, а про людей говорят who.',
       whyKk:'Адам туралы сұраймыз, адамға who қолданылады.'},
      {t:'choice', q:'___ will we stay in the hotel?', opts:['How often', 'How long', 'Why'], a:1,
       why:'Нужен срок — сколько дней, а не сколько раз.',
       whyKk:'Мерзімі керек — қанша күн, қанша рет емес.'},
      {t:'order', ru:'Куда мы едем на отдых?', kk:'Біз демалысқа қайда барамыз?',
       words:['Where', 'are', 'we', 'going', 'on', 'holiday'], a:'Where are we going on holiday'},
      {t:'order', ru:'Как часто мы ездим в поход?', kk:'Біз қаншалықты жиі жорыққа шығамыз?',
       words:['How', 'often', 'do', 'we', 'go', 'camping'], a:'How often do we go camping'},
    ]
  },

  b13: {
    title:'My Family', subtitle:'Семья и друзья', subtitleKk:'Отбасы мен достар',
    rule:'Про одного человека говорим this is, про двоих и больше — these are. Это начало предложения, дальше идёт сам человек: this is my uncle, these are my classmates.',
    ruleKk:'Бір адам туралы this is, екі не одан көп адам туралы these are деп айтамыз. Осы сөздер сөйлемнің басында тұрады, олардан кейін адамның өзі аталады.',
    examples:[
      {en:'This is my cousin. We always play together.', ru:'Это мой двоюродный брат. Мы всегда играем вместе.', kk:'Бұл — менің немере ағам. Біз үнемі бірге ойнаймыз.'},
      {en:'These are my grandparents. They live in a village.', ru:'Это мои бабушка и дедушка. Они живут в ауле.', kk:'Бұл — менің атам мен әжем. Олар ауылда тұрады.'},
      {en:'This is my best friend. She helps me with my homework.', ru:'Это моя лучшая подруга. Она помогает мне с домашним заданием.', kk:'Бұл — менің ең жақын құрбым. Ол маған үй тапсырмасын орындауға көмектеседі.'},
      {en:'These are my team-mates. We play football in the same team.', ru:'Это мои товарищи по команде. Мы играем в футбол в одной команде.', kk:'Бұл — менің командаластарым. Біз бір командада футбол ойнаймыз.'},
    ],
    words:[
      {en:'cousin', ru:'двоюродный брат, двоюродная сестра', kk:'немере туыс', ex:'My cousin and I play together.', g:'thing'},
      {en:'grandparents', ru:'бабушка и дедушка', kk:'ата-әже', ex:'My grandparents live in a village.', g:'thing'},
      {en:'uncle', ru:'дядя', kk:'нағашы', ex:'My uncle is very kind.', g:'thing'},
      {en:'aunt', ru:'тётя', kk:'тәте', ex:'This is my aunt.', g:'thing'},
      {en:'best friend', ru:'лучший друг', kk:'ең жақын дос', ex:'My best friend helps me.', g:'thing'},
      {en:'classmate', ru:'одноклассник', kk:'сыныптас', ex:'My classmate sits next to me.', g:'thing'},
      {en:'team-mate', ru:'товарищ по команде', kk:'командалас', ex:'These are my team-mates.', g:'thing'},
      {en:'online friend', ru:'друг из интернета', kk:'интернеттегі дос', ex:'My online friend is from Turkey.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'This ___ my best friend.', opts:['is', 'are', 'am'], a:0,
       why:'Человек один, поэтому после this идёт is.',
       whyKk:'Адам біреу, сондықтан this-тен кейін is тұрады.'},
      {t:'choice', q:'___ are my grandparents.', opts:['This', 'These', 'It'], a:1,
       why:'Людей двое, а про двоих и больше говорим these.',
       whyKk:'Адам екеу, ал екі не одан көп адам туралы these деп айтамыз.'},
      {t:'choice', q:'This is my ___. He is my mother’s brother.', opts:['uncle', 'aunt', 'cousin'], a:0,
       why:'Брата мамы называют дядей.',
       whyKk:'Ананың ағасын нағашы дейді.'},
      {t:'choice', q:'These are my ___. We play in the same football team.', opts:['classmates', 'team-mates', 'grandparents'], a:1,
       why:'Речь про одну команду, а не про школу или семью.',
       whyKk:'Әңгіме бір команда туралы, мектеп не отбасы туралы емес.'},
      {t:'order', ru:'Это мой двоюродный брат.', kk:'Бұл — менің немере ағам.',
       words:['This', 'is', 'my', 'cousin'], a:'This is my cousin'},
      {t:'order', ru:'Это мои одноклассники.', kk:'Бұл — менің сыныптастарым.',
       words:['These', 'are', 'my', 'classmates'], a:'These are my classmates'},
    ]
  },

  b14: {
    title:'How Much', subtitle:'Спрашивать «сколько?»', subtitleKk:'«Қанша?» деп сұрау',
    rule:'Milk, water, sugar по штукам не считают — про них спрашиваем how much. Apples, chairs, books, students пересчитать можно — про них how many. Оба стоят в самом начале вопроса.',
    ruleKk:'Milk, water, sugar данамен саналмайды — олар туралы how much деп сұраймыз. Apples, chairs, books, students санауға келеді — олар туралы how many. Екеуі де сұрақтың ең басында тұрады.',
    examples:[
      {en:'How much milk do we need?', ru:'Сколько молока нам нужно?', kk:'Бізге қанша сүт керек?'},
      {en:'How many apples should I buy?', ru:'Сколько яблок мне купить?', kk:'Маған қанша алма алу керек?'},
      {en:'How much homework do we have today?', ru:'Сколько у нас сегодня домашнего задания?', kk:'Бүгін қанша үй тапсырмасы бар?'},
      {en:'How many students are absent today?', ru:'Сколько учеников сегодня нет?', kk:'Бүгін қанша оқушы жоқ?'},
    ],
    words:[
      {en:'how much', ru:'сколько (то, что не считают по штукам)', kk:'қанша (данамен саналмайтын зат)', ex:'How much milk do we need?', g:'word'},
      {en:'how many', ru:'сколько (штук)', kk:'қанша (дана)', ex:'How many apples should I buy?', g:'word'},
      {en:'milk', ru:'молоко', kk:'сүт', ex:'We need one liter of milk.', g:'thing'},
      {en:'water', ru:'вода', kk:'су', ex:'How much water is in the glass?', g:'thing'},
      {en:'sugar', ru:'сахар', kk:'қант', ex:'How much sugar is in the tea?', g:'thing'},
      {en:'homework', ru:'домашнее задание', kk:'үй тапсырмасы', ex:'We have only two exercises.', g:'thing'},
      {en:'apple', ru:'яблоко', kk:'алма', ex:'I want to buy six apples.', g:'thing'},
      {en:'absent', ru:'отсутствует, нет на месте', kk:'жоқ, келмеген', ex:'Two students are absent today.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'___ water is in the glass?', opts:['How much', 'How many', 'How old'], a:0,
       why:'Воду не считают по штукам, у неё нет множественного числа.',
       whyKk:'Суды данамен санамайды, оның көпше түрі жоқ.'},
      {t:'choice', q:'___ apples should I buy?', opts:['How much', 'How many', 'How long'], a:1,
       why:'Яблоки можно пересчитать: одно, два, шесть.',
       whyKk:'Алманы санап шығуға болады: бір, екі, алты.'},
      {t:'choice', q:'___ money do you need?', opts:['How many', 'How much', 'How often'], a:1,
       why:'Деньги в английском считают не штуками, а суммой.',
       whyKk:'Ағылшынша ақшаны данамен емес, сомамен санайды.'},
      {t:'choice', q:'How many ___ are absent today?', opts:['student', 'students', 'a student'], a:1,
       why:'После how many предмет всегда стоит во множественном числе.',
       whyKk:'How many-дан кейін зат әрқашан көпше түрде тұрады.'},
      {t:'order', ru:'Сколько молока нам нужно?', kk:'Бізге қанша сүт керек?',
       words:['How', 'much', 'milk', 'do', 'we', 'need'], a:'How much milk do we need'},
      {t:'order', ru:'Сколько там шариков?', kk:'Онда қанша шар бар?',
       words:['How', 'many', 'balloons', 'are', 'there'], a:'How many balloons are there'},
    ]
  },

  /* Elementary · Damu. Материал снят с двух роликов урока: теория дала
     правило и примеры со слайдов, практика — слова и задания. */
  e1: {
    title:'To Be', subtitle:'Кто, где и какой', subtitleKk:'Кім, қайда және қандай',
    rule:'По-русски говорим «я дома», «мне 12 лет» без глагола, а по-английски на это место ставим am, is или are: I am at home, I am 12 years old. am идёт только с I, is — с he, she, it, are — с we, you, they. Для «не» добавляем not: He is not my brother, а в вопросе am, is, are встают первыми: Are they friends?',
    ruleKk:'Қазақша «мен үйдемін», «мен 12 жастамын» деп етістіксіз айтамыз, ал ағылшынша бұл орынға am, is немесе are қойылады: I am at home, I am 12 years old. am тек I-мен, is — he, she, it-пен, are — we, you, they-мен келеді. Болымсыз сөйлемде not қосамыз: He is not my brother, ал сұрақта am, is, are сөйлемнің басына шығады: Are they friends?',
    examples:[
      {en:'My mother is a doctor.', ru:'Моя мама — врач.', kk:'Анам — дәрігер.'},
      {en:'I am 12 years old.', ru:'Мне 12 лет.', kk:'Мен 12 жастамын.'},
      {en:'They are not in the room.', ru:'Их нет в комнате.', kk:'Олар бөлмеде емес.'},
      {en:'Is she a teacher?', ru:'Она учительница?', kk:'Ол мұғалім бе?'},
    ],
    words:[
      {en:'awake', ru:'проснувшийся, не спит', kk:'ояу, оянған', ex:'I am awake.', g:'sign'},
      {en:'sleepy', ru:'сонный', kk:'ұйқысы келген', ex:'He is sleepy. He is not awake.', g:'sign'},
      {en:'ready', ru:'готовый', kk:'дайын', ex:'We are ready to learn English.', g:'sign'},
      {en:'hungry', ru:'голодный', kk:'қарны ашқан', ex:'This is my cat. It’s hungry.', g:'sign'},
      {en:'classmate', ru:'одноклассник', kk:'сыныптас', ex:'They are my classmates.', g:'thing'},
      {en:'doctor', ru:'врач', kk:'дәрігер', ex:'My mother is a doctor.', g:'thing'},
      {en:'room', ru:'комната', kk:'бөлме', ex:'My room is clean.', g:'thing'},
      {en:'outside', ru:'на улице, снаружи', kk:'сыртта, далада', ex:'It is warm outside.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'My mom ___ a teacher.', opts:['am', 'is', 'are'], a:1,
       why:'Мама — это одна она, she, а с she ставим is.',
       whyKk:'Анам — бір адам, яғни she, ал she-мен is келеді.'},
      {t:'choice', q:'We ___ at the park.', opts:['are', 'is', 'am'], a:0,
       why:'С we всегда are. is говорят про одного человека или предмет, am — только про себя, с I.',
       whyKk:'we-мен әрқашан are келеді. is бір адам не бір зат туралы айтылады, am тек I-мен келеді.'},
      {t:'choice', q:'Timur is at school now. He ___ at home.', opts:['is', 'are not', 'is not'], a:2,
       why:'Тимур в школе, значит дома его нет: is not. С he are не ставят.',
       whyKk:'Тимур мектепте, демек үйде жоқ: is not. he-мен are қолданылмайды.'},
      {t:'choice', q:'___ they your classmates? — Yes, they are.', opts:['Is', 'Am', 'Are'], a:2,
       why:'В вопросе глагол встаёт первым, а с they это are. Ответ подсказывает то же: they are.',
       whyKk:'Сұрақта етістік бірінші тұрады, they-мен are келеді. Жауаптың өзі де айтып тұр: they are.'},
      {t:'order', ru:'Ты готов к новому дню?', kk:'Бүгінгі күнге дайынсың ба?',
       words:['Are', 'you', 'ready', 'for', 'the', 'day'], a:'Are you ready for the day'},
      {t:'order', ru:'Их нет в комнате.', kk:'Олар бөлмеде емес.',
       words:['They', 'are', 'not', 'in', 'the', 'room'], a:'They are not in the room'},
    ]
  },

  e2: {
    title:'Possessive Adjectives', subtitle:'Мой, твой, его, её', subtitleKk:'Менің, сенің, оның',
    rule:'Чтобы сказать, чьё это, ставим перед предметом my, your, his, her, its, our, their: my mother, our family, their house. his — про мальчика или мужчину, her — про девочку или женщину, its — про животное или вещь: The dog is wagging its tail. Это слово всегда стоит перед предметом, а не после: this is my book, а не this is book my.',
    ruleKk:'Зат кімдікі екенін айту үшін оның алдына my, your, his, her, its, our, their қоямыз: my mother, our family, their house. his — ұл бала не ер адам туралы, her — қыз бала не әйел туралы, its — жануар не зат туралы: The dog is wagging its tail. Бұл сөз әрқашан заттың алдында тұрады, артында емес: this is my book деп айтамыз, this is book my деп айтпаймыз.',
    examples:[
      {en:'His father is strong.', ru:'Его папа сильный.', kk:'Оның әкесі күшті.'},
      {en:'Her eyes are green.', ru:'У неё зелёные глаза.', kk:'Оның көзі жасыл.'},
      {en:'Their friends are at school.', ru:'Их друзья в школе.', kk:'Олардың достары мектепте.'},
      {en:'This is our house.', ru:'Это наш дом.', kk:'Бұл — біздің үйіміз.'},
    ],
    words:[
      {en:'grandparents', ru:'бабушка и дедушка', kk:'ата-әже', ex:'Our grandparents are old.', g:'thing'},
      {en:'best friend', ru:'лучший друг, лучшая подруга', kk:'ең жақын дос', ex:'Her best friend is kind.', g:'thing'},
      {en:'jacket', ru:'куртка', kk:'күрте', ex:'Your jacket is green.', g:'thing'},
      {en:'tail', ru:'хвост', kk:'құйрық', ex:'The dog is wagging its tail.', g:'thing'},
      {en:'wag', ru:'вилять (хвостом)', kk:'(құйрығын) бұлғаңдату', ex:'The dog is wagging its tail.', g:'act'},
      {en:'strong', ru:'сильный', kk:'күшті', ex:'His father is strong.', g:'sign'},
      {en:'kind', ru:'добрый', kk:'мейірімді', ex:'My father is kind.', g:'sign'},
      {en:'funny', ru:'смешной, весёлый', kk:'күлкілі, көңілді', ex:'My friend is funny.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'I have a pen. This is ___ pen.', opts:['my', 'me', 'I'], a:0,
       why:'Ручка моя, и перед предметом ставим my. me и I перед словом pen не ставят.',
       whyKk:'Қалам менікі, заттың алдына my қоямыз. me мен I pen сөзінің алдында тұрмайды.'},
      {t:'choice', q:'She has a dog. ___ dog is fast.', opts:['His', 'Her', 'She'], a:1,
       why:'Собака девочки, поэтому her. his было бы про мальчика.',
       whyKk:'Ит қыз баланікі, сондықтан her. his ұл бала туралы айтылады.'},
      {t:'choice', q:'Look at the dog. It is wagging ___ tail.', opts:['it', 'it’s', 'its'], a:2,
       why:'Хвост собаки, а про животное говорим its. it’s с апострофом значит it is.',
       whyKk:'Құйрық иттікі, жануар туралы its дейміз. Апострофы бар it’s — бұл it is.'},
      {t:'choice', q:'Aidar and Arman are brothers. ___ house is big.', opts:['Their', 'They', 'There'], a:0,
       why:'Дом принадлежит двум братьям — their. They значит просто «они», а there — «там».',
       whyKk:'Үй екі ағайындыға тиесілі — their. They — жай ғана «олар», ал there — «сонда».'},
      {t:'order', ru:'Это твой карандаш?', kk:'Бұл сенің қарындашың ба?',
       words:['Is', 'this', 'your', 'pencil'], a:'Is this your pencil'},
      {t:'order', ru:'Её лучшая подруга добрая.', kk:'Оның ең жақын құрбысы мейірімді.',
       words:['Her', 'best', 'friend', 'is', 'kind'], a:'Her best friend is kind'},
    ]
  },

  e3: {
    title:'Possessive Pronouns', subtitle:'Сказать «моё», не называя вещь', subtitleKk:'Затты атамай «менікі» деу',
    rule:'mine, yours, his, hers, ours, theirs значат «мой, твой, его, её, наш, их», но саму вещь после них уже не называют: This pen is mine — «Эта ручка моя». Сравни: my book, но The book is mine; mine book сказать нельзя. Почти все они кончаются на s, а his не меняется: his hat — This hat is his.',
    ruleKk:'mine, yours, his, hers, ours, theirs «менікі, сенікі, оныкі, біздікі, олардікі» дегенді білдіреді, олардан кейін зат аталмайды: This pen is mine — «Бұл қалам менікі». Салыстыр: my book, бірақ The book is mine; mine book деп айтуға болмайды. Бұлардың көбі s әрпімен бітеді, ал his өзгермейді: his hat — This hat is his.',
    examples:[
      {en:'The book is mine.', ru:'Книга моя.', kk:'Кітап менікі.'},
      {en:'The bag is hers.', ru:'Сумка её.', kk:'Сөмке оныкі.'},
      {en:'This house is ours.', ru:'Этот дом наш.', kk:'Бұл үй біздікі.'},
      {en:'These toys are theirs.', ru:'Эти игрушки их.', kk:'Бұл ойыншықтар олардікі.'},
    ],
    words:[
      {en:'mine', ru:'мой, моя, моё (без вещи после)', kk:'менікі', ex:'The book is mine.', g:'word'},
      {en:'yours', ru:'твой, ваш (без вещи после)', kk:'сенікі, сіздікі', ex:'The pencil is yours.', g:'word'},
      {en:'hers', ru:'её (без вещи после)', kk:'оныкі (қыз, әйел)', ex:'The phone is hers.', g:'word'},
      {en:'theirs', ru:'их (без вещи после)', kk:'олардікі', ex:'That bicycle is theirs.', g:'word'},
      {en:'hat', ru:'шапка', kk:'бас киім', ex:'This hat is his.', g:'thing'},
      {en:'phone', ru:'телефон', kk:'телефон', ex:'This is her phone.', g:'thing'},
      {en:'toy', ru:'игрушка', kk:'ойыншық', ex:'These toys are theirs.', g:'thing'},
      {en:'scarf', ru:'шарф', kk:'мойынорағыш', ex:'The red scarf is his.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'This jacket is ___.', opts:['my', 'mine', 'I'], a:1,
       why:'После is вещь уже не называют, поэтому mine. my ставят только перед вещью: my jacket.',
       whyKk:'is-тен кейін зат аталмайды, сондықтан mine. my тек заттың алдында тұрады: my jacket.'},
      {t:'choice', q:'Ali and Ainur play with these toys. The toys are ___.', opts:['theirs', 'they', 'their'], a:0,
       why:'Игрушки принадлежат Али и Айнур, а после are вещи нет — theirs. they значит просто «они», а their ставят перед вещью: their toys.',
       whyKk:'Ойыншықтар Әли мен Айнұрдікі, are-дан кейін зат жоқ — theirs. they — жай ғана «олар», ал their заттың алдында келеді: their toys.'},
      {t:'choice', q:'The red scarf is ___.', opts:['him', 'he', 'his'], a:2,
       why:'his одинаковый и с вещью, и без неё: his scarf, The scarf is his. him значит «его, ему», а не «его вещь».',
       whyKk:'his затпен де, затсыз да бірдей: his scarf, The scarf is his. him — «оны, оған» деген сөз, «оныкі» емес.'},
      {t:'choice', q:'Dana has a new phone. The phone is ___.', opts:['her', 'hers', 'she'], a:1,
       why:'Телефон Даны, а после is вещи нет — hers. her ставят перед вещью: her phone.',
       whyKk:'Телефон Дананікі, is-тен кейін зат жоқ — hers. her заттың алдында келеді: her phone.'},
      {t:'order', ru:'Эта ручка моя.', kk:'Бұл қалам менікі.',
       words:['This', 'pen', 'is', 'mine'], a:'This pen is mine'},
      {t:'order', ru:'Нет, карандаш не твой.', kk:'Жоқ, қарындаш сенікі емес.',
       words:['No,', 'the', 'pencil', 'is', 'not', 'yours'], a:'No, the pencil is not yours'},
    ]
  },

  e4: {
    title:'Articles', subtitle:'Какой-то или тот самый', subtitleKk:'Әйтеуір бір ме, әлде дәл сол ма',
    rule:'Когда говоришь о предмете впервые или тебе подойдёт любой один, ставь a, а перед гласным звуком an: I saw a dog, an apple, an hour. Когда уже ясно, о каком именно речь, или он такой один на свете, ставь the: The dog was very friendly, the sun. Если предметов много или их не посчитать, a не нужно: I like books, I need water.',
    ruleKk:'Бір затты алғаш рет айтсақ немесе кез келген біреуі бола берсе, a қоямыз, ал дауысты дыбыстың алдында an: I saw a dog, an apple, an hour. Қай зат туралы айтып тұрғанымыз белгілі болса немесе ол әлемде біреу ғана болса, the қоямыз: The dog was very friendly, the sun. Зат көп болса немесе оны санауға келмесе, a қойылмайды: I like books, I need water.',
    examples:[
      {en:'I saw a cat. The cat was black.', ru:'Я увидел кошку. Кошка была чёрная.', kk:'Мен бір мысық көрдім. Ол мысық қара еді.'},
      {en:'He is an engineer.', ru:'Он инженер.', kk:'Ол — инженер.'},
      {en:'Close the door, please.', ru:'Закрой, пожалуйста, дверь.', kk:'Есікті жауып жіберші.'},
      {en:'I need water.', ru:'Мне нужна вода.', kk:'Маған су керек.'},
    ],
    words:[
      {en:'kettle', ru:'чайник', kk:'шәйнек', ex:'Please pass me the kettle.', g:'thing'},
      {en:'cookie', ru:'печенье', kk:'печенье', ex:'My mom is eating a cookie.', g:'thing'},
      {en:'folder', ru:'папка', kk:'папка', ex:'Is it the big blue folder?', g:'thing'},
      {en:'uncle', ru:'дядя', kk:'аға, нағашы', ex:'I have an uncle in Astana.', g:'thing'},
      {en:'engineer', ru:'инженер', kk:'инженер', ex:'He is an engineer.', g:'thing'},
      {en:'hour', ru:'час', kk:'сағат', ex:'The lesson is an hour long.', g:'time'},
      {en:'need', ru:'нужно, нуждаться', kk:'керек болу', ex:'I need an apple.', g:'act'},
      {en:'forget', ru:'забыть', kk:'ұмыту', ex:'Oh no, I forgot my folder at home.', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'I saw a cat in the park. ___ cat was black.', opts:['A', 'The', 'An'], a:1,
       why:'Кошку уже упомянули, теперь ясно, о какой речь, — the.',
       whyKk:'Мысық бұрын аталды, енді қай мысық екені белгілі — the.'},
      {t:'choice', q:'The lesson is ___ hour long.', opts:['an', 'a', 'the'], a:0,
       why:'hour пишется с h, но h не читается, и слово начинается с гласного звука «ауэр». Поэтому an.',
       whyKk:'hour h әрпімен жазылады, бірақ h оқылмайды, сөз «ауэр» деген дауысты дыбыстан басталады. Сондықтан an.'},
      {t:'choice', q:'Look at ___ moon. It is so big tonight.', opts:['a', 'an', 'the'], a:2,
       why:'Луна на небе одна, поэтому the moon, как the sun и the earth.',
       whyKk:'Аспанда ай біреу ғана, сондықтан the moon дейміз, the sun, the earth сияқты.'},
      {t:'choice', q:'I am thirsty. I need ___.', opts:['a water', 'water', 'an water'], a:1,
       why:'Воду не посчитать штуками, поэтому a перед water не ставим. Говорим просто I need water.',
       whyKk:'Суды данамен санамаймыз, сондықтан water-дің алдына a қойылмайды. Жай ғана I need water дейміз.'},
      {t:'order', ru:'Передай мне, пожалуйста, чайник.', kk:'Шәйнекті беріп жіберші.',
       words:['Please', 'pass', 'me', 'the', 'kettle'], a:'Please pass me the kettle'},
      {t:'order', ru:'Мой дядя — инженер.', kk:'Нағашы ағам — инженер.',
       words:['My', 'uncle', 'is', 'an', 'engineer'], a:'My uncle is an engineer'},
    ]
  },

  e5: {
    title:'Demonstratives', subtitle:'Показать, что близко и что далеко', subtitleKk:'Жақындағы мен алыстағыны көрсету',
    rule:'Близкий предмет, который можно взять в руку, — this, а если близких предметов много — these: this book, these apples. Далёкий предмет, который видишь, но не достанешь, — that, а много далёких — those: that house, those birds. После this и that ставь is, после these и those — are: These are my friends.',
    ruleKk:'Қолмен ұстауға болатын жақын бір затты this деп, жақын заттар көп болса these деп көрсетеміз: this book, these apples. Көзің көріп тұр, бірақ қолың жетпейтін алыстағы бір зат — that, алыстағы көп зат — those: that house, those birds. this және that сөздерінен кейін is, these және those сөздерінен кейін are келеді: These are my friends.',
    examples:[
      {en:'This is my friend.', ru:'Это мой друг.', kk:'Бұл менің досым.'},
      {en:'That car is new.', ru:'Вон та машина новая.', kk:'Анау көлік жаңа.'},
      {en:'These apples are sweet.', ru:'Эти яблоки сладкие.', kk:'Мына алмалар тәтті.'},
      {en:'Those cars are expensive.', ru:'Вон те машины дорогие.', kk:'Анау көліктер қымбат.'},
    ],
    words:[
      {en:'this', ru:'это, этот', kk:'бұл, мынау', ex:'This book is interesting.', g:'word'},
      {en:'that', ru:'то, вон тот', kk:'анау', ex:'That car is new.', g:'word'},
      {en:'these', ru:'эти', kk:'мыналар, бұлар', ex:'These are my friends.', g:'word'},
      {en:'those', ru:'те, вон те', kk:'аналар', ex:'Those are trees.', g:'word'},
      {en:'pencil', ru:'карандаш', kk:'қарындаш', ex:'These are pencils.', g:'thing'},
      {en:'shoe', ru:'туфля, ботинок', kk:'аяқ киім', ex:'I like these shoes.', g:'thing'},
      {en:'sweet', ru:'сладкий', kk:'тәтті', ex:'These apples are sweet.', g:'sign'},
      {en:'noisy', ru:'шумный', kk:'шулы', ex:'Those children are noisy.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'I have three pencils in my hand. ___ are my pencils.', opts:['These', 'This', 'Those'], a:0,
       why:'Карандаши у меня в руке, и их три — близко и много. Значит these. Those говорят о том, что далеко.',
       whyKk:'Қарындаштар қолымда, үшеуі де жақын әрі көп. Сондықтан these. Those алыстағы заттарға айтылады.'},
      {t:'choice', q:'The house is far from us. ___ house is very big.', opts:['This', 'That', 'These'], a:1,
       why:'Дом далеко, и он один — that. These ставят перед словом во множественном числе: these houses.',
       whyKk:'Үй алыста тұр, әрі біреу ғана — that. These көпше түрдегі сөзбен келеді: these houses.'},
      {t:'choice', q:'Those children ___ noisy.', opts:['is', 'am', 'are'], a:2,
       why:'Those — это несколько предметов, children — несколько детей. Значит are, как после they.',
       whyKk:'Those — бірнеше зат, children да бірнеше бала. Сондықтан they-дегідей are қойылады.'},
      {t:'choice', q:'The birds are far away in the sky. ___ birds are flying.', opts:['Those', 'That', 'These'], a:0,
       why:'Птицы в небе далеко, и их несколько. Далеко и много — those. That подходит только для одного предмета.',
       whyKk:'Құстар аспанда, яғни алыста, әрі бірнешеу. Алыс әрі көп — those. That тек бір затқа айтылады.'},
      {t:'order', ru:'Мне не нравятся вон те туфли.', kk:'Маған анау аяқ киім ұнамайды.',
       words:['I', 'don’t', 'like', 'those', 'shoes'], a:'I don’t like those shoes'},
      {t:'order', ru:'Это твоя сумка?', kk:'Бұл сенің сөмкең бе?',
       words:['Is', 'this', 'your', 'bag'], a:'Is this your bag'},
    ]
  },

  e6: {
    title:'There Is, There Are', subtitle:'Сказать, что где есть', subtitleKk:'Не қайда бар екенін айту',
    rule:'Чтобы сказать, что где-то что-то есть, начинай с there is, если предмет один или его не считают (вода, молоко), и с there are, если предметов несколько: There is a table in the room. There are many books on the shelf. В вопросе is или are встаёт перед there, а в отрицании к ним добавляется not: Is there a cat? There aren’t any people.',
    ruleKk:'Бір жерде бір нәрсе бар екенін айтқанда, зат біреу болса не ол саналмайтын болса (су, сүт), there is, ал зат бірнешеу болса, there are аламыз: There is a table in the room. There are many books on the shelf. Сұрақта is не are there сөзінің алдына шығады, ал болымсыз сөйлемде оларға not қосылады: Is there a cat? There aren’t any people.',
    examples:[
      {en:'There is a book on the table.', ru:'На столе есть книга.', kk:'Үстелде бір кітап бар.'},
      {en:'There are three apples in the bag.', ru:'В сумке три яблока.', kk:'Сөмкеде үш алма бар.'},
      {en:'There isn’t a dog in the room.', ru:'В комнате нет собаки.', kk:'Бөлмеде ит жоқ.'},
      {en:'Are there any books in the library?', ru:'В библиотеке есть книги?', kk:'Кітапханада кітаптар бар ма?'},
    ],
    words:[
      {en:'some', ru:'несколько, немного', kk:'біраз, бірнеше', ex:'There are some flowers in the garden.', g:'word'},
      {en:'any', ru:'какие-нибудь, никаких', kk:'ешқандай, қандай да бір', ex:'Are there any students in the class?', g:'word'},
      {en:'many', ru:'много', kk:'көп', ex:'There are many students in the class.', g:'word'},
      {en:'shelf', ru:'полка', kk:'сөре', ex:'There are many books on the shelf.', g:'thing'},
      {en:'toy', ru:'игрушка', kk:'ойыншық', ex:'There are some toys on the floor.', g:'thing'},
      {en:'floor', ru:'пол', kk:'еден', ex:'There is a ball on the floor.', g:'thing'},
      {en:'fridge', ru:'холодильник', kk:'тоңазытқыш', ex:'There is milk in the fridge.', g:'thing'},
      {en:'outside', ru:'за, снаружи', kk:'сыртында', ex:'There is a tree outside the window.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'There ___ three apples in the bag.', opts:['is', 'are', 'am'], a:1,
       why:'Яблок три, значит их несколько — there are. There is оставь для одного предмета.',
       whyKk:'Алма үшеу, яғни бірнешеу — there are. There is бір затқа ғана айтылады.'},
      {t:'choice', q:'There ___ milk in the fridge.', opts:['is', 'are', 'be'], a:0,
       why:'Молоко по штукам не посчитаешь, а с такими словами всегда there is, даже если молока много.',
       whyKk:'Сүтті дана деп санай алмаймыз, ал саналмайтын заттармен әрқашан there is келеді, көп болса да.'},
      {t:'choice', q:'___ there a TV in your room?', opts:['Are', 'Do', 'Is'], a:2,
       why:'Телевизор один, значит is. В вопросе is встаёт перед there: Is there a TV?',
       whyKk:'Теледидар біреу, сондықтан is. Сұрақта is there сөзінің алдына шығады: Is there a TV?'},
      {t:'choice', q:'There aren’t ___ chairs here.', opts:['some', 'any', 'a'], a:1,
       why:'В отрицании и в вопросе ставят any. Some — для утвердительного предложения, а a — только для одного предмета.',
       whyKk:'Болымсыз сөйлем мен сұрақта any қойылады. Some болымды сөйлемде келеді, ал a тек бір затпен айтылады.'},
      {t:'order', ru:'На полке много книг.', kk:'Сөреде көп кітап бар.',
       words:['There', 'are', 'many', 'books', 'on', 'the', 'shelf'], a:'There are many books on the shelf'},
      {t:'order', ru:'В комнате есть кошка?', kk:'Бөлмеде мысық бар ма?',
       words:['Is', 'there', 'a', 'cat', 'in', 'the', 'room'], a:'Is there a cat in the room'},
    ]
  },

  e7: {
    title:'Have Got, Has Got', subtitle:'Рассказать, что у тебя есть', subtitleKk:'Өзіңде не бар екенін айту',
    rule:'Чтобы сказать «у меня есть», бери have got с I, you, we, they и has got с he, she, it: I have got a brother. She has got blue eyes. В отрицании not прилипает к have или has — haven’t got, hasn’t got, а в вопросе have или has встаёт вперёд: Have you got a dog?',
    ruleKk:'«Менде бар» деу үшін I, you, we, they-мен have got, ал he, she, it-пен has got аламыз: I have got a brother. She has got blue eyes. Болымсыз сөйлемде not have не has сөзіне жалғанады — haven’t got, hasn’t got, ал сұрақта have не has сөйлемнің басына шығады: Have you got a dog?',
    examples:[
      {en:'I have got a brother.', ru:'У меня есть брат.', kk:'Менің інім бар.'},
      {en:'She has got a big family.', ru:'У неё большая семья.', kk:'Оның үлкен отбасы бар.'},
      {en:'We haven’t got a garden.', ru:'У нас нет сада.', kk:'Біздің бағымыз жоқ.'},
      {en:'Has she got a computer?', ru:'У неё есть компьютер?', kk:'Оның компьютері бар ма?'},
    ],
    words:[
      {en:'brother', ru:'брат', kk:'аға, іні', ex:'I have got a brother.', g:'thing'},
      {en:'sister', ru:'сестра', kk:'әпке, сіңлі', ex:'He hasn’t got a sister.', g:'thing'},
      {en:'eye', ru:'глаз', kk:'көз', ex:'He has got blue eyes.', g:'thing'},
      {en:'long', ru:'длинный', kk:'ұзын', ex:'My sister has got long hair.', g:'sign'},
      {en:'doll', ru:'кукла', kk:'қуыршақ', ex:'She has got a beautiful doll.', g:'thing'},
      {en:'tail', ru:'хвост', kk:'құйрық', ex:'It has got a long tail.', g:'thing'},
      {en:'a lot of', ru:'много', kk:'көп', ex:'We have got a lot of friends.', g:'word'},
      {en:'homework', ru:'домашнее задание', kk:'үй тапсырмасы', ex:'We have got a lot of homework.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'My sister ___ long hair.', opts:['have got', 'has got', 'is got'], a:1,
       why:'My sister — это she, а с he, she, it идёт has got. Have got — для I, you, we, they.',
       whyKk:'My sister — ол she, ал he, she, it-пен has got келеді. Have got I, you, we, they-ге арналған.'},
      {t:'choice', q:'___ you got a bike?', opts:['Has', 'Do', 'Have'], a:2,
       why:'Вопрос начинается с have или has. С you нужно have: Have you got a bike?',
       whyKk:'Сұрақ have не has сөзінен басталады. you-мен have келеді: Have you got a bike?'},
      {t:'choice', q:'The dog ___ small ears.', opts:['has got', 'have got', 'is'], a:0,
       why:'Одна собака — это it, значит has got. Have got говорят про I, you, we, they.',
       whyKk:'Бір ит — ол it, сондықтан has got. Have got I, you, we, they туралы айтылады.'},
      {t:'choice', q:'Aidar has got two brothers, but he ___ a sister.', opts:['haven’t got', 'doesn’t got', 'hasn’t got'], a:2,
       why:'Aidar — это he, поэтому hasn’t got. Doesn’t got не бывает: not прилипает прямо к has.',
       whyKk:'Aidar — ол he, сондықтан hasn’t got. Doesn’t got деген түр жоқ: not тікелей has сөзіне жалғанады.'},
      {t:'order', ru:'У неё есть красивая кукла.', kk:'Оның әдемі қуыршағы бар.',
       words:['She', 'has', 'got', 'a', 'beautiful', 'doll'], a:'She has got a beautiful doll'},
      {t:'order', ru:'У тебя есть ноутбук?', kk:'Сенің ноутбугың бар ма?',
       words:['Have', 'you', 'got', 'a', 'laptop'], a:'Have you got a laptop'},
    ]
  },

  e8: {
    title:'Present Continuous', subtitle:'Рассказать, что происходит сейчас', subtitleKk:'Дәл қазір не болып жатқанын айту',
    rule:'Чтобы сказать, что происходит прямо сейчас, бери am, is или are и глагол с -ing: I am reading a book. She is playing football. Без am, is, are нельзя: не I reading, а I am reading. Для «не» добавь not — She isn’t sleeping, а для вопроса поставь am, is или are вперёд — Are you reading?',
    ruleKk:'Дәл қазір болып жатқан әрекетті айту үшін am, is не are және -ing жалғанған етістікті аламыз: I am reading a book. She is playing football. am, is, are сөздерін түсіріп тастауға болмайды: I reading емес, I am reading. Болымсыз сөйлемде not қосамыз — She isn’t sleeping, ал сұрақта am, is не are сөйлемнің басына шығады — Are you reading?',
    examples:[
      {en:'She is talking on the phone.', ru:'Она сейчас говорит по телефону.', kk:'Ол қазір телефонмен сөйлесіп жатыр.'},
      {en:'I am not watching TV.', ru:'Я не смотрю телевизор.', kk:'Мен теледидар көріп жатқан жоқпын.'},
      {en:'What are they doing?', ru:'Что они делают?', kk:'Олар не істеп жатыр?'},
      {en:'I am living in Astana these days.', ru:'Сейчас я живу в Астане.', kk:'Мен осы күндері Астанада тұрып жатырмын.'},
    ],
    words:[
      {en:'now', ru:'сейчас', kk:'қазір', ex:'I am reading now.', g:'time'},
      {en:'at the moment', ru:'в этот момент, сейчас', kk:'дәл осы сәтте', ex:'I am washing the dishes at the moment.', g:'time'},
      {en:'sit', ru:'сидеть', kk:'отыру', ex:'His sister is sitting on a bench.', g:'act'},
      {en:'run', ru:'бегать, бежать', kk:'жүгіру', ex:'A small dog is running around.', g:'act'},
      {en:'ride', ru:'кататься, ехать', kk:'(велосипед) тебу, міну', ex:'Two girls are riding their bikes.', g:'act'},
      {en:'wear', ru:'носить, быть одетым в', kk:'кию, тағу', ex:'He is wearing glasses.', g:'act'},
      {en:'bench', ru:'скамейка', kk:'орындық', ex:'There is a bench under the big tree.', g:'thing'},
      {en:'newspaper', ru:'газета', kk:'газет', ex:'An old man is reading a newspaper.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'Look, the children ___ football in the yard.', opts:['is playing', 'are playing', 'play'], a:1,
       why:'Children — это они, значит are. «Посмотри» — значит происходит прямо сейчас: are playing.',
       whyKk:'Children — олар, сондықтан are. «Қара» деп тұрмыз, демек әрекет дәл қазір болып жатыр: are playing.'},
      {t:'choice', q:'I ___ not watching TV.', opts:['am', 'is', 'are'], a:0,
       why:'С I всегда am. Is ставят с he, she, it, а are — с you, we, they.',
       whyKk:'I-мен әрқашан am келеді. Is — he, she, it-пен, ал are — you, we, they-мен.'},
      {t:'choice', q:'Be quiet. The baby is ___.', opts:['sleep', 'sleeps', 'sleeping'], a:2,
       why:'После is нужен глагол с -ing: is sleeping. Просто sleep или sleeps после is не ставят.',
       whyKk:'is сөзінен кейін -ing жалғанған етістік керек: is sleeping. Одан кейін sleep те, sleeps те тұрмайды.'},
      {t:'choice', q:'His sister is ___ on a bench.', opts:['siting', 'sitting', 'sits'], a:1,
       why:'В sit одна короткая гласная, а в конце согласная, поэтому t удваивается: sitting. Так же run — running.',
       whyKk:'sit сөзінде бір қысқа дауысты бар, соңы дауыссызбен бітеді, сондықтан t екі еселенеді: sitting. run да солай — running.'},
      {t:'order', ru:'Он пишет письмо?', kk:'Ол хат жазып жатыр ма?',
       words:['Is', 'he', 'writing', 'a', 'letter'], a:'Is he writing a letter'},
      {t:'order', ru:'Две девочки катаются на велосипедах.', kk:'Екі қыз велосипед тебіп жүр.',
       words:['Two', 'girls', 'are', 'riding', 'their', 'bikes'], a:'Two girls are riding their bikes'},
    ]
  },

  e9: {
    title:'Present Simple', subtitle:'Что ты делаешь каждый день', subtitleKk:'Күнде не істейсің',
    rule:'Когда говоришь о привычках, о том, что повторяется, и о фактах, бери глагол в первой форме: I go to school every day. С he, she, it к глаголу добавь -s или -es: she plays, he watches. В вопросе и с not помогают do и does, а глагол остаётся без -s: Does she play tennis? She doesn’t like pizza.',
    ruleKk:'Әдетті, қайталанып тұратын істі және жалпы фактілерді айтқанда етістіктің бірінші формасын аламыз: I go to school every day. he, she, it болса, етістікке -s не -es жалғанады: she plays, he watches. Сұрақ пен болымсыз сөйлемде do мен does көмектеседі, ал етістікке -s жалғанбайды: Does she play tennis? She doesn’t like pizza.',
    examples:[
      {en:'My father goes to work every day.', ru:'Мой папа каждый день ходит на работу.', kk:'Әкем күнде жұмысқа барады.'},
      {en:'The sun rises in the east.', ru:'Солнце встаёт на востоке.', kk:'Күн шығыстан шығады.'},
      {en:'He doesn’t play football.', ru:'Он не играет в футбол.', kk:'Ол футбол ойнамайды.'},
      {en:'Does your brother study at this school?', ru:'Твой брат учится в этой школе?', kk:'Ағаң осы мектепте оқи ма?'},
    ],
    words:[
      {en:'get up', ru:'вставать (утром)', kk:'ұйқыдан тұру', ex:'I always get up early.', g:'act'},
      {en:'breakfast', ru:'завтрак', kk:'таңғы ас', ex:'We eat breakfast together.', g:'thing'},
      {en:'watch', ru:'смотреть', kk:'көру, қарау', ex:'He watches TV in the evening.', g:'act'},
      {en:'live', ru:'жить', kk:'тұру, өмір сүру', ex:'Do they live here?', g:'act'},
      {en:'work', ru:'работать', kk:'жұмыс істеу', ex:'They work in an office.', g:'act'},
      {en:'always', ru:'всегда', kk:'әрқашан', ex:'She always wakes up early.', g:'word'},
      {en:'never', ru:'никогда', kk:'ешқашан', ex:'He never drinks tea.', g:'word'},
      {en:'every day', ru:'каждый день', kk:'күнде, күн сайын', ex:'I go to school every day.', g:'time'},
    ],
    tasks:[
      {t:'choice', q:'My cat ___ a lot.', opts:['sleeps', 'sleep', 'sleeping'], a:0,
       why:'Кошка — это it, а с it к глаголу добавляем -s: sleeps.',
       whyKk:'Мысық — it, ал it болса, етістікке -s жалғанады: sleeps.'},
      {t:'choice', q:'We ___ play games on weekdays.', opts:['doesn’t', 'don’t', 'not'], a:1,
       why:'С we отрицание строим через don’t. Doesn’t нужен только для he, she, it, а одно not перед глаголом не ставят.',
       whyKk:'we-мен болымсыз сөйлем don’t арқылы жасалады. Doesn’t тек he, she, it-ке керек, ал етістіктің алдына жалғыз not қойылмайды.'},
      {t:'choice', q:'___ you speak English?', opts:['Does', 'Is', 'Do'], a:2,
       why:'Вопрос с you начинаем с Do. Does ставят только перед he, she, it.',
       whyKk:'you-мен сұрақ Do-дан басталады. Does тек he, she, it алдында тұрады.'},
      {t:'choice', q:'Does she ___ tennis?', opts:['plays', 'play', 'playing'], a:1,
       why:'После does глагол остаётся без -s: does уже взял -s на себя. Поэтому play, а не plays.',
       whyKk:'does-тан кейін етістікке -s жалғанбайды, ол does-тың өзінде тұр. Сондықтан plays емес, play.'},
      {t:'order', ru:'Моя мама не водит машину.', kk:'Анам көлік жүргізбейді.',
       words:['My', 'mother', 'doesn’t', 'drive', 'a', 'car'], a:'My mother doesn’t drive a car'},
      {t:'order', ru:'Твой брат живёт здесь?', kk:'Ағаң осында тұра ма?',
       words:['Does', 'your', 'brother', 'live', 'here'], a:'Does your brother live here'},
    ]
  },

  e10: {
    title:'Would You Like vs. Do You Want', subtitle:'Предложить вежливо или по-дружески', subtitleKk:'Сыпайы не достарша ұсыну',
    rule:'Would you like…? — так вежливо предлагают или приглашают: официант в кафе, продавец, незнакомый человек. С друзьями, родными и детьми спрашивают проще: Do you want some water? После обоих ставь сразу предмет (Would you like some tea?) или to + глагол (Do you want to play football?).',
    ruleKk:'Would you like…? — сыпайы ұсыныс не шақыру: оны кафедегі даяшы, сатушы немесе бейтаныс адам қолданады. Достармен, жақындармен және балалармен қарапайым сұраймыз: Do you want some water? Екеуінен кейін бірден зат есім (Would you like some tea?) немесе to + етістік (Do you want to play football?) келеді.',
    examples:[
      {en:'Would you like another cup of tea?', ru:'Хотите ещё чашку чая?', kk:'Тағы бір шай ішесіз бе?'},
      {en:'Would you like to come with us?', ru:'Хотите пойти с нами?', kk:'Бізбен бірге барғыңыз келе ме?'},
      {en:'Do you want to play football?', ru:'Хочешь поиграть в футбол?', kk:'Футбол ойнағың келе ме?'},
      {en:'Do you want a toy?', ru:'Хочешь игрушку?', kk:'Ойыншық қалайсың ба?'},
    ],
    words:[
      {en:'menu', ru:'меню', kk:'мәзір', ex:'Would you like a menu?', g:'thing'},
      {en:'order', ru:'заказать', kk:'тапсырыс беру', ex:'Would you like to order dessert?', g:'act'},
      {en:'dessert', ru:'десерт', kk:'десерт, тәтті тағам', ex:'Would you like some dessert?', g:'thing'},
      {en:'cinema', ru:'кинотеатр', kk:'кинотеатр', ex:'Do you want to go to the cinema?', g:'thing'},
      {en:'tonight', ru:'сегодня вечером', kk:'бүгін кешке', ex:'Would you like to go to the cinema tonight?', g:'time'},
      {en:'go shopping', ru:'ходить за покупками', kk:'дүкен аралау', ex:'Would you like to go shopping?', g:'act'},
      {en:'learn', ru:'учиться, учить', kk:'үйрену', ex:'I want to learn to play the guitar.', g:'act'},
      {en:'please', ru:'пожалуйста', kk:'өтінемін', ex:'Would you like some tea? — Yes, please.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'In a café the waiter asks: "___ you like to see the menu?"', opts:['Would', 'Does', 'Are'], a:0,
       why:'Официант вежливо предлагает — Would you like. Does с you не ставят, а are с like не сочетается.',
       whyKk:'Даяшы сыпайы ұсыныс жасап тұр — Would you like. Does you-мен қолданылмайды, ал are like сөзімен тіркеспейді.'},
      {t:'choice', q:'Do you want ___ play football with us?', opts:['for', 'to', 'a'], a:1,
       why:'Если после want идёт глагол, перед ним ставим to: want to play.',
       whyKk:'want-тан кейін етістік келсе, оның алдына to қойылады: want to play.'},
      {t:'choice', q:'— Would you like some coffee? — Yes, ___.', opts:['I do', 'I would like', 'please'], a:2,
       why:'На вежливое предложение коротко отвечают Yes, please. Yes, I do — ответ на вопрос с do, а после I would like чего-то не хватает.',
       whyKk:'Сыпайы ұсынысқа қысқаша Yes, please деп жауап береміз. Yes, I do — do-мен қойылған сұраққа жауап, ал I would like-тан кейін сөйлем аяқталмай қалады.'},
      {t:'choice', q:'— Do you want some tea? — No, I ___.', opts:['don’t', 'doesn’t', 'am not'], a:0,
       why:'Вопрос задан с do, поэтому и отвечаем с do: No, I don’t. Doesn’t с I не ставят.',
       whyKk:'Сұрақ do-мен қойылған, сондықтан жауап та do-мен беріледі: No, I don’t. Doesn’t I-мен қолданылмайды.'},
      {t:'order', ru:'Хотите заказать десерт?', kk:'Десертке тапсырыс бергіңіз келе ме?',
       words:['Would', 'you', 'like', 'to', 'order', 'dessert'], a:'Would you like to order dessert'},
      {t:'order', ru:'Я хочу научиться играть на гитаре.', kk:'Мен гитарада ойнауды үйренгім келеді.',
       words:['I', 'want', 'to', 'learn', 'to', 'play', 'the', 'guitar'], a:'I want to learn to play the guitar'},
    ]
  },

  e11: {
    title:'Adverbs', subtitle:'Как, где, когда и как часто', subtitleKk:'Қалай, қайда, қашан, қаншалықты жиі',
    rule:'Слова quickly, outside, yesterday, always отвечают на вопросы «как?», «где?», «когда?» и «как часто?». Слова, которые отвечают на «как?», обычно делают из прилагательного с -ly: quick → quickly, beautiful → beautifully, но good → well, а fast, hard и late не меняются. Если таких слов несколько, порядок такой: как → где → когда: She sang beautifully in the hall yesterday.',
    ruleKk:'quickly, outside, yesterday, always сияқты үстеулер «қалай?», «қайда?», «қашан?», «қаншалықты жиі?» деген сұрақтарға жауап береді. «Қалай?» үстеулері көбіне сын есімге -ly жалғау арқылы жасалады: quick → quickly, beautiful → beautifully, бірақ good → well болады, ал fast, hard, late өзгермейді. Үстеу бірнешеу болса, реті мынадай: қалай → қайда → қашан: She sang beautifully in the hall yesterday.',
    examples:[
      {en:'She sings beautifully.', ru:'Она красиво поёт.', kk:'Ол әдемі ән айтады.'},
      {en:'He is waiting outside.', ru:'Он ждёт на улице.', kk:'Ол сыртта күтіп тұр.'},
      {en:'I met her yesterday.', ru:'Я встретил её вчера.', kk:'Мен оны кеше кездестірдім.'},
      {en:'He is never late.', ru:'Он никогда не опаздывает.', kk:'Ол ешқашан кешікпейді.'},
    ],
    words:[
      {en:'quickly', ru:'быстро', kk:'тез, жылдам', ex:'He runs quickly.', g:'sign'},
      {en:'carefully', ru:'осторожно', kk:'абайлап', ex:'He drives carefully.', g:'sign'},
      {en:'well', ru:'хорошо', kk:'жақсы', ex:'She speaks English well.', g:'sign'},
      {en:'outside', ru:'на улице, снаружи', kk:'сыртта, далада', ex:'They are playing outside.', g:'word'},
      {en:'abroad', ru:'за границей', kk:'шетелде', ex:'She lives abroad.', g:'word'},
      {en:'yesterday', ru:'вчера', kk:'кеше', ex:'I met her yesterday.', g:'time'},
      {en:'already', ru:'уже', kk:'әлдеқашан', ex:'It is already dark.', g:'time'},
      {en:'sometimes', ru:'иногда', kk:'кейде', ex:'We sometimes go to the cinema.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'Aruzhan sings ___. Everyone loves her songs.', opts:['beautiful', 'beauty', 'beautifully'], a:2,
       why:'Говорим, как она поёт, значит, нужно слово с -ly: beautifully. Beautiful описывает предмет, а не действие: a beautiful song.',
       whyKk:'Оның қалай ән айтатынын айтып тұрмыз, сондықтан -ly жалғанған сөз керек: beautifully. Beautiful әрекетті емес, затты сипаттайды: a beautiful song.'},
      {t:'choice', q:'Timur is a good player. He plays football very ___.', opts:['well', 'good', 'goodly'], a:0,
       why:'От good слово «как?» особое: well. Goodly так не говорят, а good описывает человека или вещь: a good player.',
       whyKk:'good-тан жасалатын «қалай?» сөзі ерекше: well. Goodly деген сөз жоқ, ал good адамды не затты сипаттайды: a good player.'},
      {t:'choice', q:'My brother ___ late for school.', opts:['never is', 'never be', 'is never'], a:2,
       why:'Never и always обычно стоят перед глаголом, но после am, is, are: he is never late.',
       whyKk:'never, always сияқты сөздер әдетте етістіктің алдында тұрады, бірақ am, is, are-дан кейін келеді: he is never late.'},
      {t:'choice', q:'I met Dana ___.', opts:['tomorrow', 'yesterday', 'soon'], a:1,
       why:'Met — это прошлое, значит, нужно слово о прошлом: yesterday. Tomorrow и soon говорят о будущем.',
       whyKk:'Met — өткен шақ, сондықтан өткенді білдіретін сөз керек: yesterday. Tomorrow мен soon келешек туралы айтады.'},
      {t:'order', ru:'Мой папа водит машину очень осторожно.', kk:'Әкем көлікті өте абайлап жүргізеді.',
       words:['My', 'father', 'drives', 'very', 'carefully'], a:'My father drives very carefully'},
      {t:'order', ru:'Брат Даны живёт за границей.', kk:'Дананың ағасы шетелде тұрады.',
       words:['Dana’s', 'brother', 'lives', 'abroad'], a:'Dana’s brother lives abroad'},
    ]
  },

  e12: {
    title:'Prepositions of Place', subtitle:'Сказать, где что стоит', subtitleKk:'Не қайда тұрғанын айту',
    rule:'Где лежит или стоит вещь, показывает предлог перед местом: in — внутри, on — на, under — под, next to — рядом, between — между двумя. Порядок слов такой — кто или что + am, is, are + предлог + место: The books are on the shelf. Вещь касается поверхности — on, висит выше и не касается — above: The lamp is above the table.',
    ruleKk:'Заттың қайда жатқанын не тұрғанын орынның алдындағы предлог көрсетеді: in — ішінде, on — үстінде, under — астында, next to — қасында, between — екі заттың ортасында. Сөйлем былай құралады — кім немесе не + am, is, are + предлог + орын: The books are on the shelf. Зат бетке тиіп тұрса — on, тимей жоғарыда тұрса — above: The lamp is above the table.',
    examples:[
      {en:'The cat is in the box.', ru:'Кошка в коробке.', kk:'Мысық қораптың ішінде.'},
      {en:'The shoes are under the bed.', ru:'Обувь под кроватью.', kk:'Аяқ киім төсектің астында.'},
      {en:'The pencil is between the two books.', ru:'Карандаш лежит между двумя книгами.', kk:'Қарындаш екі кітаптың ортасында жатыр.'},
      {en:'The lamp is above the table.', ru:'Лампа висит над столом.', kk:'Шам үстелдің жоғарысында ілулі тұр.'},
    ],
    words:[
      {en:'under', ru:'под', kk:'астында', ex:'The shoes are under the bed.', g:'word'},
      {en:'next to', ru:'рядом с', kk:'қасында, жанында', ex:'The school is next to the bank.', g:'word'},
      {en:'between', ru:'между', kk:'ортасында, арасында', ex:'The pencil is between the two books.', g:'word'},
      {en:'behind', ru:'за, позади', kk:'артында', ex:'The dog is behind the door.', g:'word'},
      {en:'in front of', ru:'перед', kk:'алдында', ex:'The car is in front of the house.', g:'word'},
      {en:'above', ru:'над', kk:'жоғарысында', ex:'The lamp is above the table.', g:'word'},
      {en:'opposite', ru:'напротив', kk:'қарсысында', ex:'The bank is opposite the post office.', g:'word'},
      {en:'shelf', ru:'полка', kk:'сөре', ex:'The books are on the shelf.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'The lamp doesn’t touch the table. It is ___ the table.', opts:['above', 'on', 'in'], a:0,
       why:'Лампа стола не касается, она висит выше — above. On ставят, когда вещь лежит прямо на поверхности: The phone is on the table.',
       whyKk:'Шам үстелге тимейді, жоғарыда ілулі тұр — above. On зат бір нәрсенің тура бетінде жатқанда қойылады: The phone is on the table.'},
      {t:'choice', q:'Aruzhan sits in the middle, ___ Dana and Timur.', opts:['next', 'between', 'in front'], a:1,
       why:'Аружан посередине, по бокам Дана и Тимур — between, «между двумя». Next и in front без to и of не говорят: next to, in front of.',
       whyKk:'Аружан ортада, екі жағында Дана мен Тимур отыр — between. Next пен in front сөздері to мен of-сыз айтылмайды: next to, in front of.'},
      {t:'choice', q:'All the students look at the teacher. She stands ___ the class.', opts:['behind', 'under', 'in front of'], a:2,
       why:'Ученики смотрят на учителя, значит, она стоит перед классом — in front of. Behind — это «сзади», туда ученики не смотрят.',
       whyKk:'Оқушылар мұғалімге қарап отыр, демек ол сыныптың алдында тұр — in front of. Behind — «артында», оқушылар артқа қарап отырған жоқ.'},
      {t:'choice', q:'The books ___ on the shelf.', opts:['is', 'are', 'be'], a:1,
       why:'Книг несколько — are. Is ставят, когда вещь одна: The book is on the shelf.',
       whyKk:'Кітап бірнешеу болғандықтан are қойылады. Зат біреу болса — is: The book is on the shelf.'},
      {t:'order', ru:'Обувь под кроватью.', kk:'Аяқ киім төсектің астында.',
       words:['The', 'shoes', 'are', 'under', 'the', 'bed'], a:'The shoes are under the bed'},
      {t:'order', ru:'Мой друг сидит рядом со мной.', kk:'Досым менің қасымда отыр.',
       words:['My', 'friend', 'is', 'sitting', 'next', 'to', 'me'], a:'My friend is sitting next to me'},
    ]
  },

  e13: {
    title:'Can and Cannot', subtitle:'Умею и можно', subtitleKk:'Істей алу және рұқсат',
    rule:'Can значит «умею» или «можно», can’t — «не умею» или «нельзя». Can одинаковый для всех: I can, he can, they can, а глагол после него идёт без to и без -s: She can run very fast. Когда просим разрешения, can встаёт в начало: Can I open the window?',
    ruleKk:'Can «істей аламын» немесе «болады» дегенді білдіреді, can’t — «істей алмаймын» немесе «болмайды». Can барлық есімдікпен бірдей: I can, he can, they can, ал одан кейінгі етістікке to да, -s те қосылмайды: She can run very fast. Рұқсат сұрағанда can сөйлемнің басына шығады: Can I open the window?',
    examples:[
      {en:'I can speak three languages.', ru:'Я говорю на трёх языках.', kk:'Мен үш тілде сөйлей аламын.'},
      {en:'We can’t fly.', ru:'Мы не умеем летать.', kk:'Біз ұша алмаймыз.'},
      {en:'Can I open the window?', ru:'Можно открыть окно?', kk:'Терезені ашсам бола ма?'},
      {en:'No, you can’t talk during the exam.', ru:'Нет, на экзамене разговаривать нельзя.', kk:'Жоқ, емтихан кезінде сөйлесуге болмайды.'},
    ],
    words:[
      {en:'speak', ru:'говорить (на языке)', kk:'сөйлеу', ex:'I can speak three languages.', g:'act'},
      {en:'language', ru:'язык', kk:'тіл', ex:'She can speak two languages.', g:'thing'},
      {en:'swim', ru:'плавать', kk:'жүзу', ex:'Dogs can swim.', g:'act'},
      {en:'fly', ru:'летать', kk:'ұшу', ex:'We can’t fly.', g:'act'},
      {en:'draw', ru:'рисовать', kk:'сурет салу', ex:'I can draw.', g:'act'},
      {en:'piano', ru:'пианино', kk:'пианино', ex:'He can’t play the piano.', g:'thing'},
      {en:'leave', ru:'уйти, уехать', kk:'кету', ex:'Can we leave now?', g:'act'},
      {en:'exam', ru:'экзамен', kk:'емтихан', ex:'No, you can’t talk during the exam.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'I have no money. I ___ buy a ticket.', opts:['can', 'am not', 'can’t'], a:2,
       why:'Денег нет, значит купить не получится — can’t. Am not перед глаголом buy не ставят.',
       whyKk:'Ақша жоқ, демек билет ала алмаймын — can’t. Am not buy етістігінің алдында тұрмайды.'},
      {t:'choice', q:'___ I ask a question, please?', opts:['Can', 'Am', 'Does'], a:0,
       why:'Просим разрешения — can встаёт в начало вопроса: Can I ask a question? Am и does с I ask не сочетаются.',
       whyKk:'Рұқсат сұрағанда can сұрақтың басына шығады: Can I ask a question? Am мен does I ask-пен қолданылмайды.'},
      {t:'choice', q:'My dad is strong. He ___ lift that box.', opts:['can’t', 'can', 'is'], a:1,
       why:'Папа сильный, значит поднять может — can. Глагол после can идёт без -s: he can lift.',
       whyKk:'Әкем күшті, демек жәшікті көтере алады — can. Can-нан кейінгі етістікке -s жалғанбайды: he can lift.'},
      {t:'choice', q:'No, you ___ eat the cake before dinner.', opts:['can’t', 'aren’t', 'can'], a:0,
       why:'No в начале — это запрет, а запрещаем через can’t: No, you can’t.',
       whyKk:'Басындағы No — тыйым, ал тыйым can’t арқылы айтылады: No, you can’t.'},
      {t:'order', ru:'Он не умеет играть на пианино.', kk:'Ол пианинода ойнай алмайды.',
       words:['He', 'can’t', 'play', 'the', 'piano'], a:'He can’t play the piano'},
      {t:'order', ru:'Можно мне открыть окно?', kk:'Терезені ашсам бола ма?',
       words:['Can', 'I', 'open', 'the', 'window'], a:'Can I open the window'},
    ]
  },

  e14: {
    title:'Imperatives', subtitle:'Сделай и не делай', subtitleKk:'Істе және істеме',
    rule:'Когда велим, просим или советуем, начинаем сразу с глагола, без you: Open the door. Запрещаем через don’t + глагол: Don’t be late. Зовём с собой — let’s + глагол: Let’s go to the park, а please делает просьбу вежливой: Help me, please.',
    ruleKk:'Біреуге бұйырғанда, өтінгенде не кеңес бергенде сөйлемді бірден етістіктен бастаймыз, you қойылмайды: Open the door. Тыйым салу үшін don’t + етістік: Don’t be late. Өзімізді қоса шақырғанда let’s + етістік айтамыз: Let’s go to the park, ал please өтінішті сыпайы етеді: Help me, please.',
    examples:[
      {en:'Open the door.', ru:'Открой дверь.', kk:'Есікті аш.'},
      {en:'Don’t touch that wire.', ru:'Не трогай этот провод.', kk:'Ана сымға тиме.'},
      {en:'Please open the window.', ru:'Открой, пожалуйста, окно.', kk:'Өтінемін, терезені ашшы.'},
      {en:'Let’s not waste time.', ru:'Давай не будем терять время.', kk:'Уақытты босқа өткізбейік.'},
    ],
    words:[
      {en:'sit down', ru:'сесть', kk:'отыру', ex:'Please sit down.', g:'act'},
      {en:'touch', ru:'трогать', kk:'тию, ұстау', ex:'Don’t touch that!', g:'act'},
      {en:'careful', ru:'осторожный', kk:'абай, сақ', ex:'Be careful!', g:'sign'},
      {en:'quiet', ru:'тихий', kk:'тыныш', ex:'Be quiet!', g:'sign'},
      {en:'worry', ru:'волноваться', kk:'уайымдау', ex:'Don’t worry.', g:'act'},
      {en:'shout', ru:'кричать', kk:'айғайлау', ex:'Don’t shout in the library!', g:'act'},
      {en:'traffic lights', ru:'светофор', kk:'бағдаршам', ex:'Turn left at the traffic lights.', g:'thing'},
      {en:'salt', ru:'соль', kk:'тұз', ex:'Pass the salt, please.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'___ the door, please. It’s cold.', opts:['Close', 'Closes', 'Closing'], a:0,
       why:'Просьбу начинаем с глагола в начальной форме, без you и без -s: Close the door.',
       whyKk:'Өтініш етістіктің бастапқы түрінен басталады, you да, -s те керек емес: Close the door.'},
      {t:'choice', q:'___ run in the classroom!', opts:['Not', 'Don’t', 'No'], a:1,
       why:'Запрещаем — don’t + глагол: Don’t run. Not и no сами перед глаголом не встают.',
       whyKk:'Тыйым салғанда don’t + етістік: Don’t run. Not пен no етістіктің алдында жалғыз тұрмайды.'},
      {t:'choice', q:'It’s a nice day. Let’s ___ to the park.', opts:['to go', 'going', 'go'], a:2,
       why:'После let’s глагол идёт без to: Let’s go. Let’s to go — частая ошибка.',
       whyKk:'Let’s-тен кейін етістік to-сыз келеді: Let’s go. Let’s to go деу — жиі кездесетін қате.'},
      {t:'choice', q:'The lesson starts at nine. Don’t ___ late.', opts:['be', 'are', 'to be'], a:0,
       why:'После don’t глагол стоит в начальной форме, а у am, is, are это be: Don’t be late.',
       whyKk:'Don’t-тан кейін етістік бастапқы түрінде тұрады, ал am, is, are-дың бастапқы түрі — be: Don’t be late.'},
      {t:'order', ru:'Не трогай этот провод.', kk:'Ана сымға тиме.',
       words:['Don’t', 'touch', 'that', 'wire'], a:'Don’t touch that wire'},
      {t:'order', ru:'Давай пойдём в кино.', kk:'Кеттік, киноға барайық.',
       words:['Let’s', 'go', 'to', 'the', 'cinema'], a:'Let’s go to the cinema'},
    ]
  },


  /* Pre-Intermediate · Junior. Материал снят с двух роликов урока: теория
     дала правило и примеры со слайдов, практика — слова и задания. */
  p1: {
    title:'Past Simple', subtitle:'Рассказать, что было вчера', subtitleKk:'Кеше не болғанын айту',
    rule:'Говоришь о том, что случилось и закончилось в прошлом, — бери вторую форму глагола: к правильным глаголам добавь -ed (watch → watched), неправильные выучи по таблице (go → went, see → saw). Время обычно названо: yesterday, last week, three days ago. В отрицании и вопросе нужен did, а глагол возвращается в начальную форму: I didn’t go home early. Did you go home early?',
    ruleKk:'Өткенде басталып, өткенде бітіп қойған іс туралы айтқанда етістіктің екінші формасын аламыз: ережелі етістікке -ed жалғанады (watch → watched), ережесіз етістіктерді кестеден жаттаймыз (go → went, see → saw). Уақыты әдетте айтылады: yesterday, last week, three days ago. Теріс сөйлем мен сұрақта did келеді де, етістік бастапқы формасына оралады: I didn’t go home early. Did you go home early?',
    examples:[
      {en:'I visited my grandmother last weekend.', ru:'В прошлые выходные я ездил к бабушке.', kk:'Өткен демалыста әжеме бардым.'},
      {en:'We went to the park an hour ago.', ru:'Час назад мы ходили в парк.', kk:'Біз бір сағат бұрын саябаққа бардық.'},
      {en:'I didn’t watch the news.', ru:'Я не смотрел новости.', kk:'Мен жаңалықтарды көрген жоқпын.'},
      {en:'Did they finish their work?', ru:'Они закончили работу?', kk:'Олар жұмыстарын аяқтады ма?'},
    ],
    words:[
      {en:'wake up', ru:'проснуться', kk:'ояну', ex:'I woke up at 7 AM.', g:'act'},
      {en:'drink', ru:'пить, выпить', kk:'ішу', ex:'I quickly drank a coffee.', g:'act'},
      {en:'drive', ru:'ехать (за рулём)', kk:'көлік жүргізу, көлікпен бару', ex:'I drove to the office.', g:'act'},
      {en:'give', ru:'дать', kk:'беру', ex:'My boss gave me a new project.', g:'act'},
      {en:'visit', ru:'навестить, съездить', kk:'барып келу, қонаққа бару', ex:'I visited my grandparents.', g:'act'},
      {en:'buy', ru:'купить', kk:'сатып алу', ex:'I bought a new phone last month.', g:'act'},
      {en:'yesterday', ru:'вчера', kk:'кеше', ex:'I went to the cinema yesterday.', g:'time'},
      {en:'ago', ru:'назад (тому)', kk:'бұрын', ex:'We went to the park an hour ago.', g:'time'},
    ],
    tasks:[
      {t:'choice', q:'Yesterday I ___ to the office.', opts:['drives', 'drove', 'drived'], a:1,
       why:'Yesterday — уже прошлое, значит нужна вторая форма. Drive — неправильный глагол, его прошедшее — drove, а drived не бывает.',
       whyKk:'Yesterday — өткен уақыт, сондықтан екінші форма керек. Drive — ережесіз етістік, өткен шағы drove, ал drived деген сөз жоқ.'},
      {t:'choice', q:'She didn’t ___ her homework.', opts:['finish', 'finished', 'finishes'], a:0,
       why:'После didn’t глагол стоит в начальной форме. Прошлое уже показало did, второй раз -ed не нужен.',
       whyKk:'didn’t-тен кейін етістік бастапқы формада тұрады. Өткен шақты did көрсетіп тұр, -ed екінші рет керек емес.'},
      {t:'choice', q:'Did you ___ the new movie?', opts:['saw', 'seen', 'see'], a:2,
       why:'В вопросе с did глагол возвращается в начальную форму: Did you see. Did you saw — частая ошибка.',
       whyKk:'did бар сұрақта етістік бастапқы формаға оралады: Did you see. Did you saw — жиі кездесетін қате.'},
      {t:'choice', q:'I ___ a new phone last month.', opts:['bought', 'buyed', 'buys'], a:0,
       why:'Last month — прошлое. Buy — неправильный глагол: buy → bought, а buyed — ошибка.',
       whyKk:'Last month — өткен уақыт. Buy — ережесіз етістік: buy → bought, ал buyed — қате.'},
      {t:'order', ru:'Начальник дал мне новый проект.', kk:'Бастығым маған жаңа жоба берді.',
       words:['My', 'boss', 'gave', 'me', 'a', 'new', 'project'], a:'My boss gave me a new project'},
      {t:'order', ru:'Тебе понравился концерт?', kk:'Концерт саған ұнады ма?',
       words:['Did', 'you', 'enjoy', 'the', 'concert'], a:'Did you enjoy the concert'},
    ]
  },

  p2: {
    title:'Past Continuous', subtitle:'Что происходило в тот момент', subtitleKk:'Сол сәтте не болып жатты',
    rule:'Хочешь сказать, что действие шло в какой-то момент в прошлом, — бери was или were + глагол с -ing: At 6 PM yesterday, I was cooking dinner. Was ставим с I, he, she, it, were — с you, we, they. Если долгое действие прервало короткое, короткое идёт в Past Simple: I was sleeping when the phone rang.',
    ruleKk:'Өткендегі белгілі бір сәтте жалғасып жатқан әрекетті айтқанда was не were + -ing жалғанған етістік аламыз: At 6 PM yesterday, I was cooking dinner. Was I, he, she, it-пен, ал were you, we, they-мен келеді. Созылып жатқан әрекетті қысқа әрекет бөліп кетсе, қысқасы Past Simple-да тұрады: I was sleeping when the phone rang.',
    examples:[
      {en:'At 6 PM yesterday, I was cooking dinner.', ru:'Вчера в шесть вечера я готовил ужин.', kk:'Кеше кешкі сағат 6-да мен кешкі ас пісіріп жатқанмын.'},
      {en:'My sister was listening to music while I was studying.', ru:'Пока я занимался, сестра слушала музыку.', kk:'Мен сабақ оқып жатқанда, әпкем музыка тыңдап жатты.'},
      {en:'The lights went out while we were watching the movie.', ru:'Пока мы смотрели фильм, погас свет.', kk:'Біз фильм көріп жатқанда, жарық сөніп қалды.'},
      {en:'Were they having fun at the party?', ru:'Им было весело на вечеринке?', kk:'Олар кеште көңіл көтеріп жатты ма?'},
    ],
    words:[
      {en:'watch', ru:'смотреть', kk:'көру, тамашалау', ex:'Yesterday at 7 PM my brother was watching a football match on TV.', g:'act'},
      {en:'cook', ru:'готовить (еду)', kk:'тамақ пісіру, әзірлеу', ex:'I was cooking dinner for the whole family.', g:'act'},
      {en:'sleep', ru:'спать', kk:'ұйықтау', ex:'I was sleeping when the phone rang.', g:'act'},
      {en:'ring', ru:'звонить (о телефоне)', kk:'шылдырлау, қоңырау соғылу', ex:'The phone rang at midnight.', g:'act'},
      {en:'walk', ru:'гулять, идти пешком', kk:'серуендеу, жаяу жүру', ex:'They were walking in the park when they saw a dog.', g:'act'},
      {en:'relax', ru:'отдыхать', kk:'демалу', ex:'I wasn’t working, I was relaxing at home.', g:'act'},
      {en:'while', ru:'пока, в то время как', kk:'…ып жатқанда', ex:'My sister was listening to music while I was studying.', g:'word'},
      {en:'suddenly', ru:'вдруг, внезапно', kk:'кенеттен', ex:'They suddenly saw a dog.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'Yesterday at 7 PM my brother ___ a football match on TV.', opts:['is watching', 'was watching', 'were watching'], a:1,
       why:'Речь о процессе в момент прошлого — was + -ing. Brother — это he, поэтому was, а не were.',
       whyKk:'Өткендегі бір сәтте жүріп жатқан процесс — was + -ing. Brother — ол (he), сондықтан were емес, was.'},
      {t:'choice', q:'I was sleeping when the phone ___.', opts:['rang', 'ring', 'ringed'], a:0,
       why:'Звонок — короткое действие, он прервал сон, значит Past Simple. Ring — неправильный глагол: ring → rang.',
       whyKk:'Телефонның шылдырлауы — қысқа әрекет, ол ұйқыны бөліп кетті, сондықтан Past Simple. Ring — ережесіз етістік: ring → rang.'},
      {t:'choice', q:'They ___ walking in the park when they saw a dog.', opts:['was', 'are', 'were'], a:2,
       why:'С they ставим were. Was идёт с I, he, she, it, а are — настоящее время, хотя история уже в прошлом.',
       whyKk:'They-мен were қойылады. Was I, he, she, it-пен келеді, ал are — осы шақ, бірақ оқиға өткенде болды.'},
      {t:'choice', q:'What ___ she doing when you came?', opts:['was', 'were', 'did'], a:0,
       why:'Спрашиваем о процессе в прошлом: was + she + -ing. Did перед глаголом с -ing не ставят.',
       whyKk:'Өткендегі процесс туралы сұраймыз: was + she + -ing. -ing жалғанған етістіктің алдына did қойылмайды.'},
      {t:'order', ru:'Она не слушала радио.', kk:'Ол радио тыңдап жатқан жоқ еді.',
       words:['She', 'wasn’t', 'listening', 'to', 'the', 'radio'], a:'She wasn’t listening to the radio'},
      {t:'order', ru:'Ты спал, когда я позвонил?', kk:'Мен қоңырау шалғанда ұйықтап жатыр ма едің?',
       words:['Were', 'you', 'sleeping', 'when', 'I', 'called'], a:'Were you sleeping when I called'},
    ]
  },

  p3: {
    title:'Used To', subtitle:'Как было раньше, а теперь нет', subtitleKk:'Бұрын солай болатын, қазір олай емес',
    rule:'Used to + глагол в начальной форме говорит о привычке или положении дел, которых больше нет: I used to eat fast food every day — раньше ел, сейчас не ем. В отрицании и вопросе нужен did, и used теряет -d: I didn’t use to like seafood. Did you use to wear glasses? Про одно событие used to не говорят: I visited Paris last year.',
    ruleKk:'Used to + бастапқы формадағы етістік бұрын болған, қазір жоқ әдетті не жағдайды айтады: I used to eat fast food every day — бұрын күнде жейтінмін, қазір жемеймін. Теріс сөйлем мен сұрақта did келеді де, used сөзі -d әрпін жоғалтады: I didn’t use to like seafood. Did you use to wear glasses? Бір рет болған іске used to қолданылмайды: I visited Paris last year.',
    examples:[
      {en:'She used to have long hair.', ru:'Раньше у неё были длинные волосы.', kk:'Оның бұрын шашы ұзын болатын.'},
      {en:'There used to be a big library in my town.', ru:'Раньше в моём городе была большая библиотека.', kk:'Менің қаламда бұрын үлкен кітапхана болатын.'},
      {en:'My brother didn’t use to like vegetables, but now he eats them.', ru:'Раньше брат не любил овощи, а теперь ест.', kk:'Ағам бұрын көкөністерді ұнатпайтын, ал қазір жейді.'},
      {en:'What did you use to do on the weekends?', ru:'Чем ты раньше занимался по выходным?', kk:'Сен бұрын демалыс күндері не істейтін едің?'},
    ],
    words:[
      {en:'child', ru:'ребёнок', kk:'бала', ex:'When I was a child, I used to wake up very early.', g:'thing'},
      {en:'ride', ru:'ездить (на велосипеде)', kk:'(велосипед) тебу, мініп бару', ex:'I used to ride my bike to school every day.', g:'act'},
      {en:'live', ru:'жить', kk:'тұру', ex:'My best friend used to live next door.', g:'act'},
      {en:'move', ru:'переехать', kk:'көшу', ex:'She moved last year.', g:'act'},
      {en:'supermarket', ru:'супермаркет', kk:'супермаркет', ex:'There used to be a big supermarket here, but now it’s a bank.', g:'thing'},
      {en:'seafood', ru:'морепродукты', kk:'теңіз өнімдері', ex:'I didn’t use to like seafood, but now I love it.', g:'thing'},
      {en:'glasses', ru:'очки', kk:'көзілдірік', ex:'Did you use to wear glasses?', g:'thing'},
      {en:'seaside', ru:'морское побережье', kk:'теңіз жағасы', ex:'We used to go to the seaside.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'When I was a child, I used to ___ up very early.', opts:['woke', 'wake', 'waking'], a:1,
       why:'После used to глагол всегда в начальной форме: used to wake up, used to play, used to ride.',
       whyKk:'used to-дан кейін етістік әрқашан бастапқы формада тұрады: used to wake up, used to play, used to ride.'},
      {t:'choice', q:'My brother didn’t ___ to like vegetables.', opts:['use', 'used', 'uses'], a:0,
       why:'Прошлое уже показал did, поэтому в отрицании пишем use без -d: didn’t use to.',
       whyKk:'Өткен шақты did көрсетіп тұр, сондықтан теріс сөйлемде -d-сыз жазамыз: didn’t use to.'},
      {t:'choice', q:'Where ___ your family use to go for holidays?', opts:['was', 'do', 'did'], a:2,
       why:'Вопрос с used to строится через did, как в Past Simple: Where did your family use to go?',
       whyKk:'used to-мен сұрақ Past Simple-дағыдай did арқылы құрылады: Where did your family use to go?'},
      {t:'choice', q:'I ___ Paris last year.', opts:['used to visit', 'visited', 'use to visit'], a:1,
       why:'Last year — одна поездка, а не привычка. Про один раз говорят в Past Simple: I visited Paris last year.',
       whyKk:'Last year — бір реттік сапар, әдет емес. Бір рет болған іс Past Simple-мен айтылады: I visited Paris last year.'},
      {t:'order', ru:'Раньше здесь был большой супермаркет.', kk:'Бұрын мұнда үлкен супермаркет болатын.',
       words:['There', 'used', 'to', 'be', 'a', 'big', 'supermarket', 'here'], a:'There used to be a big supermarket here'},
      {t:'order', ru:'Ты раньше носил очки?', kk:'Сен бұрын көзілдірік киетін бе едің?',
       words:['Did', 'you', 'use', 'to', 'wear', 'glasses'], a:'Did you use to wear glasses'},
    ]
  },

  p4: {
    title:'Future Simple', subtitle:'Решить, пообещать, предсказать', subtitleKk:'Шешім, уәде, болжам',
    rule:'Решаешь прямо в разговоре, обещаешь или говоришь, что, по-твоему, будет, — бери will + глагол в начальной форме: Oh, I will close the window. I think our team will win. Will одно для всех, отрицание — won’t (will not). После when и if will не ставят: I will call you when I arrive.',
    ruleKk:'Сөйлесіп тұрып шешім қабылдағанда, уәде бергенде не болжам айтқанда will + бастапқы формадағы етістік аламыз: Oh, I will close the window. I think our team will win. Will барлық жақпен бірдей қолданылады, болымсызы — won’t (will not). When мен if-тен кейін will қойылмайды: I will call you when I arrive.',
    examples:[
      {en:'I will help you with your bags.', ru:'Я помогу тебе с сумками.', kk:'Сөмкелеріңді көтеруге көмектесемін.'},
      {en:'I think our team will win the championship.', ru:'Думаю, наша команда выиграет чемпионат.', kk:'Менің ойымша, біздің команда чемпионатты жеңеді.'},
      {en:'He won’t finish the work on time.', ru:'Он не закончит работу вовремя.', kk:'Ол жұмысты уақытында бітірмейді.'},
      {en:'Will it snow tomorrow?', ru:'Завтра пойдёт снег?', kk:'Ертең қар жауа ма?'},
    ],
    words:[
      {en:'answer', ru:'ответить', kk:'жауап беру', ex:'Don’t worry, I will answer it.', g:'act'},
      {en:'bring', ru:'принести', kk:'әкелу', ex:'I will bring you a glass of water.', g:'act'},
      {en:'thirsty', ru:'хочется пить', kk:'шөлдеген, сусаған', ex:'I’m really thirsty.', g:'sign'},
      {en:'weather', ru:'погода', kk:'ауа райы', ex:'I think the weather will be sunny tomorrow.', g:'thing'},
      {en:'probably', ru:'наверное, скорее всего', kk:'бәлкім, мүмкін', ex:'He will probably pass the exam.', g:'word'},
      {en:'pass', ru:'сдать (экзамен)', kk:'(емтиханнан) өту', ex:'I hope I will pass the exam.', g:'act'},
      {en:'promise', ru:'обещать', kk:'уәде беру', ex:'I will help you with your homework, I promise.', g:'act'},
      {en:'forget', ru:'забыть', kk:'ұмыту', ex:'I won’t forget your birthday again.', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'"I’m really thirsty." — "Wait, I ___ bring you a glass of water."', opts:['will', 'am', 'was'], a:0,
       why:'Решение принято прямо сейчас, в ответ на слова друга, — значит will + глагол.',
       whyKk:'Шешім дәл қазір, досының сөзіне жауап ретінде қабылданды — сондықтан will + етістік.'},
      {t:'choice', q:'I will call you when I ___.', opts:['will arrive', 'arrive', 'arrived'], a:1,
       why:'После when will не ставят, даже если речь о будущем. Нужен Present Simple: when I arrive.',
       whyKk:'when-нен кейін will қойылмайды, әрекет болашақта болса да. Present Simple керек: when I arrive.'},
      {t:'choice', q:'I ___ forget your birthday again, I promise.', opts:['don’t', 'didn’t', 'won’t'], a:2,
       why:'Это обещание на будущее, да ещё с отрицанием, — won’t, то есть will not.',
       whyKk:'Бұл — болашаққа берілген уәде, оның үстіне болымсыз, сондықтан won’t, яғни will not.'},
      {t:'choice', q:'I think the weather ___ sunny tomorrow.', opts:['is being', 'will be', 'was'], a:1,
       why:'I think и tomorrow — это прогноз на завтра, значит will be. После will глагол без окончаний.',
       whyKk:'I think пен tomorrow — ертеңге жасалған болжам, сондықтан will be. will-ден кейін етістік бастапқы формада тұрады.'},
      {t:'order', ru:'Закроешь окно?', kk:'Терезені жабасың ба?',
       words:['Will', 'you', 'close', 'the', 'window'], a:'Will you close the window'},
      {t:'order', ru:'Не думаю, что они придут вовремя.', kk:'Менің ойымша, олар уақытында келмейді.',
       words:['I', 'don’t', 'think', 'they', 'will', 'come', 'on', 'time'], a:'I don’t think they will come on time'},
    ]
  },

  p5: {
    title:'Going To', subtitle:'Планы и то, что вот-вот случится', subtitleKk:'Жоспар және болайын деп тұрған нәрсе',
    rule:'Решил заранее и уже готовишься — говори am, is или are + going to + глагол: I am going to buy a new laptop next month. Так же говорят, когда видят признак, что сейчас что-то случится: Look at those black clouds. It is going to rain. Not ставят после am, is, are: They aren’t going to help us.',
    ruleKk:'Бір нәрсені алдын ала шешіп, оған дайындалып жүрсең, am, is немесе are + going to + етістік қолданасың: I am going to buy a new laptop next month. Дәл қазір көзге көрініп тұрған белгіге сүйеніп болжам айтқанда да осылай айтамыз: Look at those black clouds. It is going to rain. Болымсыз сөйлемде not сөзі am, is, are-дан кейін тұрады: They aren’t going to help us.',
    examples:[
      {en:'I am going to buy a new laptop next month.', ru:'В следующем месяце я собираюсь купить новый ноутбук.', kk:'Мен келесі айда жаңа ноутбук сатып алмақшымын.'},
      {en:'Look at those black clouds. It is going to rain.', ru:'Посмотри на те чёрные тучи. Сейчас пойдёт дождь.', kk:'Ана қара бұлттарға қара. Жаңбыр жауғалы тұр.'},
      {en:'I am not going to quit my job.', ru:'Я не собираюсь уходить с работы.', kk:'Мен жұмысымнан кетпекші емеспін.'},
      {en:'Is he going to study abroad?', ru:'Он собирается учиться за границей?', kk:'Ол шетелде оқымақшы ма?'},
    ],
    words:[
      {en:'buy', ru:'купить', kk:'сатып алу', ex:'Are you going to buy a new laptop?', g:'act'},
      {en:'move', ru:'переехать', kk:'көшу', ex:'They are going to move to a bigger house in spring.', g:'act'},
      {en:'cloud', ru:'туча, облако', kk:'бұлт', ex:'Look at those black clouds.', g:'thing'},
      {en:'fall', ru:'упасть', kk:'құлау', ex:'Watch out. The baby is going to fall.', g:'act'},
      {en:'accident', ru:'авария', kk:'апат, авария', ex:'He is driving too fast. He is going to have an accident.', g:'thing'},
      {en:'abroad', ru:'за границей, за границу', kk:'шетелде, шетелге', ex:'Is he going to study abroad?', g:'word'},
      {en:'discount', ru:'скидка', kk:'жеңілдік', ex:'Why aren’t you going to wait for a discount?', g:'thing'},
      {en:'next month', ru:'в следующем месяце', kk:'келесі айда', ex:'I am going to buy a new laptop next month.', g:'time'},
    ],
    tasks:[
      {t:'choice', q:'___ he going to study abroad?', opts:['Is', 'Does', 'Are'], a:0,
       why:'В вопросе is встаёт перед he. Does с going to не ставят, а are нужен для you, we, they.',
       whyKk:'Сұрақта is сөйлемнің басына, he-ден бұрын шығады. Going to-мен does қолданылмайды, ал are you, we, they-мен келеді.'},
      {t:'choice', q:'They ___ going to help us. They are too busy.', opts:['isn’t', 'don’t', 'aren’t'], a:2,
       why:'С they нужен are, в отрицании — aren’t. Don’t с going to не используют.',
       whyKk:'they-мен are тұрады, болымсыз түрі — aren’t. Going to-мен don’t қолданылмайды.'},
      {t:'choice', q:'Look at those black clouds. It is going ___.', opts:['rain', 'to rain', 'raining'], a:1,
       why:'После going всегда идёт to, а за ним глагол в начальной форме: going to rain. Тучи уже видно, значит, дождь вот-вот начнётся.',
       whyKk:'going сөзінен кейін әрдайым to, одан соң етістіктің бастапқы формасы тұрады: going to rain. Қара бұлт көрініп тұр, демек жаңбыр жауғалы тұр.'},
      {t:'choice', q:'Are you going to buy a new laptop? — Yes, I ___.', opts:['do', 'am', 'going'], a:1,
       why:'Вопрос начался с are, а в коротком ответе с I ставим am: Yes, I am. Do отвечает только на вопрос с do.',
       whyKk:'Сұрақ are-мен басталды, ал I-мен келетін қысқа жауапта am тұрады: Yes, I am. Do тек do-мен қойылған сұраққа жауап береді.'},
      {t:'order', ru:'Ты собираешься ждать скидку?', kk:'Жеңілдікті күтпекшісің бе?',
       words:['Are', 'you', 'going', 'to', 'wait', 'for', 'a', 'discount'], a:'Are you going to wait for a discount'},
      {t:'order', ru:'Он сейчас попадёт в аварию.', kk:'Ол апатқа ұшырағалы тұр.',
       words:['He', 'is', 'going', 'to', 'have', 'an', 'accident'], a:'He is going to have an accident'},
    ]
  },

  p6: {
    title:'Future: Present Continuous', subtitle:'Встречи, о которых уже договорились', subtitleKk:'Алдын ала келісілген кездесулер',
    rule:'Если уже договорился о встрече, купил билет или записался, говори о будущем через am, is, are + глагол с -ing: I am meeting my doctor tomorrow morning. Рядом обязательно ставь слово о времени: tomorrow, next week, on Friday, at 7 PM. Без него фраза значит «прямо сейчас»: I am working now — работаю сейчас, I am working tomorrow — работаю завтра.',
    ruleKk:'Біреумен кездесуге келісіп қойсаң, билет алсаң немесе жазылып қойсаң, болашақты am, is, are + -ing жалғанған етістікпен айтасың: I am meeting my doctor tomorrow morning. Қасына міндетті түрде уақытты білдіретін сөз қос: tomorrow, next week, on Friday, at 7 PM. Ол сөз болмаса, сөйлем «дәл қазір» деген мағына береді: I am working now — қазір жұмыс істеп жатырмын, I am working tomorrow — ертең жұмыс істеймін.',
    examples:[
      {en:'I am meeting my doctor tomorrow morning.', ru:'Завтра утром у меня встреча с врачом.', kk:'Ертең таңертең дәрігеріммен кездесемін.'},
      {en:'They are flying to Dubai next Sunday.', ru:'В следующее воскресенье они летят в Дубай.', kk:'Олар келесі жексенбіде Дубайға ұшады.'},
      {en:'We aren’t going to the theatre tonight.', ru:'Сегодня вечером мы не идём в театр.', kk:'Біз бүгін кешке театрға бармаймыз.'},
      {en:'Is she coming to the party next week?', ru:'Она придёт на вечеринку на следующей неделе?', kk:'Ол келесі аптадағы кешке келе ме?'},
    ],
    words:[
      {en:'meet', ru:'встречаться', kk:'кездесу', ex:'I am meeting Sarah at 7 PM.', g:'act'},
      {en:'fly', ru:'лететь', kk:'ұшу', ex:'They are flying to Dubai next Sunday.', g:'act'},
      {en:'leave', ru:'уезжать', kk:'кету', ex:'They are leaving tomorrow morning.', g:'act'},
      {en:'book', ru:'бронировать', kk:'брондау', ex:'The tickets are already booked.', g:'act'},
      {en:'ticket', ru:'билет', kk:'билет', ex:'We have the tickets for Friday.', g:'thing'},
      {en:'interview', ru:'собеседование', kk:'сұхбат', ex:'He is having an interview on Tuesday.', g:'thing'},
      {en:'museum', ru:'музей', kk:'мұражай', ex:'Our class is visiting the museum next Tuesday.', g:'thing'},
      {en:'tonight', ru:'сегодня вечером', kk:'бүгін кешке', ex:'What are you doing tonight?', g:'time'},
    ],
    tasks:[
      {t:'choice', q:'Ali ___ an interview on Tuesday.', opts:['is having', 'are having', 'have'], a:0,
       why:'Собеседование уже назначено, поэтому Present Continuous. Про одного человека говорим is having, а are идёт с you, we, they.',
       whyKk:'Сұхбат белгіленіп қойған, сондықтан Present Continuous. Бір адам туралы is having айтамыз, ал are you, we, they-мен келеді.'},
      {t:'choice', q:'I can’t come on Friday. I ___ my doctor at 10 AM.', opts:['meets', 'am meeting', 'meeting'], a:1,
       why:'Время у врача уже назначено — am meeting. Meets говорят про he и she, а meeting без am не работает.',
       whyKk:'Дәрігерге бару уақыты келісіліп қойған — am meeting. Meets he, she-мен айтылады, ал am-сіз meeting жалғыз тұрмайды.'},
      {t:'choice', q:'We ___ going to the theatre tonight. Our plans changed.', opts:['don’t', 'isn’t', 'aren’t'], a:2,
       why:'Собирались пойти, но планы поменялись. С we ставим are, в отрицании — aren’t. Don’t рядом с -ing не ставят.',
       whyKk:'Баруды жоспарлаған едік, бірақ жоспар өзгерді. we-мен are тұрады, болымсызы — aren’t. -ing формасымен don’t қолданылмайды.'},
      {t:'choice', q:'Is she ___ to the party next week?', opts:['coming', 'come', 'comes'], a:0,
       why:'Вопрос начался с is, значит, дальше глагол с -ing: Is she coming. Come и comes после is не ставят.',
       whyKk:'Сұрақ is-пен басталды, демек етістік -ing формасында тұрады: Is she coming. is-тен кейін come не comes қойылмайды.'},
      {t:'order', ru:'Когда они уезжают в Лондон?', kk:'Олар Лондонға қашан кетеді?',
       words:['When', 'are', 'they', 'leaving', 'for', 'London'], a:'When are they leaving for London'},
      {t:'order', ru:'Что ты делаешь в субботу?', kk:'Сенбі күні не істейсің?',
       words:['What', 'are', 'you', 'doing', 'on', 'Saturday'], a:'What are you doing on Saturday'},
    ]
  },

  p7: {
    title:'Have To and Must', subtitle:'Надо, нельзя и не обязательно', subtitleKk:'Керек, болмайды және міндетті емес',
    rule:'Must говорят, когда человек сам решил, что так надо: I must call my mother. It’s her birthday. Have to (с he, she, it — has to, в прошлом — had to) говорят, когда требует кто-то другой: работа, школа, закон: She has to wear a uniform at school. Mustn’t значит «нельзя», а don’t have to — «можно не делать»: You don’t have to come if you are tired.',
    ruleKk:'Must-ты адам бір нәрсені өзі қажет деп шешкенде айтады: I must call my mother. It’s her birthday. Have to (he, she, it-пен has to, өткен шақта had to) басқа біреу талап еткенде қолданылады: жұмыс, мектеп, заң: She has to wear a uniform at school. Mustn’t «болмайды, тыйым салынған» дегенді білдіреді, ал don’t have to — «істемесең де болады»: You don’t have to come if you are tired.',
    examples:[
      {en:'At my job I have to wear a uniform.', ru:'На работе мне приходится носить форму.', kk:'Жұмысымда униформа киюге мәжбүрмін.'},
      {en:'I must finish this report today.', ru:'Мне надо закончить этот отчёт сегодня.', kk:'Бұл есепті бүгін аяқтауым керек.'},
      {en:'You mustn’t use your phone while driving.', ru:'За рулём нельзя пользоваться телефоном.', kk:'Көлік жүргізіп келе жатқанда телефон қолдануға болмайды.'},
      {en:'Yesterday I had to work until 8 PM.', ru:'Вчера мне пришлось работать до восьми вечера.', kk:'Кеше кешкі сегізге дейін жұмыс істеуге мәжбүр болдым.'},
    ],
    words:[
      {en:'wear', ru:'носить (одежду)', kk:'кию', ex:'Visitors must wear a face mask.', g:'act'},
      {en:'uniform', ru:'форма', kk:'форма, униформа', ex:'She has to wear a uniform at school.', g:'thing'},
      {en:'rule', ru:'правило', kk:'ереже', ex:'You are at work. What are the rules?', g:'thing'},
      {en:'report', ru:'отчёт', kk:'есеп', ex:'I must finish this report today.', g:'thing'},
      {en:'late', ru:'опоздавший, поздно', kk:'кеш, кешігіп', ex:'You mustn’t be late for the exam.', g:'sign'},
      {en:'smoke', ru:'курить', kk:'шылым шегу', ex:'You mustn’t smoke here.', g:'act'},
      {en:'sick', ru:'больной', kk:'ауырып тұрған, науқас', ex:'She doesn’t have to come to the office because she is sick.', g:'sign'},
      {en:'order', ru:'заказать', kk:'тапсырыс беру', ex:'You don’t have to cook tonight. We can order pizza.', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'She ___ wear a uniform at school. It’s a school rule.', opts:['has to', 'have to', 'must to'], a:0,
       why:'Правило придумала школа, поэтому have to, а с she он становится has to. Must to не бывает: после must глагол идёт сразу.',
       whyKk:'Бұл ережені мектеп қойған, сондықтан have to керек, ал she-мен ол has to болады. Must to деген жоқ: must-тан кейін етістік бірден тұрады.'},
      {t:'choice', q:'You ___ use your phone while driving. It’s dangerous.', opts:['don’t have to', 'mustn’t', 'haven’t to'], a:1,
       why:'Это запрет: опасно, значит, нельзя — mustn’t. Don’t have to значило бы «можешь не пользоваться, как хочешь».',
       whyKk:'Бұл — тыйым: қауіпті, сондықтан болмайды — mustn’t. Don’t have to «қолданбасаң да болады, өзің біл» деген мағына берер еді.'},
      {t:'choice', q:'Yesterday I ___ work until 8 PM.', opts:['must', 'have to', 'had to'], a:2,
       why:'Речь про вчера, а у must нет прошедшего времени. В прошлом говорим had to.',
       whyKk:'Кеше болған іс туралы айтып тұрмыз, ал must-тың өткен шағы жоқ. Өткен шақта had to айтамыз.'},
      {t:'choice', q:'You ___ cook tonight. We can order pizza.', opts:['mustn’t', 'don’t have to', 'must'], a:1,
       why:'Готовить никто не запрещает, просто не нужно: закажем пиццу. «Можно не делать» — don’t have to.',
       whyKk:'Тамақ істеуге ешкім тыйым салмайды, жай қажеті жоқ: пиццаға тапсырыс береміз. «Істемесең де болады» — don’t have to.'},
      {t:'order', ru:'Нам пришлось взять такси.', kk:'Біз такси алуға мәжбүр болдық.',
       words:['We', 'had', 'to', 'take', 'a', 'taxi'], a:'We had to take a taxi'},
      {t:'order', ru:'Ей не обязательно приходить в офис.', kk:'Оның кеңсеге келуі міндетті емес.',
       words:['She', 'doesn’t', 'have', 'to', 'come', 'to', 'the', 'office'], a:'She doesn’t have to come to the office'},
    ]
  },

  p8: {
    title:'Should and Shouldn’t', subtitle:'Советовать: стоит и не стоит', subtitleKk:'Кеңес беру: істеген жөн, істемеген жөн',
    rule:'Should — дружеский совет, никто не заставляет: You should take a break. Глагол после should стоит в начальной форме, а «не стоит» — shouldn’t: You shouldn’t drink coffee after 5 PM. Ещё should говорят, когда чего-то ждут по расписанию или по логике: The train should arrive in five minutes.',
    ruleKk:'Should — достық кеңес, ешкім мәжбүрлемейді: You should take a break. Should-тан кейін етістік бастапқы формада тұрады, ал «істемеген жөн» дегенді shouldn’t білдіреді: You shouldn’t drink coffee after 5 PM. Бір нәрсе кесте не логика бойынша болуы тиіс болса да, should айтылады: The train should arrive in five minutes.',
    examples:[
      {en:'You should study for the exam.', ru:'Тебе стоит подготовиться к экзамену.', kk:'Емтиханға дайындалғаның жөн.'},
      {en:'You shouldn’t go to bed so late.', ru:'Не стоит ложиться так поздно.', kk:'Бұлай кеш жатпағаның жөн.'},
      {en:'What should we do now?', ru:'Что нам теперь делать?', kk:'Енді не істегеніміз жөн?'},
      {en:'The train should arrive in five minutes.', ru:'Поезд должен прийти через пять минут.', kk:'Пойыз бес минуттан кейін келуі тиіс.'},
    ],
    words:[
      {en:'advice', ru:'совет', kk:'кеңес', ex:'Your friend feels bad. What advice can you give?', g:'thing'},
      {en:'headache', ru:'головная боль', kk:'бас ауруы', ex:'I have a terrible headache.', g:'thing'},
      {en:'break', ru:'перерыв', kk:'үзіліс', ex:'You should take a break and drink some water.', g:'thing'},
      {en:'apologize', ru:'извиниться', kk:'кешірім сұрау', ex:'Should I apologize to him?', g:'act'},
      {en:'worry', ru:'переживать', kk:'уайымдау', ex:'He shouldn’t worry about small things.', g:'act'},
      {en:'save', ru:'копить', kk:'жинау', ex:'You should save 10% of your salary every month.', g:'act'},
      {en:'spend', ru:'тратить', kk:'жұмсау', ex:'You shouldn’t spend money on unnecessary things.', g:'act'},
      {en:'on time', ru:'вовремя', kk:'уақытында', ex:'Students should arrive on time.', g:'time'},
    ],
    tasks:[
      {t:'choice', q:'You look tired. You should ___ to bed early.', opts:['to go', 'going', 'go'], a:2,
       why:'После should глагол идёт сразу, в начальной форме: should go. To и -ing здесь не нужны.',
       whyKk:'should-тан кейін етістік бірден, бастапқы формада тұрады: should go. Мұнда to да, -ing те керек емес.'},
      {t:'choice', q:'You ___ drink coffee after 5 PM. You won’t sleep well.', opts:['should', 'shouldn’t', 'don’t should'], a:1,
       why:'Кофе вечером мешает спать, значит, совет — не пить: shouldn’t. Don’t should не говорят.',
       whyKk:'Кешкі кофе ұйқыға кедергі келтіреді, сондықтан ішпеген жөн: shouldn’t. Don’t should деп айтылмайды.'},
      {t:'choice', q:'___ I apologize to him?', opts:['Should', 'Does', 'Am'], a:0,
       why:'Просим совета, и should встаёт перед I: Should I apologize? Does с I не бывает, а после am нужен был бы глагол с -ing.',
       whyKk:'Кеңес сұрап тұрмыз, сондықтан should I сөзінің алдына шығады: Should I apologize? Does I-мен келмейді, ал am-нен кейін -ing формасы керек болар еді.'},
      {t:'choice', q:'Dana looks ill. She ___ go to the doctor.', opts:['shoulds', 'is should', 'should'], a:2,
       why:'Should одинаковое для всех: I should, she should. Окончание -s и is к нему не добавляют.',
       whyKk:'Should барлық жақта бірдей: I should, she should. Оған -s жалғанбайды, is те қосылмайды.'},
      {t:'order', ru:'Тебе стоит составить подробный план.', kk:'Егжей-тегжейлі жоспар құрғаның жөн.',
       words:['You', 'should', 'make', 'a', 'detailed', 'plan'], a:'You should make a detailed plan'},
      {t:'order', ru:'Не стоит тратить деньги на ненужные вещи.', kk:'Қажетсіз заттарға ақша жұмсамағаның жөн.',
       words:['You', 'shouldn’t', 'spend', 'money', 'on', 'unnecessary', 'things'], a:'You shouldn’t spend money on unnecessary things'},
    ]
  },

  p9: {
    title:'Get Used To', subtitle:'Привыкать к новому', subtitleKk:'Жаңа нәрсеге үйрену',
    rule:'Get used to значит «привыкать»: так говорят, когда постепенно привыкаешь к новому или трудному, например к холодной погоде в Канаде. После to ставь существительное или глагол с -ing: I am getting used to driving on the left. Время меняет только get (getting, got, will get), а вопрос и отрицание строятся через do и did: Did you get used to the time difference?',
    ruleKk:'Get used to — «үйрену, бейімделу»: жаңа немесе қиын жағдайға бірте-бірте үйреніп жатқанда осылай айтамыз, мысалы, Канададағы суық ауа райына. to-дан кейін зат есім немесе -ing формасындағы етістік тұрады: I am getting used to driving on the left. Шақты тек get көрсетеді (getting, got, will get), ал сұраулы және болымсыз сөйлем do, did арқылы жасалады: Did you get used to the time difference?',
    examples:[
      {en:'I am getting used to the cold weather in Canada.', ru:'Я привыкаю к холодной погоде в Канаде.', kk:'Мен Канададағы суық ауа райына үйреніп жатырмын.'},
      {en:'We got used to the noise after a week.', ru:'Через неделю мы привыкли к шуму.', kk:'Бір аптадан кейін шуға үйреніп алдық.'},
      {en:'Have you got used to your new job yet?', ru:'Ты уже привык к новой работе?', kk:'Жаңа жұмысыңа үйрендің бе?'},
      {en:'My daughter didn’t get used to wearing glasses for many months.', ru:'Моя дочь много месяцев не могла привыкнуть к очкам.', kk:'Қызым көп ай бойы көзілдірік киюге үйрене алмады.'},
    ],
    words:[
      {en:'get used to', ru:'привыкать', kk:'үйрену, бейімделу', ex:'I am getting used to the cold weather in Canada.', g:'act'},
      {en:'move', ru:'переехать', kk:'көшу', ex:'When I moved here, I didn’t like the food at first.', g:'act'},
      {en:'get up', ru:'вставать (утром)', kk:'(ұйқыдан) тұру', ex:'I can’t get used to getting up so early for work.', g:'act'},
      {en:'adapt', ru:'приспособиться', kk:'бейімделу', ex:'It takes time to adapt.', g:'act'},
      {en:'noise', ru:'шум', kk:'шу', ex:'I got used to the noise in the evenings quite fast.', g:'thing'},
      {en:'schedule', ru:'расписание, график', kk:'кесте', ex:'I don’t think I will ever get used to this new schedule.', g:'thing'},
      {en:'spicy', ru:'острый (о еде)', kk:'ащы', ex:'I quickly got used to eating spicy meals.', g:'sign'},
      {en:'alone', ru:'один, в одиночку', kk:'жалғыз', ex:'It takes time to get used to living alone.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'I can’t get used to ___ up so early for work.', opts:['getting', 'get', 'got'], a:0,
       why:'В get used to слово to — предлог, а не частица перед глаголом. Поэтому дальше глагол с -ing: getting up.',
       whyKk:'get used to ішіндегі to — етістіктің бөлшегі емес, предлог. Сондықтан одан кейін етістік -ing формасында тұрады: getting up.'},
      {t:'choice', q:'When I moved here, I didn’t like the food at first, but I quickly ___ used to eating spicy meals.', opts:['get', 'got', 'getting'], a:1,
       why:'Всё случилось в прошлом (moved, didn’t like), и привыкание уже закончилось — got used to.',
       whyKk:'Оқиғаның бәрі өткенде болған (moved, didn’t like), үйрену процесі аяқталған — got used to.'},
      {t:'choice', q:'___ you get used to the time difference?', opts:['Was', 'Are', 'Did'], a:2,
       why:'Get — обычный глагол, и вопрос о прошлом с ним строится через did. Was и are рядом с get не ставят.',
       whyKk:'Get — толық мағыналы етістік, өткен шақтағы сұрақ онымен did арқылы жасалады. Was пен are get-пен бірге келмейді.'},
      {t:'choice', q:'I ___ live in a flat, but now I live in a house.', opts:['got used to', 'used to', 'am getting used to'], a:1,
       why:'Раньше жил в квартире, а теперь нет — это used to + глагол без -ing. После get used to стояло бы living, и смысл был бы «привыкаю».',
       whyKk:'Бұрын пәтерде тұрған, қазір тұрмайды — бұл used to + -ing-сіз етістік. Get used to болса, одан кейін living тұрып, «үйреніп жатырмын» деген мағына шығар еді.'},
      {t:'order', ru:'Я привыкаю к холодной погоде.', kk:'Мен суық ауа райына үйреніп жатырмын.',
       words:['I', 'am', 'getting', 'used', 'to', 'the', 'cold', 'weather'], a:'I am getting used to the cold weather'},
      {t:'order', ru:'Моя дочь так и не привыкла носить очки.', kk:'Қызым көзілдірік киюге үйрене алмады.',
       words:['My', 'daughter', 'didn’t', 'get', 'used', 'to', 'wearing', 'glasses'], a:'My daughter didn’t get used to wearing glasses'},
    ]
  },

  p10: {
    title:'Quantifiers', subtitle:'Сколько чего: much, many, a few, a little', subtitleKk:'Қанша: much, many, a few, a little',
    rule:'Many и a few ставь с тем, что можно посчитать (eggs, coins), much и a little — с тем, что не считается (sugar, water), а a lot of подходит к обоим. Some идёт в утверждениях и когда что-то предлагаешь (Would you like some tea?), any — в вопросах и отрицаниях: Is there any milk in the fridge? A few и a little значат «немного, но хватает», а few и little без a — «мало, не хватает».',
    ruleKk:'Many мен a few санауға болатын заттармен (eggs, coins), much пен a little саналмайтын заттармен (sugar, water) келеді, ал a lot of екеуімен де қолданылады. Some болымды сөйлемде және ұсыныста тұрады (Would you like some tea?), any — сұраулы және болымсыз сөйлемде: Is there any milk in the fridge? A few мен a little «аз, бірақ жетеді» дегенді білдіреді, ал a-сыз few мен little — «аз, жетпейді».',
    examples:[
      {en:'Is there any milk in the fridge?', ru:'В холодильнике есть молоко?', kk:'Тоңазытқышта сүт бар ма?'},
      {en:'We don’t have many eggs, but we have a lot of cheese.', ru:'Яиц у нас немного, зато сыра много.', kk:'Бізде жұмыртқа көп емес, бірақ ірімшік көп.'},
      {en:'How much sugar do you need for the cake?', ru:'Сколько сахара нужно для торта?', kk:'Тортқа қанша қант керек?'},
      {en:'There is only a little water left in the bottle.', ru:'В бутылке осталось совсем немного воды.', kk:'Бөтелкеде аз ғана су қалды.'},
    ],
    words:[
      {en:'a few', ru:'несколько (немного, но хватает)', kk:'бірнеше (аз да болса жетеді)', ex:'I have a few friends in the city.', g:'word'},
      {en:'a little', ru:'немного (но хватает)', kk:'аздап (аз да болса жетеді)', ex:'We have a little water left.', g:'word'},
      {en:'enough', ru:'достаточно', kk:'жеткілікті', ex:'We have enough food for everyone.', g:'word'},
      {en:'any', ru:'какой-нибудь, нисколько', kk:'қандай да бір, ешқандай', ex:'Do you have any questions?', g:'word'},
      {en:'need', ru:'нуждаться, нужно', kk:'керек болу', ex:'Yes, we need some apples.', g:'act'},
      {en:'fridge', ru:'холодильник', kk:'тоңазытқыш', ex:'Is there any milk in the fridge?', g:'thing'},
      {en:'sugar', ru:'сахар', kk:'қант', ex:'How much sugar do you need for the cake?', g:'thing'},
      {en:'coin', ru:'монета', kk:'тиын, монета', ex:'I have a few coins in my pocket.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'No, there isn’t ___ milk in the fridge.', opts:['some', 'any', 'many'], a:1,
       why:'В отрицании ставят any. Many не подходит: молоко штуками не считают.',
       whyKk:'Болымсыз сөйлемде any қойылады. Many келмейді: сүтті данамен санамайды.'},
      {t:'choice', q:'How ___ eggs do we have?', opts:['many', 'much', 'little'], a:0,
       why:'Яйца можно посчитать, поэтому How many. How much спрашивают про то, что не считается: сахар, воду.',
       whyKk:'Жұмыртқаны санауға болады, сондықтан How many. How much саналмайтын нәрсе туралы сұрағанда қойылады: қант, су.'},
      {t:'choice', q:'Would you like ___ tea?', opts:['many', 'few', 'some'], a:2,
       why:'Когда что-то предлагаешь, говоришь some: Would you like some tea? Many и few ставят с тем, что считают штуками, а чай не считают.',
       whyKk:'Бір нәрсе ұсынғанда some айтамыз: Would you like some tea? Many мен few санауға болатын заттармен келеді, ал шай саналмайды.'},
      {t:'choice', q:'Don’t worry, I have ___ friends in the city, so I won’t be lonely.', opts:['few', 'a few', 'much'], a:1,
       why:'Друзей немного, но хватает — это a few. Few без a значит «мало, почти нет», и тогда было бы одиноко.',
       whyKk:'Достар аз болса да жетеді — бұл a few. a-сыз few «өте аз, жетпейді» дегенді білдіреді, онда жалғыз қалар еді.'},
      {t:'order', ru:'У нас не так много яиц.', kk:'Бізде жұмыртқа көп емес.',
       words:['We', 'don’t', 'have', 'many', 'eggs'], a:'We don’t have many eggs'},
      {t:'order', ru:'Сколько сахара тебе нужно?', kk:'Саған қанша қант керек?',
       words:['How', 'much', 'sugar', 'do', 'you', 'need'], a:'How much sugar do you need'},
    ]
  },

  p11: {
    title:'However, Although, Because, So', subtitle:'Связывать мысли: хотя, потому что, поэтому', subtitleKk:'Ойды байланыстыру: …са да, себебі, сондықтан',
    rule:'Although и however нужны, когда вторая мысль идёт наперекор первой. Although склеивает две части в одно предложение: Although it was raining, we still went to the park; however начинает новое предложение, и после него ставят запятую: The math test was very difficult. However, I think I passed it. Because называет причину, so — то, что из неё вышло: I went to bed early because I was very tired; The car was broken, so we took a taxi.',
    ruleKk:'Although мен however екінші ой біріншісіне қайшы келгенде қолданылады. Although екі бөлікті бір сөйлемге біріктіреді: Although it was raining, we still went to the park; ал however жаңа сөйлемді бастайды, одан кейін үтір қойылады: The math test was very difficult. However, I think I passed it. Because себебін айтады, so — одан шыққан нәтижені: I went to bed early because I was very tired; The car was broken, so we took a taxi.',
    examples:[
      {en:'She bought the dress although it was very expensive.', ru:'Она купила платье, хотя оно было очень дорогим.', kk:'Өте қымбат болса да, ол көйлекті сатып алды.'},
      {en:'We wanted to go skiing. However, there was no snow.', ru:'Мы хотели покататься на лыжах. Но снега не было.', kk:'Біз шаңғы тепкіміз келді. Алайда қар жоқ болды.'},
      {en:'Because the train was late, we missed the meeting.', ru:'Поезд опоздал, и мы не успели на встречу.', kk:'Пойыз кешіккендіктен, біз жиналысқа үлгермедік.'},
      {en:'It was raining heavily, so we decided to stay indoors.', ru:'Шёл сильный дождь, поэтому мы решили остаться дома.', kk:'Нөсерлеп жаңбыр жауып тұрды, сол себепті біз үйде қалуды шештік.'},
    ],
    words:[
      {en:'although', ru:'хотя', kk:'…са да, …ғанына қарамастан', ex:'Although it was raining, we still went to the park.', g:'word'},
      {en:'however', ru:'однако, но', kk:'алайда, дегенмен', ex:'He is a good student. However, he is often late.', g:'word'},
      {en:'because', ru:'потому что', kk:'себебі, өйткені', ex:'I stayed home because I was tired.', g:'word'},
      {en:'so', ru:'поэтому', kk:'сондықтан', ex:'She got a new job, so she is happy.', g:'word'},
      {en:'tired', ru:'уставший', kk:'шаршаған', ex:'I went to bed early because I was very tired.', g:'sign'},
      {en:'expensive', ru:'дорогой', kk:'қымбат', ex:'She bought the dress although it was very expensive.', g:'sign'},
      {en:'miss', ru:'не успеть, пропустить', kk:'үлгермеу, қалып қою', ex:'Because the train was late, we missed the meeting.', g:'act'},
      {en:'pass', ru:'сдать (экзамен)', kk:'(емтихан) тапсыру', ex:'She passed the exam although she didn’t study much.', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'___ it was raining, we still went to the park.', opts:['However', 'Although', 'So'], a:1,
       why:'Дождь и прогулка спорят друг с другом, а обе части стоят в одном предложении через запятую — нужен although. However начинает отдельное предложение.',
       whyKk:'Жаңбыр мен серуен бір-біріне қайшы, екі бөлік бір сөйлемде үтір арқылы тұр — although керек. However бөлек сөйлемді бастайды.'},
      {t:'choice', q:'The math test was very difficult. ___, I think I passed it.', opts:['However', 'Because', 'Although'], a:0,
       why:'После точки началось новое предложение, а за пропуском стоит запятая — это however. После although запятую не ставят: за ним сразу идёт своя часть предложения.',
       whyKk:'Нүктеден кейін жаңа сөйлем басталды, сөзден кейін үтір тұр — бұл however. Although-дан кейін үтір қойылмайды, одан бірден сөйлемнің бір бөлігі басталады.'},
      {t:'choice', q:'Why did you stay home? — I stayed home ___ I was tired.', opts:['so', 'however', 'because'], a:2,
       why:'Спрашивают «почему», значит нужна причина — because. So сделало бы усталость следствием: «остался дома, поэтому устал».',
       whyKk:'Why деп «неге» сұрап тұр, яғни себебін айту керек — because. So шаршауды салдарға айналдырар еді: «үйде қалдым, сондықтан шаршадым».'},
      {t:'choice', q:'The car was broken, ___ we took a taxi.', opts:['because', 'so', 'although'], a:1,
       why:'Сначала причина (машина сломалась), потом то, что из неё вышло (взяли такси), — so. Because поменял бы причину и следствие местами.',
       whyKk:'Алдымен себеп (көлік бұзылды), содан кейін нәтиже (такси алдық) — so. Because себеп пен салдардың орнын ауыстырып жіберер еді.'},
      {t:'order', ru:'Хотя шёл дождь, мы пошли гулять.', kk:'Жаңбыр жауып тұрса да, біз серуендеуге бардық.',
       words:['Although', 'it', 'was', 'raining,', 'we', 'went', 'for', 'a', 'walk'], a:'Although it was raining, we went for a walk'},
      {t:'order', ru:'Она нашла новую работу, поэтому она счастлива.', kk:'Ол жаңа жұмысқа орналасты, сондықтан ол бақытты.',
       words:['She', 'got', 'a', 'new', 'job,', 'so', 'she', 'is', 'happy'], a:'She got a new job, so she is happy'},
    ]
  },

  p12: {
    title:'Present Perfect', subtitle:'Говорить об опыте и результате', subtitleKk:'Тәжірибе мен нәтиже туралы айту',
    rule:'Present Perfect — have или has + третья форма глагола: I have finished, she has taken. Так говорят о прошлом, которое касается сегодняшнего дня: про опыт (She has never eaten sushi), про свежий результат (He has lost his keys — и теперь не попасть домой) и про то, что тянется до сих пор, с for и since (We have lived here since 2015). Если назван точный момент, yesterday или last week, бери Past Simple: I lost my phone yesterday.',
    ruleKk:'Present Perfect — have немесе has + етістіктің үшінші формасы: I have finished, she has taken. Бұл шақпен бүгінге қатысы бар өткен оқиғалар туралы айтамыз: өмірлік тәжірибе (She has never eaten sushi), жаңа ғана болған істің нәтижесі (He has lost his keys — енді үйге кіре алмайды) және әлі жалғасып жатқан жағдай, for мен since-пен (We have lived here since 2015). Нақты уақыт аталса, мысалы yesterday не last week, Past Simple керек: I lost my phone yesterday.',
    examples:[
      {en:'I have visited London three times.', ru:'Я был в Лондоне три раза.', kk:'Мен Лондонға үш рет барғанмын.'},
      {en:'She has never eaten sushi.', ru:'Она ни разу не ела суши.', kk:'Ол ешқашан суши жеп көрмеген.'},
      {en:'They have just arrived.', ru:'Они только что приехали.', kk:'Олар жаңа ғана келді.'},
      {en:'We have lived here since 2015.', ru:'Мы живём здесь с 2015 года.', kk:'Біз мұнда 2015 жылдан бері тұрамыз.'},
    ],
    words:[
      {en:'ever', ru:'когда-нибудь', kk:'бұрын-соңды', ex:'Have you ever travelled to Japan?', g:'word'},
      {en:'never', ru:'никогда', kk:'ешқашан', ex:'No, I have never visited Asia.', g:'word'},
      {en:'just', ru:'только что', kk:'жаңа ғана', ex:'Yes, they have just arrived.', g:'word'},
      {en:'already', ru:'уже', kk:'әлдеқашан', ex:'I have already sent it.', g:'word'},
      {en:'yet', ru:'уже (в вопросе), ещё (с not)', kk:'әлі', ex:'Have the guests arrived yet?', g:'word'},
      {en:'since', ru:'с какого-то момента', kk:'…бері, …бастап', ex:'We have known each other since primary school.', g:'word'},
      {en:'lose', ru:'терять', kk:'жоғалту', ex:'I can’t find my phone. I think I have lost it.', g:'act'},
      {en:'meet', ru:'встречать, знакомиться', kk:'кездесу, танысу', ex:'Have you met my brother?', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'They haven’t seen the new movie ___.', opts:['yet', 'already', 'just'], a:0,
       why:'«Ещё не» передаёт yet в конце отрицательного предложения. Already и just сюда не подходят.',
       whyKk:'Болымсыз сөйлемде «әлі … жоқ» мағынасын yet береді, ол сөйлемнің соңында тұрады. Already мен just мұнда келмейді.'},
      {t:'choice', q:'We have known each other ___ primary school.', opts:['for', 'since', 'during'], a:1,
       why:'Primary school — момент, с которого началось знакомство. Перед такой точкой ставят since, а for — перед отрезком: for three years.',
       whyKk:'Primary school — таныстық басталған кез. Мұндай бастау нүктесінің алдында since тұрады, ал for уақыт аралығының алдында келеді: for three years.'},
      {t:'choice', q:'I can’t find my phone. I think I ___ it.', opts:['has lost', 'have lose', 'have lost'], a:2,
       why:'С I ставят have, а после него третью форму: lost. Has — для he, she, it.',
       whyKk:'I-мен have қойылады, одан кейін үшінші форма келеді: lost. Has — he, she, it үшін.'},
      {t:'choice', q:'I ___ my phone yesterday.', opts:['have lost', 'lost', 'has lost'], a:1,
       why:'Yesterday — точный момент в прошлом. С ним Present Perfect не ставят, нужен Past Simple: lost.',
       whyKk:'Yesterday — өткендегі нақты уақыт. Онымен Present Perfect қолданылмайды, Past Simple керек: lost.'},
      {t:'order', ru:'Ты когда-нибудь был в Париже?', kk:'Парижге барып көрдің бе?',
       words:['Have', 'you', 'ever', 'been', 'to', 'Paris'], a:'Have you ever been to Paris'},
      {t:'order', ru:'Я только что сделал домашнее задание.', kk:'Мен үй тапсырмасын жаңа ғана бітірдім.',
       words:['I', 'have', 'just', 'finished', 'my', 'homework'], a:'I have just finished my homework'},
    ]
  },

  p13: {
    title:'Expressing Purpose with To and For', subtitle:'Объяснить, зачем ты что-то делаешь', subtitleKk:'Не үшін істейтініңді түсіндіру',
    rule:'Зачем ты что-то делаешь, объясняет to + глагол в начальной форме: I went to the library to study. For ставят перед существительным: I went to the store for some bread. Глагол после for бывает только с -ing и обычно говорит, для чего нужна вещь: A pen is for writing; «for to study» и «to bread» — ошибки.',
    ruleKk:'Бір істі не үшін істейтініңді to + етістіктің бастапқы формасы түсіндіреді: I went to the library to study. For зат есімнің алдында тұрады: I went to the store for some bread. For-дан кейін етістік тек -ing формасында келеді және көбіне заттың не үшін керек екенін айтады: A pen is for writing; «for to study» мен «to bread» — қате.',
    examples:[
      {en:'We called a taxi to get to the airport quickly.', ru:'Мы вызвали такси, чтобы быстро доехать до аэропорта.', kk:'Әуежайға тез жету үшін такси шақырдық.'},
      {en:'I am here to help you.', ru:'Я пришёл тебе помочь.', kk:'Мен саған көмектесуге келдім.'},
      {en:'I am here for a meeting.', ru:'Я пришёл на встречу.', kk:'Мен мұнда жиналысқа келдім.'},
      {en:'This tool is for cutting wood.', ru:'Этот инструмент нужен, чтобы резать дерево.', kk:'Бұл құрал ағаш кесуге арналған.'},
    ],
    words:[
      {en:'library', ru:'библиотека', kk:'кітапхана', ex:'I went to the library to study for the exam.', g:'thing'},
      {en:'post office', ru:'почта', kk:'пошта бөлімшесі', ex:'I went to the post office to send a letter.', g:'thing'},
      {en:'bread', ru:'хлеб', kk:'нан', ex:'I went to the shop for bread.', g:'thing'},
      {en:'meeting', ru:'встреча, собрание', kk:'жиналыс, кездесу', ex:'We use this room for meetings.', g:'thing'},
      {en:'tool', ru:'инструмент', kk:'құрал', ex:'This tool is for cutting wood.', g:'thing'},
      {en:'save', ru:'копить (деньги)', kk:'(ақша) жинау', ex:'She is saving money for a new car.', g:'act'},
      {en:'check', ru:'проверять', kk:'тексеру', ex:'We use this app for checking the weather.', g:'act'},
      {en:'ask', ru:'спрашивать', kk:'сұрау', ex:'She called him to ask a question.', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'Why did she call him? She called him ___ ask a question.', opts:['for', 'to', 'for to'], a:1,
       why:'Дальше идёт глагол ask: позвонила, чтобы спросить. Перед глаголом цель показывает to, а «for to» — ошибка.',
       whyKk:'Одан кейін ask етістігі тұр: сұрақ қою үшін қоңырау шалды. Етістіктің алдында мақсатты to көрсетеді, ал «for to» — қате.'},
      {t:'choice', q:'I went to the shop ___ bread.', opts:['for', 'to', 'for to'], a:0,
       why:'Bread — существительное, перед ним цель показывает for. «To bread» не говорят.',
       whyKk:'Bread — зат есім, оның алдында мақсатты for көрсетеді. «To bread» деп айтылмайды.'},
      {t:'choice', q:'This machine is for ___ coffee.', opts:['make', 'to make', 'making'], a:2,
       why:'После for глагол всегда с -ing: for making. Машина нужна, чтобы варить кофе.',
       whyKk:'For-дан кейін етістік әрдайым -ing формасында келеді: for making. Бұл машина кофе жасауға арналған.'},
      {t:'choice', q:'I went to the post office ___ a letter.', opts:['for to send', 'to send', 'sending'], a:1,
       why:'Пошёл, чтобы отправить письмо, — цель-действие, значит to + глагол: to send. «For to send» — частая ошибка, такого сочетания нет.',
       whyKk:'Хат жіберу үшін барды — мақсат әрекет, сондықтан to + етістік: to send. «For to send» — жиі кездесетін қате, мұндай тіркес жоқ.'},
      {t:'order', ru:'Она копила деньги, чтобы купить новую машину.', kk:'Ол жаңа көлік сатып алу үшін ақша жинады.',
       words:['She', 'saved', 'money', 'to', 'buy', 'a', 'new', 'car'], a:'She saved money to buy a new car'},
      {t:'order', ru:'Этим приложением мы проверяем погоду.', kk:'Біз бұл қолданбаны ауа райын тексеру үшін пайдаланамыз.',
       words:['We', 'use', 'this', 'app', 'for', 'checking', 'the', 'weather'], a:'We use this app for checking the weather'},
    ]
  },

  p14: {
    title:'First Conditional', subtitle:'Что будет, если…', subtitleKk:'Егер… болса, не болады',
    rule:'Говоришь о том, что вполне может случиться, — бери if + Present Simple, а во второй части will + глагол: If it rains tomorrow, I will stay at home. После if will не ставят, хотя речь о будущем: If it rains, we will stay inside. Unless значит «если не»: Unless you hurry up, you will miss the train.',
    ruleKk:'Болуы әбден мүмкін нәрсе туралы айтқанда if + Present Simple, ал екінші бөлігінде will + етістік қолданамыз: If it rains tomorrow, I will stay at home. Болашақ туралы айтсақ та, if-тен кейін will қойылмайды: If it rains, we will stay inside. Unless «егер … болмаса» дегенді білдіреді: Unless you hurry up, you will miss the train.',
    examples:[
      {en:'If you study hard, you will pass the exam.', ru:'Если будешь хорошо заниматься, сдашь экзамен.', kk:'Жақсы оқысаң, емтиханнан өтесің.'},
      {en:'I will travel to London if I save enough money.', ru:'Я поеду в Лондон, если накоплю достаточно денег.', kk:'Жеткілікті ақша жинасам, Лондонға саяхатқа барамын.'},
      {en:'If he drives too fast, he will have an accident.', ru:'Если он будет гнать, то попадёт в аварию.', kk:'Ол көлікті тым жылдам жүргізсе, апатқа ұшырайды.'},
      {en:'He won’t pass the exam unless he starts studying.', ru:'Он не сдаст экзамен, если не начнёт заниматься.', kk:'Оқуды бастамаса, ол емтиханнан өтпейді.'},
    ],
    words:[
      {en:'if', ru:'если', kk:'егер', ex:'If it rains tomorrow, I will stay at home.', g:'word'},
      {en:'unless', ru:'если не', kk:'егер … болмаса', ex:'Unless you hurry up, you will miss the train.', g:'word'},
      {en:'pass', ru:'сдать (экзамен)', kk:'(емтиханнан) өту', ex:'If you study hard, you will pass the exam.', g:'act'},
      {en:'miss', ru:'опоздать (на поезд, автобус)', kk:'(пойызға, автобусқа) кешігу', ex:'If she comes late, we will miss the train.', g:'act'},
      {en:'hurry up', ru:'поторопиться', kk:'асығу', ex:'If you don’t hurry up, you will miss the train.', g:'act'},
      {en:'stay', ru:'остаться', kk:'қалу', ex:'If it rains, we will stay inside.', g:'act'},
      {en:'travel', ru:'путешествовать, поехать', kk:'саяхаттау', ex:'I will travel to London if I save enough money.', g:'act'},
      {en:'accident', ru:'авария', kk:'апат', ex:'If he drives too fast, he will have an accident.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'If it ___ tomorrow, I will stay at home.', opts:['will rain', 'rains', 'rain'], a:1,
       why:'После if будущее передают через Present Simple, а с it нужно -s: it rains. «If it will rain» — самая частая ошибка в этой теме.',
       whyKk:'if-тен кейін болашақ Present Simple арқылы беріледі, it-пен -s жалғанады: it rains. «If it will rain» — осы тақырыптағы ең жиі қате.'},
      {t:'choice', q:'If she comes late, we ___ the train.', opts:['will miss', 'would miss', 'missed'], a:0,
       why:'Часть с if стоит в Present Simple, значит во второй части will + глагол: will miss.',
       whyKk:'if бөлігі Present Simple-да тұр, демек екінші бөлігінде will + етістік келеді: will miss.'},
      {t:'choice', q:'The train leaves in five minutes. ___ you hurry up, you will miss it.', opts:['If', 'When', 'Unless'], a:2,
       why:'Опоздаешь, если не поторопишься. «Если не» по-английски — unless: Unless you hurry up.',
       whyKk:'Асықпасаң, пойызға кешігесің. «Егер … болмаса» мағынасын unless береді: Unless you hurry up.'},
      {t:'choice', q:'What will you do if you ___ the bus?', opts:['will miss', 'miss', 'missed'], a:1,
       why:'Даже в вопросе о будущем после if will не ставят: if you miss. Missed тоже не годится: в начале вопроса стоит will.',
       whyKk:'Болашақ туралы сұрақта да if-тен кейін will қойылмайды: if you miss. Missed та келмейді, себебі сұрақтың басында will тұр.'},
      {t:'order', ru:'Если устал, сделай перерыв.', kk:'Шаршасаң, үзіліс жаса.',
       words:['If', 'you', 'are', 'tired,', 'take', 'a', 'break'], a:'If you are tired, take a break'},
      {t:'order', ru:'Если пойдёт дождь, мы не пойдём гулять.', kk:'Жаңбыр жауса, біз далаға шықпаймыз.',
       words:['We', 'won’t', 'go', 'out', 'if', 'it', 'rains'], a:'We won’t go out if it rains'},
    ]
  },


  /* Intermediate · Senior. Разбор, слова и задания сняты с самих роликов:
     слайды урока плюс речь преподавателя. Ролик здесь один, теория. */
  i1: {
    title:'Past Perfect', subtitle:'Что случилось ещё раньше', subtitleKk:'Одан да бұрын не болды',
    rule:'Рассказываешь о прошлом и надо вернуться к тому, что случилось ещё раньше, — бери had + третью форму глагола: had finished, had eaten. Раннее действие стоит в Past Perfect, позднее — в Past Simple: When I got home, my dog had eaten my shoes.',
    ruleKk:'Өткен оқиғаны айтып отырып, одан да ертерек болған нәрсеге оралу керек болса, had + етістіктің үшінші формасын аламыз: had finished, had eaten. Ертерек болған әрекет Past Perfect-те, кейінгісі Past Simple-да тұрады: When I got home, my dog had eaten my shoes.',
    examples:[
      {en:'When I got home, my dog had eaten my shoes.', ru:'Когда я пришёл домой, собака уже съела мои туфли.', kk:'Үйге келсем, итім аяқ киімімді жеп қойыпты.'},
      {en:'After she had saved enough money, she bought a car.', ru:'Когда она накопила достаточно денег, она купила машину.', kk:'Жеткілікті ақша жинағаннан кейін ол көлік сатып алды.'},
      {en:'By the time we arrived, the film had started.', ru:'Когда мы пришли, фильм уже начался.', kk:'Біз келгенше фильм басталып кеткен еді.'},
      {en:'She felt tired because she had worked all night.', ru:'Она устала, потому что работала всю ночь.', kk:'Ол түні бойы жұмыс істегендіктен шаршады.'},
    ],
    words:[
      {en:'realize', ru:'понять, осознать', kk:'түсіну, аңғару', ex:'When I got home, I realized that my dog had eaten my shoes.', g:'act'},
      {en:'save', ru:'копить (деньги)', kk:'(ақша) жинау', ex:'She had saved enough money for a car.', g:'act'},
      {en:'enough', ru:'достаточно', kk:'жеткілікті', ex:'After she had saved enough money, she bought a car.', g:'word'},
      {en:'arrive', ru:'приехать, прийти', kk:'келу, жету', ex:'The film had started before we arrived.', g:'act'},
      {en:'by the time', ru:'к тому времени, как', kk:'…ған кезде, …ғанша', ex:'By the time we arrived, the film had started.', g:'word'},
      {en:'exhausted', ru:'вымотанный', kk:'әбден шаршаған', ex:'He was exhausted because he hadn’t slept well.', g:'sign'},
      {en:'prepare', ru:'готовить', kk:'дайындау', ex:'When I came home, my family had prepared dinner.', g:'act'},
      {en:'finish', ru:'закончить', kk:'бітіру, аяқтау', ex:'I had finished my work before the meeting.', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'When I got home, my dog ___ my shoes.', opts:['had eaten', 'has eaten', 'eats'], a:0,
       why:'Собака съела туфли раньше, чем я пришёл. Более раннее действие в прошлом — had + третья форма.',
       whyKk:'Ит аяқ киімді мен келмей тұрып жеп қойған. Өткендегі ертерек әрекет — had + үшінші форма.'},
      {t:'choice', q:'By the time we arrived, the film ___ started.', opts:['has', 'was', 'had'], a:2,
       why:'Фильм начался раньше нашего прихода, и вся история уже в прошлом — значит had.',
       whyKk:'Фильм біз келмей тұрып басталған, оқиғаның бәрі өткенде — сондықтан had.'},
      {t:'choice', q:'He was exhausted because he ___ well.', opts:['hasn’t slept', 'doesn’t sleep', 'hadn’t slept'], a:2,
       why:'Плохо спал он раньше, чем почувствовал усталость. Отрицание в Past Perfect — hadn’t + третья форма.',
       whyKk:'Ол алдымен нашар ұйықтады, кейін шаршады. Past Perfect-тің болымсыз түрі — hadn’t + үшінші форма.'},
      {t:'choice', q:'The theater lights went up because the movie ___.', opts:['has finished', 'finishes', 'had finished'], a:2,
       why:'Сначала кончился фильм, потом зажёгся свет. Причина случилась раньше — had finished.',
       whyKk:'Алдымен фильм бітті, содан кейін жарық жанды. Себеп ертерек болған — had finished.'},
      {t:'order', ru:'Когда я пришёл домой, семья уже приготовила ужин.', kk:'Мен үйге келгенде, отбасым кешкі асты дайындап қойған еді.',
       words:['When', 'I', 'came', 'home,', 'my', 'family', 'had', 'prepared', 'dinner'], a:'When I came home, my family had prepared dinner'},
      {t:'order', ru:'Ты к тому времени закончил работу?', kk:'Сол уақытқа дейін жұмысыңды бітіріп қойған ба едің?',
       words:['Had', 'you', 'finished', 'your', 'work'], a:'Had you finished your work'},
    ]
  },

  i2: {
    title:'Past Perfect Continuous', subtitle:'Сколько длилось до момента в прошлом', subtitleKk:'Өткендегі бір сәтке дейін қанша созылды',
    rule:'Формула: had been + глагол с -ing. Так говорят о действии, которое шло какое-то время до момента в прошлом: I had been reading for two hours before he arrived. Часто оно объясняет то, что было после: She was tired because she had been working all day.',
    ruleKk:'Формуласы: had been + -ing жалғанған етістік. Өткендегі бір сәтке дейін біраз уақыт созылған әрекетті осылай айтамыз: I had been reading for two hours before he arrived. Көбіне ол кейінгі жағдайдың себебін түсіндіреді: She was tired because she had been working all day.',
    examples:[
      {en:'I had been reading for two hours before he arrived.', ru:'Когда он пришёл, я читал уже два часа.', kk:'Ол келгенше мен екі сағат бойы кітап оқып отырдым.'},
      {en:'She was tired because she had been working all day.', ru:'Она устала, потому что весь день работала.', kk:'Ол күні бойы жұмыс істегендіктен шаршап қалды.'},
      {en:'They had been playing football, so they were dirty.', ru:'Они играли в футбол, поэтому были грязные.', kk:'Олар футбол ойнаған, сондықтан үсті-бастары кір болды.'},
      {en:'She had been living in London since 2015.', ru:'Она жила в Лондоне с 2015 года.', kk:'Ол 2015 жылдан бері Лондонда тұрып келген еді.'},
    ],
    words:[
      {en:'dirty', ru:'грязный', kk:'кір', ex:'They had been playing football, so they were dirty.', g:'sign'},
      {en:'hungry', ru:'голодный', kk:'аш', ex:'They were hungry because they had been running.', g:'sign'},
      {en:'wait', ru:'ждать', kk:'күту', ex:'We had been waiting for an hour when the bus came.', g:'act'},
      {en:'run', ru:'бегать', kk:'жүгіру', ex:'They had been running, so they were hungry.', g:'act'},
      {en:'all day', ru:'весь день', kk:'күні бойы', ex:'She had been working all day.', g:'time'},
      {en:'since', ru:'с (какого-то момента)', kk:'…бері', ex:'She had been living in London since 2015.', g:'word'},
      {en:'until', ru:'до (какого-то момента)', kk:'…дейін', ex:'I had been studying until midnight.', g:'word'},
      {en:'letter', ru:'письмо', kk:'хат', ex:'She had been writing letters before lunch.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'I ___ for two hours before he arrived.', opts:['have been reading', 'am reading', 'had been reading'], a:2,
       why:'Чтение шло до момента в прошлом — до его прихода. Это had been + -ing.',
       whyKk:'Оқу өткендегі бір сәтке дейін, ол келгенге дейін созылды. Бұл — had been + -ing.'},
      {t:'choice', q:'They were dirty because they had been ___ football.', opts:['playing', 'play', 'played'], a:0,
       why:'После had been глагол всегда с -ing.',
       whyKk:'had been-нен кейін етістікке әрқашан -ing жалғанады.'},
      {t:'choice', q:'She ___ letters all morning, so her hand hurt.', opts:['had written', 'had been writing', 'has been writing'], a:1,
       why:'All morning говорит, сколько это длилось, а не сколько писем готово. Длительность до момента в прошлом — had been writing.',
       whyKk:'All morning әрекеттің қанша созылғанын айтады, дайын хаттың санын емес. Өткендегі сәтке дейінгі ұзақтық — had been writing.'},
      {t:'choice', q:'She had been living in London ___ 2015.', opts:['for', 'during', 'since'], a:2,
       why:'Since ставят перед точкой отсчёта: годом, датой. For — перед отрезком: for three hours.',
       whyKk:'Since басталған уақыттың алдына қойылады: жыл, күн. For уақыт аралығының алдында тұрады: for three hours.'},
      {t:'order', ru:'Они были голодные, потому что бегали.', kk:'Олар жүгіргендіктен қарындары ашып қалды.',
       words:['They', 'were', 'hungry', 'because', 'they', 'had', 'been', 'running'], a:'They were hungry because they had been running'},
      {t:'order', ru:'Ты долго ждал?', kk:'Сен ұзақ күттің бе?',
       words:['Had', 'you', 'been', 'waiting', 'long'], a:'Had you been waiting long'},
    ]
  },

  i3: {
    title:'Present Perfect Continuous', subtitle:'Началось раньше и идёт до сих пор', subtitleKk:'Бұрын басталып, әлі жалғасып жатыр',
    rule:'have/has been + глагол с -ing — для действия, которое началось в прошлом и идёт до сих пор: I have been studying English for three years. Время показывают for (сколько) и since (с какого момента), а спрашивают How long have you been…? Если дело только что кончилось, а след виден сейчас, — тоже он: She is tired because she has been working all day.',
    ruleKk:'have/has been + -ing жалғанған етістік — бұрын басталып, әлі жалғасып жатқан әрекет үшін: I have been studying English for three years. Уақытты for (қанша уақыт) пен since (қашаннан бері) көрсетеді, ал сұрақ How long have you been…? деп қойылады. Іс жаңа ғана біткенімен, ізі қазір көрініп тұрса да, осы шақ керек: She is tired because she has been working all day.',
    examples:[
      {en:'I have been studying English for three years.', ru:'Я учу английский уже три года.', kk:'Мен ағылшын тілін үш жылдан бері оқып жүрмін.'},
      {en:'She is tired because she has been working all day.', ru:'Она устала, потому что весь день работала.', kk:'Ол күні бойы жұмыс істегендіктен шаршап тұр.'},
      {en:'It has been raining all day.', ru:'Весь день идёт дождь.', kk:'Күні бойы жаңбыр жауып тұр.'},
      {en:'How long have you been studying English?', ru:'Сколько ты уже учишь английский?', kk:'Ағылшын тілін қанша уақыттан бері оқып жүрсің?'},
    ],
    words:[
      {en:'lately', ru:'в последнее время', kk:'соңғы кездері', ex:'I have been feeling tired lately.', g:'time'},
      {en:'recently', ru:'недавно, в последнее время', kk:'жақында, соңғы уақытта', ex:'She has been working a lot recently.', g:'time'},
      {en:'how long', ru:'как долго, сколько времени', kk:'қанша уақыт', ex:'How long have you been waiting?', g:'word'},
      {en:'rain', ru:'идти (о дожде)', kk:'жаңбыр жауу', ex:'It has been raining all day.', g:'act'},
      {en:'live', ru:'жить', kk:'тұру', ex:'She has been living here since 2018.', g:'act'},
      {en:'write', ru:'писать', kk:'жазу', ex:'I have been writing letters all morning.', g:'act'},
      {en:'tired', ru:'уставший', kk:'шаршаған', ex:'She is tired because she has been working all day.', g:'sign'},
      {en:'all morning', ru:'всё утро', kk:'таңертеңнен бері', ex:'I have been writing letters all morning.', g:'time'},
    ],
    tasks:[
      {t:'choice', q:'I ___ English for three years.', opts:['had been studying', 'have been studying', 'am studying'], a:1,
       why:'Начал три года назад и учу до сих пор — have been + -ing. Am studying for three years — частая ошибка.',
       whyKk:'Үш жыл бұрын бастадым, әлі оқып жүрмін — have been + -ing. Am studying for three years деу — жиі кездесетін қате.'},
      {t:'choice', q:'She ___ been working all day, so she is tired.', opts:['have', 'has', 'had'], a:1,
       why:'С she ставят has. И устала она сейчас, поэтому время настоящее, а не had.',
       whyKk:'She-мен has қойылады. Ол қазір шаршап тұр, сондықтан шақ — осы шақ, had емес.'},
      {t:'choice', q:'They have been waiting ___ two hours.', opts:['since', 'during', 'for'], a:2,
       why:'Two hours — отрезок времени, перед ним for. Since — перед точкой отсчёта: since 2018.',
       whyKk:'Two hours — уақыт аралығы, оның алдында for тұрады. Since басталған уақыттың алдына қойылады: since 2018.'},
      {t:'choice', q:'I ___ three letters today.', opts:['have written', 'have been writing', 'am writing'], a:0,
       why:'Важно, сколько писем готово, — это результат. Результат даёт Present Perfect: have written.',
       whyKk:'Қанша хат дайын екені маңызды — бұл нәтиже. Нәтижені Present Perfect береді: have written.'},
      {t:'order', ru:'Сколько ты уже учишь английский?', kk:'Ағылшын тілін қанша уақыттан бері оқып жүрсің?',
       words:['How', 'long', 'have', 'you', 'been', 'studying', 'English'], a:'How long have you been studying English'},
      {t:'order', ru:'Весь день идёт дождь.', kk:'Күні бойы жаңбыр жауып тұр.',
       words:['It', 'has', 'been', 'raining', 'all', 'day'], a:'It has been raining all day'},
    ]
  },

  i4: {
    title:'Future Continuous', subtitle:'Что будет идти в момент в будущем', subtitleKk:'Болашақтағы бір сәтте не болып жатады',
    rule:'will be + глагол с -ing — действие, которое будет идти в конкретный момент в будущем: At this time tomorrow, I will be flying to Paris. Future Simple сообщает решение (I will call you later), Future Continuous показывает процесс. Им же вежливо спрашивают о чужих планах: Will you be joining us for dinner?',
    ruleKk:'will be + -ing жалғанған етістік — болашақтағы нақты бір сәтте жүріп жатқан әрекет: At this time tomorrow, I will be flying to Paris. Future Simple шешімді хабарлайды (I will call you later), Future Continuous процесті көрсетеді. Біреудің жоспарын сыпайы сұрағанда да осы қолданылады: Will you be joining us for dinner?',
    examples:[
      {en:'I will be studying at 8 p.m. tomorrow.', ru:'Завтра в восемь вечера я буду заниматься.', kk:'Ертең кешкі сегізде сабақ оқып отыратын боламын.'},
      {en:'At this time tomorrow, I will be flying to Paris.', ru:'Завтра в это время я буду лететь в Париж.', kk:'Ертең дәл осы уақытта Парижге ұшып бара жатамын.'},
      {en:'Will you be joining us for dinner?', ru:'Вы присоединитесь к нам за ужином?', kk:'Бізбен бірге кешкі асқа қосыласыз ба?'},
      {en:'This time next year, I will be living in another city.', ru:'Через год в это время я буду жить в другом городе.', kk:'Келесі жылы дәл осы кезде басқа қалада тұратын боламын.'},
    ],
    words:[
      {en:'fly', ru:'лететь', kk:'ұшу', ex:'At this time tomorrow, I will be flying to Paris.', g:'act'},
      {en:'join', ru:'присоединиться', kk:'қосылу', ex:'Will you be joining us for dinner?', g:'act'},
      {en:'sleep', ru:'спать', kk:'ұйықтау', ex:'She will be sleeping when you arrive.', g:'act'},
      {en:'office', ru:'офис', kk:'кеңсе', ex:'They will be working in the office next week.', g:'thing'},
      {en:'as usual', ru:'как обычно', kk:'әдеттегідей', ex:'She will be working next week as usual.', g:'word'},
      {en:'at this time tomorrow', ru:'завтра в это же время', kk:'ертең дәл осы уақытта', ex:'At this time tomorrow, I will be flying to Paris.', g:'time'},
      {en:'next week', ru:'на следующей неделе', kk:'келесі аптада', ex:'They will be working in the office next week.', g:'time'},
      {en:'later', ru:'позже', kk:'кейінірек', ex:'I will call you later.', g:'time'},
    ],
    tasks:[
      {t:'choice', q:'At this time tomorrow, I ___ to Paris.', opts:['will fly', 'am flying', 'will be flying'], a:2,
       why:'Речь о процессе в конкретный момент завтра — will be + -ing.',
       whyKk:'Ертеңгі нақты бір сәтте жүріп жатқан процесс туралы — will be + -ing.'},
      {t:'choice', q:'Don’t call at 8 p.m. I ___ then.', opts:['will studying', 'will be studying', 'study'], a:1,
       why:'Нужны оба слова, will и be, а глагол берёт -ing.',
       whyKk:'will мен be екеуі де керек, ал етістікке -ing жалғанады.'},
      {t:'choice', q:'___ you be joining us for dinner?', opts:['Are', 'Will', 'Do'], a:1,
       why:'В вопросе will выходит вперёд: Will you be joining…? Так вежливо спрашивают о чужих планах.',
       whyKk:'Сұраулы сөйлемде will алға шығады: Will you be joining…? Біреудің жоспарын осылай сыпайы сұрайды.'},
      {t:'choice', q:'She ___ when you arrive, so please be quiet.', opts:['sleeps', 'will be sleeping', 'slept'], a:1,
       why:'Когда ты придёшь, сон уже будет идти. Процесс в момент в будущем — will be sleeping.',
       whyKk:'Сен келгенде ол ұйықтап жатқан болады. Болашақтағы бір сәтте жүріп жатқан әрекет — will be sleeping.'},
      {t:'order', ru:'Они не будут нас ждать.', kk:'Олар бізді күтіп отырмайды.',
       words:['They', 'will', 'not', 'be', 'waiting', 'for', 'us'], a:'They will not be waiting for us'},
      {t:'order', ru:'Через год в это время я буду жить в другом городе.', kk:'Келесі жылы дәл осы кезде басқа қалада тұратын боламын.',
       words:['This', 'time', 'next', 'year,', 'I', 'will', 'be', 'living', 'in', 'another', 'city'], a:'This time next year, I will be living in another city'},
    ]
  },

  i5: {
    title:'Future Perfect', subtitle:'Что будет готово к сроку', subtitleKk:'Белгілі мерзімге не дайын болады',
    rule:'will have + третья форма глагола: к моменту в будущем дело уже будет сделано. I will have finished my homework by 8 p.m. Срок задают by, by the time, before: by tomorrow, by next year. Так же строят уверенную догадку о том, что уже случилось: He will have reached home by now.',
    ruleKk:'will have + етістіктің үшінші формасы: болашақтағы бір сәтке дейін іс бітіп қояды. I will have finished my homework by 8 p.m. Мерзімді by, by the time, before береді: by tomorrow, by next year. Болып қойған іс туралы сенімді болжам да осылай құрылады: He will have reached home by now.',
    examples:[
      {en:'I will have finished my homework by 8 p.m.', ru:'К восьми вечера я уже сделаю домашнее задание.', kk:'Кешкі сегізге дейін үй тапсырмамды орындап қоямын.'},
      {en:'She will have left the office before you arrive.', ru:'Она уйдёт из офиса до твоего прихода.', kk:'Сен келгенше ол кеңседен кетіп қалады.'},
      {en:'They will have built the bridge by next year.', ru:'К следующему году мост уже построят.', kk:'Келесі жылға дейін олар көпірді салып бітіреді.'},
      {en:'By the time you arrive, we will have eaten dinner.', ru:'К твоему приходу мы уже поужинаем.', kk:'Сен келгенше біз кешкі асты ішіп қоямыз.'},
    ],
    words:[
      {en:'graduate', ru:'окончить учёбу', kk:'оқуды бітіру', ex:'I will have graduated by next June.', g:'act'},
      {en:'bridge', ru:'мост', kk:'көпір', ex:'They will have built the bridge by next year.', g:'thing'},
      {en:'leave', ru:'уйти, уехать', kk:'кету', ex:'She will have left the office before you arrive.', g:'act'},
      {en:'reach', ru:'добраться до', kk:'жету', ex:'He will have reached home by now.', g:'act'},
      {en:'move', ru:'переехать', kk:'көшу', ex:'They will have moved to a new house by next month.', g:'act'},
      {en:'project', ru:'проект', kk:'жоба', ex:'I will have completed my project by tomorrow.', g:'thing'},
      {en:'by', ru:'к (сроку)', kk:'…ға дейін (мерзім)', ex:'I will have finished my homework by 8 p.m.', g:'word'},
      {en:'by now', ru:'уже, к этому моменту', kk:'осы уақытқа дейін', ex:'He will have reached home by now.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'I will have ___ my homework by 8 p.m.', opts:['finish', 'finishing', 'finished'], a:2,
       why:'После will have нужна третья форма глагола: finished.',
       whyKk:'will have-тен кейін етістіктің үшінші формасы керек: finished.'},
      {t:'choice', q:'They will have built the bridge ___ next year.', opts:['since', 'by', 'for'], a:1,
       why:'By задаёт срок: к следующему году.',
       whyKk:'By мерзімді көрсетеді: келесі жылға дейін.'},
      {t:'choice', q:'By the time you arrive, we ___ dinner.', opts:['will eat', 'will have eaten', 'have eaten'], a:1,
       why:'Ужин закончится раньше, чем ты придёшь, — will have + третья форма.',
       whyKk:'Сен келмей тұрып кешкі ас бітеді — will have + үшінші форма.'},
      {t:'choice', q:'It’s nine o’clock. He ___ home by now.', opts:['will have reached', 'reaches', 'will reach'], a:0,
       why:'Это догадка о том, что уже случилось: скорее всего, он уже дома.',
       whyKk:'Бұл болып қойған іс туралы болжам: ол үйге жетіп қалған шығар.'},
      {t:'order', ru:'Она уйдёт до твоего прихода?', kk:'Сен келгенше ол кетіп қала ма?',
       words:['Will', 'she', 'have', 'left', 'before', 'you', 'arrive'], a:'Will she have left before you arrive'},
      {t:'order', ru:'К следующему июню я уже окончу учёбу.', kk:'Келесі маусымға дейін оқуымды бітіріп қоямын.',
       words:['I', 'will', 'have', 'graduated', 'by', 'next', 'June'], a:'I will have graduated by next June'},
    ]
  },

  i6: {
    title:'Second Conditional', subtitle:'«Если бы…»: мечты и советы', subtitleKk:'«Егер… болса»: арман мен кеңес',
    rule:'Нереальную ситуацию в настоящем или будущем строят так: if + Past Simple, потом would + глагол: If I had more time, I would travel the world. После if со всеми лицами ставят were: If I were you, I would study more.',
    ruleKk:'Осы шақтағы не болашақтағы шынайы емес жағдай былай құрылады: if + Past Simple, одан кейін would + етістік: If I had more time, I would travel the world. if-тен кейін барлық жақпен were қойылады: If I were you, I would study more.',
    examples:[
      {en:'If I had more time, I would travel the world.', ru:'Будь у меня больше времени, я бы путешествовал по миру.', kk:'Уақытым көбірек болса, әлемді аралап шығар едім.'},
      {en:'If I were you, I would study more.', ru:'На твоём месте я бы занимался больше.', kk:'Сенің орныңда болсам, көбірек оқыр едім.'},
      {en:'What would you do if you won the lottery?', ru:'Что бы ты сделал, если бы выиграл в лотерею?', kk:'Лотереядан ұтып алсаң, не істер едің?'},
      {en:'If he weren’t busy, he would help us.', ru:'Если бы он не был занят, он бы нам помог.', kk:'Бос болса, ол бізге көмектесер еді.'},
    ],
    words:[
      {en:'travel', ru:'путешествовать', kk:'саяхаттау', ex:'If I had more time, I would travel the world.', g:'act'},
      {en:'lottery', ru:'лотерея', kk:'лотерея', ex:'What would you do if you won the lottery?', g:'thing'},
      {en:'millionaire', ru:'миллионер', kk:'миллионер', ex:'If I were a millionaire, I would buy a big house.', g:'thing'},
      {en:'exam', ru:'экзамен', kk:'емтихан', ex:'If she studied harder, she would pass the exam.', g:'thing'},
      {en:'rich', ru:'богатый', kk:'бай', ex:'If I were rich, I would travel the world.', g:'sign'},
      {en:'busy', ru:'занятой', kk:'бос емес', ex:'If he weren’t busy, he would help us.', g:'sign'},
      {en:'if', ru:'если', kk:'егер', ex:'If it rained, we would stay at home.', g:'word'},
      {en:'would', ru:'бы', kk:'…ар еді', ex:'I would call him if I knew his number.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'If I ___ more time, I would travel the world.', opts:['have', 'had', 'will have'], a:1,
       why:'Во втором условном после if стоит Past Simple: had.',
       whyKk:'Екінші шартты сөйлемде if-тен кейін Past Simple тұрады: had.'},
      {t:'choice', q:'If I were you, I ___ study more.', opts:['would', 'will', 'am'], a:0,
       why:'Во второй части нереального условия — would + глагол.',
       whyKk:'Шынайы емес шарттың екінші бөлігінде would + етістік тұрады.'},
      {t:'choice', q:'If she ___ here, she would help us.', opts:['is', 'were', 'be'], a:1,
       why:'В нереальном условии после if ставят were, даже с he, she, it.',
       whyKk:'Шынайы емес шартта if-тен кейін he, she, it-пен де were қойылады.'},
      {t:'choice', q:'If it rains tomorrow, I ___ at home.', opts:['would stay', 'will stay', 'stayed'], a:1,
       why:'Rains — настоящее время, дождь вполне возможен. Это первое условие, в нём will.',
       whyKk:'Rains — осы шақ, жаңбырдың жаууы әбден мүмкін. Бұл бірінші шартты сөйлем, онда will тұрады.'},
      {t:'order', ru:'Что бы ты сделал, если бы выиграл в лотерею?', kk:'Лотереядан ұтып алсаң, не істер едің?',
       words:['What', 'would', 'you', 'do', 'if', 'you', 'won', 'the', 'lottery'], a:'What would you do if you won the lottery'},
      {t:'order', ru:'Если бы у меня не было машины, я бы ездил на автобусе.', kk:'Көлігім болмаса, автобуспен жүрер едім.',
       words:['If', 'I', 'didn’t', 'have', 'a', 'car,', 'I', 'would', 'take', 'the', 'bus'], a:'If I didn’t have a car, I would take the bus'},
    ]
  },

  i7: {
    title:'Passive Voice', subtitle:'Говорить о деле, не называя, кто его сделал', subtitleKk:'Істі кім істегенін атамай айту',
    rule:'Пассив строят так: to be в нужном времени + третья форма глагола: Cars are made in Japan, A bridge was built, The report has been finished. Того, кто сделал, добавляют через by, и только если это важно: The song was written by Taylor Swift.',
    ruleKk:'Ырықсыз етіс былай құрылады: керекті шақтағы to be + етістіктің үшінші формасы: Cars are made in Japan, A bridge was built, The report has been finished. Кім істегенін by арқылы қосамыз, ол да маңызды болса ғана: The song was written by Taylor Swift.',
    examples:[
      {en:'Cars are made in Japan.', ru:'Машины делают в Японии.', kk:'Көліктер Жапонияда жасалады.'},
      {en:'The meal was cooked by the chef.', ru:'Еду приготовил шеф-повар.', kk:'Тамақты бас аспаз дайындады.'},
      {en:'My wallet was stolen.', ru:'У меня украли кошелёк.', kk:'Әмиянымды ұрлап кетті.'},
      {en:'The wall is being painted.', ru:'Стену сейчас красят.', kk:'Қабырға қазір боялып жатыр.'},
    ],
    words:[
      {en:'steal', ru:'украсть', kk:'ұрлау', ex:'My wallet was stolen.', g:'act'},
      {en:'wallet', ru:'кошелёк', kk:'әмиян', ex:'My wallet was stolen on the bus.', g:'thing'},
      {en:'paint', ru:'красить', kk:'бояу', ex:'The wall is being painted.', g:'act'},
      {en:'repair', ru:'чинить', kk:'жөндеу', ex:'The car was repaired yesterday.', g:'act'},
      {en:'be born', ru:'родиться', kk:'туылу', ex:'I was born in 2003.', g:'act'},
      {en:'wood', ru:'дерево (материал)', kk:'ағаш (материал)', ex:'The chair is made of wood.', g:'thing'},
      {en:'interested in', ru:'интересуется', kk:'…ға қызығады', ex:'She is interested in art.', g:'sign'},
      {en:'known for', ru:'известен (чем-то)', kk:'…мен танымал', ex:'Italy is known for its food.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'Cars ___ made in Japan.', opts:['is', 'are', 'be'], a:1,
       why:'Cars — множественное число, в Present Simple с ним are.',
       whyKk:'Cars — көпше түр, Present Simple-да онымен are тұрады.'},
      {t:'choice', q:'My wallet was ___ yesterday.', opts:['stole', 'stolen', 'stealing'], a:1,
       why:'В пассиве после to be идёт третья форма: steal — stole — stolen.',
       whyKk:'Ырықсыз етісте to be-ден кейін үшінші форма келеді: steal — stole — stolen.'},
      {t:'choice', q:'The car ___ yesterday.', opts:['repaired', 'is repairing', 'was repaired'], a:2,
       why:'Машина сама себя не чинила, её починили. Без was получается ошибка: The car repaired.',
       whyKk:'Көлік өзін-өзі жөндеген жоқ, оны жөндеді. was болмаса, қате шығады: The car repaired.'},
      {t:'choice', q:'Something strange ___ last night.', opts:['was happened', 'is happened', 'happened'], a:2,
       why:'У happen нет объекта, поэтому пассива у него не бывает. Так же с die, sleep, arrive.',
       whyKk:'happen етістігінің объектісі жоқ, сондықтан ырықсыз етісі болмайды. die, sleep, arrive да солай.'},
      {t:'order', ru:'Я родился в 2003 году.', kk:'Мен 2003 жылы туылдым.',
       words:['I', 'was', 'born', 'in', '2003'], a:'I was born in 2003'},
      {t:'order', ru:'Мне подарили подарок.', kk:'Маған сыйлық берілді.',
       words:['I', 'was', 'given', 'a', 'present'], a:'I was given a present'},
    ]
  },

  i8: {
    title:'Relative Clauses', subtitle:'Добавить подробность в то же предложение', subtitleKk:'Сол сөйлемге қосымша мәлімет қосу',
    rule:'Чтобы сказать больше о человеке, вещи или месте, не начиная новое предложение, ставь who (о людях), which (о вещах), where (о месте), when (о времени), whose (чей): The man who lives next door is a doctor. That годится и для людей, и для вещей, но только без запятых.',
    ruleKk:'Адам, зат немесе орын туралы жаңа сөйлем бастамай толығырақ айту үшін who (адам), which (зат), where (орын), when (уақыт), whose (кімнің) қоямыз: The man who lives next door is a doctor. That адамға да, затқа да жарайды, бірақ тек үтірсіз сөйлемде.',
    examples:[
      {en:'The man who lives next door is a doctor.', ru:'Мужчина, который живёт по соседству, — врач.', kk:'Көршіде тұратын кісі — дәрігер.'},
      {en:'The book that I bought yesterday is very interesting.', ru:'Книга, которую я купил вчера, очень интересная.', kk:'Кеше сатып алған кітабым өте қызық.'},
      {en:'My brother, who lives in Canada, is an engineer.', ru:'Мой брат, который живёт в Канаде, инженер.', kk:'Канадада тұратын ағам — инженер.'},
      {en:'That’s the student whose laptop was stolen.', ru:'Это тот студент, у которого украли ноутбук.', kk:'Ноутбугі ұрланған студент — осы.'},
    ],
    words:[
      {en:'next door', ru:'по соседству', kk:'көршіде', ex:'The man who lives next door is a doctor.', g:'word'},
      {en:'engineer', ru:'инженер', kk:'инженер', ex:'My brother, who lives in Canada, is an engineer.', g:'thing'},
      {en:'laptop', ru:'ноутбук', kk:'ноутбук', ex:'That’s the student whose laptop was stolen.', g:'thing'},
      {en:'boss', ru:'начальник', kk:'бастық', ex:'The woman whom I met is my boss.', g:'thing'},
      {en:'traffic', ru:'пробки', kk:'көлік кептелісі', ex:'The reason why I’m late is traffic.', g:'thing'},
      {en:'polite', ru:'вежливый', kk:'сыпайы', ex:'The person I spoke to was very polite.', g:'sign'},
      {en:'helpful', ru:'отзывчивый, готовый помочь', kk:'көмектесуге дайын', ex:'The woman who works here is very helpful.', g:'sign'},
      {en:'whose', ru:'чей', kk:'кімнің', ex:'The boy whose father is a pilot is my friend.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'The man ___ lives next door is a doctor.', opts:['which', 'where', 'who'], a:2,
       why:'Речь о человеке, поэтому who. Which — для вещей.',
       whyKk:'Сөз адам туралы, сондықтан who. Which зат үшін қолданылады.'},
      {t:'choice', q:'The book ___ I bought is interesting.', opts:['which', 'who', 'where'], a:0,
       why:'Книга — вещь, для неё which или that. Who о книге — частая ошибка.',
       whyKk:'Кітап — зат, оған which не that керек. Кітап туралы who деу — жиі кездесетін қате.'},
      {t:'choice', q:'My brother, ___ lives in Canada, is an engineer.', opts:['who', 'that', 'what'], a:0,
       why:'Когда подробность выделена запятыми, that не ставят. О человеке — who.',
       whyKk:'Қосымша мәлімет үтірмен бөлінсе, that қойылмайды. Адам туралы — who.'},
      {t:'choice', q:'That’s the student ___ laptop was stolen.', opts:['who', 'which', 'whose'], a:2,
       why:'Чей ноутбук? Принадлежность показывает whose.',
       whyKk:'Кімнің ноутбугі? Тиесілікті whose көрсетеді.'},
      {t:'order', ru:'Это ресторан, где мы ужинали.', kk:'Бұл — біз кешкі ас ішкен мейрамхана.',
       words:['That’s', 'the', 'restaurant', 'where', 'we', 'had', 'dinner'], a:'That’s the restaurant where we had dinner'},
      {t:'order', ru:'Я помню день, когда мы впервые встретились.', kk:'Біз алғаш кездескен күн есімде.',
       words:['I', 'remember', 'the', 'day', 'when', 'we', 'first', 'met'], a:'I remember the day when we first met'},
    ]
  },

  i9: {
    title:'Modals', subtitle:'Умел, может быть, должен, не обязан', subtitleKk:'Істей алдым, мүмкін, керек, міндетті емес',
    rule:'could — умел в прошлом или вежливая просьба: Could you help me? might — может быть, уверенности нет: It might snow tomorrow. must — правило, которое ставишь себе сам; have to — правило извне: закон, школа, начальник. don’t have to значит «не обязательно», mustn’t — «нельзя».',
    ruleKk:'could — өткенде істей алдым немесе сыпайы өтініш: Could you help me? might — мүмкін, сенім жоқ: It might snow tomorrow. must — өзіңе қойған ереже; have to — сырттан келген ереже: заң, мектеп, бастық. don’t have to — «міндетті емес», mustn’t — «болмайды».',
    examples:[
      {en:'When I was a child, I could swim very well.', ru:'В детстве я очень хорошо плавал.', kk:'Бала кезімде өте жақсы жүзе алатынмын.'},
      {en:'She might come to the party.', ru:'Может быть, она придёт на вечеринку.', kk:'Ол кешке келуі мүмкін.'},
      {en:'You must wear a seatbelt.', ru:'Нужно пристегнуться ремнём безопасности.', kk:'Қауіпсіздік белдігін тағу керек.'},
      {en:'You don’t have to come if you’re busy.', ru:'Если ты занят, можешь не приходить.', kk:'Бос болмасаң, келуің міндетті емес.'},
    ],
    words:[
      {en:'could', ru:'мог, умел', kk:'істей алатын', ex:'When I was a child, I could swim very well.', g:'word'},
      {en:'might', ru:'может быть', kk:'мүмкін', ex:'It might snow tomorrow.', g:'word'},
      {en:'have to', ru:'приходится, нужно', kk:'керек, тура келеді', ex:'I have to get up early tomorrow.', g:'word'},
      {en:'be able to', ru:'смочь, суметь', kk:'…а алу', ex:'I was able to win the race yesterday.', g:'act'},
      {en:'race', ru:'забег, гонка', kk:'жарыс', ex:'I was able to win the race.', g:'thing'},
      {en:'seatbelt', ru:'ремень безопасности', kk:'қауіпсіздік белдігі', ex:'You must wear a seatbelt.', g:'thing'},
      {en:'flight', ru:'перелёт, рейс', kk:'рейс, ұшу', ex:'He must be tired after the long flight.', g:'thing'},
      {en:'necessary', ru:'необходимый', kk:'қажет', ex:'You don’t have to go. It’s not necessary.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'When I was a child, I ___ swim very well.', opts:['can', 'must', 'could'], a:2,
       why:'Умел в прошлом — could.',
       whyKk:'Өткенде істей алу — could.'},
      {t:'choice', q:'I ___ win the race yesterday.', opts:['could', 'might', 'was able to'], a:2,
       why:'Получилось один раз в прошлом — was able to. Could в таком случае не говорят.',
       whyKk:'Өткенде бір рет қолымнан келді — was able to. Мұндайда could айтылмайды.'},
      {t:'choice', q:'Take an umbrella. It ___ rain later.', opts:['must', 'might', 'has to'], a:1,
       why:'Дождь только возможен, уверенности нет — might.',
       whyKk:'Жаңбыр жаууы мүмкін ғана, сенім жоқ — might.'},
      {t:'choice', q:'You ___ bring food. It’s not necessary.', opts:['don’t have to', 'mustn’t', 'can’t'], a:0,
       why:'Не обязательно — don’t have to. Mustn’t значит «нельзя».',
       whyKk:'Міндетті емес — don’t have to. Mustn’t «болмайды» дегенді білдіреді.'},
      {t:'order', ru:'Мне пришлось рано уйти домой.', kk:'Маған үйге ерте кетуге тура келді.',
       words:['I', 'had', 'to', 'go', 'home', 'early'], a:'I had to go home early'},
      {t:'order', ru:'Тебе вчера надо было делать домашнее задание?', kk:'Кеше саған үй тапсырмасын орындау керек болды ма?',
       words:['Did', 'you', 'have', 'to', 'do', 'homework', 'yesterday'], a:'Did you have to do homework yesterday'},
    ]
  },

  i10: {
    title:'Gerund and Infinitive', subtitle:'Reading или to read', subtitleKk:'Reading пе, to read пе',
    rule:'Герундий — глагол с -ing (reading), инфинитив — to + глагол (to read). После enjoy, finish, avoid, can’t stand и после предлогов идёт -ing: I enjoy reading, good at playing. После want, decide, plan, promise и после easy, happy идёт to: I want to go home, It’s easy to learn English.',
    ruleKk:'Герундий — -ing жалғанған етістік (reading), инфинитив — to + етістік (to read). enjoy, finish, avoid, can’t stand сөздерінен кейін және предлогтан кейін -ing келеді: I enjoy reading, good at playing. want, decide, plan, promise және easy, happy сөздерінен кейін to келеді: I want to go home, It’s easy to learn English.',
    examples:[
      {en:'I enjoy reading.', ru:'Я люблю читать.', kk:'Кітап оқығанды ұнатамын.'},
      {en:'He’s good at playing football.', ru:'Он хорошо играет в футбол.', kk:'Ол футболды жақсы ойнайды.'},
      {en:'She promised to call me.', ru:'Она обещала мне позвонить.', kk:'Ол маған қоңырау шалуға уәде берді.'},
      {en:'It’s easy to learn English.', ru:'Учить английский легко.', kk:'Ағылшын тілін үйрену оңай.'},
    ],
    words:[
      {en:'enjoy', ru:'получать удовольствие, любить', kk:'ұнату, рахаттану', ex:'I enjoy reading.', g:'act'},
      {en:'avoid', ru:'избегать', kk:'қашу, болдырмау', ex:'He avoided talking to her.', g:'act'},
      {en:'can’t stand', ru:'терпеть не могу', kk:'көргім келмейді, жек көремін', ex:'She can’t stand doing homework.', g:'act'},
      {en:'decide', ru:'решить', kk:'шешу', ex:'She decided to learn Italian.', g:'act'},
      {en:'promise', ru:'обещать', kk:'уәде беру', ex:'She promised to call me.', g:'act'},
      {en:'remember', ru:'помнить, не забыть', kk:'есте сақтау, ұмытпау', ex:'Remember to meet her at six.', g:'act'},
      {en:'good at', ru:'хорошо умеет', kk:'…ға шебер', ex:'He’s good at playing football.', g:'sign'},
      {en:'without', ru:'без', kk:'…сыз, …май', ex:'They left without saying goodbye.', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'I enjoy ___.', opts:['reading', 'read', 'to read'], a:0,
       why:'После enjoy глагол идёт с -ing.',
       whyKk:'enjoy-дан кейін етістікке -ing жалғанады.'},
      {t:'choice', q:'I want ___ home.', opts:['go', 'going', 'to go'], a:2,
       why:'После want идёт инфинитив: to + глагол.',
       whyKk:'want-тан кейін инфинитив келеді: to + етістік.'},
      {t:'choice', q:'He’s good at ___ football.', opts:['playing', 'play', 'to play'], a:0,
       why:'После предлога (at, in, without) глагол всегда с -ing.',
       whyKk:'Предлогтан кейін (at, in, without) етістікке әрқашан -ing жалғанады.'},
      {t:'choice', q:'He stopped ___. Now he doesn’t smoke at all.', opts:['smoking', 'to smoke', 'smoke'], a:0,
       why:'Stopped smoking — бросил курить. Stopped to smoke — остановился, чтобы покурить.',
       whyKk:'Stopped smoking — темекіні тастады. Stopped to smoke — темекі шегу үшін тоқтады.'},
      {t:'order', ru:'Я не знаю, что делать.', kk:'Не істерімді білмеймін.',
       words:['I', 'don’t', 'know', 'what', 'to', 'do'], a:'I don’t know what to do'},
      {t:'order', ru:'Они ушли, не попрощавшись.', kk:'Олар қоштаспай кетіп қалды.',
       words:['They', 'left', 'without', 'saying', 'goodbye'], a:'They left without saying goodbye'},
    ]
  },

  i11: {
    title:'Reported Speech', subtitle:'Пересказать чужие слова', subtitleKk:'Біреудің сөзін жеткізу',
    rule:'Пересказываешь чужие слова после said — время сдвигается на шаг назад: am → was, will → would, can → could, saw → had seen. Меняются и местоимения, и слова времени: tomorrow → the next day, yesterday → the day before. Просьбу передают через told или asked + to: She told me to sit down.',
    ruleKk:'Біреудің сөзін said арқылы жеткізгенде шақ бір саты артқа жылжиды: am → was, will → would, can → could, saw → had seen. Есімдіктер мен уақыт сөздері де өзгереді: tomorrow → the next day, yesterday → the day before. Өтінішті told немесе asked + to арқылы жеткіземіз: She told me to sit down.',
    examples:[
      {en:'She said she was tired.', ru:'Она сказала, что устала.', kk:'Ол шаршағанын айтты.'},
      {en:'He said he would help me.', ru:'Он сказал, что поможет мне.', kk:'Ол маған көмектесетінін айтты.'},
      {en:'She asked where I lived.', ru:'Она спросила, где я живу.', kk:'Ол менің қайда тұратынымды сұрады.'},
      {en:'She told me not to be late.', ru:'Она сказала мне не опаздывать.', kk:'Ол маған кешікпе деді.'},
    ],
    words:[
      {en:'say', ru:'сказать', kk:'айту', ex:'She said she was busy.', g:'act'},
      {en:'tell', ru:'сказать (кому-то)', kk:'(біреуге) айту', ex:'He told me that he liked cats.', g:'act'},
      {en:'ask', ru:'спросить, попросить', kk:'сұрау, өтіну', ex:'She asked me to help her.', g:'act'},
      {en:'whether', ru:'ли', kk:'…ма, …ме', ex:'She asked whether he was coming.', g:'word'},
      {en:'the next day', ru:'на следующий день', kk:'келесі күні', ex:'She said she would call me the next day.', g:'time'},
      {en:'the day before', ru:'накануне', kk:'бір күн бұрын', ex:'She said she had met him the day before.', g:'time'},
      {en:'coffee', ru:'кофе', kk:'кофе', ex:'She asked if I liked coffee.', g:'thing'},
      {en:'late', ru:'опоздавший, поздно', kk:'кешіккен', ex:'She told me not to be late.', g:'sign'},
    ],
    tasks:[
      {t:'choice', q:'“I am tired.” She said she ___ tired.', opts:['is', 'be', 'was'], a:2,
       why:'После said время сдвигается назад: am → was.',
       whyKk:'said-тан кейін шақ артқа жылжиды: am → was.'},
      {t:'choice', q:'“I will call you.” She said she ___ call me.', opts:['will', 'would', 'can'], a:1,
       why:'В пересказе will становится would.',
       whyKk:'Сөзді жеткізгенде will — would болады.'},
      {t:'choice', q:'“Do you like coffee?” She asked ___ I liked coffee.', opts:['if', 'that', 'do'], a:0,
       why:'Вопрос, на который отвечают «да» или «нет», пересказывают через if или whether.',
       whyKk:'«Иә» не «жоқ» деп жауап берілетін сұрақ if немесе whether арқылы жеткізіледі.'},
      {t:'choice', q:'“Don’t be late.” She told me ___ late.', opts:['not to be', 'don’t be', 'not be'], a:0,
       why:'Запрет передают через not to + глагол.',
       whyKk:'Тыйымды not to + етістік арқылы жеткіземіз.'},
      {t:'order', ru:'Она спросила, где я живу.', kk:'Ол менің қайда тұратынымды сұрады.',
       words:['She', 'asked', 'where', 'I', 'lived'], a:'She asked where I lived'},
      {t:'order', ru:'Он сказал, что видел её накануне.', kk:'Ол оны бір күн бұрын көргенін айтты.',
       words:['He', 'said', 'he', 'had', 'seen', 'her', 'the', 'day', 'before'], a:'He said he had seen her the day before'},
    ]
  },

  i12: {
    title:'Question Tags', subtitle:'Переспросить: «…, правда?»', subtitleKk:'Қайта сұрау: «…, солай ма?»',
    rule:'Короткий вопрос в конце фразы просит подтвердить: You are a student, aren’t you? К утверждению добавляют хвостик с not, к отрицанию — без not. В хвостике тот же вспомогательный глагол (is, can, have), а если его нет — do, does или did: She likes music, doesn’t she?',
    ruleKk:'Сөйлем соңындағы қысқа сұрақ айтылғанды растап алу үшін керек: You are a student, aren’t you? Болымды сөйлемге not-пен келетін сұрақ, болымсызға not-сыз сұрақ жалғанады. Сұрақта сол көмекші етістік тұрады (is, can, have), ол жоқ болса — do, does немесе did: She likes music, doesn’t she?',
    examples:[
      {en:'You’re a student, aren’t you?', ru:'Ты ведь студент, да?', kk:'Сен студентсің ғой, солай ма?'},
      {en:'She can drive, can’t she?', ru:'Она ведь умеет водить?', kk:'Ол көлік жүргізе алады ғой, солай ма?'},
      {en:'They don’t live here, do they?', ru:'Они ведь здесь не живут?', kk:'Олар мұнда тұрмайды ғой, солай ма?'},
      {en:'Let’s go for a walk, shall we?', ru:'Давай прогуляемся, а?', kk:'Серуендеп қайтайық, қалай қарайсың?'},
    ],
    words:[
      {en:'drive', ru:'водить машину', kk:'көлік жүргізу', ex:'She can drive, can’t she?', g:'act'},
      {en:'walk', ru:'прогулка', kk:'серуен', ex:'Let’s go for a walk, shall we?', g:'thing'},
      {en:'meat', ru:'мясо', kk:'ет', ex:'She never eats meat, does she?', g:'thing'},
      {en:'movie', ru:'фильм', kk:'фильм', ex:'She’s seen that movie, hasn’t she?', g:'thing'},
      {en:'sure', ru:'уверенный', kk:'сенімді', ex:'You’re sure, aren’t you?', g:'sign'},
      {en:'never', ru:'никогда', kk:'ешқашан', ex:'She never eats meat, does she?', g:'word'},
      {en:'hardly', ru:'почти не', kk:'әрең, дерлік …май', ex:'He hardly works, does he?', g:'word'},
      {en:'shall we', ru:'давай…?', kk:'…айық па?', ex:'Let’s sit down, shall we?', g:'word'},
    ],
    tasks:[
      {t:'choice', q:'You are tired, ___?', opts:['are you', 'aren’t you', 'don’t you'], a:1,
       why:'Фраза утвердительная, значит хвостик с not, а глагол тот же: are → aren’t.',
       whyKk:'Сөйлем болымды, демек сұрақ not-пен келеді, етістік сол күйі: are → aren’t.'},
      {t:'choice', q:'She likes music, ___?', opts:['doesn’t she', 'isn’t she', 'don’t she'], a:0,
       why:'Вспомогательного глагола нет, у глагола -s, значит в хвостике does: doesn’t she.',
       whyKk:'Көмекші етістік жоқ, етістікте -s бар, демек сұрақта does тұрады: doesn’t she.'},
      {t:'choice', q:'I am late, ___?', opts:['amn’t I', 'aren’t I', 'don’t I'], a:1,
       why:'I am — особый случай, хвостик у него aren’t I.',
       whyKk:'I am — ерекше жағдай, оның сұрағы aren’t I болады.'},
      {t:'choice', q:'He hardly works, ___?', opts:['doesn’t he', 'does he', 'is he'], a:1,
       why:'Hardly уже делает фразу отрицательной, поэтому хвостик без not.',
       whyKk:'Hardly сөйлемді болымсыз етеді, сондықтан сұрақ not-сыз келеді.'},
      {t:'order', ru:'Давай прогуляемся, а?', kk:'Серуендеп қайтайық, қалай қарайсың?',
       words:['Let’s', 'go', 'for', 'a', 'walk,', 'shall', 'we'], a:'Let’s go for a walk, shall we'},
      {t:'order', ru:'Ты ведь из Казахстана?', kk:'Сен Қазақстаннансың ғой, солай ма?',
       words:['You’re', 'from', 'Kazakhstan,', 'aren’t', 'you'], a:'You’re from Kazakhstan, aren’t you'},
    ]
  },

  i13: {
    title:'Enough and Too', subtitle:'Достаточно или слишком', subtitleKk:'Жеткілікті ме, тым артық па',
    rule:'too ставят перед прилагательным, и это «слишком», то есть проблема: It’s too cold to swim. enough ставят после прилагательного, и это «достаточно»: The water is warm enough to swim. Перед существительным enough идёт первым: We have enough chairs.',
    ruleKk:'too сын есімнің алдына қойылады, мағынасы — «тым», яғни мәселе бар: It’s too cold to swim. enough сын есімнен кейін тұрады, мағынасы — «жеткілікті»: The water is warm enough to swim. Зат есімнің алдында enough бірінші тұрады: We have enough chairs.',
    examples:[
      {en:'She is old enough to drive.', ru:'Она уже достаточно взрослая, чтобы водить.', kk:'Оның көлік жүргізуге жасы жетеді.'},
      {en:'It’s too cold to swim.', ru:'Слишком холодно, чтобы купаться.', kk:'Шомылуға тым суық.'},
      {en:'We have enough money to buy the tickets.', ru:'Денег на билеты нам хватает.', kk:'Билет алуға ақшамыз жетеді.'},
      {en:'This bag is too heavy to carry.', ru:'Эта сумка слишком тяжёлая, её не унести.', kk:'Бұл сөмке көтеруге тым ауыр.'},
    ],
    words:[
      {en:'enough', ru:'достаточно', kk:'жеткілікті', ex:'He is tall enough to play basketball.', g:'word'},
      {en:'too', ru:'слишком', kk:'тым', ex:'The dress is too big.', g:'word'},
      {en:'too many', ru:'слишком много (того, что считают)', kk:'тым көп (саналатын)', ex:'I have too many books.', g:'word'},
      {en:'tall', ru:'высокий (о человеке)', kk:'ұзын бойлы', ex:'He is tall enough to play basketball.', g:'sign'},
      {en:'heavy', ru:'тяжёлый', kk:'ауыр', ex:'This bag is too heavy to carry.', g:'sign'},
      {en:'dark', ru:'тёмный, темно', kk:'қараңғы', ex:'It’s too dark to see anything.', g:'sign'},
      {en:'carry', ru:'нести', kk:'көтеріп апару', ex:'This bag is too heavy to carry.', g:'act'},
      {en:'hold', ru:'вмещать', kk:'сыйғызу', ex:'The room is big enough to hold 50 people.', g:'act'},
    ],
    tasks:[
      {t:'choice', q:'He is ___ to play basketball.', opts:['enough tall', 'too tall enough', 'tall enough'], a:2,
       why:'Enough ставят после прилагательного: tall enough. Too и enough вместе не ставят.',
       whyKk:'Enough сын есімнен кейін тұрады: tall enough. Too мен enough бірге қойылмайды.'},
      {t:'choice', q:'This bag is ___ heavy to carry.', opts:['enough', 'too', 'very'], a:1,
       why:'Унести не получается, значит «слишком» — too.',
       whyKk:'Көтеріп апару мүмкін емес, яғни «тым» — too.'},
      {t:'choice', q:'We don’t have ___ to finish the test.', opts:['time enough', 'too time', 'enough time'], a:2,
       why:'Перед существительным enough идёт первым: enough time.',
       whyKk:'Зат есімнің алдында enough бірінші тұрады: enough time.'},
      {t:'choice', q:'I have too ___ books.', opts:['many', 'much', 'little'], a:0,
       why:'Книги можно посчитать, поэтому too many. Too much — для того, что не считают: too much water.',
       whyKk:'Кітапты санауға болады, сондықтан too many. Too much саналмайтын затқа айтылады: too much water.'},
      {t:'order', ru:'Слишком темно, ничего не видно.', kk:'Тым қараңғы, ештеңе көрінбейді.',
       words:['It’s', 'too', 'dark', 'to', 'see', 'anything'], a:'It’s too dark to see anything'},
      {t:'order', ru:'Комната достаточно большая, чтобы вместить 50 человек.', kk:'Бөлме 50 адамды сыйғызатындай үлкен.',
       words:['The', 'room', 'is', 'big', 'enough', 'to', 'hold', '50', 'people'], a:'The room is big enough to hold 50 people'},
    ]
  },

  i14: {
    title:'Reflexive Pronouns', subtitle:'Себя и сам: myself, herself', subtitleKk:'Өзі: myself, herself',
    rule:'myself, yourself, himself, herself, itself, ourselves, themselves ставят, когда действие возвращается к тому, кто его делает: I cut myself while cooking. Они же значат «сам, без помощи»: I did it myself. Если двое делают что-то друг другу, нужно each other: They looked at each other.',
    ruleKk:'myself, yourself, himself, herself, itself, ourselves, themselves әрекет оны істеген адамның өзіне қайтқанда қойылады: I cut myself while cooking. Олар «өзім, ешкімнің көмегінсіз» дегенді де білдіреді: I did it myself. Екі адам бір-біріне бір нәрсе істесе, each other керек: They looked at each other.',
    examples:[
      {en:'She taught herself to play guitar.', ru:'Она сама научилась играть на гитаре.', kk:'Ол гитара ойнауды өз бетімен үйренді.'},
      {en:'They enjoyed themselves at the party.', ru:'Они хорошо повеселились на вечеринке.', kk:'Олар кеште көңілді уақыт өткізді.'},
      {en:'I did it myself.', ru:'Я сделал это сам.', kk:'Мұны өзім істедім.'},
      {en:'She looked at herself in the mirror.', ru:'Она посмотрела на себя в зеркало.', kk:'Ол айнадан өзіне қарады.'},
    ],
    words:[
      {en:'myself', ru:'себя, сам (я)', kk:'өзім, өзімді', ex:'I cut myself while cooking.', g:'word'},
      {en:'herself', ru:'себя, сама (она)', kk:'өзі, өзін (ол, әйел)', ex:'She taught herself to play guitar.', g:'word'},
      {en:'themselves', ru:'себя, сами (они)', kk:'өздері, өздерін', ex:'They enjoyed themselves at the party.', g:'word'},
      {en:'each other', ru:'друг друга', kk:'бір-бірін', ex:'They looked at each other.', g:'word'},
      {en:'introduce', ru:'представить', kk:'таныстыру', ex:'Please introduce yourself to the class.', g:'act'},
      {en:'behave', ru:'вести себя', kk:'өзін ұстау', ex:'The children behaved themselves.', g:'act'},
      {en:'hurt', ru:'поранить, ушибить', kk:'жарақаттау', ex:'Don’t hurt yourself with that knife.', g:'act'},
      {en:'mirror', ru:'зеркало', kk:'айна', ex:'She looked at herself in the mirror.', g:'thing'},
    ],
    tasks:[
      {t:'choice', q:'I cut ___ while cooking.', opts:['me', 'mine', 'myself'], a:2,
       why:'Порезал сам себя: действие вернулось к тому, кто его сделал, — myself.',
       whyKk:'Өзімді-өзім кесіп алдым: әрекет істеген адамның өзіне қайтты — myself.'},
      {t:'choice', q:'She taught ___ to play guitar.', opts:['her', 'himself', 'herself'], a:2,
       why:'Она учила саму себя — herself. Himself говорят о мужчине.',
       whyKk:'Ол өзін-өзі үйретті — herself. Himself ер адам туралы айтылады.'},
      {t:'choice', q:'They enjoyed ___ at the party.', opts:['themselves', 'them', 'theirselves'], a:0,
       why:'Enjoy oneself — хорошо провести время. С they — themselves; theirselves такого слова нет.',
       whyKk:'Enjoy oneself — көңілді уақыт өткізу. they-мен — themselves; theirselves деген сөз жоқ.'},
      {t:'choice', q:'Ali looked at Dana, and Dana looked at Ali. They looked at ___.', opts:['themselves', 'ourselves', 'each other'], a:2,
       why:'Двое смотрят друг на друга — each other. Themselves значило бы, что каждый смотрит на себя.',
       whyKk:'Екеуі бір-біріне қарайды — each other. Themselves десек, әрқайсысы өзіне қарағаны болар еді.'},
      {t:'order', ru:'Можешь представиться?', kk:'Өзіңді таныстыра аласың ба?',
       words:['Can', 'you', 'introduce', 'yourself'], a:'Can you introduce yourself'},
      {t:'order', ru:'Не поранься этим ножом.', kk:'Ана пышақпен қолыңды кесіп алма.',
       words:['Don’t', 'hurt', 'yourself', 'with', 'that', 'knife'], a:'Don’t hurt yourself with that knife'},
    ]
  },

};

/* ══════════════════════════════════════════════════════════════════════
   3b. ТЕКСТЫ ДЛЯ ЧТЕНИЯ
   Шаг «Чтение» в практике урока: короткий текст, где слова этого урока
   кликабельны. Нажал — флип-карта с переводом и примером из словаря
   урока, поэтому перевод здесь не повторяется.

   [слово] — слово урока; [форма|слово], когда в тексте другая форма
   (apples → apple). Ключ после черты — ровно поле en из words урока.
   \n — новый абзац. Урока здесь нет — шага «Чтение» у него нет.
   node app/check_reading.mjs проверяет, что каждое слово урока в тексте
   есть и что каждая пометка находит своё слово.
   ══════════════════════════════════════════════════════════════════ */
window.TEXTS = {
  b1: 'It is Sunday morning. Mom puts [bread] and [fruit] on the table. I take a [spoon] and eat my yogurt.\n' +
      'After breakfast we go to the park by [train]. In the park there is a big [tree] with pink [flowers]. ' +
      'The sky is [blue]. I sit under the tree and read my [book].',
  b2: 'Look at the market table. What do you [see]? I [see] [ten] [apples|apple]. ' +
      '[One] apple is [green], and nine apples are [red].\n' +
      'Next to them there is a [yellow] banana. My bag is [blue]. I buy [one] kilo of apples and go home.',
  b3: 'There are [many] things in our kitchen. There are four [chairs|chair] and a table. ' +
      'On the table there are two [books|book] and three [apples|apple].\n' +
      'We have some [bread], but not [much]. There is [water] in the bottle. ' +
      'My brother puts too [much] [sugar] in his tea!',
  b4: 'Today is my birthday. We are in a small café. I want [soup] and a [salad]. My sister wants a [sandwich].\n' +
      'Dad drinks [coffee] and Mom drinks [tea]. I drink [water]. ' +
      'Then the waiter brings a big [cake] and [ice cream]. What a great day!',
  b5: 'I live in a big [city]. There are many [cars|car] and [buses|bus] on the streets. ' +
      'Every morning I go to school by [bus]. I sit by the [window] and look outside.\n' +
      'My two [friends|friend] sit next to me. One [child] reads a [book], another eats an [apple]. ' +
      'Our [city] has many [children|child] and many schools.',
  b6: 'We are going on a picnic. Do we have [any] bread? Yes, we have [some]. ' +
      'Do we have [much] [water]? No, only [a little]. Let\'s buy [some] water.\n' +
      'We have [a few] apples, but not [many]. How [much] [money] do we have? Only [a little], but it is enough.',
  b7: 'This is my family. [I] am Aruzhan. My [father] is a doctor. [He] works in a hospital. ' +
      'My [mother] is a teacher. [She] teaches English.\n' +
      'We have a cat. [It] is white and very lazy. My grandparents live in a village. ' +
      '[They] have a big garden. On Sundays [we] visit them.',
  b8: 'Tomorrow is Asel\'s birthday. I call my brother. "Can you help [me]?" I ask. ' +
      '"Of course, I can help [you]," he says.\n' +
      'We buy a book for [her]. Dad wants to [give] her flowers. Our uncle is late, so we wait for [him]. ' +
      'Our cousins come too, and we invite [them] to dinner. ' +
      'Asel opens the box and says: "Thank you! I love [it]!" Then she hugs [us].',
  b9: 'I want a new phone. The black phone is [bigger] [than] the white one. ' +
      'The white phone is [lighter] and [cheaper].\n' +
      'The black phone is [more expensive], but its camera is [better]. ' +
      'The shop near my house is [closer] [than] the mall, and the line in the mall is [longer]. ' +
      'So I buy the white phone in the small shop.',
  b10: 'Let me tell you about my class. Daniyar is the [tallest] boy. Aigerim is the [kindest] girl: she always helps.\n' +
       'Timur is very [talkative]. He talks all day! He is also the [funniest]. ' +
       'Our school café has the [cheapest] lunch in town, and the soup is [delicious]. ' +
       'The [most comfortable|comfortable] chair is in the library. It is the [best] place to read.',
  b11: 'Welcome to my house! It is small but [comfortable]. This is the [living room]. ' +
       'We have a big grey [sofa] here. Next to it is the [kitchen], where my mom cooks.\n' +
       'My [bedroom] is upstairs. The [bathroom] is next to my bedroom. ' +
       'Behind the house there is a little [garden]. It is very [quiet] there in the evening.',
  b12: 'Every summer my family goes on [holiday]. [Where] do we go? To the mountains near Almaty. ' +
       '[When] do we go? In July. [Who] goes with us? My cousins.\n' +
       '[Why] the mountains? Because the [weather] is cool there. [What] do we do? We walk and swim in the lake. ' +
       '[How long] do we stay? Ten days.',
  b13: 'I have a big family. My [grandparents] live in Shymkent. My [uncle] Serik is my father\'s brother, ' +
       'and my [aunt] Gulnar is my mother\'s sister. Their son Arman is my [cousin]. He is also my [best friend].\n' +
       'At school my [classmate] Dana sits next to me. In football, Timur is my [team-mate]. ' +
       'I also have an [online friend] from Turkey. We play games together.',
  b14: 'Today Aliya is [absent]. She is sick. Her mom goes to the shop. [How much] [milk] does she need? One litre. ' +
       '[How many] [apples|apple] does she need? Five. She also buys [water] and a little [sugar].\n' +
       'In the evening Aliya asks her friend: "[How much] [homework] do we have?" "Not much," says her friend.',

  e1: 'Hi, I am Aruzhan. I am 12 years old, and I am from Almaty. It is seven in the morning. I am [awake], but my brother Timur is [sleepy]. ' +
      'He is still in his [room]. My mom is a [doctor], and she is at work. Our cat is [hungry].\n' +
      'Now it is eight. It is sunny and warm [outside]. Timur and I are at school. Dana and Arman are my [classmates|classmate]. ' +
      'They are funny. We are [ready] for the English lesson.',

  e2: 'My name is Dana. This is my family. My father is [strong], and my mother is [kind]. Our [grandparents] live in Almaty. ' +
      'Their house is big, and their dog is old. When we come, the dog [wags|wag] its [tail].\n' +
      'My [best friend] is Aruzhan. Her brother Timur is very [funny]. His [jacket] is green, and his bag is red. ' +
      'Our school is near my house, and our teacher is nice. I love my family and my friends.',

  e3: 'After school, Aruzhan and Timur look in a big box in their classroom. Timur finds a black [hat]. "Is it [mine]?" he asks. ' +
      '"No, it is not [yours]. It is Arman’s hat. It is his." Then Aruzhan finds a pink [phone]. "This phone is Dana’s. It is [hers]."\n' +
      'There are two small [toys|toy] in the box too. The twins Ali and Ainur play with them, so they are [theirs]. ' +
      'The long red [scarf] is the teacher’s. And the blue pen? Timur smiles: "Oh, that pen is mine."',

  e4: 'It is Sunday morning. Timur is in the kitchen with his [uncle]. His uncle is an [engineer] in Almaty. ' +
      'He puts the [kettle] on and eats a [cookie]. Timur [needs|need] an apple. The apple is on the table.\n' +
      'After breakfast, they go to the park for an [hour]. Timur sees a dog. The dog is white and very friendly. ' +
      'At home, Timur looks for his blue [folder]. He often [forgets|forget] it at school, but today the folder is in his bag.',

  e5: 'Aruzhan and her brother Timur are at the market in Almaty. Aruzhan has a bag in her hand. "[This] bag is heavy," she says. "[These] apples are very [sweet]." ' +
      'Timur looks at a shop far away. "Look at [those] [shoes|shoe]. And [that] red jacket is nice."\n' +
      '[Those] children near the shop are [noisy]. They are playing with a ball. Timur buys three [pencils|pencil] for school. ' +
      '"[These] two are for me, and [this] one is for you," he tells Aruzhan.',

  e6: 'Dana lives in Almaty. Her room is small. There is a desk near the window, and there are [many] books on the [shelf]. ' +
      'There is a tall tree [outside] the window. Her little brother Timur often plays here, so there are [some] [toys|toy] on the [floor].\n' +
      'In the evening Dana is hungry. She opens the [fridge]. There is milk, but there aren’t [any] apples. ' +
      '"Mom, are there [any] apples in your bag?" she asks. "No, there aren’t," says Mom.',

  e7: 'Aruzhan lives in Almaty. She has got a [brother], Timur, and a little [sister], Dana. Dana is five. ' +
      'She has got big brown [eyes|eye] and [long] hair. She has got [a lot of] [dolls|doll].\n' +
      'The family has got a cat too. It has got a long [tail] and green eyes. ' +
      'Timur hasn’t got a phone, but he has got a new bike. Today the children haven’t got time to play. They have got a lot of [homework].',

  e8: 'It is Saturday, and Timur’s family is in the park. Timur is [riding|ride] his bike. He is [wearing|wear] a helmet. ' +
      'His little sister Dana is [running|run] after a ball. Grandpa is [sitting|sit] on a [bench] and reading a [newspaper].\n' +
      'Mom is talking to Aunt Saule on the phone [now]. "What are you doing [at the moment]?" asks Saule. ' +
      '"We are having a picnic," says Mom. "The kids are playing, and Grandpa isn’t sleeping. He is reading."',

  e9: 'Aruzhan [lives|live] in Almaty with her family. She [always] [gets up|get up] at seven. Her mother cooks [breakfast], and they eat together. ' +
      'Her father [works|work] in an office and goes there [every day].\n' +
      'After school Aruzhan does her homework. Her brother Timur [watches|watch] TV in the evening, but Aruzhan doesn’t. She reads books. ' +
      'Their cat [never] gets up early. It sleeps a lot and drinks milk every morning.',

  e10: 'Dana and her mum are in a café in Almaty. The waiter smiles: "Would you like to see the [menu]?" Dana says: "Yes, [please]." ' +
       'Later he asks: "Would you like to [order] [dessert]?" Mum says: "No, thank you."\n' +
       'In the evening Dana calls her friend Timur: "Do you want to [go shopping] tomorrow?" Timur answers: "Not really. I want to [learn] to play the guitar. ' +
       'But do you want to go to the [cinema] [tonight]?"',

  e11: 'Timur lives in Almaty, but his uncle lives [abroad]. Every morning Timur eats [quickly] and runs to school. ' +
       'He speaks English [well], and he [sometimes] helps his friends with homework.\n' +
       'Today is Saturday. [Yesterday] it was cold, but now the sun is out, and the boys are playing football [outside]. ' +
       'In the evening Timur’s dad drives home [carefully]. When they get home, it is [already] dark.',

  e12: 'My name is Aruzhan. This is my room. My bed is [next to] the window, and my desk is [between] the bed and the door. ' +
       'There is a lamp [above] the desk. My books are on the [shelf], and my cat sleeps [under] the bed.\n' +
       'We live in Almaty. There is a small park [in front of] our house and a garden [behind] it. ' +
       'My school is [opposite] the bank, only five minutes from home.',

  e13: 'My name is Timur. I can [speak] three [languages|language]: Kazakh, Russian and English. ' +
       'I can [swim] and [draw], but I can’t play the [piano]. My little sister can’t read yet, but she can sing.\n' +
       'Today we have an English [exam]. During the exam we can’t talk. After it I ask the teacher: "Can we [leave] now?" ' +
       '"Yes, you can," she says. We run outside. I can run fast, but I can’t [fly].',

  e14: 'It’s Dana’s first day at a new school. Mom says: "Be [careful] and stop at the [traffic lights]." ' +
       'The teacher smiles: "Come in and [sit down], please. Don’t [worry]."\n' +
       'In the library a boy is loud. The teacher says: "Be [quiet], please. Don’t [shout]." ' +
       'In the art room she says: "Don’t [touch] the paint, it’s wet." At home Mom says: "Wash your hands, please." At dinner Dad asks: "Pass the [salt], please."',

  p1: 'Last Saturday Timur [woke up|wake up] early. He [drank|drink] a cup of tea, and his dad [drove|drive] him to the village. ' +
      'They [visited|visit] Timur’s grandmother. She [gave|give] him a big plate of baursaks.\n' +
      'In the evening they went to a shopping centre in Almaty, and Timur [bought|buy] new headphones. ' +
      'He didn’t sleep in the car on the way home. Two days [ago] his teacher asked: "What did you do at the weekend?" ' +
      'Timur told her everything, and [yesterday] he wrote a story about it.',

  p2: 'Yesterday at 7 PM everyone in Dana’s family was busy. Her brother was [watching|watch] a football match on TV, ' +
      'and Dana was [cooking|cook] dinner. Grandpa was [sleeping|sleep] on the sofa [while] the kids were playing outside.\n' +
      '[Suddenly] the phone [rang|ring]. It was Aunt Saule: "I was [walking|walk] in the park, and I saw your old teacher. ' +
      'What were you doing?" Dana laughed: "I wasn’t [relaxing|relax], I was cooking."',

  p3: 'When Aruzhan was a [child], her family lived in a small village near Shymkent. She used to [ride] her bike to school every day. ' +
      'Her best friend Madina used to [live] next door, but then she [moved|move] to Astana.\n' +
      'Now Aruzhan lives in Almaty. There used to be a big [supermarket] near her flat, but now it’s a bank. ' +
      'She didn’t use to like [seafood], but now she loves it. She used to wear [glasses], too. ' +
      'Every summer her family used to go to the [seaside] in Aktau.',

  p4: 'Timur has a maths exam tomorrow, and he is nervous. "I think I will [pass] it," he says, "but I’m not sure." ' +
      'His sister Dana smiles: "You will [probably] get a good mark. I will help you, I [promise]."\n' +
      'In the evening Timur says: "I’m really [thirsty]." Dana answers: "Wait, I will [bring] you some water." ' +
      'Then the phone rings. "I will [answer] it," says Mom. Dad looks out of the window: "The [weather] will be sunny tomorrow." ' +
      'Timur won’t [forget] this evening.',

  p5: 'Timur has big plans. His family is going to [move] to a bigger flat [next month]. His sister Dana is going to study [abroad]. ' +
      'Timur is going to [buy] a new laptop, but first he is going to wait for a [discount].\n' +
      'Now Timur and his brother are in the park. Look at those black [clouds|cloud]. It is going to rain. ' +
      'His brother is running on the wet path. "Stop, you are going to [fall]," Timur shouts. ' +
      'A man is riding a bike too fast. He is going to have an [accident].',

  p6: 'Aruzhan has a busy week. [Tonight] she is [meeting|meet] her friend Dana at 7 PM. On Tuesday her class is visiting the [museum]. ' +
      'On Thursday her dad is [flying|fly] to Astana for work. He has already [booked|book] the [tickets|ticket].\n' +
      'On Friday her big brother Timur is having a job [interview]. "When are you [leaving|leave]?" Aruzhan asks. ' +
      '"At nine in the morning. The office is far." On Saturday the family isn’t going anywhere. They are staying at home.',

  p7: 'Dana works at a bank in Almaty. All workers have to [wear] a [uniform], and the [rules|rule] are strict: you mustn’t be [late], ' +
      'and you mustn’t [smoke] near the door. Yesterday Dana had to stay at work until 8 PM.\n' +
      'Today she is tired, but she must finish an important [report]. She decided it herself. Her friend Timur is [sick], ' +
      'so he doesn’t have to come to work. In the evening Dana doesn’t have to cook: her brother [orders|order] pizza.',

  p8: 'Aidar has a terrible [headache] today. He asks his sister Aruzhan for [advice]. "You should take a [break] and drink some water," she says. ' +
      '"And you shouldn’t play games at night." Aidar wants a new phone. "You should [save] money every month and [spend] less on sweets."\n' +
      '"Should I [apologize] to Mom? I was rude yesterday." "Yes, you should. And don’t [worry] about small things." ' +
      'Their dad should be home at six. He always comes [on time].',

  p9: 'Last summer Timur [moved|move] from Shymkent to Astana for a new job. At first everything was hard. ' +
      'He couldn’t [get used to] the cold wind, and the [noise] of the big city kept him awake at night.\n' +
      'Now he is slowly [getting used to|get used to] [getting up|get up] at six, and the new work [schedule] doesn’t seem so strange anymore. ' +
      'He has got used to [spicy] food and to living [alone]. "People can [adapt] to anything," he says.',

  p10: 'On Saturday Dana and her brother Timur want to bake a cake for Mom. Dana opens the [fridge]: there are [a few] eggs, ' +
       'but there isn’t [any] milk. "We [need] milk and some [sugar]," she says.\n' +
       'Timur looks in his pocket. He has only [a little] money, just a few [coins|coin]. Is it [enough]? ' +
       'At the shop they buy milk, but the sugar costs too much. Luckily, Grandma has a lot of sugar at home.',

  p11: 'Last week Aidar had an English exam. The night before, he was very [tired], [so] he went to bed early. ' +
       '[Although] he didn’t study much, he [passed|pass] the exam.\n' +
       'After that he wanted to buy new headphones in a shop in Almaty. [However], they were too [expensive]. ' +
       'He didn’t buy them [because] he was saving money for a trip. On the way home the bus was late, and he [missed|miss] his favorite TV show.',

  p12: 'My friend Timur loves to travel. He has been to Turkey and China, but he has [never] visited Japan. He often asks me: "Have you [ever] been abroad?" ' +
       'I always say no. We have been friends [since] primary school, and I love his stories.\n' +
       'Timur’s family is waiting for guests from Shymkent. "Have they arrived [yet]?" asks his mom. "Yes, they have [just] come," says Timur. ' +
       'He has [already] [met|meet] them at the station. Now he can’t find his phone. He has [lost|lose] it again.',

  p13: 'Aruzhan has a busy Saturday. In the morning she goes to the [library] to study for her exam. ' +
       'Then she goes to the [post office] to send a letter to her grandma in Taraz.\n' +
       'She is [saving|save] money for a new phone, so at the shop she buys only [bread]. At home Dad shows her a new [tool] for cutting wood. ' +
       'In the evening her class has an online [meeting]. Then Aruzhan calls Dana to [ask] a question and uses an app for [checking|check] the weather.',

  p14: 'Dana has a big exam on Monday. Her mom says: "[If] you study this weekend, you will [pass] it." ' +
       'Dana wants to see a film, but she decides to [stay] at home. "[Unless] I study, I will fail," she thinks.\n' +
       'On Monday Dana gets up late. "[Hurry up], or you will [miss] the bus," says her brother. Dad drives her to school, but not too fast: ' +
       '"If I drive too fast, we will have an [accident]." Dana smiles: "If I get a good mark, I will [travel] to Astana in summer."',

  i1: 'Last Friday was a bad day. I left work late, and [by the time] I [arrived|arrive] at the station, my train had gone. ' +
      'Then I [realized|realize] that I had left my wallet in the office.\n' +
      'When I finally got home, I was [exhausted]. Luckily, Mom had [prepared|prepare] dinner, and my little brother had [finished|finish] his homework. ' +
      'He told me he had [saved|save] [enough] money for a new bike.',
  i2: 'Yesterday our team had a big match. We had been training [since] March, so we felt ready. ' +
      'It had been raining [all day], and the field was wet.\n' +
      'We had been [running|run] for ninety minutes when the game ended. After the match we were [dirty] and very [hungry]. ' +
      'Mom had been [waiting|wait] for us with dinner, and we sat at the table [until] ten. ' +
      'Later I found a [letter] from the coach in my bag: "You played well!"',
  i3: 'My name is Dana. I have been [living|live] in Almaty for five years. [Lately] I have been learning to cook. ' +
      'My friends ask: "[How long] have you been cooking?" Only two months!\n' +
      'Today it has been [raining|rain] since the morning, so I am at home. I have been [writing|write] my food blog [all morning], ' +
      'and I am a little [tired] now. [Recently] a hundred new people have started reading it.',
  i4: 'Tomorrow is a busy day for my family. [At this time tomorrow] my dad will be [flying|fly] to Astana for work. ' +
      'Mom will be working in her [office] [as usual].\n' +
      'My little sister will be [sleeping|sleep] when I come home. In the evening I will be studying, so I will call my friend [later]. ' +
      '[Next week] our cousins will be visiting us. Will you be [joining|join] us for dinner on Saturday?',
  i5: 'My brother Arman is a student. He will have [graduated|graduate] [by] next June. ' +
      'Now he is working on a big [project]: a model of a new [bridge] for our town.\n' +
      'Our family is busy too. We will have [moved|move] to a new flat before spring. ' +
      'This morning Arman [left|leave] for Astana by train. It’s nine now, so he will have [reached|reach] the city [by now].',
  i6: 'What would you do if you were [rich]? My friend Aliya often asks this question. ' +
      'She says: "[If] I won the [lottery], I [would] [travel] around the world."\n' +
      'My answer is different. If I were a [millionaire], I would open a free school. ' +
      'But now I am a student, and I am [busy] with my [exam]. If I had more time, I would read more books.',
  i7: 'Our school was built in 1975. It is [known for] its big library. Last summer the old roof was [repaired|repair], ' +
      'and now the walls are being [painted|paint].\n' +
      'Last week my [wallet] was [stolen|steal] on the bus. The next day it was found by a teacher. ' +
      'My friend Asel is [interested in] history. She told me that our first director [was born|be born] in this town. ' +
      'Even the desks in our library are made of [wood].',
  i8: 'This is my street. The man who lives [next door] is a doctor. His wife is an [engineer] who builds roads. ' +
      'Their son Timur, [whose] dog barks every morning, is my best friend.\n' +
      'Yesterday I was late for work. The reason why I was late was [traffic]. My [boss], who is usually strict, only smiled. ' +
      'The woman who works at reception was very [helpful]: she gave me a charger for my [laptop]. ' +
      'People in our office are always [polite].',
  i9: 'When I was ten, I [could] run very fast. Once I [was able to|be able to] win a [race] at school.\n' +
      'Now I am a pilot. I [have to] get up at five every day. Before a [flight] every passenger must wear a [seatbelt]. ' +
      'Tomorrow it [might] snow, and the flight could be late. Passengers often ask me: "Is it [necessary] to come two hours early?" ' +
      'Yes, it is.',
  i10: 'My sister Madina [enjoys|enjoy] cooking, but she [can’t stand] washing the dishes. Last month she [decided|decide] ' +
       'to learn Italian food. Now she is really [good at] making pasta.\n' +
       'I [promised|promise] to help her on Sunday. I usually [avoid] cooking, because I always forget the salt. ' +
       'This time I [remembered|remember] to buy everything. We cooked for three hours [without] stopping, and the pasta was delicious.',
  i11: 'On Monday my friend Aruzhan called me. She [said|say] she was [late] for her train. ' +
       'She [asked|ask] [whether] I could meet her at the station.\n' +
       'I [told|tell] her I would come. At the station she said she had arrived in Almaty [the day before]. ' +
       'We had [coffee] together, and she told me to visit her [the next day].',
  i12: 'Aidar meets his old friend Dana in a café. "You can [drive] now, can’t you?" he asks. ' +
       '"Yes, I got my licence last year," she says.\n' +
       '"You [never] eat [meat], do you?" "No, I don’t." "You have seen the new [movie], haven’t you?" ' +
       '"No, I [hardly] go to the cinema." "Are you [sure]? Then let’s go tonight, [shall we]?" ' +
       'After the film they go for a [walk] in the park.',
  i13: 'Our class wants to play basketball after school. Daniyar is [tall] [enough] to be the captain. ' +
       'Little Ali is [too] short, but he runs very fast.\n' +
       'The gym can [hold] a hundred people, but today there are [too many] students in it. ' +
       'The bag with the balls is too [heavy] for one boy, so two boys [carry] it. At seven it gets [dark], and we go home.',
  i14: 'It’s the first lesson in a new class. The teacher says: "Please [introduce] yourselves." ' +
       'Dana stands up: "Hi, I’m Dana. Last summer I taught [myself] to play the guitar."\n' +
       'The twins Aidar and Arman look at [each other] and laugh. They made the class video [themselves]. ' +
       'The teacher asks everyone to [behave] well. After the lesson Dana looks at [herself] in the [mirror] and smiles. ' +
       'On the way home she falls, but she doesn’t [hurt] herself.'
};

/* ══════════════════════════════════════════════════════════════════════
   4. СБОРКА
   Экраны читают только window.COURSE и про таблицы выше не знают.
   ══════════════════════════════════════════════════════════════════ */
window.COURSE = {
  levels: window.LEVELS.map(function (lv) {
    var pre = lv.id[0] === 'p' ? 'p' : lv.id[0];   /* beginner→b, elementary→e, pre→p, intermediate→i */
    var out = [];
    for (var n = 1; n <= window.LESSONS_PER_LEVEL; n++) {
      var id = pre + n, c = window.CONTENT[id] || {};
      out.push({
        id: id, n: n,
        title:    c.title    || '',
        subtitle: c.subtitle || '', subtitleKk: c.subtitleKk || '',
        rule:     c.rule     || '', ruleKk:     c.ruleKk     || '',
        examples: c.examples || [],
        words:    c.words    || [],
        tasks:    c.tasks    || [],
        text:     window.TEXTS[id] || ''
      });
    }
    return {
      id: lv.id, code: lv.code, title: lv.title,
      tagline: lv.tagline, taglineKk: lv.taglineKk,
      about: lv.about, aboutKk: lv.aboutKk, lessons: out
    };
  })
};
