'use babel';
'use strict';

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
      visible: true
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'provisioning-checker:display-results': () => this.checkEnv(),
      'provisioning-checker:cancel': () => this.cancel()
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

  cancel() {
    destroyBottomPanels();
  },

  // prepare to use openssl
  checkEnv() {
    // Tested macOS only
    destroyBottomPanels();
    atom.workspace.addBottomPanel(this.modalPanel)
    this.modalPanel.isVisible() ? this.modalPanel.hide() : this.modalPanel.show()
    let command = 'openssl';
    let args = ['version'];
    let stdout = function(output) {
      console.log('stdout1 = ' + output);
      var sslInfo = output.replace(/\n+$/g, '');
      let elements = document.getElementsByClassName('message');
      console.log(elements)
      var textEditorView = elements[0]
      console.log(textEditorView);
      atom.notifications.addInfo('I\'ll use openssl @ ' + sslInfo);
      let command = 'which';
      let args = ['openssl'];
//      let panel = this.provisioningCheckerView.getElement()
      let stdout = function(output) {
        var output = output.replace(/\n+$/g, '');
        textEditorView.textContent = 'Command location = ' + output + ' [a.k.a ' + sslInfo + ']';

        let passEditorElement = atom.views.getView(document.getElementsByClassName('editor mini p12-pass-editor')[0]);
        // https://github.com/atom/atom-keymap
        console.log(passEditorElement);
        passEditorElement.addEventListener('keydown', function(event) {
          console.log(event)
          if (event.key == 'Enter') {
            let p12FileName = p12FileSelector.getModel().getText();
            let provFileName = provFileSelector.getModel().getText();
            password = passEditorElement.getModel().getText()
            let basePath = atom.packages.resolvePackagePath('provisioning-checker')
            let command = path.normalize(basePath + '/appendix/ProvisioningChecker.py');
            let outputPath = path.normalize(basePath + '/appendix/tmp/');
            let args = ['-pwd', password, '-c', p12FileName, '-p', provFileName, '-o', outputPath];
            let proc = new BufferedProcess({ command, args, stdout: function(output) {
              var output = output.replace(/\n+$/g, '');
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
                      let file = seed.slice(3)
                      console.log(file);
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

function addBottomPanel(ins, view) {
  ins.bottomPanels.push(view)
  atom.workspace.addBottomPanel({item: view, visible: true});
}

function destroyBottomPanels() {
  let panels = atom.workspace.getBottomPanels()
  for (var i = 0; i < panels.length; i++) {
    let p = panels[i]
    p.hide()
    p.destroy()
  }
}
