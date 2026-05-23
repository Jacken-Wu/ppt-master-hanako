/**
 * ppt-master/routes/preview.js
 *
 * Iframe-based slide preview card. Shows the project's SVG slides in a
 * lightweight viewer embedded in chat messages.
 *
 * The viewer displays SVG thumbnails, allows page navigation, and optionally
 * embeds the live preview server when running.
 */
import fs from "node:fs";
import path from "node:path";

export default function (app, ctx) {
  // Slide preview card — embedded iframe showing project SVGs
  app.get("/preview", (c) => {
    const projectPath = c.req.query("project");
    const port = c.req.query("port");
    const slideIndex = parseInt(c.req.query("slide") || "0", 10);
    const hanaCss = c.req.query("hana-css") || "";

    const pptMaster = ctx._pptMaster;
    if (!pptMaster) {
      return c.text("PPT Master 插件未初始化", 500);
    }

    const { projectsDir } = pptMaster;

    // Resolve project
    const resolvedPath = projectPath
      ? (path.isAbsolute(projectPath) ? projectPath : path.join(projectsDir, projectPath))
      : null;

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return c.html(renderError("项目不存在", hanaCss));
    }

    // Find SVG files
    let svgFiles = [];
    const svgFinalDir = path.join(resolvedPath, "svg_final");
    const svgDir = path.join(resolvedPath, "svg");

    if (fs.existsSync(svgFinalDir)) {
      svgFiles = fs.readdirSync(svgFinalDir)
        .filter((f) => f.endsWith(".svg"))
        .sort()
        .map((f) => path.join(svgFinalDir, f));
    } else if (fs.existsSync(svgDir)) {
      svgFiles = fs.readdirSync(svgDir)
        .filter((f) => f.endsWith(".svg"))
        .sort()
        .map((f) => path.join(svgDir, f));
    }

    // Load spec info
    let projectTitle = "未命名项目";
    let specData = {};
    const specPath = path.join(resolvedPath, "spec_lock.md");
    if (fs.existsSync(specPath)) {
      try {
        const content = fs.readFileSync(specPath, "utf-8");
        const titleMatch = content.match(/^#\s+(.+)/m);
        if (titleMatch) projectTitle = titleMatch[1];
        specData = { title: projectTitle };
      } catch { /* ignore */ }
    }

    // Also check project.json
    const metaPath = path.join(resolvedPath, "project.json");
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        if (meta.title) projectTitle = meta.title;
        specData.title = projectTitle;
      } catch { /* ignore */ }
    }

    // Live preview URL if server is running
    const livePreviewUrl = port
      ? `http://localhost:${port}`
      : null;

    // Read first few SVGs for thumbnails (limit to 10)
    const thumbnails = svgFiles.slice(0, 10).map((fp, i) => {
      try {
        const content = fs.readFileSync(fp, "utf-8");
        // Extract just the viewBox info and a brief preview (first ~200 chars)
        const viewBoxMatch = content.match(/viewBox="([^"]+)"/);
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        return {
          index: i,
          file: path.basename(fp),
          title: titleMatch ? titleMatch[1] : `Slide ${i + 1}`,
          viewBox: viewBoxMatch ? viewBoxMatch[1] : "0 0 960 540",
          previewSvg: content.slice(0, 500) + (content.length > 500 ? "\n<!-- truncated -->" : ""),
        };
      } catch {
        return { index: i, file: path.basename(fp), title: `Slide ${i + 1}`, error: true };
      }
    });

    const totalSlides = svgFiles.length;

    return c.html(renderPreview({
      projectTitle,
      totalSlides,
      thumbnails,
      slideIndex,
      livePreviewUrl,
      specData,
      hanaCss,
      projectPath: resolvedPath,
    }));
  });
}

function renderPreview(data) {
  const { projectTitle, totalSlides, thumbnails, slideIndex, livePreviewUrl, hanaCss, projectPath } = data;

  const thumbHtml = thumbnails.map((t) => `
    <div class="thumb" data-index="${t.index}">
      <div class="thumb-frame">
        <svg viewBox="${t.viewBox || '0 0 960 540'}" class="thumb-svg">
          <foreignObject width="100%" height="100%">
            <div class="thumb-placeholder">Slide ${t.index + 1}</div>
          </foreignObject>
        </svg>
      </div>
      <div class="thumb-label">${escHtml(t.title)}</div>
    </div>
  `).join("");

  const liveHtml = livePreviewUrl ? `
    <div class="live-banner">
      <span class="live-dot"></span>
      Live Preview: <a href="${escHtml(livePreviewUrl)}" target="_blank">${escHtml(livePreviewUrl)}</a>
    </div>
  ` : "";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${hanaCss ? `<link rel="stylesheet" href="${hanaCss}">` : ""}
<title>${escHtml(projectTitle)} — PPT Master 预览</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
  background:var(--bg-page,#f5f3ef);color:var(--text,#333);padding:16px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}
.header h2{font-size:18px;font-weight:600}
.header .meta{font-size:13px;color:var(--text-muted,#888)}
.live-banner{display:inline-flex;align-items:center;gap:8px;padding:6px 12px;background:#e8f5e9;
  border-radius:6px;font-size:13px;margin-bottom:12px;color:#2e7d32}
.live-dot{width:8px;height:8px;border-radius:50%;background:#4caf50;animation:pulse 1.5s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
.thumb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px}
.thumb{background:var(--bg-card,#fff);border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);
  transition:transform 0.15s,box-shadow 0.15s}
.thumb:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.12)}
.thumb-frame{aspect-ratio:16/9;background:#fafafa;display:flex;align-items:center;justify-content:center;
  border-bottom:1px solid #eee}
.thumb-placeholder{color:#bbb;font-size:13px}
.thumb-label{padding:8px 10px;font-size:12px;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.empty{padding:40px;text-align:center;color:var(--text-muted,#999)}
.empty .icon{font-size:48px;margin-bottom:12px;opacity:0.3}
@media (prefers-color-scheme:dark){
  body{background:var(--bg-page,#16161a);color:var(--text,#e6e6e9)}
  .thumb{background:var(--bg-card,#1e1e22);box-shadow:0 1px 3px rgba(0,0,0,0.3)}
  .thumb-frame{background:#232328;border-color:#333}
  .thumb-label{color:#aaa}
  .thumb-placeholder{color:#555}
  .live-banner{background:#1b3a1f;color:#81c784}
}
</style>
</head>
<body>
<div class="header">
  <div>
    <h2>${escHtml(projectTitle)}</h2>
    <div class="meta">${totalSlides} slides</div>
  </div>
  ${liveHtml}
</div>
${totalSlides === 0 ? `
<div class="empty">
  <div class="icon">📄</div>
  <p>项目还没有生成的 SVG 页面。</p>
  <p style="font-size:12px;margin-top:8px;color:var(--text-muted,#999)">${escHtml(projectPath)}</p>
</div>` : `<div class="thumb-grid">${thumbHtml}</div>`}
<script>
(function(){function notify(){parent.postMessage({type:'resize-request',
  payload:{width:document.body.scrollWidth,height:document.body.scrollHeight}},'*')}
  new ResizeObserver(notify).observe(document.body);
  parent.postMessage({type:'ready'},'*');
  requestAnimationFrame(notify);
})();
</script>
</body>
</html>`;
}

function escHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderError(msg, hanaCss) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
${hanaCss ? `<link rel="stylesheet" href="${hanaCss}">` : ""}
<style>body{font-family:sans-serif;padding:24px;color:#c0392b;text-align:center;padding-top:60px}</style>
<body><h3>${escHtml(msg)}</h3></body></html>`;
}
