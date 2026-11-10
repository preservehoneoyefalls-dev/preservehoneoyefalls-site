/* Preserve Honeoye Falls: renders editable content (content/*.json) into the page.
   Text is edited at /admin. Nothing in this file needs to change for normal edits. */
(function () {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(u)) return u;
    if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return "https://" + u;
    return "#";
  }
  function isExternal(u) { return /^https?:/i.test(u) && u.indexOf(location.host) === -1; }
  function linkAttrs(u) {
    var url = safeUrl(u);
    return 'href="' + esc(url) + '"' + (isExternal(url) ? ' target="_blank" rel="noopener"' : "");
  }

  // Inline markdown: **bold**, *italic*, [text](url)
  function inline(s) {
    // Keep backslash-escaped characters (the editor writes e.g. \* or \.) literal.
    var out = esc(String(s == null ? "" : s).replace(/\\([!-\/:-@\[-`{-~])/g, function (m, c) { return "\u0000" + c.charCodeAt(0) + "\u0000"; }));
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
      return "<a " + linkAttrs(u.replace(/&amp;/g, "&")) + ">" + t + "</a>";
    });
    // Bold/italic only in text, never inside a link's tag (URLs can contain * or _).
    out = out.split(/(<[^>]+>)/).map(function (part, i) {
      if (i % 2) return part;
      return part
        .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
        .replace(/__([^_]+)__/g, "<b>$1</b>")
        .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
        .replace(/(^|[^\w_])_([^_\n]+)_(?!\w)/g, "$1<em>$2</em>");
    }).join("");
    return out.replace(/\u0000(\d+)\u0000/g, "&#$1;");
  }

  // Block markdown: paragraphs, ## / ### headings, - lists, 1. lists, images ![alt](src)
  function blocks(md) {
    var lines = String(md || "").replace(/\r/g, "").split("\n");
    var html = [], para = [], list = null;
    function flushPara() { if (para.length) { html.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } }
    function flushList() { if (list) { html.push("<" + list.tag + ">" + list.items.map(function (i) { return "<li>" + inline(i) + "</li>"; }).join("") + "</" + list.tag + ">"); list = null; } }
    lines.forEach(function (raw) {
      var line = raw.trim(), m;
      if (!line) { flushPara(); flushList(); return; }
      if ((m = line.match(/^(#{2,3})\s+(.*)$/))) { flushPara(); flushList(); var n = m[1].length; html.push("<h" + n + ">" + inline(m[2]) + "</h" + n + ">"); return; }
      if ((m = line.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) { flushPara(); flushList(); html.push('<p><img src="' + esc(safeUrl(m[2])) + '" alt="' + esc(m[1]) + '" loading="lazy"></p>'); return; }
      if ((m = line.match(/^[-*]\s+(.*)$/))) { flushPara(); if (!list || list.tag !== "ul") { flushList(); list = { tag: "ul", items: [] }; } list.items.push(m[1]); return; }
      if ((m = line.match(/^\d+[.)]\s+(.*)$/))) { flushPara(); if (!list || list.tag !== "ol") { flushList(); list = { tag: "ol", items: [] }; } list.items.push(m[1]); return; }
      flushList(); para.push(line);
    });
    flushPara(); flushList();
    return html.join("\n");
  }

  function list(a) { return Array.isArray(a) ? a : []; }

  function copyRow(id, text) {
    return '<div class="copyrow"><code id="' + id + '">' + esc(text) + '</code><button class="copy" type="button" data-copy="' + id + '">Copy</button></div>';
  }
  function wireCopy(root) {
    (root || document).querySelectorAll(".copy").forEach(function (b) {
      b.addEventListener("click", function () {
        var el = document.getElementById(b.dataset.copy), t = el.textContent.trim();
        function sel() { var r = document.createRange(); r.selectNodeContents(el); var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected"; }
        try { navigator.clipboard.writeText(t).then(function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1800); }, sel); } catch (e) { sel(); }
      });
    });
  }

  // Shared chrome: nav links, footer. onHome = anchors stay on page; otherwise link back to "/".
  function renderChrome(home, onHome) {
    var site = home.site || {};
    var base = onHome ? "" : "/";
    var nav = document.getElementById("navlinks");
    if (nav) {
      var links = [
        ["#copperfield", "Copperfield"], ["#concerns", "Concerns"], ["#status", "Where it stands"], ["#about", "About us"]
      ].map(function (l) { return '<a href="' + base + l[0] + '">' + l[1] + "</a>"; });
      list(site.menu).forEach(function (m) { if (m && m.label) links.push("<a " + linkAttrs(m.url) + ">" + esc(m.label) + "</a>"); });
      if (site.documents_url) links.push('<a class="docs" href="' + esc(safeUrl(site.documents_url)) + '" target="_blank" rel="noopener">' + esc(site.documents_label || "Documents") + " ↗</a>");
      links.push('<a class="cta" href="' + base + '#petition">Take action</a>');
      nav.innerHTML = links.join("\n");
    }
    var brand = document.getElementById("brandlink");
    if (brand) brand.setAttribute("href", onHome ? "#top" : "/");
    var foot = document.getElementById("footer");
    if (foot) foot.innerHTML = "<span>" + inline(site.footer_text) + "</span><span>" + esc(site.updated) + "</span>";
  }

  function loadJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  window.PHF = { esc: esc, inline: inline, blocks: blocks, list: list, linkAttrs: linkAttrs, safeUrl: safeUrl, copyRow: copyRow, wireCopy: wireCopy, renderChrome: renderChrome, loadJSON: loadJSON };
})();
