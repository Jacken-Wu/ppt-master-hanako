/**
 * ppt-master/tools/manage-project.js
 *
 * Project management: init, import-sources, validate, list.
 */
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export const name = "ppt-master_manage-project";
export const description =
  "管理 PPT Master 项目。支持: init（创建新项目）, import-sources（导入源文件）, validate（验证项目结构）, list（列出项目）。";

export const parameters = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["init", "import-sources", "validate", "list"],
      description: "操作类型。init=创建新项目, import-sources=导入源文件, validate=验证结构, list=列出所有项目。",
    },
    projectName: {
      type: "string",
      description: "项目名称（init 时必填）。用于创建项目的目录名。",
    },
    format: {
      type: "string",
      enum: ["ppt169", "ppt43"],
      description: "画布格式（init 时可选，默认 ppt169）。ppt169=16:9, ppt43=4:3。",
      default: "ppt169",
    },
    projectPath: {
      type: "string",
      description: "已有项目的路径（import-sources / validate 时使用）。绝对路径。",
    },
    sources: {
      type: "array",
      items: { type: "string" },
      description: "要导入的源文件路径列表（import-sources 时使用）。",
    },
    move: {
      type: "boolean",
      description: "是否将源文件移动到项目目录（import-sources 时可选，默认 false）。",
      default: false,
    },
  },
  required: ["action"],
};

export async function execute(input, ctx) {
  const pptMaster = ctx._pptMaster;
  if (!pptMaster) {
    return { content: [{ type: "text", text: "PPT Master 插件未初始化" }] };
  }

  const { scriptsDir, projectsDir, pythonCmd, log } = pptMaster;
  const scriptPath = path.join(scriptsDir, "project_manager.py");

  if (!fs.existsSync(scriptPath)) {
    return { content: [{ type: "text", text: `project_manager.py 未找到: ${scriptPath}` }] };
  }

  const { action } = input;

  // Special case: list projects
  if (action === "list") {
    try {
      const items = fs.readdirSync(projectsDir).filter((name) => {
        const p = path.join(projectsDir, name);
        return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, "project.json"));
      });
      if (items.length === 0) {
        return { content: [{ type: "text", text: `项目目录为空: ${projectsDir}` }] };
      }
      const list = items.map((name) => {
        try {
          const meta = JSON.parse(fs.readFileSync(path.join(projectsDir, name, "project.json"), "utf-8"));
          return `  • ${name} — ${meta.title || "无标题"} (${meta.format || "16:9"})`;
        } catch {
          return `  • ${name}`;
        }
      });
      return {
        content: [{ type: "text", text: `项目列表 (${items.length}):\n${list.join("\n")}\n\n路径: ${projectsDir}` }],
      };
    } catch (err) {
      return { content: [{ type: "text", text: `列出项目失败: ${err.message}` }] };
    }
  }

  // Build args
  let args = [scriptPath, action];
  const runOpts = { cwd: scriptsDir, timeout: 60_000 };

  if (action === "init") {
    if (!input.projectName) {
      return { content: [{ type: "text", text: "init 操作需要 projectName 参数。" }] };
    }
    const projectDir = path.join(projectsDir, input.projectName);
    if (fs.existsSync(projectDir)) {
      return { content: [{ type: "text", text: `项目已存在: ${projectDir}` }] };
    }
    args.push(input.projectName, "--format", input.format || "ppt169");
    runOpts.cwd = projectsDir;
  } else if (action === "import-sources") {
    if (!input.projectPath || !input.sources?.length) {
      return { content: [{ type: "text", text: "import-sources 需要 projectPath 和 sources 参数。" }] };
    }
    args.push(input.projectPath, ...input.sources);
    if (input.move) args.push("--move");
  } else if (action === "validate") {
    if (!input.projectPath) {
      return { content: [{ type: "text", text: "validate 需要 projectPath 参数。" }] };
    }
    args.push(input.projectPath);
  }

  return new Promise((resolve) => {
    const proc = execFile(pythonCmd, args, runOpts, (err, stdout, stderr) => {
      if (err) {
        log.warn(`manage-project ${action} failed: ${err.message}`);
        resolve({
          content: [
            { type: "text", text: `操作失败 (${action}): ${err.message}` },
            ...(stderr ? [{ type: "text", text: `stderr: ${stderr.slice(0, 2000)}` }] : []),
          ],
        });
        return;
      }

      const out = stdout.trim();
      resolve({
        content: [{ type: "text", text: `✅ ${action} 成功。\n\n${out}` }],
      });
    });

    proc.on("error", (err) => {
      resolve({
        content: [{ type: "text", text: `启动脚本失败: ${err.message}` }],
      });
    });
  });
}
