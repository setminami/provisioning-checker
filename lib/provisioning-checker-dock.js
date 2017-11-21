'use babel';
'use strict';
import { CompositeDisposable } from 'atom';

export default class ProvisioningCheckerDock {
  constructor(serializedState /* willbe DockDirection */) {
    console.log('****');
    // root
    this.element = document.createElement('div');
    this.element.classList.add('provisioning-checker-dock');
    const direction = atom.config.get('provisioning-checker.direction');
    const body = this.getDirectedDock(direction);
    body.getElement().className = 'dock';
    body.activate();
    this.maskElement = body.innerElement.getElementsByClassName('atom-dock-mask')[0];
    this.body = body;
    console.log(body);

    this.subscriptions = new CompositeDisposable();
    let self = this;
    // https://discuss.atom.io/t/how-to-add-ondidchangevisble-with-callback-to-a-panel/37134/2
    this.subscriptions.add(
      this.body.onDidAddPaneItem((event) => {
        console.log("***");
        console.log(event);
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
    }
    return _dock
  }

  isVisible() { return this.body.isVisible(); }
  show() { this.body.show(); }
  hide() { this.body.hide(); }
}

export const DockDirection = {
  BOTTOM:0, RIGHT:1, LEFT:2
};
