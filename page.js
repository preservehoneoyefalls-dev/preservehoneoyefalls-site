/* Builds an extra page (e.g. /p/meeting-guide) from content/pages/<name>.json. Pages are added at /admin. */
(function () {
  "use strict";
  var P = window.PHF, esc = P.esc, inline = P.inline, blocks = P.blocks;
  var slug = (location.pathname.match(/^\/p\/([a-z0-9-]+)\/?$/i) || [])[1] ||
             new URLSearchParams(location.search).get("p") || "";
  var app = document.getElementById("app");

  function notFound() {
    document.title = "Page not found · Preserve Honeoye Falls";
    app.innerHTML = '<section class="page"><div class="wrap prose"><h1>Page not found</h1><p class="lede">That page doesn\'t exist or was moved. <a href="/">Go to the homepage</a>.</p></div></section>';
  }

  P.loadJSON("/content/home.json").then(function (home) { P.renderChrome(home, false); }).catch(function () {});

  if (!/^[a-z0-9-]+$/i.test(slug)) { notFound(); return; }

  P.loadJSON("/content/pages/" + slug.toLowerCase() + ".json").then(function (pg) {
    document.title = (pg.title || "") + " · Preserve Honeoye Falls";
    var md = document.querySelector('meta[name="description"]');
    if (md && pg.intro) md.setAttribute("content", pg.intro);
    app.innerHTML =
      '<header class="page-hero"><div class="wrap"><div class="eyebrow">' + esc(pg.eyebrow || "Preserve Honeoye Falls") + "</div><h1>" + esc(pg.title) + "</h1>" +
      (pg.intro ? "<p>" + inline(pg.intro) + "</p>" : "") + "</div></header>" +
      '<section class="page"><div class="wrap"><article class="prose article">' + blocks(pg.body) + "</article>" +
      '<p class="back"><a href="/">← Back to the homepage</a></p></div></section>';
    P.wireCopy(app);
  }).catch(notFound);
})();
