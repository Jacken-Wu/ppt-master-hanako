/**
 * ppt-master/tools/convert-source.js
 *
 * Convert source documents (PDF / DOCX / XLSX / PPTX / URL / Markdown) to
 * Markdown for the Strategist phase.
 */
import { execFile } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

export const name = "ppt-master_convert-source";
export const description =
  "将源文档转换为 Markdown 格式。支持 PDF / DOCX / XLSX / PPTX / URL / Markdown。Converter: pdf_to_md, doc_to_md, excel_to_md, ppt_to_md, web_to_md.";

export const parameters = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: ["pdf", "doc", "excel", "ppt", "web", "markdown"],
      description: "源文档类型。pdf→PDF, doc→DOCX/Word/EPUB/IPYNB, excel→XLSX/XLSM, ppt→PPTX, web→URL, markdown→已有 MD 文件。",
    },
    source: {
      type: "string",
      description: "文件路径（本地文件）或 URL（type=web 时）。绝对路径或相对当前工作目录的路径。",
    },
    output: {
      type: "string",
      description: "输出 MD 文件路径（可选）。省略时自动存放在源文件同目录下。",
    },
  },
  required: ["type", "source"],
};

export async function execute(input, ctx) {
  const pptMaster = ctx._pptMaster;
  if (!pptMaster) {
    return { content: [{ type: "text", text: "PPT Master 插件未初始化" }] };
  }

  const { scriptsDir, pythonCmd, log } = pptMaster;

  // Resolve script path
  const scriptMap = {
    pdf: "source_to_md/pdf_to_md.py",
    doc: "source_to_md/doc_to_md.py",
    excel: "source_to_md/excel_to_md.py",
    ppt: "source_to_md/ppt_to_md.py",
    web: "source_to_md/web_to_md.py",
    markdown: null,
  };

  const scriptRel = scriptMap[input.type];
  if (!scriptRel && input.type !== "markdown") {
    return { content: [{ type: "text", text: `未知的源文档类型: ${input.type}` }] };
  }

  // Markdown source — just copy or return the path
  if (input.type === "markdown") {
    const src = path.resolve(input.source);
    if (!fs.existsSync(src)) {
      return { content: [{ type: "text", text: `文件不存在: ${src}` }] };
    }
    const dest = input.output || src.replace(/\.md$/i, "") + "_converted.md";
    if (src !== dest) {
      fs.copyFileSync(src, dest);
    }
    return {
      content: [
        { type: "text", text: `Markdown 源已就绪。` },
        { type: "text", text: `路径: ${dest}` },
      ],
    };
  }

  const scriptPath = path.join(scriptsDir, scriptRel);
  if (!fs.existsSync(scriptPath)) {
    return { content: [{ type: "text", text: `脚本文件不存在: ${scriptPath}\n请确保已安装 Python 依赖。` }] };
  }

  // Run the Python script
  return new Promise((resolve) => {
    const args = [scriptPath, input.source];
    if (input.output) args.push("--output", input.output);

    const proc = execFile(pythonCmd, args, {
      cwd: scriptsDir,
      timeout: 120_000, // 2 min
    }, (err, stdout, stderr) => {
      if (err) {
        log.warn(`convert-source failed: ${err.message}`);
        resolve({
          content: [
            { type: "text", text: `转换失败: ${err.message}` },
            { type: "text", text: stderr ? `stderr: ${stderr.slice(0, 2000)}` : "" },
          ],
        });
        return;
      }

      // Find output — script usually prints the output path
      const outputLine = stdout.trim().split("\n").filter(l => l.startsWith("Output:") || l.startsWith("output:") || l.endsWith(".md"));
      const outPath = outputLine[0]?.replace(/^(Output:|output:)\s*/i, "").trim() || input.output || `${input.source}.md`;

      resolve({
        content: [
          { type: "text", text: `✅ 源文档转换成功。\n\n${stdout.trim()}` },
        ],
      });
    });

    proc.on("error", (err) => {
      resolve({
        content: [{ type: "text", text: `启动脚本失败: ${err.message}` }],
      });
    });
  });
}
