function mapHandler() {
  var mapElement = document.getElementById('map');
  var latitude = mapElement.getAttribute('data-latitude');
  var longitude = mapElement.getAttribute('data-longitude');
  var centerLatLng = new google.maps.LatLng(latitude,longitude);

  var mapOptions = {
    zoom: 16,
    draggable: true, // если false, карту нельзя перемещять. Перемещение включено, по умолчанию.
    center: centerLatLng,
    scrollwheel: false, // false, скролл отключен.
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var map = new google.maps.Map(document.getElementById('map'), mapOptions);

  var image = {
    url: 'img/bg/map-marker.svg',
    // This marker is 20 pixels wide by 32 pixels high.
    size: new google.maps.Size(36, 36),
    // The origin for this image is (0, 0).
    origin: new google.maps.Point(0, 0),
    // The anchor for this image is the base of the flagpole at (0, 32).
    anchor: new google.maps.Point(18, 18)
  };

  var marker = new google.maps.Marker({
    map: map,
    position: centerLatLng,
    icon: image,
    title: 'HTML Academy'
  });
}

