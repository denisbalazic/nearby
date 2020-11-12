const mapDiv = document.querySelector("#map");
const listDiv = document.querySelector("#list-page");
const searchInput = document.querySelector("form input");
const searchBtn = document.querySelector("form button");
const list = document.querySelector("#list")
const navBtn = document.querySelector("#nav-btn");
const closeNav = document.querySelector("#close-nav");
const nav = document.querySelector("nav");
const mapView = document.querySelector("#map-view");
const listView = document.querySelector("#list-view");
const navFilter = document.querySelector("nav #types");
const radiusInput = document.querySelector("#radius input");
const radiusDisplay = document.querySelector("#radius-display");
const firstBtn = document.querySelector("#first");
const previousBtn = document.querySelector("#previous");
const pageBtn = document.querySelector("#page");
const nextBtn = document.querySelector("#next");
const lastBtn = document.querySelector("#last");

let map;
let service;
let infowindow;
let initialLocation;
let types = [""];
let markers = [];
let results = [];
let request = {
  radius: '1000'
}
// pagination variables
let currentPage = 1;
let numberPerPage = 10;
let numberOfPages = 0;
let pageResults = [];

/*
* Retrieve clients geolocation if possible
* and center the map.
* Otherwise center it on Zagreb.
* 
* TODO: Center it on user input
*/
function initMap() {
  // fethcing clients position from browser Html geolocation api
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(setMap, geolocatingError);
  } else {
    geolocatingError({message: "Browser does not support geolocating"});
  }
  
  // Sets map to current position
  function setMap(position) {
    initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    infowindow = new google.maps.InfoWindow();
    map = new google.maps.Map(mapDiv, {
      center: initialLocation,
      zoom: 13,
    });
    request.location = initialLocation;
    getPlaces();
  }

  // Sets map to Zagreb, Maksimir if geolocating failed
  function geolocatingError(e) {
    console.log(e);
    setDefaultMap();
  }

  function setDefaultMap() {
    const position = {
      coords: {
        latitude: 45.81678,
        longitude: 16.01193
      }
    };
    setMap(position);
  }
}





/* 
 * Select group of similar types of POIs from navbar
 * and send request
 */
navFilter.addEventListener("click", (e) => {
  const filters = nav.querySelectorAll("a");
  for(filter of filters) {
    filter.classList.remove("active");
  }
  e.target.classList.add("active");
  setRequestType(e);
  getPlaces();
  toggleNav();
});


/* 
 * Change radius of search request 
 * and send request
 */
radiusInput.addEventListener("change", (e) => {
  request.radius = e.target.value;
  getPlaces();
  toggleNav();
});


/* 
 * Take query from user input and set request
 */
searchInput.addEventListener("change", (e) => {
  request.query = e.target.value;
})

/* 
 * NEEDFIX: results from request dont reflect query
 */
searchBtn.addEventListener("click", () => {
  getPlaces();
})


/* 
 * Sends request, puts markers on map
 * and creates list of places in dom
 * 
 * NEEDSFIX: this function should be async
 *           so createMarkers and displayPlaces can run after this one
 */
function getPlaces() {
  results = [];
  currentPage = 1;
  for(type of types) {
    request.type = type;
    service = new google.maps.places.PlacesService(map);
    service.nearbySearch(request, (response, status, pagination) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        results.push(...response);
        createMarkers();
        displayPlaces();
      }
      if(pagination.hasNextPage) {
        setTimeout(() => pagination.nextPage(), 1000);
      } else {
        displayPlaces();      }
    });
    console.log(type)
  }  
}

/* 
 * Display found places in list
 * and on map
 */
function displayPlaces() {
  // clear list div
  list.innerHTML = "";
  if(results.length === 0) {
    console.log("no results for filter");
    const message = document.createElement("p");
    message.classList.add("message");
    message.innerText = "There are no results for given filter";
    list.append(message);
    for(marker of markers) {
      marker.setMap(null);
    }
  } else {
    // results.filter(place => place.rating).sort((a, b) => a.rating > b.rating ? -1 : 1);
    numberOfPages = Math.ceil(results.length / numberPerPage);
    const begin = ((currentPage - 1) * numberPerPage);
    const end = begin + numberPerPage;
    pageResults = results.slice(begin, end);
    for (place of pageResults) {
      createCard(place);
    }
  }
  pageBtn.innerText = currentPage;
  // check pagination buttons
  firstBtn.disabled = currentPage == 1 ? true : false;
  previousBtn.disabled = currentPage == 1 ? true : false;
  nextBtn.disabled = currentPage == numberOfPages ? true : false;
  lastBtn.disabled = currentPage == numberOfPages ? true : false;
}


