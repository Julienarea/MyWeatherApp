const API_KEY = "c687077a5f3f250f25e808be908e0e49";
const BASE_URL = "https://api.openweathermap.org/data/2.5";

const locationInput = document.getElementById("location-input");
const addWidgetBtn = document.getElementById("add-widget-btn");
const addByCoordsBtn = document.getElementById("add-by-coords-btn");
const latInput = document.getElementById("lat-input");
const lonInput = document.getElementById("lon-input");
const widgetsContainer = document.getElementById("weather-widgets-container");

let weatherWidgets = [];

function initApp() {
    addWidgetBtn.addEventListener("click", () => handleAddWidget("city"));
    addByCoordsBtn.addEventListener("click", () => handleAddWidget("coords"));

    locationInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleAddWidget("city");
    });

    latInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleAddWidget("coords");
    });

    lonInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleAddWidget("coords");
    });

    loadSavedWidgets();
}

function loadSavedWidgets() {
    const savedWidgets = JSON.parse(localStorage.getItem("weatherWidgets")) || [];
    savedWidgets.forEach((widget) => {
        if (widget.lat && widget.lon) {
            createWeatherWidgetByCoords(widget.lat, widget.lon);
        } else if (widget.city) {
            createWeatherWidget(widget.city);
        }
    });
}

function handleAddWidget(type) {
    if (type === "city") {
        const city = locationInput.value.trim();
        if (validateCity(city)) {
            createWeatherWidget(city);
            locationInput.value = "";
            saveWidgetsToStorage();
        }
    } else if (type === "coords") {
        const lat = latInput.value.trim();
        const lon = lonInput.value.trim();
        if (validateCoordinates(lat, lon)) {
            createWeatherWidgetByCoords(lat, lon);
            latInput.value = "";
            lonInput.value = "";
            saveWidgetsToStorage();
        }
    }
}

function validateCity(city) {
    if (!city) {
        alert("Пожалуйста, введите название города");
        return false;
    }

    if (weatherWidgets.some((widget) => widget.city && widget.city.toLowerCase() === city.toLowerCase())) {
        alert("Виджет для этого города уже добавлен");
        return false;
    }

    return true;
}

function validateCoordinates(lat, lon) {
    if (!lat || !lon) {
        alert("Пожалуйста, введите широту и долготу");
        return false;
    }

    if (isNaN(lat) || isNaN(lon)) {
        alert("Широта и долгота должны быть числами");
        return false;
    }

    if (lat < -90 || lat > 90) {
        alert("Широта должна быть в диапазоне от -90 до 90");
        return false;
    }

    if (lon < -180 || lon > 180) {
        alert("Долгота должна быть в диапазоне от -180 до 180");
        return false;
    }

    return true;
}

function createWeatherWidget(city) {
    const widget = {
        city,
        element: document.createElement("div"),
        id: Date.now(),
    };

    widget.element.className = "weather-widget";
    widget.element.innerHTML = createWidgetTemplate(city);
    widgetsContainer.appendChild(widget.element);

    widget.element.querySelector(".delete-widget").addEventListener("click", () => deleteWidget(widget.id));
    widget.element.querySelector(".show-map").addEventListener("click", () => toggleMap(widget));

    weatherWidgets.push(widget);
    fetchWeatherDataByCity(city, widget);
}

function createWeatherWidgetByCoords(lat, lon) {
    const widget = {
        lat,
        lon,
        element: document.createElement("div"),
        id: Date.now(),
    };

    widget.element.className = "weather-widget";
    widget.element.innerHTML = createWidgetTemplate(`Широта: ${lat}, Долгота: ${lon}`);
    widgetsContainer.appendChild(widget.element);

    widget.element.querySelector(".delete-widget").addEventListener("click", () => deleteWidget(widget.id));
    widget.element.querySelector(".show-map").addEventListener("click", () => toggleMap(widget));

    weatherWidgets.push(widget);
    fetchWeatherDataByCoords(lat, lon, widget);
}

function createWidgetTemplate(location) {
    return `
        <div class="weather-widget-header">
            <div class="weather-location">${location}</div>
            <button class="delete-widget">&times;</button>
        </div>
        <div class="weather-icon">
            <img src="" alt="Погода">
        </div>
        <div class="weather-temp">--°C</div>
        <div class="weather-description">Загрузка...</div>
        <div class="weather-time">--:--</div>
        <div class="weather-details">
            <div class="weather-detail">
                <div class="weather-detail-label">Ветер</div>
                <div class="weather-detail-value wind-value">-- м/с</div>
            </div>
            <div class="weather-detail">
                <div class="weather-detail-label">Влажность</div>
                <div class="weather-detail-value humidity-value">--%</div>
            </div>
        </div>
        <button class="show-map">Показать карту</button>
        <div class="map-container" style="display: none;">
            <iframe src="" width="100%" height="200" frameborder="0"></iframe>
        </div>
    `;
}

