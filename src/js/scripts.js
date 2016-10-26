(function() {
  var btns = document.querySelectorAll('.js-toggle');
  var menu = document.getElementById('nav');
  var header = document.getElementById('header');
  var btnsForm = document.querySelectorAll('.btn--form');

  header.classList.add('page-header--js');
  header.classList.remove('page-header--active');
  menu.classList.add('navigation--closed');
  menu.classList.add('navigation--positioned');
  handleMenu(menu, btns);
  btnHandler(btnsForm);
  svg4everybody();
})();
function preview() {
  var preview = document.querySelector('.preview');
  var preloader = document.querySelector('#preloader');
  preloader.classList.remove('js-show');
  preview.classList.remove('preview');
}
window.onload = preview;
