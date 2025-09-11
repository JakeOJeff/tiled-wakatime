

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


tiled.activeAssetChanged.connect(function (asset) {
    if (!asset) {
        tiled.log("No active asset");
        return;
    }

    let loadkey = loadFromFile("./key.txt");
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

if (tiled.activeAsset !== null) {
    let oAList = tiled.openAssets;
    for (let i = 0; i < oAList.length; ++i) {
        tiled.log(i + ": " + oAList[i].fileName);
    }
    tiled.log("Active asset exists");
}

tiled.activeAsset.modifiedChanged.connect(function () {
    if (tiled.activeAsset) {
        tiled.log("modifying objects");
        WakaTime.pushHeartBeat(tiled.activeAsset.fileName, false, "building");
    }
});



function saveToFile(filePath, content) {
    try {
        let file = new File(filePath, File.WriteOnly);
        file.write(content);
        file.commit(); // finalize write
        file.close();
        tiled.log("Saved Wakatime API key to " + filePath);
        return true;
    } catch (e) {
        tiled.log("ERR: Failed to save file: " + e);
        return false;
    }
}

function loadFromFile(filePath) {
    try {
        let file = new File(filePath, File.ReadOnly);
        let content = file.readAll();
        file.close();
        return content.trim();
    } catch (e) {
        // file may not exist first time
        tiled.log("Could not load file (" + filePath + "): " + e);
        return null;
    }
}