/* 
 * Puts markers on the map 
 */
function createMarkers() {
  // delete previous markers
  for(marker of markers) {
    marker.setMap(null);
  }
  for(place of results) {
    const marker = new google.maps.Marker({
      map: map,
      position: place.geometry.location
    });
    markers.push(marker);
    google.maps.event.addListener(marker, "click", () => {
      infowindow.setContent(place.name);
      infowindow.open(map);
    });
  }
}


/* 
 * Creates html element with single place records
 * and appends it to list div
 */
function createCard(place) {
  const card = document.createElement("div");
  card.classList.add("card");
  const name = document.createElement("h3");
  name.innerText = place.name;
  card.append(name);
  const address = document.createElement("p");
  address.innerText = place.vicinity;
  card.append(address);
  list.append(card);
}



/* 
 * Pagination control
 */
firstBtn.addEventListener("click", () => {
  currentPage = 1;
  displayPlaces();
})

previousBtn.addEventListener("click", () => {
  currentPage -= 1;
  displayPlaces();
})

nextBtn.addEventListener("click", () => {
  currentPage += 1;
  displayPlaces();
})

lastBtn.addEventListener("click", () => {
  currentPage = numberOfPages;
  displayPlaces();
})



/* 
 * Populates types array with similar types
 * based on user selection
 */
function setRequestType(e) {
  if(e.target.tagName.toLowerCase() === "a") {
    console.log(e.target.innerText);
    types = findTypes(e.target.innerText);    
  }
}


/* 
 * Choose between groups of similar types of places
 * based on user selection
 */
function findTypes(selection) {
  switch(selection) {
    case "Caffes": return ["cafe", "bar"];
    case "Medical": return ["doctor", "dentist", "hospital", "pharmacy"];
    case "Tourism": return ["travel_agency", "tourist_attraction", "lodging"];
    case "Traffic": return ["taxi_stand", "train_station", "transit_station", "bus_station", "car_rental", "parking", "gas_station"];
    case "Official": return ["courthouse", "embassy", "fire_station", "post_office", "police", "city-hall", "local_government_office"];
    case "Education": return ["school", "secondary_school", "university", "library"];
    case "Sports": return ["gym", "stadium"];
    case "Stores": return ["store", "convinience_store", "supermarket", "drugstore", "book_store", "shopping_mall", "shoe_store", "clothing_store", "hardware_store"];
    case "Banking": return ["bank", "atm"];
    case "Beauty": return ["beauty_salon", "hair_care", "spa"];
    case "Culture": return ["museum", "art_galery", "movie_theatar", "library"];
    case "Business": return ["plumber", "painter", "accounting", "lawyer", "electrician", "car_repair"];
    case "Restaurants": return ["restaurant"];
    default: return [];
  }
}


/* 
 * Toggle navigation bar on and off
 */
navBtn.addEventListener("click", toggleNav);

closeNav.addEventListener("click", toggleNav);

function toggleNav(e) {
  nav.classList.toggle("hidden");
}

/* 
 * Toggle between map view and list view
 */
mapView.addEventListener("click", changeToMapView);
listView.addEventListener("click", changeToListView);

function changeToListView() {
  mapDiv.classList.add("hidden");
  listDiv.classList.remove("hidden");
  mapView.classList.remove("inactive");
  listView.classList.add("inactive");
  toggleNav();
}

function changeToMapView()  {
  mapDiv.classList.remove("hidden");
  listDiv.classList.add("hidden");
  mapView.classList.add("inactive");
  listView.classList.remove("inactive"); 
  toggleNav();
}

/* 
 * Changes display in nav based on slider input change
 */
radiusInput.addEventListener("input", (e) => {
  radiusDisplay.innerText = e.target.value;
});


/* 
 * Change layout based on window size
 */
// window.addEventListener("resize", () => {
//   if(window.innerWidth > 900) {
//     listDiv.classList.remove("hidden");
//   } else {
//     listDiv.classList.add("hidden");
//   }
// })











/* 
 * TODO: Zoom map to include all markers
 * Tryed to implement code below without success
 */
// let bounds = new google.maps.LatLngBounds();
// for (var i = 0; i < markers.length; i++) {
//  bounds.extend(markers[i]);
// }
// map.fitBounds(bounds);














// const search = document.querySelector("#search");
// search.addEventListener("click", getPlaces);

// async function getPlaces(e) {
//   try{
//     e.preventDefault();
//     const res = await axios.get("https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=AIzaSyBUx1ZToWYxAgjkmJHGsa3JN0WfmmkpmJo&location=45.819024,16.068422&radius=1000");
//     console.log(res);
//   } catch(e) {
//     console.log("GRESHKA BRE", e)
//   }
// }