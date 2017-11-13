'use babel';
'use strict';

import ProvisioningCheckerView from './provisioning-checker-view';
import { CompositeDisposable, BufferedProcess } from 'atom';
import { TextEditor } from 'atom';

export default {

  provisioningCheckerView: null,
  modalPanel: null,
  subscriptions: null,

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
      'provisioning-checker:toggle': () => this.toggle()
    }));
    let button = atom.views.getView(document.getElementsByClassName('cancel-button')[0]);
    let tooltips = atom.tooltips;
    this.subscriptions.add(tooltips.add(button,
      {title: '<span style="font-size: small;">hide this panel</span> <br>by click X or toggleme with ',
      keyBindingCommand: 'provisioning-checker:toggle', placement: 'right',
      trigger: 'hover'})
    );
    let self = this
    button.addEventListener('click', function(event) {
      console.log(event);
      self.modalPanel.hide();
    });
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
  toggle() {
    // Tested macOS only
    var self = this;
    if (this.modalPanel.isVisible()) {
      console.log('prepare to hide()');
      this.modalPanel.hide()
      return
    } else {
      this.modalPanel.show();
    }
    console.log(this);
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

      let stdout = function(output) {
        console.log('<*> ' + self);
        var output = output.replace(/\n+$/g, '');

        textEditorView.innerHTML += '<br/><span style="font-size: x-small">Command location = ' +
                                      output + ' [a.k.a ' + sslInfo + ']</span>';

        let passEditorView = getEditorView('mini p12-pass-editor');
        // https://github.com/atom/atom-keymap
        console.log(passEditorView);
        passEditorView.addEventListener('keydown', function(event) {
          console.log(event)
          var path = require('path');
          if (event.key == 'Enter') {
            let p12FileName = p12FileSelector.getModel().getText();
            let provFileName = provFileSelector.getModel().getText();
            password = passEditorView.getModel().getText()
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
                var files = [];
                for (var x in info) {
                  let seed = info[x];
                  if ( seed != '') {
                    atom.notifications.addInfo(info[x]);
                    let fileMark = '> '
                    if (seed.startsWith(fileMark)) {
                      let file = seed.slice(fileMark.length)
                      console.log(file);
                      files.push(file);
                    }
                  }
                }
                pane = atom.workspace.getActivePane()
                // pane.splitRight([{
                //   item:
                // }])
              }
            }, stderr: function(output) {
              console.log('stderr -> ' + output);
            }, exit: function(code) {
              console.log('exit code = ' + code);
              if (code == 0) {
                atom.notifications.addInfo('Success')
                console.log(self);

              } else {
                let options = {
                  detail: 'Maybe inputed wrong password. Check ' + p12FileName + ' password is [' + password + ']' ,
                  dismissable: true
                }
                atom.notifications.addWarning('Uhmm recieved failure code.', options)
              }
            }});
          }
          console.log('>>> ' + password)

        })

        var password = ''
        var p12FileSelector = getEditorView('mini p12-file-editor');
        setupDragDropFileEvent(p12FileSelector, 'application/x-pkcs12', 'It seems not p12 file...')

        var provFileSelector = getEditorView('mini provision-file-editor');
        setupDragDropFileEvent(provFileSelector, 'any')
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

function getEditorView(classname) {
  var classname = 'editor ' + classname
  return atom.views.getView(document.getElementsByClassName(classname)[0]);
}

function dependencyCheck() {
  
}
