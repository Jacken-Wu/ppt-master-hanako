/**
 * ppt-master-hanako/index.js
 *
 * PPT Master — Hanako plugin lifecycle.
 * Manages project workspace, script resolution, and bus events.
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class PptMasterPlugin {
  async onload() {
    const { dataDir, log, bus } = this.ctx;
    const logTag = "[ppt-master]";

    // Resolve plugin skill directory (where SKILL.md lives)
    const skillDir = path.resolve(__dirname, "skills", "ppt-master");
    const scriptsDir = path.join(skillDir, "scripts");

    // Project workspace — configurable via plugin config, default to dataDir/projects
    const projectsDir =
      this.ctx.config?.get?.("projectsDir") || path.join(dataDir, "projects");
    fs.mkdirSync(projectsDir, { recursive: true });

    const pythonCmd =
      this.ctx.config?.get?.("pythonPath") ||
      (process.platform === "win32" ? "python" : "python3");

    // Shared context — accessible from tools and routes
    this.ctx._pptMaster = {
      skillDir,
      scriptsDir,
      projectsDir,
      pythonCmd,
      log,
      bus,
      previewServers: new Map(), // projectPath → { server, port }
    };

    log.info(`${logTag} plugin loaded`);
    log.info(`${logTag} scripts: ${scriptsDir}`);
    log.info(`${logTag} projects: ${projectsDir}`);

    // Bus handlers — allow external queries about plugin state
    this.register(
      bus.handle("ppt-master:info", () => ({
        skillDir,
        scriptsDir,
        projectsDir,
        pythonCmd,
        version: "2.7.0",
      }))
    );

    // Cleanup: kill any running preview servers
    this.register(() => {
      const { previewServers } = this.ctx._pptMaster || {};
      if (previewServers) {
        for (const [projectPath, svr] of previewServers) {
          try {
            svr.server.close();
          } catch { /* ignore */ }
        }
        previewServers.clear();
      }
      log.info(`${logTag} plugin unloaded`);
    });
  }
}
