const signupForm = document.querySelector("#signup-form");
const formResult = document.querySelector("#form-result");
const imageViewer = document.querySelector("#image-viewer");
const imageViewerImage = imageViewer.querySelector(".image-viewer-image");
const imageViewerClose = imageViewer.querySelector(".image-viewer-close");
const heroArt = document.querySelector(".hero-art");
const paymentFieldset = document.querySelector("#payment-fieldset");
const paymentRequired = document.querySelector("#payment-required");
const paymentInputs = [...signupForm.querySelectorAll('input[name="payment"]')];
const planInputs = [...signupForm.querySelectorAll('input[name="plan"]')];
const submitLabel = signupForm.querySelector(".submit-label");
const sightingSpecies = document.querySelector("#sighting-species");
const sightingDate = document.querySelector("#sighting-date");
const sightingNote = document.querySelector("#sighting-note");
const hungaryMap = document.querySelector("#hungary-map");
const mapLand = document.querySelector("#map-land");
const sightingMarkers = document.querySelector("#sighting-markers");
const sightingList = document.querySelector("#sighting-list");
const sightingEmptyMessage = document.querySelector("#sighting-empty-message");
const sightingCount = document.querySelector("#sighting-count");
const mapStatus = document.querySelector("#map-status");
const submitSightingsButton = document.querySelector("#submit-sightings");
const clearSightingsButton = document.querySelector("#clear-sightings");
const clearSubmittedSightingsButton = document.querySelector("#clear-submitted-sightings");
const sightingSubmitResult = document.querySelector("#sighting-submit-result");
const cityShortcuts = [...document.querySelectorAll(".map-city-shortcuts button")];
const sightingsStorageKey = "madarkalauz-megfigyelesek";
const svgNamespace = "http://www.w3.org/2000/svg";
const sightings = [];
let nextSightingId = 1;
let canSaveSightings = true;

function getLocalDateValue(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

sightingDate.value = getLocalDateValue();

function showMapStatus(message, isError = false) {
  mapStatus.textContent = message;
  mapStatus.classList.toggle("error", isError);
}

function saveSightings() {
  if (!canSaveSightings) {
    return;
  }

  try {
    localStorage.setItem(sightingsStorageKey, JSON.stringify(sightings));
  } catch {
    canSaveSightings = false;
    showMapStatus("A jelölés megmarad ezen az oldalon, de a böngésző nem tudta elmenteni.", true);
  }
}

function loadSightings() {
  let storedSightings;

  try {
    storedSightings = localStorage.getItem(sightingsStorageKey);
  } catch {
    canSaveSightings = false;
    showMapStatus("A jelölések tárolása nem érhető el; a most hozzáadott jelölések csak az oldal megnyitásáig maradnak meg.", true);
    return;
  }

  if (!storedSightings) {
    return;
  }

  let parsedSightings;
  try {
    parsedSightings = JSON.parse(storedSightings);
  } catch {
    canSaveSightings = false;
    showMapStatus("A korábban mentett jelölések adatai hibásak, ezért nem sikerült betölteni őket.", true);
    return;
  }

  const validSightings =
    Array.isArray(parsedSightings) &&
    parsedSightings.every(
      (item) =>
        item &&
        typeof item.id === "number" &&
        typeof item.species === "string" &&
        Number.isFinite(item.x) &&
        Number.isFinite(item.y) &&
        (item.observedOn === undefined || /^\d{4}-\d{2}-\d{2}$/.test(item.observedOn)) &&
        (item.note === undefined || typeof item.note === "string") &&
        (item.submitted === undefined || typeof item.submitted === "boolean") &&
        item.x >= 0 &&
        item.x <= 600 &&
        item.y >= 0 &&
        item.y <= 360,
    );

  if (!validSightings) {
    canSaveSightings = false;
    showMapStatus("A korábban mentett jelölések adatai nem érvényesek, ezért nem sikerült betölteni őket.", true);
    return;
  }

  sightings.push(...parsedSightings);
  nextSightingId = Math.max(0, ...sightings.map((sighting) => sighting.id)) + 1;
}

function renderSightings() {
  sightingMarkers.replaceChildren();
  sightingList.replaceChildren();

  const pendingSightings = sightings.filter((sighting) => !sighting.submitted);
  let pendingIndex = 0;

  sightings.forEach((sighting) => {
    const marker = document.createElementNS(svgNamespace, "g");
    marker.setAttribute("class", sighting.submitted ? "sighting-marker submitted-sighting-marker" : "sighting-marker");
    marker.setAttribute("transform", `translate(${sighting.x} ${sighting.y})`);

    const title = document.createElementNS(svgNamespace, "title");
    title.textContent = sighting.species;
    marker.append(title);

    const outerCircle = document.createElementNS(svgNamespace, "circle");
    outerCircle.setAttribute("r", "10");
    marker.append(outerCircle);

    if (!sighting.submitted) {
      const markerNumber = document.createElementNS(svgNamespace, "text");
      markerNumber.textContent = String(++pendingIndex);
      marker.append(markerNumber);
    }
    sightingMarkers.append(marker);

    if (sighting.submitted) {
      return;
    }

    const item = document.createElement("li");
    item.className = "sighting-item";

    const copy = document.createElement("span");
    copy.className = "sighting-item-copy";
    const speciesName = document.createElement("strong");
    speciesName.textContent = sighting.species;
    const position = document.createElement("small");
    position.textContent = sighting.observedOn
      ? new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "long", day: "numeric" }).format(
          new Date(`${sighting.observedOn}T12:00:00`),
        )
      : "Dátum nincs megadva";
    copy.append(speciesName, position);
    if (sighting.note) {
      const note = document.createElement("small");
      note.className = "sighting-note";
      note.textContent = sighting.note;
      copy.append(note);
    }

    const removeButton = document.createElement("button");
    removeButton.className = "remove-sighting-button";
    removeButton.type = "button";
    removeButton.textContent = "Törlés";
    removeButton.setAttribute("aria-label", `${sighting.species} megfigyelés törlése`);
    removeButton.addEventListener("click", () => removeSighting(sighting.id));

    item.append(copy, removeButton);
    sightingList.append(item);
  });

  sightingCount.textContent = String(pendingSightings.length);
  sightingEmptyMessage.hidden = pendingSightings.length > 0;
  submitSightingsButton.hidden = pendingSightings.length === 0;
  clearSightingsButton.hidden = sightings.length === 0;
  clearSubmittedSightingsButton.hidden = !sightings.some((sighting) => sighting.submitted);
}

