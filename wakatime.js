var WakaTime = {
    lastObj: null,
    lastTimeUsed: 0,

    pushHeartBeat: function (filePath, isWrite, category) {
        let currentDate = Date.now()

        // for further tweaks : this is for less than 2 mins, etc
        if (!isWrite && this.lastObj == filePath && (now - lastTime < 120000)) {
            return;
        }

        let args = [
            "--entity", filePath,
            "--category", category
            // Add plugin later 
        ]

        if (isWrite) {
            args.push("--write");
        }

        //temp exe location
        let exe = "E:\\Wakatime\\wakatime-cli.exe"

        try {
            tiled.proces.exec(exe, args);
        } catch (e) {
            tiled.alert("Failed to run wakatime : " + e);
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

    tiled.log("Active asset changed: " + asset.fileName);

    WakaTime.sendHeartbeat(asset.fileName, false);
});