async function fetchWeatherDataByCity(city, widget) {
    try {
        const response = await fetch(`${BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=ru`);

        if (!response.ok) throw new Error("Город не найден");

        const data = await response.json();
        updateWidgetUI(widget, data);
    } catch (error) {
        widget.element.querySelector(".weather-description").textContent = error.message;
        console.error("Ошибка получения данных о погоде:", error);
    }
}

async function fetchWeatherDataByCoords(lat, lon, widget) {
    try {
        const response = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`);

        if (!response.ok) throw new Error("Не удалось получить данные");

        const data = await response.json();
        updateWidgetUI(widget, data);
    } catch (error) {
        widget.element.querySelector(".weather-description").textContent = error.message;
        console.error("Ошибка получения данных о погоде:", error);
    }
}

function updateWidgetUI(widget, data) {
    const { name, main, weather, wind, dt, coord } = data;

    if (widget.city) {
        if (name) {
            widget.element.querySelector(".weather-location").textContent = name;
            widget.city = name;
        }
    } else if (name) {
        widget.element.querySelector(".weather-location").textContent = name;
        widget.city = name;
    }

    if (coord) {
        widget.lat = coord.lat;
        widget.lon = coord.lon;
    }

    if (main) {
        widget.element.querySelector(".weather-temp").textContent = `${Math.round(main.temp)}°C`;
        widget.element.querySelector(".humidity-value").textContent = `${main.humidity}%`;
    }

    if (weather && weather[0]) {
        const description = weather[0].description.charAt(0).toUpperCase() + weather[0].description.slice(1);
        widget.element.querySelector(".weather-description").textContent = description;

        const iconCode = weather[0].icon;
        widget.element.querySelector(".weather-icon img").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        updateWidgetBackground(widget, weather[0].main);
    }

    if (wind) {
        widget.element.querySelector(".wind-value").textContent = `${wind.speed} м/с`;
    }

    const timezoneOffset = data.timezone || 0;
    const localTime = new Date((dt + timezoneOffset) * 1000);
    const hours = String(localTime.getUTCHours()).padStart(2, "0");
    const minutes = String(localTime.getUTCMinutes()).padStart(2, "0");
    widget.element.querySelector(".weather-time").textContent = `Время в локации: ${hours}:${minutes}`;

    widget.data = data;
}

function updateWidgetBackground(widget, weatherMain) {
    const weatherClass = getWeatherClass(weatherMain);
    widget.element.className = `weather-widget ${weatherClass}`;
}

function getWeatherClass(weatherMain) {
    const weatherTypes = {
        Clear: "clear",
        Clouds: "cloud",
        Rain: "rain",
        Drizzle: "rain",
        Thunderstorm: "thunderstorm",
        Snow: "snow",
        Mist: "cloud",
        Fog: "cloud",
        Haze: "cloud",
    };

    return weatherTypes[weatherMain] || "clear";
}

function toggleMap(widget) {
    const mapContainer = widget.element.querySelector(".map-container");
    const button = widget.element.querySelector(".show-map");
    if (!mapContainer || !button) return;

    const isHidden = mapContainer.style.display === "none" || !mapContainer.style.display;

    if (isHidden) {
        mapContainer.innerHTML = '';

        const lon = parseFloat(widget.lon);
        const lat = parseFloat(widget.lat);

        if (isNaN(lat) || isNaN(lon)) {
            mapContainer.textContent = "Невозможно отобразить карту";
        } else {
            const img = document.createElement("img");
            img.src = `https://static-maps.yandex.ru/1.x/?lang=ru_RU&ll=${lon},${lat}&z=11&l=map&size=300,200&pt=${lon},${lat},pm2rdm`;
            img.alt = "Карта";
            img.style.width = "100%";
            img.style.borderRadius = "8px";
            mapContainer.appendChild(img);
        }

        mapContainer.style.display = "block";
        button.textContent = "Скрыть карту";
    } else {
        mapContainer.style.display = "none";
        button.textContent = "Показать карту";
    }
}

function deleteWidget(widgetId) {
    weatherWidgets = weatherWidgets.filter((widget) => {
        if (widget.id === widgetId) {
            widget.element.remove();
            return false;
        }
        return true;
    });

    saveWidgetsToStorage();
}

function saveWidgetsToStorage() {
    const widgetsToSave = weatherWidgets.map((widget) => {
        if (widget.lat && widget.lon) {
            return {
                lat: widget.lat,
                lon: widget.lon,
            };
        } else {
            return {
                city: widget.city,
            };
        }
    });

    localStorage.setItem("weatherWidgets", JSON.stringify(widgetsToSave));
}

document.addEventListener("DOMContentLoaded", initApp);