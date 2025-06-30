document.addEventListener("DOMContentLoaded", () => {
  const pathname = window.location.pathname;

  // ========================
  // api.html
  // ========================
  if (pathname === "/" || pathname.includes("api.html")) {
    const guardarBtn = document.getElementById("guardarClave");

    if (guardarBtn) {
      guardarBtn.addEventListener("click", async () => {
        const clave = document.getElementById("apiKeyInput").value.trim();
        const errorMsg = document.getElementById("errorMsg");

        if (clave.length < 10) {
          errorMsg.textContent = "⚠️ La clave es demasiado corta.";
          errorMsg.style.display = "block";
          return;
        }

        try {
          const response = await fetch("/validar_api", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ apiKey: clave }),
          });

          const data = await response.json();

          if (data.valida) {
            sessionStorage.setItem("openai_api_key", clave);
            window.location.href = "/index";
          } else {
            errorMsg.textContent = "❌ Clave inválida.";
            errorMsg.style.display = "block";
            errorMsg.classList.add("error-visible");
          }
        } catch (err) {
          errorMsg.textContent = "❌ Error al validar la clave.";
          errorMsg.style.display = "block";
        }
      });
    }
  }

  // ========================
  // index.html
  // ========================
  if (pathname.includes("/index")) {
    const apiKey = sessionStorage.getItem("openai_api_key");

    if (!apiKey) {
      alert(
        "⚠️ No se ha encontrado una API Key válida. Vuelve a la página de inicio."
      );
      window.location.href = "/";
      return;
    }

    const analizarBtn = document.getElementById("analizar");
    if (analizarBtn) {
      analizarBtn.addEventListener("click", async () => {
        const fileInput = document.getElementById("imagen");
        const descripcionEl = document.getElementById("descripcion");
        const informeEl = document.getElementById("informe");

        if (!fileInput.files[0]) {
          alert("Debes seleccionar una imagen.");
          return;
        }

        const formData = new FormData();
        formData.append("imagen", fileInput.files[0]);
        formData.append("apiKey", apiKey);

        // Mostrar mensajes de load
        descripcionEl.innerHTML =
          '<div class="cargando-linea">Generando descripción...</div>';
        informeEl.innerHTML =
          '<div class="cargando-linea">Generando informe de accesibilidad...</div>';

        try {
          const response = await fetch("/analizar", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (data.error) {
            descripcionEl.textContent = "Error: " + data.error;
            informeEl.textContent = "";
          } else {
            // Formatear líneas de la descripción
            const lineas = data.descripcion.split("\n");
            descripcionEl.innerHTML = lineas
              .map((linea) => {
                const trimmed = linea.trimStart();
                const sinPrefijo = trimmed.replace(/^[-*#]\s*/, "");

                if (trimmed.startsWith("#")) {
                  return `<div class="heading-line">${sinPrefijo}</div>`;
                } else if (trimmed.startsWith("-")) {
                  return `<div class="bold-line">${sinPrefijo}</div>`;
                } else if (trimmed.startsWith("*")) {
                  return `<div class="indent-line">${sinPrefijo}</div>`;
                } else {
                  return `<div>${sinPrefijo}</div>`;
                }
              })
              .join("");
            // Formatear líneas del informe
            const lineasInforme = data.informe.split("\n");
            informeEl.innerHTML = lineasInforme
              .map((linea) => {
                const trimmed = linea.trimStart();
                const sinPrefijo = trimmed.replace(/^[-*#]\s*/, "");

                if (trimmed.startsWith("#")) {
                  return `<div class="heading-line">${sinPrefijo}</div>`;
                } else if (trimmed.startsWith("-")) {
                  return `<div class="bold-line">${sinPrefijo}</div>`;
                } else if (trimmed.startsWith("*")) {
                  return `<div class="indent-line">${sinPrefijo}</div>`;
                } else {
                  return `<div>${sinPrefijo}</div>`;
                }
              })
              .join("");
          }
        } catch (err) {
          descripcionEl.textContent = "Error en la solicitud.";
        }
      });
    }

    const leerBtn = document.getElementById("leer");
    if (leerBtn) {
      leerBtn.addEventListener("click", () => {
        const informe = document.getElementById("descripcion").textContent;
        if (informe) {
          const msg = new SpeechSynthesisUtterance(informe);
          msg.lang = "es-ES";
          window.speechSynthesis.speak(msg);
        }
      });
    }

    const pararBtn = document.getElementById("parar");
    if (pararBtn) {
      pararBtn.addEventListener("click", () => {
        window.speechSynthesis.cancel();
      });
    }

    // Dropzone (seccion para arrastrar imagen)

    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("imagen");
    const previewImg = document.getElementById("preview");

    dropzone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) mostrarVistaPrevia(file);
    });

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.style.backgroundColor = "#dbeefc";
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.style.backgroundColor = "#f4faff";
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.style.backgroundColor = "#f4faff";
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        fileInput.files = e.dataTransfer.files;
        mostrarVistaPrevia(file);
      }
    });

    function mostrarVistaPrevia(file) {
      const reader = new FileReader();
      reader.onload = () => {
        previewImg.src = reader.result;
        previewImg.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  }
});
