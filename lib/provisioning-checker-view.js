'use babel';
// see also. appendix/debug/modalPanel.html

export default class ProvisioningCheckerView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('provisioning-checker');

    // Create title element
    const title = document.createElement('div');
    title.className = 'appname';
    title.textContent = 'Provision Checker';
    this.element.appendChild(title);
    console.log(title);
    // create subtitle
    const subtitle = document.createElement('div');
    subtitle.className = 'sub-title';
    this.element.appendChild(subtitle);

    let basePath = atom.packages.resolvePackagePath('provisioning-checker')
    const button = document.createElement('button');
    button.className = 'cancel-button';
    button.style.backgroundImage = 'url(' + basePath + '/icon/cancel.svg)';
    button.addEventListener('mouseover', function(event) {
      button.style.backgroundImage = 'url(' + basePath + '/icon/cancel-red.svg)';
    });
    button.addEventListener('mouseleave', function(event) {
      button.style.backgroundImage = 'url(' + basePath + '/icon/cancel.svg)';
    });
    this.element.appendChild(button);

    // Create provisioning file name cell
    this.element.appendChild(
      addEditorElement(title, 'p', 'provision-file-editor', 'Drag&Drop provisionprofile file here')
    );

    // Create Password cell
    this.element.appendChild(
      addEditorElement(title, 'p', 'p12-file-editor', 'Drag&Drop .p12 file here')
    );

    // Create Password cell
    this.element.appendChild(
      addEditorElement(title, 'p', 'p12-pass-editor', 'Password for .p12 file [return key as submit&run]')
    );
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

function addEditorElement(parent, nodeName, className, placeholder) {
  const elem = document.createElement(nodeName);
  elem.appendChild(inputParts(className, placeholder));
  parent.appendChild(elem)
  return elem
}
