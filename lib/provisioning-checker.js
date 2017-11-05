'use babel';

import ProvisioningCheckerView from './provisioning-checker-view';
import { CompositeDisposable } from 'atom';
import { BufferedProcess } from 'atom';

const DEVNULL = ' > /dev/null 2> /dev/null';
const BEGINSIGN = '-----BEGIN CERTIFICATE-----';
const ENDSIGN = '-----END CERTIFICATE-----';
const DATAOPEN = '<data>';
const DATACLOSE = '</data>';

export default {

  provisioningCheckerView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.provisioningCheckerView = new ProvisioningCheckerView(state.provisioningCheckerViewState);
    this.modalPanel = atom.workspace.addBottomPanel({
      item: this.provisioningCheckerView.getElement(),
      visible: true
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'provisioning-checker:display-results': () => this.checkEnv()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.provisioningCheckerView.destroy();
  },

  serialize() {
    return {
      provisioningCheckerViewState: this.provisioningCheckerView.serialize()
    };
  },

  // prepare to use openssl
  checkEnv() {
    // Tested macOS only
    let command = 'openssl';
    let args = ['version'];
    var stdout = function(output) {
      console.log('stdout = ' + output);
      var sslInfo = output.replace(/\n+$/g, '');
      atom.notifications.addInfo('I\'ll use openssl @ ' + sslInfo);
      let command = 'which';
      let args = ['openssl'];
      var stdout = function(output) {
        this.modalPanel.putMessage(output)
      }
      var proc = new BufferedProcess({ command, args, stdout });
    };

    var stderr = function(error) {
      console.log('Error = ' + error);
    };

    var exit = function(arg) {
      console.log('code = ' + arg);
      if (arg != 0) {
        let option = {
          detail:  'process.env.PATH = [' + process.env.PATH + ']',
          dismissable: true
        }
        atom.notifications.addError('openssl not found in the env', option)
      } else {
        let command = 'openssl'
      }
    };

    var proc = new BufferedProcess({ command, args, stdout, stderr, exit });
    if (!this.modalPanel.isVisible()) {
      this.modalPanel.show()
    }
  }
};
