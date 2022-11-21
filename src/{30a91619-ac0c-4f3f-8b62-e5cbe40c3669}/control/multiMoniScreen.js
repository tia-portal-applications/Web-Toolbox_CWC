/* code provides screen/window placement functionallity
   Date: 16.06.2022
   Author: Christian Kühne */
   
/** @type {Array<Monitor>} */
const monitorInfos = [];

class Monitor {
    constructor(left, width, top, height, number, name) {
        /** @type {number} */
        this.left = left;
        /** @type {number} */
        this.width = width;
        /** @type {number} */
        this.top = top;
        /** @type {number} */
        this.height = height;
        /** @type {number} */
        this.number = number;
        /** @type {string} */
        this.name = name;
    }
}

async function getPermission() {
    const { state } = await navigator.permissions.query({ name: 'window-placement' });
    console.log("permission state " + state);
    return state;
}

async function checkPermission(permissionName, descriptor) {
    const permission = await navigator.permissions.query(Object.assign({ name: permissionName }, descriptor))
    console.log(permissionName + "-status: " + permission.state);
}

function sortTopLeft(a, b) {
    if (a.top > b.top) {
        return 1;
    }
    if (a.top < b.top) {
        return -1;
    }
    if (a.left > b.left) {
        return 1;
    }
    if (a.left < b.left) {
        return -1;
    }
    return 0;
}

async function getMonitors() {
    try {
        const screenDetails = await parent.window.getScreenDetails();
        console.dir(screenDetails);
        let _screenDetails = screenDetails.screens.slice();
        _screenDetails.sort(function (a, b) { return sortTopLeft(a, b); });
        let monitorNr = 1;
        for (let i of _screenDetails) {
            console.log("screen: " + "number: " + monitorNr);
            saveMonitorInfos(i, monitorNr, i.label);
            monitorNr++;
        }
        return _screenDetails;
    }
    catch (e) {
        console.log("permission issue?: " + e);
        return null;
    }
}

function saveMonitorInfos(screen, monitorNr, name) {
    let tempMoni = new Monitor(screen.availLeft, screen.availWidth, screen.availTop, screen.availHeight, monitorNr, name);
    console.dir(tempMoni);
    monitorInfos.push(tempMoni);
}

async function setScreen(url, startScreen, screenInfo) {
    try {
        let newUrl = url + "?screen=" + screenInfo.UnifiedScreenName;
        let checkOrigin = url.search("\\?");
        let fitInMonitor = false;//not used functionality
        let moniNr = screenInfo.MonitorNumber;
        let newMoniNr;
        let width = parseInt(screenInfo.Width, 10);
        let height = parseInt(screenInfo.Height, 10);
        let recalcX = parseInt(screenInfo.Left, 10);
        let recalcY = parseInt(screenInfo.Top, 10);
        // check for existing monitor, if not exist take array element zero
        newMoniNr = ((moniNr > 0) && (moniNr <= monitorInfos.length)) ? (moniNr - 1) : 0;
        console.log("requested monitor: " + moniNr + " found monitors: " + monitorInfos.length + " used monitor: " + newMoniNr);

        // screen positioning offset for each monitor
        // number 1 starts top left and last number ends at bottom right
        if (screenInfo.Fullscreen) {
            // option for real fullscreen
            newUrl = newUrl + "&fullscreen=yes";
            recalcX = monitorInfos[newMoniNr].left;
            recalcY = monitorInfos[newMoniNr].top;
        }
        else {
            recalcX += monitorInfos[newMoniNr].left;
            recalcY += monitorInfos[newMoniNr].top;
        }
        // recalculate width and height for the screen to match the monitor
        let maxWidth = null;
        let maxHeight = null;
        if (fitInMonitor){
            maxWidth = monitorInfos[newMoniNr].width - width;
            maxHeight = monitorInfos[newMoniNr].height - height;
            width = (maxWidth < width) ? maxWidth : width;
            height = (maxHeight < height) ? maxHeight : height;
            console.log("maxWidth: " + maxWidth + " maxHeight: " + maxHeight);
        }        
        console.log("width: " + width + " height: " + height);

        let windowOptions;
        if (screenInfo.Fullscreen) {
            windowOptions = "left=" + String(recalcX) + ", top=" + String(recalcY) + ", fullscreen=yes, scrollbars=auto";
        }
        else {
            windowOptions = "left=" + String(recalcX) + ", top=" + String(recalcY) + "width=" + String(width) + ", height=" + String(height);
        }

        if (checkOrigin == -1) {
            let _windowObjectReference = (window.open(newUrl, "_blank", windowOptions));
            // handle pseudo fullscreen
            if (screenInfo.Fullscreen) {
                _windowObjectReference.resizeTo(monitorInfos[newMoniNr].width,  monitorInfos[newMoniNr].height);
            }
            // resize to fit screen
            if ((width > 99) && (height > 99) && (screenInfo.Fullscreen == false)) {
                _windowObjectReference.resizeTo(width, height);
            }
            // move to new monitor
            console.log("move window of Screen: " + screenInfo.UnifiedScreenName + " to left pos: " + recalcX + " to top pos: " + recalcY);
            _windowObjectReference.moveTo(recalcX, recalcY);
            return startScreen;
        }
        return screenInfo.UnifiedScreenName;
    }
    catch (e) {
        console.log("something went wrong in setScreen: " + e);
        return;
    }
}