function addSighting(x, y) {
  if (!sightingDate.value) {
    sightingDate.reportValidity();
    showMapStatus("A megfigyelés rögzítéséhez válassz dátumot.", true);
    return;
  }

  const species = sightingSpecies.value;
  sightings.push({
    id: nextSightingId,
    species,
    x: Math.round(x),
    y: Math.round(y),
    observedOn: sightingDate.value,
    note: sightingNote.value.trim(),
  });
  nextSightingId += 1;
  sightingSubmitResult.hidden = true;
  sightingSubmitResult.textContent = "";
  renderSightings();
  saveSightings();
  if (canSaveSightings) {
    showMapStatus(`${species} megfigyelése hozzáadva a naplóhoz.`);
  }
  sightingNote.value = "";
}

function removeSighting(id) {
  const index = sightings.findIndex((sighting) => sighting.id === id);
  if (index === -1) {
    showMapStatus("Ezt a megfigyelést már töröltük. Frissítsd a listát, és próbáld újra.", true);
    return;
  }

  const [removedSighting] = sightings.splice(index, 1);
  renderSightings();
  saveSightings();
  if (canSaveSightings) {
    showMapStatus(`${removedSighting.species} megfigyelését töröltük.`);
  }
}

mapLand.addEventListener("click", (event) => {
  const matrix = hungaryMap.getScreenCTM();
  if (!matrix) {
    showMapStatus("Nem sikerült meghatározni a térképen kattintott helyet. Próbáld újra.", true);
    return;
  }

  const point = hungaryMap.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const mapPoint = point.matrixTransform(matrix.inverse());
  addSighting(mapPoint.x, mapPoint.y);
});

mapLand.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    addSighting(254, 143);
  }
});

cityShortcuts.forEach((button) => {
  button.addEventListener("click", () => {
    addSighting(Number(button.dataset.x), Number(button.dataset.y));
  });
});

submitSightingsButton.addEventListener("click", () => {
  const pendingSightings = sightings.filter((sighting) => !sighting.submitted);
  if (pendingSightings.length === 0) {
    renderSightings();
    return;
  }

  pendingSightings.forEach((sighting) => {
    sighting.submitted = true;
  });
  renderSightings();
  saveSightings();
  sightingSubmitResult.textContent = "A megfigyelésedet sikeresen beküldted.";
  sightingSubmitResult.hidden = false;
});

clearSightingsButton.addEventListener("click", () => {
  sightings.length = 0;
  renderSightings();
  saveSightings();
  sightingSubmitResult.textContent = "";
  sightingSubmitResult.hidden = true;
  if (canSaveSightings) {
    showMapStatus("Az összes megfigyelést töröltük.");
  }
});

clearSubmittedSightingsButton.addEventListener("click", () => {
  const submittedSightings = sightings.filter((sighting) => sighting.submitted);
  if (submittedSightings.length === 0) {
    renderSightings();
    return;
  }

  for (let index = sightings.length - 1; index >= 0; index -= 1) {
    if (sightings[index].submitted) {
      sightings.splice(index, 1);
    }
  }
  renderSightings();
  saveSightings();
  showMapStatus("A beküldött megfigyeléseket töröltük.");
});

loadSightings();
renderSightings();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;
const radiansToDegrees = (radians) => (radians * 180) / Math.PI;
let initialSunPositionSet = false;

