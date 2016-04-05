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

(function() {
  var btns = document.querySelectorAll('.js-toggle');
  var menu = document.getElementById('nav');
  var header = document.getElementById('header');

  header.classList.add('page-header--js');
  header.classList.remove('page-header--active');
  menu.classList.add('navigation--closed');
  menu.classList.add('navigation--positioned');
  handleMenu(menu, btns);
})();


function initMap() {
  var map = document.getElementById('map');
  var latitude = map.getAttribute('data-latitude');
  var longitude = map.getAttribute('data-longitude');
  var centerLatLng = new google.maps.LatLng(latitude,longitude);
  // var markerLatLng = new google.maps.LatLng(59.938770, 30.323075);

  var mapOptions = {
    zoom: 16,
    draggable: true, // если false, карту нельзя перемещять. Перемещение включено, по умолчанию.
    center: centerLatLng,
    scrollwheel: false, // false, скролл отключен.
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }

  var map = new google.maps.Map(document.getElementById('map'), mapOptions);

  var marker = new google.maps.Marker({
    position: centerLatLng,
    title: 'HTML Academy'
  });
  marker.setMap(map);
};

