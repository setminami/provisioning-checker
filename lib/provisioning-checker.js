'use babel';
'use strict';

import ProvisioningCheckerView from './provisioning-checker-view';
import ProvisioningCheckerDock from './provisioning-checker-dock';
import DockDirection from './provisioning-checker-dock';
import { CompositeDisposable, BufferedProcess } from 'atom';
import { TextEditor } from 'atom';

export default {
  provisioningCheckerView: null,
  modalPanel: null,
  subscriptions: null,
  _myDock: null,
  humanreadable_files: null,
  password: null,
  p12FileSelector: null,
  provFileSelector: null,
  passEditorView: null,

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

    this.setupPanelCancelButton(this.modalPanel);

    let p12FileSelector = this.getEditorView('mini p12-file-editor');
    this.setupDragDropFileEvent(p12FileSelector, 'application/x-pkcs12', 'It seems not p12 file...')
    this.p12FileSelector = p12FileSelector;

    let provFileSelector = this.getEditorView('mini provision-file-editor');
    this.setupDragDropFileEvent(provFileSelector, 'any');
    this.provFileSelector = provFileSelector;

    this.humanreadable_files = {};

    // static variables
    const packname = 'provisioning-checker';
    this.SUCCESS_MSG = 'p12 Dump Success';
    let basePath = atom.packages.resolvePackagePath(name);
    let filenames = ['diffResult.txt', 'pkcs12-x509.txt', 'pkcs12.out', 'pkcs12.pem', 'pkcs12.rawkey',
                  'provision-x509.txt', 'provision.out', 'provision.pem', 'provision.rawkey'];
    const path = require('path');
    this.OUT_FILES = filenames.map(function(name) {
      return path.normalize(basePath + '/appendix/tmp/' + name);
    });

    // local assertion for promise
    this.getEmitter().setMaxListeners(15);
    let direction = packname + '.direction';
    if (atom.config.get(direction) == null) {
      atom.config.set(direction, DockDirection.BOTTOM);
    }
  },

  deactivate() {
    this.modalPanel.destroy();
    if (this.rightPane != null) { this.rightPane.destroy(); }
    this.subscriptions.dispose();
    this.provisioningCheckerView.destroy();
  },

  serialize() {
    return {
      provisioningCheckerViewState: this.provisioningCheckerView.serialize()
    };
  },

  getEmitter() {
    const events = require('events');
    return new events.EventEmitter();
  },

  // local funcs
  // for binds model to UI
  getEditorView(classname) {
    var classname = 'editor ' + classname
    return atom.views.getView(document.getElementsByClassName(classname)[0]);
  },

  // 各viewのcancelボタン targetPanelごとclose
  // targetPanelは'cancel-button'を必ず持つこと
  setupPanelCancelButton(targetPanel) {
    let button = atom.views.getView(targetPanel.item.getElementsByClassName('cancel-button')[0]);
    console.assert(button != null);
    console.log(button);
    let panel = targetPanel;
    button.addEventListener('click', function(event) {
      console.log('X has clicked');
      console.log(panel);
      panel.hide();
    });
  },

  setupDragDropFileEvent(aView, type, msg) {
    aView.addEventListener('dragover', function(event) {
      aView.focus()
      event.preventDefault();
    });

    aView.addEventListener('drop', function(event) {
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
  },

  generateDock(direction /* DockDirection */) {
    console.assert(this.humanreadable_files != null);

    // not pane, use Dock
    if (this._myDock == null) {
      // direction
      this._myDock = new ProvisioningCheckerDock();
    }
    var _pane = this._myDock.getActivePane();
    _pane.activate();

    console.log('_pane = ');
    console.log(_pane);

    var lacked = [];
    if (_pane.getItems().length == 0) {
      console.log('rightPane was empty.');
      lacked = Object.values(this.humanreadable_files);
    } else {
      // wanna liveupdate for rightPane
      let nameSet = new Set(Object.keys(this.humanreadable_files));
      let panedItems = new Set(_pane.getItems().map(function(e) {
        return e.getPath();
      }));
      // 集合演算を持っていない？
      var t = new Set();
      [...nameSet].filter(x=>(!(new Set([...panedItems])).has(x))).forEach(x=>t.add(x));
      lacked = [...t];
    }

    let keynum = Object.keys(lacked).length;
    console.log('keynum = ' + keynum);
    if ( keynum > 0 ) {
      let texts = Object.values(lacked);
      console.log(texts);
      let f = function(editor) {
        _pane.addItem(editor);
      };

      for (tE of texts) {
        var self = this;
        if (tE instanceof Promise) {
          tE.then(f);
        } else { // String
          let newEditor = atom.workspace.createItemForURI(tE);
          // rewrite
          this.humanreadable_files[tE] = newEditor;
          newEditor.then(f);
        }
      }
    }

    Object.values(this.humanreadable_files).forEach(function(promise) {
      promise.then(function(editor) {
        console.log('reload: ' + editor.getPath());
        editor.getBuffer().reload();
      });
    })
    return _pane;
  },

  // for system status check
  checkFiles(txt1, txt2) {
    if (txt1 == '' || txt2 == '') {
      var detailText = '';
      if (txt2 == '') { detailText += 'provision file not set.\n'; }
      if (txt1 == '') { detailText += 'p12 file not set.'; }
      atom.notifications.addWarning('Files not set.', {detail: detailText});
      return true;
    } else {
      return false;
    }
  },

  dependencyCheck(modal) {
    let command = 'which';
    let panel = this.modalPanel;
    let stdout = function(output) {
      atom.notifications.addInfo('ENV: check ... ' + output + ' OK');
    };
    let exit_ext = function(code, cmdname) {
      if (code != 0) {
        let option = {
          detail: cmdname + ' not found in process.env.PATH = [' + process.env.PATH + ']',
          dismissable: true
        }
        atom.notifications.addError('ENV: not satisfied to run Provision Checker.', option);
        panel.hide();
      }
    };
    var proc = new BufferedProcess({ command, args: ['security'], stdout, exit: function(code) {
      exit_ext(code, 'security');
    } });
    var proc2 = new BufferedProcess({ command, args: ['plutil'], stdout, exit: function(code) {
      exit_ext(code, 'plutil');
    } });
    var proc3 = new BufferedProcess({ command, args: ['python3'], stdout, exit: function(code) {
      exit_ext(code, 'python3');
    } });
  },

  passeditor_stdout_cdr1(out) {
    var output = out.replace(/\n+$/g, '');
    console.log('stdout2 = ' + output);
    let info = output.split('\n');
    console.log('array length = ' + Object.keys(this.humanreadable_files).length);
    if (info[0] == this.SUCCESS_MSG) {
      // 出力ファイル再読み込み
      atom.notifications.addInfo('X.509 outputs', {detail: output});

      for (f of this.OUT_FILES) {
        console.log(f);
        this.humanreadable_files[f] = atom.workspace.createItemForURI(f);
      }
      console.log('hrfiles length = ' + Object.keys(this.humanreadable_files).length);
      let _ = this.generateDock(DockDirection.BOTTOM);
      this.modalPanel.hide();
    }
  },

  // password 入力時action
  passEditor_action(event) {
    console.log(event);
    const path = require('path');
    if (event.key == 'Enter') {
      console.log(this.p12FileSelector);
      let p12FileName = this.p12FileSelector.getModel().getText();
      let provFileName = this.provFileSelector.getModel().getText();
      this.password = this.passEditorView.getModel().getText()
      let basePath = atom.packages.resolvePackagePath('provisioning-checker')
      let outputPath = path.normalize(basePath + '/appendix/tmp/');
      // guard
      if (this.checkFiles(p12FileName, provFileName)) { return; }
      let self = this;
      let proc_cdr1 = new BufferedProcess({
        command: path.normalize(basePath + '/appendix/ProvisioningChecker.py'),
        args: ['-pwd', this.password, '-c', p12FileName, '-p', provFileName, '-o', outputPath],
        stdout: function(output) { self.passeditor_stdout_cdr1(output); },
        stderr: function(output) { console.log('stderr -> ' + output); },
        exit: function(code) {
          console.log('exit code = ' + code);
          if (code == 0) {
            atom.notifications.addInfo('Match!');
          } else if (code == 1){
            atom.notifications.addInfo('not Match!');
          } else {
            atom.notifications.addWarning('Uhmm recieved failure code.', {
              detail: 'Maybe inputed wrong password. Check ' + p12FileName + ' password is [' + password + ']' ,
              dismissable: true
            })
          }
      }});
    }
    console.log('>>> ' + this.password)
  },

  toggle_stdout_cdr0(output, info) {
    console.log('stdout_cdr0 = ' + output);
    var output = output.replace(/\n+$/g, '');
    let elements = document.getElementsByClassName('sub-title');
    var subTitle = elements[0]
    subTitle.textContent = 'Command location = ' + output + ' [a.k.a ' + info + ']';

    this.passEditorView = this.getEditorView('mini p12-pass-editor');
    let self = this;
    // https://github.com/atom/atom-keymap
    this.passEditorView.addEventListener('keydown', function(event) { self.passEditor_action(event); });
    this.password = ''
  },

  //
  toggle_stdout_car(output) {
    console.log('stdout_car = ' + output);
    var sslInfo = output.replace(/\n+$/g, '');
    atom.notifications.addInfo('I\'ll use openssl @ ' + sslInfo);
    let self = this;
    let proc_cdr0 = new BufferedProcess({ command: 'openssl', args: ['version'],
    stdout: function(out) { self.toggle_stdout_cdr0(out, sslInfo); },
    stderr: function(out) { console.log('stderr -> ' + out); }});
  },

  // seed caller / prepare to use openssl
  toggle() {
    // Tested macOS only
    // check
    const events = require('events');
    console.log('num of listeners = ' + this.getEmitter().getMaxListeners());
    // guard
    if (this.modalPanel.isVisible()) {
      console.log('prepare to hide()');
      this.modalPanel.hide();
      if (this._myDock != null && this._myDock.isVisible()) { this._myDock.hide(); }
      return;
    }

    this.modalPanel.show();
    this.dependencyCheck();

    let self = this;
    // 先頭要素として実行、以後はstdout/stderr/exit内で分岐実行
    let proc_car = new BufferedProcess({
      command: 'which', args: ['openssl'],
      stdout: function(out) { self.toggle_stdout_car(out) },
      stderr: function(error) {
        console.log('Error = ' + error);
      }, exit: function(code) {
        console.log('code = ' + code);
        if (code != 0) {
          atom.notifications.addError('openssl not found in the env', {
            detail: 'process.env.PATH = [' + process.env.PATH + ']',
            dismissable: true
          })
        }
    } });
  }
};
