function btnHandler(btns) {


  function onToggleClick(event){
    event.preventDefault();
    event.target.classList.toggle('btn--in-progress');
  }


  for (var i = btns.length - 1; i >= 0; i--) {
    var btn = btns[i];

    if (btn.classList.contains('btn--in-progress')) {
      btn.classList.remove('btn--in-progress');
    }

    btn.addEventListener('click', onToggleClick);
  }
}
