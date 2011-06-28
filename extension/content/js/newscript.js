Components.utils.import("resource://scriptish/prefmanager.js");
Components.utils.import("resource://scriptish/scriptish.js");
Components.utils.import("resource://scriptish/utils/Scriptish_createUserScriptSource.js");
Components.utils.import("resource://scriptish/utils/Scriptish_localizeDOM.js");
Components.utils.import("resource://scriptish/utils/Scriptish_stringBundle.js");

var $ = function(aID) document.getElementById(aID);

Scriptish_localizeOnLoad(this);

var scriptContent = "";
try {
  scriptContent = window.arguments[0]
      .QueryInterface(Components.interfaces.nsIDialogParamBlock)
      .GetString(0);
} catch(e) {}

window.addEventListener("load", function() {
  $("scriptish").addEventListener("dialogaccept", function() doInstall(), false);

  // load defaults
  $("id").value = Scriptish_prefRoot.getValue("newscript_id", "");
  $("namespace").value = Scriptish_prefRoot.getValue("newscript_namespace", "");

  // default the includes with the current page's url
  var content = window.opener.document.getElementById("content");
  if (content)
    $("includes").value = content.selectedBrowser.contentWindow.location.href;
}, false);

function doInstall() {
  var tools = {};
  Components.utils.import("resource://scriptish/utils/Scriptish_openInEditor.js", tools);
  Components.utils.import("resource://scriptish/utils/Scriptish_getTempFile.js", tools);
  Components.utils.import("resource://scriptish/utils/Scriptish_getWriteStream.js", tools);

  var script = createScriptSource();
  if (!script) return false;

  // put this created script into a file -- only way to install it
  var tempFile = tools.Scriptish_getTempFile();
  var foStream = tools.Scriptish_getWriteStream(tempFile);
  foStream.write(script, script.length);
  foStream.close();

  Scriptish.getConfig(function(config) {
    // create a script object with parsed metadata,
    script = config.parse(script);

    // make sure entered details will not ruin an existing file
    if (config.installIsUpdate(script)) {
      var overwrite = confirm(Scriptish_stringBundle("newscript.exists"));
      if (!overwrite) return false;
    }

    // finish making the script object ready to install
    script.setDownloadedFile(tempFile);

    // install this script
    config.install(script);

    // and fire up the editor!
    tools.Scriptish_openInEditor(script, window);

    // persist namespace value
    Scriptish_prefRoot.setValue("newscript_namespace", script.namespace);
  })

  return true;
}

// assemble the XUL fields into a script template
function createScriptSource() {
  var header = {
    id: $("id").value,
    name: $("name").value,
    namespace: $("namespace").value,
    description: $("description").value,
    includes: $("includes").value ? $("includes").value.match(/.+/g) : [],
    excludes: $("excludes").value ? $("excludes").value.match(/.+/g) : []
  }
  try {
    return Scriptish_createUserScriptSource(header, scriptContent);
  } catch (e) {
    alert(e.message);
  }
}
