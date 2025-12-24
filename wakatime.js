/* ============================================================
   Tiled WakaTime Integration
   ============================================================ */

const SCRIPT_DIR = FileInfo.path(__filename);
const HEARTBEAT_INTERVAL = 120000; // 2 minutes
const WAKATIME_EXE = "E:/Wakatime/wakatime-cli.exe"; // CHANGE IF NEEDED

let startTime = Date.now();

/* ============================================================
   Utility: Elapsed Time Action
   ============================================================ */

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

/* ============================================================
   WakaTime Core
   ============================================================ */

var WakaTime = {
    lastEntity: null,
    lastHeartbeat: 0,

    heartbeat: function (entityPath, isWrite, category) {
        let now = Date.now();

        // Absolute path is CRITICAL for Git project detection
        let absPath = FileInfo.absolutePath(entityPath);

        // Debounce non-write heartbeats
        if (
            !isWrite &&
            this.lastEntity === absPath &&
            (now - this.lastHeartbeat) < HEARTBEAT_INTERVAL
        ) {
            return;
        }

        let args = [
            "--entity", absPath,
            "--category", category,
            "--language", "Tiled"
        ];

        if (isWrite) {
            args.push("--write");
        }

        try {
            let proc = new Process();
            proc.exec(WAKATIME_EXE, args);
            tiled.log(`WakaTime heartbeat → ${absPath}`);
        } catch (e) {
            tiled.log("ERR: WakaTime failed → " + e);
        }

        this.lastEntity = absPath;
        this.lastHeartbeat = now;
    }
};

/* ============================================================
   API Key Handling
   ============================================================ */

function getKeyPath() {
    return FileInfo.joinPaths(SCRIPT_DIR, "key.txt");
}

function saveToFile(filePath, content) {
    try {
        let file = new File(filePath);
        if (!file.open(File.WriteOnly | File.Text)) return false;
        file.write(content);
        file.close();
        return true;
    } catch (e) {
        tiled.log("ERR saving file: " + e);
        return false;
    }
}

function loadFromFile(filePath) {
    try {
        let file = new File(filePath);
        if (!file.open(File.ReadOnly | File.Text)) return null;
        let content = file.readAll();
        file.close();
        return content.trim();
    } catch (e) {
        return null;
    }
}

function ensureApiKey() {
    let keyPath = getKeyPath();
    let key = loadFromFile(keyPath);

    if (key) {
        tiled.log("WakaTime API key loaded");
        return;
    }

    let result = tiled.prompt("Enter WakaTime API key", "");
    if (result !== null && result.trim() !== "") {
        saveToFile(keyPath, result.trim());
        tiled.log("WakaTime API key saved");
    }
}

/* ============================================================
   Tiled Event Hooks
   ============================================================ */

tiled.activeAssetChanged.connect(function (asset) {
    if (!asset) return;

    ensureApiKey();

    tiled.log("Active asset: " + asset.fileName);
    WakaTime.heartbeat(asset.fileName, false, "debugging");
});

if (tiled.activeAsset) {
    tiled.log("Active asset exists at startup");
}

tiled.activeAsset.modifiedChanged.connect(function () {
    if (!tiled.activeAsset) return;

    tiled.log("Asset modified");
    WakaTime.heartbeat(tiled.activeAsset.fileName, true, "building");
});