function updateSunPosition() {
  const now = new Date();
  const julianDay = now.getTime() / 86400000 + 2440587.5;
  const centuries = (julianDay - 2451545) / 36525;
  const meanLongitude = (280.46646 + centuries * (36000.76983 + centuries * 0.0003032)) % 360;
  const meanAnomaly = 357.52911 + centuries * (35999.05029 - 0.0001537 * centuries);
  const eccentricity = 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries);
  const anomalyRadians = degreesToRadians(meanAnomaly);
  const equationOfCenter =
    Math.sin(anomalyRadians) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries)) +
    Math.sin(2 * anomalyRadians) * (0.019993 - 0.000101 * centuries) +
    Math.sin(3 * anomalyRadians) * 0.000289;
  const omega = degreesToRadians(125.04 - 1934.136 * centuries);
  const apparentLongitude = degreesToRadians(meanLongitude + equationOfCenter - 0.00569 - 0.00478 * Math.sin(omega));
  const meanObliquity =
    23 + (26 + (21.448 - centuries * (46.815 + centuries * (0.00059 - centuries * 0.001813))) / 60) / 60;
  const obliquity = degreesToRadians(meanObliquity + 0.00256 * Math.cos(omega));
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(apparentLongitude));
  const y = Math.tan(obliquity / 2) ** 2;
  const equationOfTime =
    4 *
    radiansToDegrees(
      y * Math.sin(2 * degreesToRadians(meanLongitude)) -
        2 * eccentricity * Math.sin(anomalyRadians) +
        4 * eccentricity * y * Math.sin(anomalyRadians) * Math.cos(2 * degreesToRadians(meanLongitude)) -
        0.5 * y ** 2 * Math.sin(4 * degreesToRadians(meanLongitude)) -
        1.25 * eccentricity ** 2 * Math.sin(2 * anomalyRadians),
    );

  const latitude = degreesToRadians(47.4979);
  const longitude = 19.0402;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
  const solarMinutes = utcMinutes + equationOfTime + 4 * longitude;
  const hourAngle = degreesToRadians(solarMinutes / 4 - 180);
  const altitude = Math.asin(
    Math.sin(latitude) * Math.sin(declination) +
      Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
  );
  const altitudeDegrees = radiansToDegrees(altitude);
  const sunHeight = clamp(altitudeDegrees / 70, 0, 1);
  const sunX = clamp(75 + Math.sin(hourAngle) * 17, 58, 92);
  const sunY = 70 - sunHeight * 55;
  const sunlight = clamp((altitudeDegrees + 6) / 41, 0, 1);
  const visibleSun = clamp((altitudeDegrees + 1) / 5, 0, 1);

  heroArt.style.setProperty("--sun-x", `${sunX}%`);
  heroArt.style.setProperty("--sun-y", `${sunY}%`);
  heroArt.style.setProperty("--sun-opacity", visibleSun.toFixed(2));
  heroArt.style.setProperty("--sunlight-opacity", (sunlight * 0.85).toFixed(2));

  if (!initialSunPositionSet) {
    initialSunPositionSet = true;
    window.requestAnimationFrame(() => heroArt.classList.add("solar-position-ready"));
  }
}

updateSunPosition();
window.setInterval(updateSunPosition, 60_000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    updateSunPosition();
  }
});

function updatePaymentRequirement() {
  const isFreePlan = signupForm.querySelector('input[name="plan"]:checked')?.value === "ingyenes";
  paymentFieldset.hidden = isFreePlan;
  paymentRequired.hidden = isFreePlan;
  paymentInputs.forEach((input) => {
    input.required = !isFreePlan;
  });
  submitLabel.textContent = isFreePlan ? "Regisztráció" : "Regisztráció és fizetés";
}

planInputs.forEach((input) => {
  input.addEventListener("change", updatePaymentRequirement);
});
updatePaymentRequirement();

document.querySelectorAll(".image-viewer-trigger").forEach((trigger) => {
  trigger.addEventListener("click", () => {
    const image = trigger.querySelector("img");
    imageViewerImage.src = image.src;
    imageViewerImage.alt = image.alt;
    imageViewer.showModal();
  });
});

imageViewerClose.addEventListener("click", () => {
  imageViewer.close();
});

imageViewer.addEventListener("cancel", (event) => {
  event.preventDefault();
  imageViewer.close();
});

imageViewer.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    imageViewer.close();
  }
});

imageViewer.addEventListener("click", (event) => {
  if (event.target === imageViewer) {
    imageViewer.close();
  }
});

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!signupForm.reportValidity()) {
    return;
  }

  const selectedPlan = signupForm.querySelector('input[name="plan"]:checked').value;
  formResult.textContent =
    selectedPlan === "ingyenes"
      ? "Sikeres regisztráció! Az ingyenes csomagot választottad. Ez csak próbaüzenet: adatot nem küldtünk el."
      : "Sikeres regisztráció! A bemutató fizetés visszaigazolása elkészült. Ez csak próbaüzenet: fizetés nem történt, és adatot nem küldtünk el.";
  formResult.classList.remove("error");
  formResult.hidden = false;
});
