"use strict";

function documentReadyCallback() {

  if (localStorage.getItem("theme") === "dark") {
    document.body.setAttribute("theme", "dark");
    document.querySelectorAll("img, picture, video, pre").forEach(img => img.setAttribute("theme", "dark"));
    document.querySelectorAll(".vimeo, .youtube, .chart").forEach(video => video.setAttribute("theme", "dark"));
    document.getElementById("dark-mode").setAttribute("title", "Switch to light theme");
  }

  document.querySelector(".navbar-burger").addEventListener("click", () => {
    document.querySelector(".navbar-burger").classList.toggle("is-active");
    document.querySelector(".navbar-menu").classList.toggle("is-active");
  });

  document.querySelectorAll("div.navbar-end > .navbar-item").forEach((el) => {
    if (location.href.includes(el.getAttribute("href"))) {
      document.querySelectorAll("a.navbar-item.is-active").forEach(itm => itm.classList.remove("is-active"));
      el.classList.add("is-active");
    }
  })

  document.getElementById("nav-search").addEventListener("click", (evt) => {
    //let target = evt.currentTarget.getAttribute("data-target");
    document.querySelector("html").classList.add("is-clipped");
    document.getElementById("search-modal").classList.add("is-active");

    document.getElementById("search").focus();
    document.getElementById("search").select();
  });

  document.querySelector(".modal-close").addEventListener("click", (evt) => {
    document.querySelector("html").classList.remove("is-clipped");
    evt.currentTarget.parentElement.classList.remove("is-active");
  });

  document.querySelector(".modal-background").addEventListener("click", (evt) => {
    document.querySelector("html").classList.remove("is-clipped");
    evt.currentTarget.parentElement.classList.remove("is-active");
  });

  document.getElementById("dark-mode").addEventListener("click", () => {
    if (
      localStorage.getItem("theme") == null ||
      localStorage.getItem("theme") == "light"
    ) {
      localStorage.setItem("theme", "dark");
      document.body.setAttribute("theme", "dark");
      document.querySelectorAll("img, picture, video, pre").forEach(img => img.setAttribute("theme", "dark"));
      document.querySelectorAll(".vimeo, .youtube, .chart").forEach(video => video.setAttribute("theme", "dark"));

      document.getElementById("dark-mode").setAttribute("title", "Switch to light theme");
    } else {
      localStorage.setItem("theme", "light");
      document.body.removeAttribute("theme", "dark");
      document.querySelectorAll("img, picture, video, pre").forEach(img => img.removeAttribute("theme", "dark"))
      document.querySelectorAll(".vimeo, .youtube, .chart").forEach(video => video.removeAttribute("theme", "dark"));

      document.getElementById("dark-mode").setAttribute("title", "Switch to dark theme");
    }
  });

  if (typeof mermaid !== "undefined") {
    mermaid.initialize({ startOnLoad: true });
  }

  if (typeof chartXkcd !== "undefined") {
    document.querySelectorAll(".chart").forEach((el, i) => {
      el.setAttribute("id", `chart-${i}`);

      let svg = document.getElementById(`chart-${i}`);
      let { type, ...chartData } = JSON.parse(el.textContent);
      new chartXkcd[type](svg, chartData);
    });
  }

  if (typeof Galleria !== "undefined") {
    document.querySelectorAll(".galleria").forEach((el, i) => {
      el.setAttribute("id", `galleria-${i}`);

      let { images } = JSON.parse(el.textContent);

      for (let image of images) {
        el.insertAdjacentHTML("beforeend",
          `<a href="${image.src}"><img src="${image.src}" data-title="${image.title}" data-description="${image.description}"></a>`
        );
      }

      Galleria.run(".galleria");
    });
  }

  if (typeof mapboxgl !== "undefined") {
    document.querySelectorAll(".map").forEach((el, i) => {
      el.setAttribute("id", `map-${i}`);

      mapboxgl.accessToken = el.querySelector(".mapbox-access-token").textContent.trim();
      let zoom = el.querySelector(".mapbox-zoom").textContent.trim();

      let map = new mapboxgl.Map({
        container: `map-${i}`,
        style: "mapbox://styles/mapbox/light-v10",
        center: [-96, 37.8],
        zoom: zoom,
      });

      map.addControl(new mapboxgl.NavigationControl());

      let geojson = JSON.parse(el.querySelector(".mapbox-geojson").textContent.trim());

      const center = [0, 0];

      geojson.features.forEach(function (marker) {
        center[0] += marker.geometry.coordinates[0];
        center[1] += marker.geometry.coordinates[1];

        new mapboxgl.Marker()
          .setLngLat(marker.geometry.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }) // add popups
              .setHTML(
                "<h3>" +
                marker.properties.title +
                "</h3><p>" +
                marker.properties.description +
                "</p>"
              )
          )
          .addTo(map);
      });

      center[0] = center[0] / geojson.features.length;
      center[1] = center[1] / geojson.features.length;

      map.setCenter(center);
    });
  }

  if (typeof renderMathInElement !== "undefined") {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ]
    });
  }
};

if (document.readyState === 'loading') {  // Loading hasn't finished yet
  document.addEventListener('DOMContentLoaded', documentReadyCallback);
} else {  // `DOMContentLoaded` has already fired
  documentReadyCallback();
}
