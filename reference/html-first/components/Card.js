/* Card · engine 1.8.0 reference module (catalog/components/Card.json). Progressive enhancement only (§6.4):
   interactive cards are a real title link (stretched with CSS) and selectable cards a native Checkbox, so both work without JS.
   This module (on .ds-card-grid or a single selectable .ds-card) announces "Selected {title}" / "Not selected {title}" politely
   when a selectable card changes. Blocked cards (aria-disabled) never toggle: Checkbox.js stops the click and reads the reason. */
(function () {
  var DS = (window.DS = window.DS || {});
  DS.register('card', function (root) {
    root.addEventListener('change', function (e) {
      var input = e.target;
      if (!input.closest || !input.closest('.ds-card__select')) return;
      var card = input.closest('.ds-card');
      var title = card && card.querySelector('.ds-card__title');
      var name = title ? title.textContent.replace(/\s+/g, ' ').trim() : '';
      var msg = (input.checked ? (root.getAttribute('data-msg-selected') || 'Selected') : (root.getAttribute('data-msg-unselected') || 'Not selected')) + (name ? ' ' + name : '');
      if (DS.announce) DS.announce(msg, 'polite');
      card.dispatchEvent(new CustomEvent('ds:selectedchange', { bubbles: true, detail: input.checked }));
    });
  });
})();
