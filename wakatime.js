const HEARTBEAT_INTERVAL = 4000;
const WAKATIME_EXE = "D:/wakatime-cli-windows-amd64.exe";
const WAKATIME_CFG = "C:/Users/pauly/AppData/Local/Tiled/extensions/tiled-wakatime/.wakatime.cfg";

let startTime = Date.now();

function showElapsedTime() {
    let elapsed = Math.floor((Date.now() - startTime) / 1000);
    let minutes = Math.floor(elapsed / 60);
    let seconds = elapsed % 60;
    tiled.alert(`Elapsed editing time: ${minutes}m ${seconds}s`);
}

let displayTimerAction = tiled.registerAction("displayTimer", function () {
    showElapsedTime();
});
displayTimerAction.text = "Display WakaTime Session";

tiled.extendMenu("View", [
    { action: "displayTimer", before: "ShowGrid" },
    { separator: true }
]);


// ==========================
// GIT PROJECT DETECTION
// ==========================
function findGitProjectRoot(filePath) {
    let dir = FileInfo.path(filePath);

    while (dir) {
        let gitPath = FileInfo.joinPaths(dir, ".git");
        if (File.exists(gitPath)) {
            return dir;
        }
        let parent = FileInfo.path(dir);
        if (!parent || parent === dir) break;
        dir = parent;
    }

    return null;
}

function getGitProjectName(filePath) {
    let root = findGitProjectRoot(filePath);
    return root ? FileInfo.fileName(root) : "Unknown Project";
}


// ==========================
// WAKATIME CORE
// ==========================
var WakaTime = {
    lastEntity: null,
    lastHeartbeat: 0,

    heartbeat: function (entityPath, isWrite, category, action) {
        let now = Date.now();
        let projectName = getGitProjectName(entityPath);

        if (
            !isWrite &&
            this.lastEntity === entityPath &&
            (now - this.lastHeartbeat) < HEARTBEAT_INTERVAL
        ) {
            return;
        }

        let args = [
            "--config", WAKATIME_CFG,
            "--entity", entityPath,
            "--category", category,
            "--project", projectName,
            "--language", "Tiled",
            "--plugin", "tiled-wakatime/1.0.0"
        ];

        if (isWrite) args.push("--write");

        try {
            let proc = new Process();
            proc.exec(WAKATIME_EXE, args);

            tiled.log(
                `[WakaTime] Project="${projectName}" ` +
                `Action="${action}" ` +
                `Category="${category}" ` +
                `Entity="${entityPath}"`
            );
        } catch (e) {
            tiled.log("ERR: WakaTime failed → " + e);
        }

        this.lastEntity = entityPath;
        this.lastHeartbeat = now;
    }
};


// ==========================
// ASSET HANDLING
// ==========================
let currentAsset = null;

function onAssetModified() {
    if (!tiled.activeAsset) return;
    tiled.log("Asset Changed");

    WakaTime.heartbeat(
        tiled.activeAsset.fileName,
        true,
        "building",
        "asset-edit"
    );
}

tiled.activeAssetChanged.connect(function (asset) {
    if (currentAsset) {
        try {
            currentAsset.modifiedChanged.disconnect(onAssetModified);
        } catch (e) {}
    }

    currentAsset = asset;
    if (!asset) return;

    let projectName = getGitProjectName(asset.fileName);
    tiled.log(`[Asset] Opened: ${asset.fileName}`);
    tiled.log(`[Project] ${projectName}`);

    WakaTime.heartbeat(
        asset.fileName,
        false,
        "debugging",
        "asset-open"
    );

    asset.modifiedChanged.connect(onAssetModified);
});


// ==========================
// STARTUP LOG
// ==========================
tiled.log("[WakaTime] Tiled Git-based tracker loaded");