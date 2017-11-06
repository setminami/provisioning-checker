'use babel';

import ProvisioningCheckerView from './provisioning-checker-view';
import { CompositeDisposable, BufferedProcess } from 'atom';
import { TextEditor } from 'atom';
import {humanizeKeystroke} from 'underscore-plus'

export default {

  provisioningCheckerView: null,
  modalPanel: null,
  subscriptions: null,
  prompt: null,

  activate(state) {
    this.provisioningCheckerView = new ProvisioningCheckerView(state.provisioningCheckerViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.provisioningCheckerView.getElement(),
      visible: false
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
    let stdout = function(output) {
      console.log('stdout1 = ' + output);
      var sslInfo = output.replace(/\n+$/g, '');
      var textEditorView = document.createElement('div');
      atom.notifications.addInfo('I\'ll use openssl @ ' + sslInfo);
      let command = 'which';
      let args = ['openssl'];
//      let panel = this.provisioningCheckerView.getElement()
      let stdout = function(output) {
        textEditorView.textContent = 'Command location = ' + output + ' [a.k.a ' + sslInfo + ']';
        atom.workspace.addBottomPanel({item: textEditorView, visible: true});

        var passcodeEditor = atom.workspace.buildTextEditor({
          mini: true,
          lineNumberGutterVisible: false, // linenumber not visible
          placeholderText: 'Password for p12 file:'
        });
        
        // password Input parts
        passcodeEditor.onDidChange(function() {
          let blink = '*'
          var lastChar = passcodeEditor.getText().slice(-1);
          console.log(lastChar)
          if (lastChar != blink) {
            passcodeEditor.backspace()
            passcodeEditor.insertText(blink)
            password += lastChar
          }
          console.log(password)
        })
        var password = ''
        atom.workspace.addBottomPanel({item: passcodeEditor, visible: true});

        let path = atom.packages.resolvePackagePath('provisioning-checker')
        let command = path + '/appendix/ProvisioningChecker.py';
        let args = ['-c', path + '/appendix/Oct14-2018-2.p12',
                    '-p', path + '/appendix/XC_CoolerControllerPro4Hacker.provisionprofile'];
        let proc = new BufferedProcess({ command, args, stdout: function(output) {
          console.log('stdout2 = ' + output);
          // textEditorView.textContent = output;
          // atom.workspace.addRightPanel({item: textEditorView, visible: true});
        } });
      }
      let proc = new BufferedProcess({ command, args, stdout });
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
      }
    };

    let proc = new BufferedProcess({ command, args, stdout, stderr, exit });
  }
};
