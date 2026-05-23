/**
 * ppt-master/tools/post-process.js
 *
 * Post-processing pipeline: total_md_split → finalize_svg → svg_to_pptx.
 * Also includes animation_config scaffold/validate, svg_quality_checker, update_spec.
 */
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export const name = "ppt-master_post-process";
export const description =
  "PPT 后处理与导出管道。支持: split（分割 speaker notes）, finalize（终处理 SVG）, export（导出 PPTX）, quality-check（SVG 质量检查）, update-spec（更新 spec 后批量修改 SVG）, animate-scaffold（创建动画配置）, animate-validate（验证动画配置）。";

export const parameters = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["split", "finalize", "export", "quality-check", "update-spec", "animate-scaffold", "animate-validate"],
      description: "后处理操作。split=分割 speaker notes, finalize=终处理 SVG, export=导出 PPTX, quality-check=质量检查, update-spec=更新颜色/字体后同步 SVG, animate-scaffold=创建逐对象动画配置, animate-validate=验证动画配置。",
    },
    projectPath: {
      type: "string",
      description: "项目路径。所有操作都需要。",
    },
    specChanges: {
      type: "object",
      description: "update-spec 时的颜色/字体变更。如 { color: '#ff0000', font_family: 'Microsoft YaHei' }。",
    },
  },
  required: ["action", "projectPath"],
};

export async function execute(input, ctx) {
  const pptMaster = ctx._pptMaster;
  if (!pptMaster) {
    return { content: [{ type: "text", text: "PPT Master 插件未初始化" }] };
  }

  const { scriptsDir, pythonCmd, log } = pptMaster;

  if (!fs.existsSync(input.projectPath)) {
    return { content: [{ type: "text", text: `项目路径不存在: ${input.projectPath}` }] };
  }

  const actionMap = {
    "split":           { script: "total_md_split.py",               args: [] },
    "finalize":        { script: "finalize_svg.py",                 args: [] },
    "export":          { script: "svg_to_pptx.py",                  args: [] },
    "quality-check":   { script: "svg_quality_checker.py",          args: [] },
    "animate-scaffold":{ script: "animation_config.py",             args: ["scaffold"] },
    "animate-validate":{ script: "animation_config.py",             args: ["validate"] },
  };

  // update-spec is special
  if (input.action === "update-spec") {
    return runUpdateSpec(input, pythonCmd, scriptsDir, log);
  }

  const entry = actionMap[input.action];
  if (!entry) {
    return { content: [{ type: "text", text: `未知操作: ${input.action}` }] };
  }

  const scriptPath = path.join(scriptsDir, entry.script);
  if (!fs.existsSync(scriptPath)) {
    return { content: [{ type: "text", text: `脚本未找到: ${scriptPath}\n请确保已安装 Python 依赖。` }] };
  }

  const args = [scriptPath, ...entry.args, input.projectPath];
  return new Promise((resolve) => {
    const proc = execFile(pythonCmd, args, { cwd: scriptsDir, timeout: 180_000 }, (err, stdout, stderr) => {
      if (err) {
        log.warn(`post-process ${input.action} failed: ${err.message}`);
        resolve({
          content: [
            { type: "text", text: `❌ ${input.action} 失败: ${err.message}` },
            ...(stderr ? [{ type: "text", text: `stderr: ${stderr.slice(0, 2000)}` }] : []),
          ],
        });
        return;
      }
      resolve({
        content: [{ type: "text", text: `✅ ${input.action} 完成。\n\n${stdout.trim()}` }],
      });
    });
    proc.on("error", (err) => {
      resolve({ content: [{ type: "text", text: `启动脚本失败: ${err.message}` }] });
    });
  });
}

async function runUpdateSpec(input, pythonCmd, scriptsDir, log) {
  const scriptPath = path.join(scriptsDir, "update_spec.py");
  if (!fs.existsSync(scriptPath)) {
    return { content: [{ type: "text", text: `update_spec.py 未找到` }] };
  }

  const changes = input.specChanges || {};
  const args = [scriptPath, input.projectPath];
  if (changes.color) args.push("--color", changes.color);
  if (changes.font_family) args.push("--font-family", changes.font_family);

  return new Promise((resolve) => {
    const proc = execFile(pythonCmd, args, { cwd: scriptsDir, timeout: 120_000 }, (err, stdout, stderr) => {
      if (err) {
        log.warn(`update-spec failed: ${err.message}`);
        resolve({
          content: [
            { type: "text", text: `update-spec 失败: ${err.message}` },
            ...(stderr ? [{ type: "text", text: `stderr: ${stderr.slice(0, 2000)}` }] : []),
          ],
        });
        return;
      }
      resolve({
        content: [{ type: "text", text: `✅ spec 更新完成。\n\n${stdout.trim()}` }],
      });
    });
    proc.on("error", (err) => {
      resolve({ content: [{ type: "text", text: `启动脚本失败: ${err.message}` }] });
    });
  });
}
