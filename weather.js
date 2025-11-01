/* ---------- SkyCast JS — OpenWeatherMap API version ---------- */

/* Your OpenWeatherMap API key */
const API_KEY = "84c02736f73d2bd0e21ec68b1031296a";

/* ---------- Helpers ---------- */
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

/* ---------- Dark mode ---------- */
const MODE_KEY = "skycast_mode";
function applyMode(mode) {
  if (mode === "dark") document.body.classList.add("dark");
  else document.body.classList.remove("dark");
  const icon = document.body.classList.contains("dark") ? "☀️" : "🌙";
  if ($("#modeToggle")) $("#modeToggle").textContent = icon;
  if ($("#modeToggleResults")) $("#modeToggleResults").textContent = icon;
}
function initMode() {
  const saved = localStorage.getItem(MODE_KEY) || "light";
  applyMode(saved);
}
function toggleMode() {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem(MODE_KEY, isDark ? "dark" : "light");
  applyMode(isDark ? "dark" : "light");
}
if ($("#modeToggle")) $("#modeToggle").addEventListener("click", toggleMode);
if ($("#modeToggleResults")) $("#modeToggleResults").addEventListener("click", toggleMode);
initMode();

/* ---------- Page detection ---------- */
const isIndex = !!$("#mapHero");
const isResults = !!$("#resultsCards");

/* ---------- Weather helpers ---------- */
function iconForDesc(desc) {
  if (!desc) return "🌤️";
  const d = desc.toLowerCase();
  if (d.includes("sun") || d.includes("clear")) return "☀️";
  if (d.includes("cloud")) return "⛅";
  if (d.includes("rain") || d.includes("drizzle")) return "🌧️";
  if (d.includes("thunder") || d.includes("storm")) return "⛈️";
  if (d.includes("snow")) return "❄️";
  return "🌤️";
}

function generateWearSuggestions(today) {
  const t = Math.round(today.temp.day);
  const desc = (today.weather[0].main || "").toLowerCase();
  const items = [];
  if (desc.includes("rain") || desc.includes("drizzle") || desc.includes("thunder")) {
    items.push("Waterproof jacket / raincoat");
    items.push("Water-resistant shoes or boots");
    items.push("Umbrella");
  } else if (desc.includes("snow")) {
    items.push("Insulated coat + scarf");
    items.push("Gloves & warm boots");
    items.push("Thermal layers");
  } else {
    if (t >= 28) {
      items.push("T-shirt / breathable top");
      items.push("Shorts / light trousers");
      items.push("Sunglasses & hat");
    } else if (t >= 20) {
      items.push("Light shirt / blouse");
      items.push("Light trousers or jeans");
      items.push("Thin cardigan for evening");
    } else if (t >= 10) {
      items.push("Long-sleeve + sweater");
      items.push("Warm trousers");
      items.push("Light jacket");
    } else {
      items.push("Heavy coat");
      items.push("Thermal layers");
      items.push("Hat + gloves");
    }
  }
  items.push("Check wind & humidity before heading out");
  return items;
}

/* ---------- Fetch weather ---------- */
async function fetchWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&appid=${API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Weather API fetch failed");
  const data = await resp.json();
  return data.daily.slice(0, 3); // today + next 2 days
}

/* ---------- Geocode city ---------- */
async function geocodeCity(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Geocoding failed");
  const data = await resp.json();
  if (!data.length) throw new Error("City not found");
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name };
}

/* ---------- INDEX PAGE ---------- */
if (isIndex) {
  const map = L.map("mapHero", { center: [20, 0], zoom: 2, preferCanvas: true });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  let marker = null;
  map.on("click", (e) => {
    if (marker) map.removeLayer(marker);
    marker = L.marker(e.latlng).addTo(map);
    marker.bindPopup("Selected location").openPopup();
    map._lastClicked = e.latlng;
  });

  const heroInput = $("#heroSearch");
  const heroBtn = $("#heroSearchBtn");
  const usePinBtn = $("#usePinBtn");

  function redirectToResults(queryObj) {
    const params = new URLSearchParams(queryObj).toString();
    window.location.href = `results.html?${params}`;
  }

  heroBtn.addEventListener("click", async () => {
    const q = heroInput.value.trim();
    try {
      if (q) {
        const geo = await geocodeCity(q);
        return redirectToResults({ lat: geo.lat, lon: geo.lon, city: geo.name });
      }
      if (map._lastClicked) {
        const { lat, lng } = map._lastClicked;
        return redirectToResults({ lat: lat.toFixed(5), lon: lng.toFixed(5) });
      }
      alert("Type a city or click the map to pick a location.");
    } catch (err) {
      alert(err.message);
    }
  });

  heroInput.addEventListener("keydown", (e) => { if (e.key === "Enter") heroBtn.click(); });

  usePinBtn.addEventListener("click", () => {
    if (map._lastClicked) {
      const { lat, lng } = map._lastClicked;
      redirectToResults({ lat: lat.toFixed(5), lon: lng.toFixed(5) });
    } else {
      alert("No pin placed — click the map to place one, or type a city.");
    }
  });
}

/* ---------- RESULTS PAGE ---------- */
if (isResults) {
  const params = new URLSearchParams(window.location.search);
  const lat = params.get("lat");
  const lon = params.get("lon");
  const cityName = params.get("city") || "";

  const resultsTitle = $("#resultsTitle");
  const resultsSubtitle = $("#resultsSubtitle");
  const cardsContainer = $("#resultsCards");
  const wearList = $("#resultsWearList");

  async function loadResults() {
    try {
      resultsSubtitle.textContent = "Loading forecast…";
      const forecast = await fetchWeather(lat, lon);
      resultsTitle.textContent = cityName ? `Forecast for ${cityName}` : `Forecast for Lat ${lat}, Lon ${lon}`;
      resultsSubtitle.textContent = "Today + next 2 days";

      // Fill cards
      cardsContainer.innerHTML = "";
      forecast.forEach((day, i) => {
        const dateLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : "Day after";
        const c = document.createElement("article");
        c.className = "card";
        c.innerHTML = `
          <div class="card-head">
            <div>
              <div class="muted">${dateLabel}</div>
              <div class="location muted">${cityName || `Lat ${lat}, Lon ${lon}`}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:1.2rem">${iconForDesc(day.weather[0].main)}</div>
              <div class="muted" style="font-size:.92rem">${day.weather[0].main}</div>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div class="big">${Math.round(day.temp.day)}°C</div>
            <div style="text-align:right">
              <div class="muted">Humidity</div>
              <div>${day.humidity}%</div>
            </div>
          </div>

          <p class="muted" style="margin-top:12px">Wind: ${day.wind_speed} m/s</p>
        `;
        cardsContainer.appendChild(c);
      });

      // Fill wear tips
      wearList.innerHTML = "";
      const suggestions = generateWearSuggestions(forecast[0]);
      suggestions.forEach(s => {
        const li = document.createElement("li");
        li.textContent = s;
        wearList.appendChild(li);
      });

    } catch (err) {
      resultsSubtitle.textContent = "Failed to load weather.";
      console.error(err);
      alert("Error fetching weather: " + err.message);
    }
  }

  loadResults();
}
