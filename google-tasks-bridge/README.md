# Google Tasks bridge setup

This small Google Apps Script lets the static iPad dashboard read and edit Google Tasks without performing Google sign-in on the old iPad. The script runs as your Google account; the dashboard only sends the private bridge key that you generate below.

## 1. Create the script

1. Open https://script.google.com/create while signed in to the Google account that owns the tasks.
2. Replace the default Code.gs with the contents of this folder's Code.gs.
3. In Project Settings, turn on Show appsscript.json manifest file in editor, then replace that file with this folder's appsscript.json.
4. In the editor, next to Services, click +, add Tasks API, and save.

## 2. Authorize and create a private key

1. Select authorizeTasks in the function menu and click Run. Review the permission: this script needs to view and manage Google Tasks so it can synchronize edits.
2. Select setupTasksBridge and click Run.
3. Open the execution log and copy the value after Dashboard bridge key (keep private):. Keep it private; do not add it to GitHub.

## 3. Deploy

1. Click Deploy → New deployment and select Web app.
2. Set Execute as to Me.
3. Set Who has access to Anyone so the old iPad does not need Google sign-in. The generated key gates all task data and edits.
4. Deploy and copy the web app URL ending in /exec.

## 4. Connect the dashboard

On the iPad, open the dashboard and tap Подключить. The /exec URL is already configured; enter the private key. Choose a Google Tasks list. Add, edit, complete, and delete actions then sync to that list.

The URL and key are stored only in that browser's local storage. The key is not written into the public dashboard source.