async function reqFullscreen(windowObjRef, monitorNumber) {
    let elem = windowObjRef.document.body;
    const screenDetails =  await windowObjRef.getScreenDetails();
    const availScreens = screenDetails.screens;
    let destScreen = screenDetails.currentScreen;
    
    await getMonitors();
    let monitorName = null;
    for (let i of monitorInfos) {
        if (i.number == monitorNumber) {
            monitorName = i.name;
        }
    }

    for (let k of availScreens) {
        if (k.label == monitorName) {
            destScreen = k;
            break;
        }
    }

    let retVal = -3;
    if (elem.requestFullscreen) {
        try {
            const result = await elem.requestFullscreen({ screen: destScreen });
            console.log("successfull fullscreen: " + result);
            retVal = 1;
        } catch (e) {
            console.log("rejected fullscreen " + e);
            retVal = 2;
        };
        try {
            const fullscreenCheck = parent.window.document.fullscreenElement
            console.log("is fullscreen? " + (fullscreenCheck != null));
        }
        catch (e) {
            console.log("rejected fullscreen status " + e);
        };
        console.log("elem.reqFulls finished? return: " + retVal);
        return retVal;

    } else if (elem.webkitRequestFullscreen) { /* Safari */
        try {
            const result = await elem.webkitRequestFullscreen({ screen: destScreen });
            console.log("successfull fullscreen: " + result);
            retVal = 1;
        } catch (e) {
            console.log("rejected fullscreen " + e);
            retVal = 2;
        };
        try {
            const fullscreenCheck = parent.window.document.webkitFullscreenElement;
            console.log("is fullscreen? " + (fullscreenCheck != null));
        }
        catch (e) {
            console.log("rejected fullscreen status " + e);
        };
        console.log("elem.reqFulls finished? return: " + retVal);
        return retVal;

    } else {// way too old browser
        return -2;
    }
}

async function setAllScreens(url, startScreen, screenInfos) {
    try {
        let screenElements = screenInfos.length;
        console.log("you have " + screenElements + " new screens to be opened");
        for (let i of screenInfos) {
            console.log("screenelement: " + i.UnifiedScreenName);
            setScreen(url, startScreen, i);
        }
        return startScreen;
    }
    catch (e) {
        console.log("something went wrong in setAllScreens: " + e);
        return false;
    }
}

async function checkFullscreen() {
    let querystring = parent.window.location.search;
    let urlParams = new URLSearchParams(querystring);
    //console.log("urlParams: " + urlParams);    
    let urlScreenName = urlParams.get("screen");
    console.log(" get screenname: " + urlScreenName);
    let fullscreen = urlParams.get("fullscreen");
    console.log(" get fullscreen: " + fullscreen);
    let screenInfos = WebCC.Properties.Screens;

    if (fullscreen == "yes") {
        let foundObject = null;
        for (let i of screenInfos) {
            if (i.UnifiedScreenName == urlScreenName) {
                foundObject = i;
            }
        }
        if (foundObject != null) {
            let result = await reqFullscreen(parent.window, foundObject.MonitorNumber);
            return result;
        } else {
            console.log("could not find a matching screen name!" + urlScreenName);
            return -1;
        }
    }
    else {
        console.log("no fullscreen request return 0");
        return 0;
    }
}

function openScreenOnMonitorX(url, startScreen) {
    let _multiMoniSupport = false;
    let screenDetails = null;
    const isSupported = ("getScreenDetails" in parent.window);
    console.log("getMonitorInfos called, supported?  " + isSupported);
    // Offer multi-screen controls for the user.
    if (isSupported) {
        console.log("api supported ");
        // The Multi-Screen Window Placement API is supported.
        const state = getPermission();
        _multiMoniSupport = state === 'granted';
        console.log("multiMoni is supported: " + _multiMoniSupport);
        if (!_multiMoniSupport) {
        }
        screenDetails = getMonitors();
        screenDetails.then(function () {
            console.log("url: " + url);
            let screenInfos = WebCC.Properties.Screens;
            let checkOrigin = url.search("\\?");
            let querystring = parent.window.location.search;
            let urlParams = new URLSearchParams(querystring);
            console.log("urlParams: " + urlParams);
            let urlScreenName = urlParams.get("screen");
            console.log(" get screenname: " + urlScreenName);

            if (checkOrigin == -1) {
                // open new windows
                return setAllScreens(url, startScreen, screenInfos);
            }
            else {
                // return screen name do nothing else
                return urlScreenName;
            }
        }
        );
    }
}

export { openScreenOnMonitorX, checkFullscreen };
