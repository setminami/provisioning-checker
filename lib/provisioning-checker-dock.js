'use babel';
'use strict';
import { CompositeDisposable } from 'atom';

export default class ProvisioningCheckerDock {
  constructor(serializedState /* willbe DockDirection */) {
    // root
    this.element = document.createElement('div');
    this.element.classList.add('provisioning-checker-dock');
    const direction = atom.config.get('provisioning-checker.direction');
    const body = this.getDirectedDock(direction);
    body.activate();
    this.body = body;
    console.log(body);

    this.subscriptions = new CompositeDisposable();
    let self = this;
    // https://discuss.atom.io/t/how-to-add-ondidchangevisble-with-callback-to-a-panel/37134/2
    this.subscriptions.add(
      this.body.onDidAddPaneItem((event) => {
        console.log("***");
        console.log(event.item);
        let item = event.item;
        if (atom.workspace.isTextEditor(item)) {
          self.subscriptions.add(item.onDidDestroy(() => {
            // https://electronjs.org/docs/api/dialog#dialogshowsavedialogbrowserwindow-options-callback
            const dialog = require('electron').remote.dialog;
            const path = require('path');
            let fullpath = item.getPath();
            let fName = path.basename(fullpath);
            let extName = path.extname(fullpath);
            dialog.showSaveDialog(null, {
              title: 'Save the file As...',
              defaultPath: path.normalize('./' + fName),
              filters: [
                {name: 'default', extensions: [extName]},
                {name: 'All Files', extensions: ['*']}
              ]}, (saved) => {
                console.log('saved! to ' + saved);
              });
          }));
        }
      })
    );
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.subscriptions.dispose();
    this.element.remove();
  }

  getElement() {
    return this.body.getElement();
  }

  getActivePane() {
    return this.body.getActivePane();
  }

  getDirectedDock(direction) {
    var _dock;
    switch (direction) {
      case DockDirection.BOTTOM:
        _dock = atom.workspace.getBottomDock();
        break;
      case DockDirection.RIGHT:
        _dock = atom.workspace.getRightDock();
        break;
      case DockDirection.LEFT:
        _dock = atom.workspace.getLeftDock();
        break;
      default:
        console.log('fall in DEFAULT: ' + direction);
        _dock = atom.workspace.getBottomDock();
        break;
    }
    return _dock
  }

  isVisible() { return this.body.isVisible(); }
  show() { this.body.show(); }
  hide() { this.body.hide(); }
}

export const DockDirection = { BOTTOM:0, RIGHT:1, LEFT:2 };
