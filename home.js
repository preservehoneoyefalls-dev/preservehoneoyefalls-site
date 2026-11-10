/* Builds the homepage from content/home.json. Edit the words at /admin, not here. */
(function () {
  "use strict";
  var P = window.PHF, esc = P.esc, inline = P.inline, blocks = P.blocks, list = P.list;

  function head(eyebrow, title, lede) {
    return '<div class="head"><div class="eyebrow">' + esc(eyebrow) + "</div><h2>" + esc(title) + "</h2>" +
      (lede ? '<p class="lede">' + inline(lede) + "</p>" : "") + "</div>";
  }

  function render(d) {
    var site = d.site || {}, hero = d.hero || {}, cf = d.copperfield || {}, co = d.concerns || {},
        st = d.status || {}, pe = d.petition || {}, ac = d.actions || {}, ab = d.about || {};
    var petitionUrl = P.safeUrl(site.petition_url);

    if (site.title) document.title = site.title;
    var md = document.querySelector('meta[name="description"]');
    if (md && site.description) md.setAttribute("content", site.description);

    P.renderChrome(d, true);

    // Hero
    document.getElementById("hero-eyebrow").textContent = hero.eyebrow || "";
    document.getElementById("hero-title").innerHTML = esc(hero.headline) + (hero.headline_emphasis ? " <em>" + esc(hero.headline_emphasis) + "</em>" : "");
    document.getElementById("hero-intro").innerHTML = inline(hero.intro);
    document.getElementById("hero-btns").innerHTML =
      '<a class="btn gold" href="' + esc(petitionUrl) + '" target="_blank" rel="noopener">' + esc(hero.primary_button || "Sign the petition") + "</a>" +
      (hero.secondary_button ? '<a class="btn ghost" href="#petition">' + esc(hero.secondary_button) + "</a>" : "");

    var h = [];

    // What is Copperfield
    var total = cf.mix_total ? '<tr><td><b>Total</b></td><td>' + esc(cf.mix_total) + "</td></tr>" : "";
    h.push('<section id="copperfield"><div class="wrap">' + head(cf.eyebrow, cf.title, cf.lede) +
      '<div class="facts">' + list(cf.facts).map(function (f) { return '<div class="fact"><b>' + esc(f.number) + "</b><span>" + esc(f.label) + "</span></div>"; }).join("") + "</div>" +
      '<div class="two"><div class="prose">' + blocks(cf.body) + "</div>" +
      '<div class="mix"><h3>' + esc(cf.mix_title) + "</h3><table>" +
      list(cf.mix).map(function (r) { return "<tr><td>" + esc(r.label) + "</td><td>" + esc(r.value) + "</td></tr>"; }).join("") + total + "</table>" +
      (cf.sources ? '<p class="src">' + inline(cf.sources) + "</p>" : "") +
      (cf.documents_link_text && site.documents_url ? '<p style="margin-top:14px;font-size:15.5px"><a href="' + esc(P.safeUrl(site.documents_url)) + '" target="_blank" rel="noopener">' + esc(cf.documents_link_text) + "</a></p>" : "") +
      "</div></div></div></section>");

    // Concerns
    h.push('<section class="alt" id="concerns"><div class="wrap">' + head(co.eyebrow, co.title, co.lede) +
      '<div class="concerns">' + list(co.items).map(function (c) {
        return '<div class="concern' + (c.wide ? " wide" : "") + '"><h3>' + esc(c.title) + "</h3><p>" + inline(c.text) + "</p></div>";
      }).join("") + "</div></div></section>");

    // Where it stands
    h.push('<section id="status"><div class="wrap">' + head(st.eyebrow, st.title) +
      '<div class="two" style="margin-top:0"><ol class="timeline">' + list(st.timeline).map(function (t) {
        return "<li" + (t.next ? ' class="next"' : "") + "><time>" + esc(t.date) + "</time><span>" + inline(t.text) + "</span></li>";
      }).join("") + '</ol><div class="who">' + list(st.bodies).map(function (b) {
        return "<div><b>" + esc(b.name) + "</b>" + inline(b.text) + "</div>";
      }).join("") + "</div></div></div></section>");

    // Petition
    h.push('<section class="petition" id="petition"><div class="wrap"><div style="display:grid;gap:14px">' +
      '<div class="eyebrow">' + esc(pe.eyebrow) + "</div><h2>" + esc(pe.title) + "</h2><p>" + inline(pe.text) + "</p>" +
      '<div class="btns" style="margin-top:6px"><a class="btn gold" href="' + esc(petitionUrl) + '" target="_blank" rel="noopener">' + esc(pe.button || "Sign the petition") + "</a></div></div>" +
      '<div class="tally" aria-label="Community support">' + list(pe.tally).map(function (t) {
        return "<div><b>" + esc(t.number) + "</b><span>" + esc(t.label) + "</span></div>";
      }).join("") + "</div></div></section>");

    // More ways to help
    h.push('<section id="act"><div class="wrap">' + head(ac.eyebrow, ac.title) + '<div class="actions">' +
      list(ac.items).map(function (a, i) {
        var extra = "";
        if (a.copy_text) extra = P.copyRow("copy-action-" + i, a.copy_text);
        else if (a.button_label && a.button_url) extra = '<a class="btn green" ' + P.linkAttrs(a.button_url) + ">" + esc(a.button_label) + "</a>";
        return '<div class="action"><div class="step">' + esc(a.step) + "</div><h3>" + esc(a.title) + "</h3><p>" + inline(a.text) + "</p>" + extra + "</div>";
      }).join("") + "</div></div></section>");

    // About
    h.push('<section class="alt" id="about"><div class="wrap about"><div class="prose">' +
      '<div class="eyebrow">' + esc(ab.eyebrow) + "</div><h2>" + esc(ab.title) + "</h2>" + blocks(ab.body) + "</div>" +
      '<div class="note"><b style="color:var(--ink)">' + esc(ab.contact_title || "Contact us") + "</b><br>" + esc(ab.contact_text) + "<br>" +
      (site.contact_email ? copyRow2(site.contact_email) : "") + "</div></div></section>");

    document.getElementById("app").innerHTML = h.join("\n");
    P.wireCopy(document);

    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  }

  function copyRow2(email) {
    return P.copyRow("ourEmail", email).replace('<div class="copyrow">', '<div class="copyrow" style="margin-top:10px">');
  }

  P.loadJSON("/content/home.json").then(render).catch(function (e) {
    document.getElementById("app").innerHTML = '<section><div class="wrap"><p class="lede">Sorry, this page didn\'t load. Please refresh, or email preservehoneoyefalls@gmail.com.</p></div></section>';
    if (window.console) console.error(e);
  });
})();
