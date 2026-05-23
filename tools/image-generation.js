/**
 * ppt-master/tools/image-generation.js
 *
 * AI image generation and analysis tools for the Image Generator role.
 * Wraps image_gen.py and analyze_images.py.
 */
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export const name = "ppt-master_image-generation";
export const description =
  "图片分析与生成工具。支持: analyze（分析项目图片), generate（生成 AI 图片), render-md（渲染图片提示词为 Markdown 预览）。";

export const parameters = {
  type: "object",
  properties: {
    action: {
      type: "string",
      enum: ["analyze", "generate", "render-md"],
      description: "操作类型。analyze=分析已有图片, generate=按 manifest 生成 AI 图片, render-md=渲染图片提示词为 Markdown。",
    },
    projectPath: {
      type: "string",
      description: "项目路径（analyze 时必填）。包含 images/ 目录的项目路径。",
    },
    manifestPath: {
      type: "string",
      description: "image_prompts.json manifest 路径（generate / render-md 时必填）。",
    },
    prompt: {
      type: "string",
      description: "单张图片生成提示词（generate 且无 manifest 时使用）。",
    },
    aspectRatio: {
      type: "string",
      enum: ["16:9", "4:3", "1:1", "3:2", "2:3", "3:4", "21:9", "9:16"],
      description: "图片宽高比（单张生成时可选，默认 16:9）。",
      default: "16:9",
    },
    imageSize: {
      type: "string",
      enum: ["1K", "2K", "4K"],
      description: "图片尺寸（单张生成时可选，默认 1K）。",
      default: "1K",
    },
    outputDir: {
      type: "string",
      description: "输出目录（单张生成时可选）。",
    },
  },
  required: ["action"],
};

export async function execute(input, ctx) {
  const pptMaster = ctx._pptMaster;
  if (!pptMaster) {
    return { content: [{ type: "text", text: "PPT Master 插件未初始化" }] };
  }

  const { scriptsDir, pythonCmd, log } = pptMaster;

  // --- analyze images ---
  if (input.action === "analyze") {
    if (!input.projectPath) {
      return { content: [{ type: "text", text: "analyze 操作需要 projectPath 参数。" }] };
    }
    const scriptPath = path.join(scriptsDir, "analyze_images.py");
    if (!fs.existsSync(scriptPath)) {
      return { content: [{ type: "text", text: `analyze_images.py 未找到` }] };
    }
    return runPython(scriptPath, [input.projectPath], pythonCmd, log);
  }

  // --- generate with manifest ---
  if (input.action === "generate") {
    const scriptPath = path.join(scriptsDir, "image_gen.py");
    if (!fs.existsSync(scriptPath)) {
      return { content: [{ type: "text", text: `image_gen.py 未找到` }] };
    }

    let args;
    if (input.manifestPath) {
      // Manifest mode
      args = ["--manifest", input.manifestPath];
    } else if (input.prompt) {
      // Single image
      args = [
        input.prompt,
        "--aspect_ratio", input.aspectRatio || "16:9",
        "--image_size", input.imageSize || "1K",
      ];
      if (input.outputDir) args.push("-o", input.outputDir);
    } else {
      return { content: [{ type: "text", text: "generate 需要 manifestPath 或 prompt 参数。" }] };
    }

    // Run with longer timeout for image generation
    return runPython(scriptPath, args, pythonCmd, log, 300_000);
  }

  // --- render-md ---
  if (input.action === "render-md") {
    if (!input.manifestPath) {
      return { content: [{ type: "text", text: "render-md 需要 manifestPath 参数。" }] };
    }
    const scriptPath = path.join(scriptsDir, "image_gen.py");
    if (!fs.existsSync(scriptPath)) {
      return { content: [{ type: "text", text: `image_gen.py 未找到` }] };
    }
    return runPython(scriptPath, ["--render-md", input.manifestPath], pythonCmd, log);
  }

  return { content: [{ type: "text", text: `未知操作: ${input.action}` }] };
}

function runPython(script, args, pythonCmd, log, timeout = 120_000) {
  return new Promise((resolve) => {
    const proc = execFile(pythonCmd, [script, ...args], { timeout }, (err, stdout, stderr) => {
      if (err) {
        log.warn(`script failed: ${err.message}`);
        resolve({
          content: [
            { type: "text", text: `脚本执行失败: ${err.message}` },
            ...(stderr ? [{ type: "text", text: `stderr: ${stderr.slice(0, 2000)}` }] : []),
          ],
        });
        return;
      }
      resolve({
        content: [{ type: "text", text: `✅ 执行成功。\n\n${stdout.trim()}` }],
      });
    });
    proc.on("error", (err) => {
      resolve({ content: [{ type: "text", text: `启动脚本失败: ${err.message}` }] });
    });
  });
}
