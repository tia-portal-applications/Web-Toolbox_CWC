/* code provides all you needed for the Toolbox CWC
   Date: 16.06.2022
   Author: David Kollinger */

   import { openScreenOnMonitorX, checkFullscreen } from './multiMoniScreen.js';
   const windowObjectReference = [];
   
   function download(fileName, content) {
     if (content && content != 'undefined') {
       // see https://stackoverflow.com/questions/3665115/create-a-file-in-memory-for-user-to-download-not-through-server
       var blob = new Blob([content], { type: 'text/csv' });
       if (window.navigator.msSaveOrOpenBlob) {
         window.navigator.msSaveBlob(blob, fileName);
       }
       else {
         var elem = window.document.createElement('a');
         elem.href = window.URL.createObjectURL(blob);
         elem.download = fileName;
         document.body.appendChild(elem);
         elem.click();
         document.body.removeChild(elem);
       }
     } else {
       downloadFromServer(fileName);
     }
   }
   
   function downloadFromServer(fileName) {
     console.log('downloadFromServer ' + fileName);
     var url = `./${fileName}`;
     var link = document.getElementById('aDownload');
     link.download = fileName;
     link.href = url;
     link.click();
   }
   
   function openNewTab(url) {
     window.open(url, "_blank",);
     //"_self" -> URL replaces current page
   }
   
   function openNewWindow(url, width, height) {
     var windowOptions = "width=" + String(width) + ", height=" + String(height);
     windowObjectReference.push(window.open(url, "_blank", windowOptions));
     //"_self" -> URL replaces current page
   }
   
   function closeWindow() {
     windowObjectReference.shift().close();
     //"_self" -> URL replaces current page
   }
   
   
   async function takeScreenshot() {
   
     var stream;
   
   
     // Options for getDisplayMedia()
     var displayMediaOptions = {
       video: {
         cursor: "always"
       },
       audio: false
     };
   
   
     try {
       stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
       const track = stream.getVideoTracks()[0];
       let imageCapture = new ImageCapture(track);
       await new Promise(r => setTimeout(r, 200));//sleep to avoid pop-up in image
       imageCapture.grabFrame().then((bitmap) => {
   
         // create a canvas
         const canvas = document.createElement('canvas');
         // resize it to the size of our ImageBitmap
         canvas.width = bitmap.width;
         canvas.height = bitmap.height;
         // try to get a bitmaprenderer context
         let ctx = canvas.getContext('bitmaprenderer');
         if (ctx) {
           // transfer the ImageBitmap to it
           ctx.transferFromImageBitmap(bitmap);
         }
         else {
           // in case someone supports createImageBitmap only
           // twice in memory...
           canvas.getContext('2d').drawImage(bitmap, 0, 0);
         }
         // get it back as a Blob
         canvas.toBlob((blob) => {
           const currentDate = new Date();
           download(currentDate.getFullYear() + "-" + currentDate.getMonth() + "-" + currentDate.getDate() + "-" + currentDate.getHours() + "-" + currentDate.getMinutes() + "-" + currentDate.getSeconds() + ".png", blob);
           stream.getTracks().forEach(track => track.stop());
           stream = null;
   
         });
       });
   
     } catch (err) {
       console.error("Error: " + err);
       stream.getTracks().forEach(track => track.stop());
       stream = null;
     }
   
   
   }
   
   function playSound(audioFilePath) {
    if(audioFilePath == null){audioFilePath="./dist/media/Alarm01.wav"}
     const audio = new Audio(audioFilePath);
     audio.play();
   }
   
   function setSizes() {
     WebCC.Events.fire('SizeChanged', `${parent.window.innerWidth},${parent.window.innerHeight}`);
   }
   
   function subscribeToResizing() {
     setSizes();
     // this is a workaround, because the size from default is 100 
     // and can be set even after initialization, so the sizes must be triggered again
     setTimeout(setSizes, 400);
     parent.window.onresize = function () {
       setSizes();
     }
   }
   
   parent.window.addEventListener("touchmove", myTouchFunc);
   function myTouchFunc() {
     WebCC.Events.fire('Touched', `${event.touches[0].clientX},${event.touches[0].clientY}`);
   }
   
   function onPropertyChanged(data) {
     if (data.key === 'TabTitle') {
       parent.document.title = data.value;
     }
   }
   
   // https://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
   function inIframe() {
     try {
        if (window.self === window.top){
          return false;
        }
        else {
          return window.parent.self !== window.top;
        }

     } catch (e) {
         return true;
     }
   }
   
   ////////////////////////////////////////////
   // Initialize the custom control
   WebCC.start(
     // callback
     function (result) {
       if (result) {
         console.log("connected successfully")
         subscribeToResizing();
         WebCC.Events.fire('Url', parent.window.location.href);
         onPropertyChanged({ key: 'TabTitle', value: WebCC.Properties.TabTitle })
         WebCC.onPropertyChanged.subscribe(onPropertyChanged);
   
         WebCC.Events.fire('IsMonitorClient', WebCC.Extensions.HMI.Properties.IsMonitorMode);
         WebCC.Events.fire('UnifiedInContainer', inIframe());
       }
       else {
         console.log("connection failed")
       }
     },
     // contract
     {
       methods: {
         Download: download,
         openNewTab: openNewTab,
         openNewWindow: openNewWindow,
         closeWindow: closeWindow,
         takeScreenshot: takeScreenshot,
         openScreenOnMonitorX: openScreenOnMonitorX,
         checkFullscreen: checkFullscreen,
         playSound:playSound
       },
       //Events
       events: ['SizeChanged', 'Url', 'Touched', 'IsMonitorClient', 'UnifiedInContainer'],
       //Properties
       //////////
       properties: {
         TabTitle: "WinCC Unified RT",
         Screens: []
       }
     },
     // extensions
     ['HMI'],
     // timeout
     10000
   );
