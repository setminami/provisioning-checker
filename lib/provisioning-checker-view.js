'use babel';
// see also. appendix/debug/modalPanel.html

const focused_color = '#0f00ff';

export default class ProvisioningCheckerView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('provisioning-checker');

    // Create title element
    const title = document.createElement('div');
    title.id = 'appname';
    title.textContent = 'Provisioning Checker';
    this.element.appendChild(title);
    console.log(title);
    // create subtitle
    const subtitle = document.createElement('div');
    subtitle.id = 'sub-title';
    this.element.appendChild(subtitle);

    let basePath = atom.packages.resolvePackagePath('provisioning-checker')
    const button = document.createElement('button');
    button.className = 'cancel-button';
    this.element.appendChild(button);

    // Create provisioning file name cell
    const pfileEditor = addEditorElement(title, 'p', 'provision-file-editor', 'Drag&Drop provisionprofile file here');
    this.element.appendChild(pfileEditor);

    // Create Password cell
    const p12fileEditor = addEditorElement(title, 'p', 'p12-file-editor', 'Drag&Drop .p12 file here')
    this.element.appendChild(p12fileEditor);

    // Create Password cell
    const passEditor = addEditorElement(title, 'p', 'p12-pass-editor', 'Password for .p12 file [return key as submit&run]')
    this.element.appendChild(passEditor);
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }
}

function inputParts(classname, placeholder) {
  var model = atom.workspace.buildTextEditor({
    mini: true,
    lineNumberGutterVisible: false, // linenumber not visible
    placeholderText: placeholder
  });
  var view = atom.views.getView(model);
  view.classList.add(classname);

  return view
}

function addEditorElement(parent, nodeName, name, placeholder='') {
  var elem = document.createElement(nodeName);
  elem.className = name;
  elem.appendChild(inputParts(name, placeholder));
  parent.appendChild(elem)
  return elem
}
