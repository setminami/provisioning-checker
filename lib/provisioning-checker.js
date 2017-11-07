'use babel';

import ProvisioningCheckerView from './provisioning-checker-view';
import { CompositeDisposable, BufferedProcess } from 'atom';
import { TextEditor } from 'atom';

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

        let passEditorElement = inputParts('Password for .p12 file [return key as submit&run]');
        // https://github.com/atom/atom-keymap
        passEditorElement.addEventListener('keydown', function(event) {
          console.log(event)
          if (event.key == 'Enter') {
            let p12FileName = p12FileSelector.getModel().getText();
            let provFileName = provFileSelector.getModel().getText();
            password = passEditorElement.getModel().getText()
            let path = atom.packages.resolvePackagePath('provisioning-checker')
            let command = path + '/appendix/ProvisioningChecker.py';
            let args = ['-pwd', password, '-c', p12FileName, '-p', provFileName];
            let proc = new BufferedProcess({ command, args, stdout: function(output) {
              console.log('stdout2 = ' + output);
              // textEditorView.textContent = output;
              // atom.workspace.addRightPanel({item: textEditorView, visible: true});
              let info = output.split('\n');
              if (info.length > 1) {
                for (var x in info) {
                  let seed = info[x];
                  if ( seed != '') {
                    atom.notifications.addInfo(info[x]);
                    if (seed.startsWith('> ')) {
                      let file = seed.slice(2)
                      atom.workspace.open(file)
                    }
                  }
                }
              }
            }, exit: function(code) {
              if (code != 0) {
                atom.notifications.addInfo('Success')
                let panels = atom.workspace.getBottomPanels()
                for (var i = 0; i < panels.length; i++) {
                  let p = panels[i]
                  p.hide()
                  p.destroy()
                }
              } else {
                let options = {
                  detail: 'Maybe inputed wrong password. Check ' + p12FileName + ' password is [' + password + ']' ,
                  dismissable: true
                }
                atom.notifications.addWarning('Uhmm recieved failure code.', options)
              }
            } });
          }
          console.log('>>> ' + password)
        })

        var password = ''
        atom.workspace.addBottomPanel({item: passEditorElement, visible: true});

        var p12FileSelector = inputParts('Drag&Drop .p12 file here');
        setupDragDropFileEvent(p12FileSelector, 'application/x-pkcs12', 'It seems not p12 file...')
        atom.workspace.addBottomPanel({item: p12FileSelector, visible: true});

        var provFileSelector = inputParts('Drag&Drop .provisionprofile file here');
        setupDragDropFileEvent(provFileSelector, 'any')
        atom.workspace.addBottomPanel({item: provFileSelector, visible: true});
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
          detail: 'process.env.PATH = [' + process.env.PATH + ']',
          dismissable: true
        }
        atom.notifications.addError('openssl not found in the env', option)
      }
    };

    let proc = new BufferedProcess({ command, args, stdout, stderr, exit });
  }
};

function inputParts(placeholder) {
  var model = atom.workspace.buildTextEditor({
    mini: true,
    lineNumberGutterVisible: false, // linenumber not visible
    placeholderText: placeholder
  });
  var view = atom.views.getView(model);
  return view
}

function setupDragDropFileEvent(aView, type, msg) {
  aView.addEventListener('dragover', function(event) {
    console.log(event.type)
    aView.focus()
    event.preventDefault();
  });

  aView.addEventListener('drop', function(event) {
    console.log(event.dataTransfer.files)
    let theFile = event.dataTransfer.files[0]
    if (type == 'any') {
      aView.getModel().setText(theFile.path)
    } else {
      if (theFile.type == type) {
        aView.getModel().setText(theFile.path)
      } else {
        atom.notifications.addWarning(msg)
      }
    }
    event.preventDefault();
  });
}
