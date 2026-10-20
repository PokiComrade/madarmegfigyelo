const signupForm = document.querySelector("#signup-form");
const formResult = document.querySelector("#form-result");
const imageViewer = document.querySelector("#image-viewer");
const imageViewerImage = imageViewer.querySelector(".image-viewer-image");
const imageViewerClose = imageViewer.querySelector(".image-viewer-close");

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

  formResult.textContent = "Sikeres regisztráció! A bemutató fizetés visszaigazolása elkészült. Ez csak próbaüzenet: fizetés nem történt, és adatot nem küldtünk el.";
  formResult.classList.remove("error");
  formResult.hidden = false;
});
