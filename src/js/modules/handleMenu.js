function handleMenu(menu, togglers) {


  function onToggleClick(event) {
    event.preventDefault();
    menu.classList.toggle('navigation--closed');
    header.classList.toggle('page-header--active');

    for (var i = togglers.length - 1; i >= 0; i--) {
      togglers[i].classList.toggle('page-header__btn-burger--active');
    }
  }


  for (var i = togglers.length - 1; i >= 0; i--) {
    var toggler = togglers[i];
    toggler.classList.add('page-header__btn-burger--show');
    toggler.addEventListener('click', onToggleClick);
  }
}
