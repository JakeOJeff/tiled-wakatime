
const SCRIPT_DIR = FileInfo.path(__filename);
let startTime = Date.now();

function showElapsedTime() {
    let elapsed = Math.floor((Date.now() - startTime) / 1000);
    let minutes = Math.floor(elapsed / 60);
    let seconds = elapsed % 60;
    tiled.alert("Elapsed editing time: " + minutes + "m " + seconds + "s");
}

var displayTimerAction = tiled.registerAction("displayTimer", function (action) {
    tiled.log(showElapsedTime());
    // tiled.log(action.text + " was " + (action.checked ? "checked" : "unchecked"))
})

displayTimerAction.text = "Display Wakatime"
tiled.extendMenu("View", [
    { action: "displayTimer", before: "ShowGrid" },
    { separator: true }
]);
var WakaTime = {
    lastObj: null,
    lastTimeUsed: 0,

    pushHeartBeat: function (filePath, isWrite, category) {
        let currentDate = Date.now()

        // for further tweaks : this is for less than 2 mins, etc
        // if (!isWrite && this.lastObj == filePath && (now - lastTime < 120000)) {
        //     return;
        // }

        let args = [
            "--entity", filePath,
            "--category", category
            // Add plugin later 
        ]

        if (isWrite) {
            args.push("--write");
        }

        //temp exe location
        let exe = "E:/Wakatime/wakatime-cli.exe";

        try {
            let proc = new Process();
            proc.exec(exe, args)
            tiled.log("Started wakatime for " + filePath);
        } catch (e) {
            tiled.log("ERR: Failed to run wakatime : " + e);
        }


        this.lastObj = filePath;
        this.lastTimeUsed = currentDate;
    }

    
}
//

tiled.activeAssetChanged.connect(function (asset) {
    if (!asset) {
        tiled.log("No active asset");
        return;
    }
    let keyFile = getLocalPath("key.txt");

    let loadkey = loadFromFile(keyFile);
    if (loadkey) {
        tiled.log("Loaded API key");
    }
    else {
        let result = tiled.prompt("Enter Wakatime API key", "");

        if (result != null || result.trim() != "") {
            saveToFile("./key.txt", result)
            loadkey = result.trim();
        }

    }



    tiled.log("Active asset changed: " + asset.fileName);

    WakaTime.pushHeartBeat(asset.fileName, false, "debugging");
});

//
if (tiled.activeAsset !== null) {
    let oAList = tiled.openAssets;
    for (let i = 0; i < oAList.length; ++i) {
        tiled.log(i + ": " + oAList[i].fileName);
    }
    tiled.log("Active asset exists");
}
//
tiled.activeAsset.modifiedChanged.connect(function () {
    if (tiled.activeAsset) {
        tiled.log("modifying objects");
        WakaTime.pushHeartBeat(tiled.activeAsset.fileName, false, "building");
    }
});
//


function saveToFile(filePath, content) {
    try {
        let file = new File(filePath);              // step 1
        if (!file.open(File.WriteOnly | File.Text)) { // step 2
            tiled.log("ERR: Could not open file for writing: " + filePath);
            return false;
        }
        file.write(content); // step 3
        file.close();        // step 4
        tiled.log("Saved Wakatime API key to " + filePath);
        return true;
    } catch (e) {
        tiled.log("ERR: Failed to save file: " + e);
        return false;
    }
}

function loadFromFile(filePath) {
    try {
        let file = new File(filePath);
        if (!file.open(File.ReadOnly | File.Text)) {
            return null;
        }
        let content = file.readAll();
        file.close();
        return content.trim();
    } catch (e) {
        tiled.log("Could not load file (" + filePath + "): " + e);
        return null;
    }
}


function getLocalPath(fileName) {
    return FileInfo.joinPaths(SCRIPT_DIR, fileName);
}