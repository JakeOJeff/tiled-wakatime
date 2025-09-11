

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

    let loadKey = " " //loadFromFile("./key.txt");
    // if (loadKey) {
    //     tiled.log("Loaded API key");
    // }
    // else {
        let result = tiled.prompt("Enter Wakatime API key", "");

        if (result != null || result != "") {
            saveToFile("./key.txt", result)
        }

        loadKey = result;
    // }



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
    let file = new File(content, filePath);

    titled.log("Saved Wakatime API key to " + filePath)
}

function loadFromFile(filePath) {

    fetch(filePath)
        .then(response => response.text())
        .then((data) => {
            console.log(data)
            return data;

        })
    return;
}