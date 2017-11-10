'use babel';
// import { View } from 'space-pen';
// see also. appendix/debug/modalPanel.html

export default class ProvisioningCheckerView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('provisioning-checker');

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'The ProvisioningChecker package is Alive! It\'s ALIVE!';
    message.classList.add('message');
    this.element.appendChild(message);

    // Create Password cell
    const password = document.createElement('p');
    password.appendChild(inputParts('p12-pass-editor', 'Password for .p12 file [return key as submit&run]'));
    password.classList.add('p12-password');
    message.appendChild(password)
    this.element.appendChild(password);

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
