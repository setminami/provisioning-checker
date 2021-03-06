'use babel';

import ProvisioningChecker from '../lib/provisioning-checker';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('ProvisioningChecker', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('provisioning-checker');
    // #10 boilerに次の記述内容が反映されていなかったため追加。
    // http://flight-manual.atom.io/upgrading-to-1-0-apis/sections/upgrading-your-package/#attaching-the-workspace-to-the-dom
    jasmine.attachToDOM(workspaceElement);
  });

  describe('when the provisioning-checker:toggle event is triggered', () => {
    it('hides and shows the modal panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.provisioning-checker')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'provisioning-checker:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.provisioning-checker')).toExist();

        let provisioningCheckerElement = workspaceElement.querySelector('.provisioning-checker');
        expect(provisioningCheckerElement).toExist();

        let provisioningCheckerPanel = atom.workspace.panelForItem(provisioningCheckerElement);
        expect(provisioningCheckerPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'provisioning-checker:toggle');
        expect(provisioningCheckerPanel.isVisible()).toBe(false);
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.provisioning-checker')).not.toExist();

      // This is an activation event, triggering it causes the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'provisioning-checker:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // Now we can test for view visibility
        let provisioningCheckerElement = workspaceElement.querySelector('.provisioning-checker');
        expect(provisioningCheckerElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'provisioning-checker:toggle');
        expect(provisioningCheckerElement).not.toBeVisible();
      });
    });
  });
});
