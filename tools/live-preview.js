/**
 * ppt-master/tools/live-preview.js
 *
 * Start/stop the SVG live preview server for a project.
 * The server runs the svg_editor/server.py which hosts an interactive browser
 * preview with element-level annotation capabilities.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export const name = "ppt-master_live-preview";
export const description =
  "启动/停止 SVG 实时预览服务器。启动后可在浏览器中预览和标注 SVG 页面元素。默认端口 8765。";

export const parameters = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["start", "stop", "status"],
      description: "start=启动预览服务器, stop=停止, status=查看状态。",
    },
    projectPath: {
      type: "string",
      description: "项目路径（start 时必填）。",
    },
    port: {
      type: "number",
      description: "端口号（start 时可选，默认 8765）。",
      default: 8765,
    },
    live: {
      type: "boolean",
      description: "是否开启实时文件监控（start 时可选，默认 true）。",
      default: true,
    },
  },
  required: ["action"],
};

export async function execute(input, ctx) {
  const pptMaster = ctx._pptMaster;
  if (!pptMaster) {
    return { content: [{ type: "text", text: "PPT Master 插件未初始化" }] };
  }

  const { scriptsDir, pythonCmd, log, previewServers } = pptMaster;

  if (input.action === "status") {
    const running = [];
    for (const [projectPath, svr] of previewServers) {
      running.push(`  • ${projectPath} → http://localhost:${svr.port}`);
    }
    if (running.length === 0) {
      return { content: [{ type: "text", text: "没有运行中的预览服务器。" }] };
    }
    return { content: [{ type: "text", text: `运行中的预览服务器:\n${running.join("\n")}` }] };
  }

  if (input.action === "stop") {
    let stopped = 0;
    if (input.projectPath) {
      const svr = previewServers.get(input.projectPath);
      if (svr) {
        svr.proc.kill("SIGTERM");
        previewServers.delete(input.projectPath);
        stopped = 1;
      }
    } else {
      for (const [projectPath, svr] of previewServers) {
        svr.proc.kill("SIGTERM");
        previewServers.delete(projectPath);
        stopped++;
      }
    }
    return { content: [{ type: "text", text: `已停止 ${stopped} 个预览服务器。` }] };
  }

  // start
  if (input.action === "start") {
    if (!input.projectPath) {
      return { content: [{ type: "text", text: "start 操作需要 projectPath 参数。" }] };
    }
    if (!fs.existsSync(input.projectPath)) {
      return { content: [{ type: "text", text: `项目路径不存在: ${input.projectPath}` }] };
    }

    // Check if already running
    if (previewServers.has(input.projectPath)) {
      const svr = previewServers.get(input.projectPath);
      return {
        content: [{ type: "text", text: `预览服务器已运行: http://localhost:${svr.port}` }],
      };
    }

    const scriptPath = path.join(scriptsDir, "svg_editor", "server.py");
    if (!fs.existsSync(scriptPath)) {
      return { content: [{ type: "text", text: `svc 编辑器脚本未找到: ${scriptPath}` }] };
    }

    const port = input.port || 8765;
    const args = [scriptPath, input.projectPath, "--port", String(port)];
    if (input.live !== false) args.push("--live");

    const proc = spawn(pythonCmd, args, {
      cwd: scriptsDir,
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    });

    // Store for lifecycle management
    previewServers.set(input.projectPath, { proc, port });

    proc.on("error", (err) => {
      log.warn(`live-preview server error: ${err.message}`);
      previewServers.delete(input.projectPath);
    });

    proc.on("exit", (code) => {
      log.info(`live-preview server exited (code=${code})`);
      previewServers.delete(input.projectPath);
    });

    // Brief delay to let server start
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          content: [
            {
              type: "text",
              text: `✅ 预览服务器已启动。\n\nURL: http://localhost:${port}\n项目: ${input.projectPath}\n\n打开浏览器即可实时预览和标注 SVG 页面元素。`,
            },
          ],
          details: {
            card: {
              type: "iframe",
              route: `/preview?port=${port}&project=${encodeURIComponent(input.projectPath)}`,
              title: "PPT Master 预览",
              description: "SVG 实时预览",
              aspectRatio: "16:9",
            },
          },
        });
      }, 1500);
    });
  }

  return { content: [{ type: "text", text: `未知操作: ${input.action}` }] };
}
