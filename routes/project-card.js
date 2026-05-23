/**
 * ppt-master/routes/project-card.js
 *
 * Project status card — embedded iframe showing pipeline progress.
 * Used in chat to display project generation progress.
 */
import fs from "node:fs";
import path from "node:path";

export default function (app, ctx) {
  app.get("/project-card", (c) => {
    const projectPath = c.req.query("project");
    const hanaCss = c.req.query("hana-css") || "";

    const pptMaster = ctx._pptMaster;
    if (!pptMaster) {
      return c.text("PPT Master 插件未初始化", 500);
    }

    const { projectsDir } = pptMaster;
    const resolvedPath = projectPath
      ? (path.isAbsolute(projectPath) ? projectPath : path.join(projectsDir, projectPath))
      : null;

    if (!resolvedPath || !fs.existsSync(resolvedPath)) {
      return c.html(renderCard("项目不存在", "warning", [], hanaCss));
    }

    // Detect pipeline state
    const state = detectPipelineState(resolvedPath);
    const hasSpec = fs.existsSync(path.join(resolvedPath, "spec_lock.md"));
    const svgCount = countSvgs(resolvedPath);
    const hasPptx = fs.existsSync(path.join(resolvedPath, "output.pptx")) ||
                    fs.existsSync(path.join(resolvedPath, "output.ppt"));

    // Read project metadata
    let title = path.basename(resolvedPath);
    const metaPath = path.join(resolvedPath, "project.json");
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
        if (meta.title) title = meta.title;
      } catch { /* ignore */ }
    }

    // Build pipeline steps
    const steps = [
      { id: "sources",   label: "源文档导入",         done: fs.existsSync(path.join(resolvedPath, "sources.md")) || fs.existsSync(path.join(resolvedPath, "sources")) },
      { id: "spec",      label: "设计方案 (Strategist)", done: hasSpec },
      { id: "images",    label: "图片生成 (Image Gen)",  done: state.hasImages },
      { id: "svg",       label: "SVG 生成 (Executor)",  done: svgCount > 0, detail: `${svgCount} slides` },
      { id: "quality",   label: "质量检查",             done: state.hasQualityReport },
      { id: "pptx",      label: "PPTX 导出",            done: hasPptx, detail: hasPptx ? "已导出" : undefined },
    ];

    const completedSteps = steps.filter((s) => s.done).length;
    const totalSteps = steps.length;
    const progress = Math.round((completedSteps / totalSteps) * 100);

    return c.html(renderCard(title, state.phase, steps, hanaCss, progress, resolvedPath));
  });
}

function detectPipelineState(projectPath) {
  const files = fs.readdirSync(projectPath);

  const hasSources = files.some((f) => f.endsWith(".md") && f !== "spec_lock.md" && f !== "design_spec.md");
  const hasSpec = fs.existsSync(path.join(projectPath, "spec_lock.md"));
  const hasImages = fs.existsSync(path.join(projectPath, "images")) &&
    fs.readdirSync(path.join(projectPath, "images")).some((f) => /\.(png|jpg|jpeg|webp|svg)$/i.test(f));
  const svgCount = countSvgs(projectPath);
  const hasQualityReport = fs.existsSync(path.join(projectPath, "quality_report.json"));
  const hasPptx = files.some((f) => f.endsWith(".pptx"));

  let phase = "pending";
  if (hasPptx) phase = "completed";
  else if (svgCount > 0) phase = "svg-generated";
  else if (hasSpec) phase = "strategist-done";
  else if (hasSources) phase = "sources-ready";

  return { phase, hasImages, hasQualityReport };
}

function countSvgs(projectPath) {
  let count = 0;
  for (const dir of ["svg_final", "svg"]) {
    const d = path.join(projectPath, dir);
    if (fs.existsSync(d)) {
      count += fs.readdirSync(d).filter((f) => f.endsWith(".svg")).length;
    }
  }
  return count;
}

function renderCard(title, phase, steps, hanaCss, progress, projectPath) {
  const phaseLabel = {
    "pending": "⏳ 等待开始",
    "sources-ready": "📄 源文件已就绪",
    "strategist-done": "🎨 设计方案完成",
    "svg-generated": "🖼️ SVG 页面已生成",
    "completed": "✅ 已完成",
  };

  const phaseColors = {
    "pending": "#888",
    "sources-ready": "#5b8def",
    "strategist-done": "#e67e22",
    "svg-generated": "#8e44ad",
    "completed": "#27ae60",
  };

  const stepsHtml = steps.map((s) => `
    <div class="step ${s.done ? 'done' : 'pending'}">
      <div class="step-icon">${s.done ? '✓' : '○'}</div>
      <div class="step-info">
        <div class="step-label">${s.label}</div>
        ${s.detail ? `<div class="step-detail">${s.detail}</div>` : ""}
      </div>
    </div>
  `).join("");

  const progressBar = progress != null
    ? `<div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
       <div class="progress-text">${progress}%</div>`
    : "";

  const projectPathShort = projectPath ? projectPath.replace(/\\/g, "/").split("/").slice(-2).join("/") : "";

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${hanaCss ? `<link rel="stylesheet" href="${hanaCss}">` : ""}
<title>${escHtml(title)} — PPT Master</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;
  background:transparent;color:var(--text,#333);padding:8px}
.card{background:var(--bg-card,#fff);border-radius:12px;padding:16px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
.card-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:6px}
.card-title{font-size:15px;font-weight:600;display:flex;align-items:center;gap:8px}
.phase-badge{font-size:11px;padding:2px 8px;border-radius:999px;font-weight:500;
  background:${phaseColors[phase] || "#888"}18;color:${phaseColors[phase] || "#888"}}
.path{font-size:10px;color:var(--text-muted,#999);margin-top:2px}
.progress-section{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.progress-bar{flex:1;height:4px;background:var(--border,#eee);border-radius:2px;overflow:hidden}
.progress-fill{height:100%;background:${phaseColors[phase] || "#5b8def"};border-radius:2px;transition:width 0.3s}
.progress-text{font-size:11px;font-weight:600;color:var(--text-muted,#888);min-width:30px;text-align:right}
.steps{display:flex;flex-direction:column;gap:6px}
.step{display:flex;align-items:flex-start;gap:8px;padding:6px 8px;border-radius:6px;font-size:12px}
.step.done{color:var(--text,#333)}
.step.pending{color:var(--text-muted,#999)}
.step-icon{font-size:14px;width:18px;text-align:center}
.step.done .step-icon{color:#27ae60}
.step-info{min-width:0}
.step-label{font-weight:500}
.step-detail{font-size:11px;color:var(--text-muted,#999);margin-top:1px}
@media (prefers-color-scheme:dark){
  .card{background:var(--bg-card,#1e1e22)}
  .step.done{color:var(--text,#e6e6e9)}
  .progress-bar{background:var(--border,#333)}
}
</style>
</head>
<body>
<div class="card">
  <div class="card-header">
    <div>
      <div class="card-title">
        <span>📊</span>
        <span>${escHtml(title)}</span>
        <span class="phase-badge">${phaseLabel[phase] || phase}</span>
      </div>
      <div class="path">${escHtml(projectPathShort)}</div>
    </div>
  </div>
  ${progressBar}
  <div class="steps">${stepsHtml}</div>
</div>
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
