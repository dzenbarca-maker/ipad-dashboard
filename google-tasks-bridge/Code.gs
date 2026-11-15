/**
 * Private Google Tasks bridge for the iPad Dashboard.
 * Deploy as a web app that executes as the owner. Requests require a private key.
 */

function setupTasksBridge() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty("TASKS_BRIDGE_KEY");
  if (!key) {
    key = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
    props.setProperty("TASKS_BRIDGE_KEY", key);
  }
  Logger.log("Dashboard bridge key (keep private): " + key);
}

function authorizeTasks() {
  var response = Tasks.Tasklists.list({ maxResults: 1 });
  Logger.log("Google Tasks authorization succeeded. Lists returned: " + ((response.items || []).length));
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === "redeemPair") {
    var code = String(p.code || "").toUpperCase();
    var cache = CacheService.getScriptCache();
    var pairedKey = cache.get("dashboard_pair_" + code);
    if (pairedKey) cache.remove("dashboard_pair_" + code);
    return jsonp_({ ok: !!pairedKey, key: pairedKey || "", error: pairedKey ? "" : "invalid_pair_code" }, p.callback);
  }
  if (!isAuthorized_(p.key)) {
    return jsonp_({ ok: false, error: "unauthorized" }, p.callback);
  }

  try {
    var action = p.action || "";
    if (action === "lists") {
      var lists = Tasks.Tasklists.list({ maxResults: 100 });
      return jsonp_({ ok: true, items: lists.items || [] }, p.callback);
    }
    if (action === "tasks") {
      if (!p.listId) return jsonp_({ ok: false, error: "missing_list" }, p.callback);
      var result = Tasks.Tasks.list(p.listId, {
        maxResults: 100,
        showCompleted: true,
        showHidden: false
      });
      return jsonp_({ ok: true, items: result.items || [] }, p.callback);
    }
    if (action === "note") {
      return jsonp_({ ok: true, note: PropertiesService.getScriptProperties().getProperty("DASHBOARD_NOTE") || "" }, p.callback);
    }
    return jsonp_({ ok: false, error: "unknown_action" }, p.callback);
  } catch (err) {
    return jsonp_({ ok: false, error: String(err && err.message || err) }, p.callback);
  }
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (!isAuthorized_(p.key)) return htmlResult_(false);

  try {
    if (p.action === "createPair") {
      var code = Utilities.getUuid().replace(/-/g, "").substring(0, 12).toUpperCase();
      CacheService.getScriptCache().put("dashboard_pair_" + code, p.key, 600);
      return htmlResult_(true, { pairCode: code });
    }
    if (p.action === "saveNote") {
      var note = String(p.note || "");
      if (note.length > 3500) return htmlResult_(false);
      PropertiesService.getScriptProperties().setProperty("DASHBOARD_NOTE", note);
      return htmlResult_(true);
    }
    var listId = p.listId;
    var action = p.action;
    if (!listId) return htmlResult_(false);

    if (action === "create") {
      var title = String(p.title || "").replace(/^\s+|\s+$/g, "");
      if (!title) return htmlResult_(false);
      Tasks.Tasks.insert({ title: title }, listId);
      return htmlResult_(true);
    }

    if (action === "update") {
      if (!p.taskId) return htmlResult_(false);
      var patch = {};
      if (typeof p.title !== "undefined") {
        var updatedTitle = String(p.title).replace(/^\s+|\s+$/g, "");
        if (!updatedTitle) return htmlResult_(false);
        patch.title = updatedTitle;
      }
      if (p.done === "true") {
        patch.status = "completed";
        patch.completed = new Date().toISOString();
      } else if (p.done === "false") {
        patch.status = "needsAction";
        patch.completed = null;
      }
      Tasks.Tasks.patch(patch, listId, p.taskId);
      return htmlResult_(true);
    }

    if (action === "delete") {
      if (!p.taskId) return htmlResult_(false);
      Tasks.Tasks.remove(listId, p.taskId);
      return htmlResult_(true);
    }
    return htmlResult_(false);
  } catch (err) {
    return htmlResult_(false);
  }
}

function isAuthorized_(submittedKey) {
  var savedKey = PropertiesService.getScriptProperties().getProperty("TASKS_BRIDGE_KEY");
  return !!savedKey && !!submittedKey && savedKey === submittedKey;
}

function jsonp_(payload, callback) {
  var json = JSON.stringify(payload);
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback)) {
    return ContentService.createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function htmlResult_(ok, extra) {
  var result = { type: "dashboard-tasks-bridge", ok: !!ok };
  extra = extra || {};
  for (var key in extra) if (extra.hasOwnProperty(key)) result[key] = extra[key];
  var message = JSON.stringify(result);
  var html = "<!doctype html><html><body><script>window.parent.postMessage(" + message + ", \"*\");</script></body></html>";
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}



