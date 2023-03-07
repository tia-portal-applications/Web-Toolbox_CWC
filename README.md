# This CustomWebControl is invisible since it has no surface. It has the following 

## properties: 
- Screens: specifies the screens with their position and size to be opened by openScreenOnMonitorX
- TabTitle: with this property you can adjust and overwrite the title of the browser tab. You can define a static value or even make the tab title dynamic to show different values on different states of the machine.

## methods:
- Download: downloads the content to the user in the given fileName
- openNewTab: opens the given URL in a new tab
- takeScreenshot: takes a Screenshot of the website and downloads it as png to the client device
- openNewWindow: opens new Window with given URL and given width and height
- closeWindow: close oldest window opened by openNewWindow
- openScreenOnMonitorX: opens new windows with the screens specified in the interface values
- checkFullscreen: checks the url and the specified interface values for going into fullscreen, only works together with openScreenOnMonitorX
- playSound: plays a sound file in client browser e.g. as Alarm Horn

## events:
- SizeChanged: gets triggered whenever the screen width or height changes
- Url: gets triggered with the creation of the cwc
- Touched: gets triggered
- UnifiedInContainer: gets triggered with the creation of the cwc

### You can use these properties to modify the behavior of this CustomWebControl:

	The Screens contain the information for new windows to be opened at defined position, size and a screen that should be changed to
	// Fullscreen 	--> if checked the Height, Left, Top and Width will be ignored and tries to go into fullscreen
	// Height 		--> specifies the height of the new browser window in pixels
	// Left			--> specifies the x position within the monitor screen to place the new browser window
	// MonitorNumber --> specifies the monitor to place the new browser window, the monitor most top left will be number 1 and at the bottom right will be the last number
	// 1-2-3
	// 4-5-6
	// Top 			--> specifies the y position within the monitor screen to place the new browser window
	// UnifiedScreenName --> specifies the Unified screen that shall be opened in the new browser window
	// Width 		--> specifies the width of the new browser window in pixels

### You can use these methods by place this CustomWebControl in a screen and a button with an event:

	// The Download method creates a new text file with the name "Protocol.txt" (can also be .csv) and the content "2020-01-01  Happy New Year ..."
	// This file will be downloaded to the client's browser directly, so it can be opened on the device (e.g. Tablet, Smartphone, PC)
	Screen.Items('Toolbox').Download('Protocol.txt', '2020-01-01  Happy New Year \n 2020-01-02  Machine is up and running \n');
	
	// The openNewTab method opens a new tab in the client's browser with the given URL, e.g. http://siemens.com/
	Screen.Items('Toolbox').openNewTab('http://siemens.com/');
	
	// The openNewWindow method opens a new browser window with the given URL, e.g. http://siemens.com/ and the given width and height in pixels
	Screen.Items('Toolbox').openNewWindow('http://siemens.com/', 1920, 1080);
	
	// The closeWindow method closes the oldest window opened by openNewWindow()
	Screen.Items('Toolbox').closeWindow();
	
	// The takeScreenshot method creates a screenshot as PNG of the current user view in the browser
	// This PNG will be downloaded to the client's browser directly, so it can be opened on the device (e.g. Tablet, Smartphone, PC)
	Screen.Items('Toolbox').takeScreenshot();
	
	// The openScreenOnMonitorX method checks your monitors and the window placement api, and then opens as many new windows as screens are specified in the interface
	// The new windows are all opened with the screen of the cwc but the urls are different to be able to get to the new screens
	// Call this function in the event "Url"
	Screen.Items('Toolbox').openScreenOnMonitorX(url, actScreen);

	// The checkFullscreen method helps to get into fullscreen mode, needs a user action (click somewhere into the screen)
	// only works with modified url from openScreenOnMonitorX method
	Screen.Items('Toolbox').checkFullscreen();

	// The playSound method play a default sound file in your client browser. This can be used e.g. as an Alarm Horn together with AlarmSubscrptions
	Screen.Items('Toolbox').playSound();
	//or other sound files provided in the CWC
	Screen.Items('Toolbox').playSound("./dist/media/Alarm01.wav");

### You can use these events by place this CustomWebControl:

	// Get triggered whenever the screen width or height changes.
	// Use it to rearrange the screen items depending on the width or height of the real device screen resolution.
	// (This is an event and no properties, because there is currently no "changed" event on the properties of a CWC, so you would need internal tags, so this solution would not be device specific any more...)
	SizeChanged(newWidth, newHeight) {}

	// Get the current URL for further processing
	//	for example
	export function Toolbox_OnUrl(item, url) {
		Tags("URL_Tag").Write(url);
	}
	
	// Touched(deltaXY) {}
	// deltaXY is a string separated by "," and gives you the current X and Y coordinates on the screen being touchmoved.
	// Use Touchscreen, i.e. for scrolling in a certain touch area:
	export function Toolbox_1_OnTouched(item, deltaXY) {
	  let coordinateArr = deltaXY.split(',');
	  let deltaX = parseInt(coordinateArr[0]);
	  let deltaY = parseInt(coordinateArr[1]);
	
	  if (deltaX > 270 && deltaX < 800 && deltaY > 96 && deltaY < 480){
		HMIRuntime.UI.SysFct.SetPropertyValue("./swSettingContent", "VerticalScrollBarPosition", (deltaY - 96));
	  } else if (deltaX < 222 && deltaY > 96 && deltaY < 480){
		HMIRuntime.UI.SysFct.SetPropertyValue("./swSettingNavigation", "VerticalScrollBarPosition", (deltaY - 96));
	  }
	}

	// Check out if the Unified Runtime was opened in a Unified Web Control
	
	function inIframe() {
		try {
			return window.parent.self !== window.top;
		} catch (e) {
			return true;
		}
	}


### Example implementation for using openScreenOnMonitorX and checkFullscreen

	// both methods are called in the event Url:
	export async function Toolbox_1_OnUrl(item, url) {

	  let actScreen = HMIRuntime.UI.ActiveScreen.Name;
	  HMIRuntime.Trace("active screen name: " + actScreen);   
	  let searchURL = url.search("screen=");
	  HMIRuntime.Trace("search screen name url: " + searchURL);

	  const pattern = /\?|&/;
	  let tempSplitP = url.split(pattern); 
	  let urlScreenName = "";
	  if (tempSplitP.length >1){   
		  urlScreenName = tempSplitP[1].split("screen=").pop();
	  }  
	  HMIRuntime.Trace(" get screenname: " + urlScreenName); 

	  if (searchURL > 0 ){
		  let result = await Screen.Items('Toolbox_1').checkFullscreen();
		  HMIRuntime.Trace("waited for checkFullscreen: " +urlScreenName + " result: " + result  );
		  HMIRuntime.Trace("new opened screen --> change it from standard to " + urlScreenName);
		  HMIRuntime.UI.SysFct.ChangeScreen(urlScreenName, ".");
	  }
	  else {
		  HMIRuntime.Trace("manual opened screen --> do not change screen but open additional screens ");
		  Screen.Items('Toolbox_1').openScreenOnMonitorX(url, actScreen);
	  }
	}
