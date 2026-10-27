/* global Zotero, Services, Components */
var chromeHandle;

function install() {}
function uninstall() {}

async function startup({ id, version, rootURI }) {
  var aomStartup = Components.classes["@mozilla.org/addons/addon-manager-startup;1"]
    .getService(Components.interfaces.amIAddonManagerStartup);
  var manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "lectio", rootURI + "content/"]
  ]);
  Services.scriptloader.loadSubScript(rootURI + "lectio.js");
  await Lectio.init({ id, version, rootURI });
  for (let win of Zotero.getMainWindows()) Lectio.addToWindow(win);
}

function onMainWindowLoad({ window }) { Lectio.addToWindow(window); }
function onMainWindowUnload({ window }) { Lectio.removeFromWindow(window); }

function shutdown() {
  if (typeof Lectio !== "undefined") Lectio.shutdown();
  if (chromeHandle) { chromeHandle.destruct(); chromeHandle = null; }
}
