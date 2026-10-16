/* Витрина · подмена видео. Грузится ПОСЛЕ course.js (иначе VIDEOS ещё нет и
   подмена молча не срабатывает — так в первой версии на экран уходили
   настоящие ролики 1English). Все 56 уроков смотрят один тизер. Пустой
   тизер — шаги остаются, плеер рисует карточку-заглушку. */
(function () {
  var B = window.BRAND || {};
  var T = B.video ? 'local' : (B.teaser || '');
  Object.keys(window.VIDEOS || {}).forEach(function (k) { window.VIDEOS[k] = [T, T]; });
  Object.keys(window.VIDEOS_RU || {}).forEach(function (k) { window.VIDEOS_RU[k] = [T, T]; });
  window.CARTOONS = {};
})();
