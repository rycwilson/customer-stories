import { Controller } from '@hotwired/stimulus';

export default class extends Controller {
  static outlets = ['customer-wins', 'contributors'];
  static targets = ['customerSelect', 'customerField', 'customerWinSelect', 'contributorSelect'];

  customerCustomerWinIds;
  customerWinsWereFiltered;

  connect() {
    this.setCustomerCustomerWinIds();
  }

  onCustomerChange(e) {
    const customerId = Number(e.target.value);
    this.customerWinSelectTarget.tomselect.clear();
    this.setCustomerCustomerWinIds(customerId);
    this.customerFieldTargets.forEach(field => field.disabled = Boolean(customerId));
  }

  onCustomerInput(e) {
  }

  onCustomerWinChange(e) {
    const customerWin = this.customerWinsOutlet.dt.column('success:name').data().toArray()
      .find(customerWin => customerWin.id === Number(e.target.value));
    const customerWinContributorIds = customerWin && this.contributorsOutlet.dt.data().toArray()
      .filter(contribution => contribution.success.id === customerWin.id)
      .map(contribution => contribution.contributor.id);
    const tsOptions = this.contributorSelectTarget.tomselect.options;
    if (customerWin) {
      this.customerSelectTarget.tomselect.setValue(customerWin.customerId, true);
      this.setCustomerCustomerWinIds(customerWin.customerId);

      // disable contributor option for any contributors that already have a contribution for the customer win
      customerWinContributorIds.forEach(contributorId => {
        this.contributorSelectTarget.tomselect.updateOption(
          contributorId, { value: contributorId, text: tsOptions[contributorId].text, disabled: true  }
        );
      });
    } else {
      Object.entries(tsOptions).forEach(([value, option]) => {
        if (option.disabled)
          this.contributorSelectTarget.tomselect.updateOption(value, { value, text: option.text, disabled: false })
      });
    }
  }

  onCustomerWinInput(e) {
    console.log(e)
  }

  onContributorChange({ target: { value: contributorId } }) {
    this.dispatch(
      'contributor-changed', 
      { detail: { submitBtnText: `${contributorId === '0' ? 'Create' : 'Add'} Contributor` } }
    );
  }

  filterCustomerWins(e) {
    if (this.customerWinsWereFiltered) return false;
    Object.keys(this.customerWinSelectTarget.tomselect.options).forEach(customerWinId => {
      const tsOption = this.customerWinSelectTarget.tomselect.getOption(customerWinId);
      const shouldHide = this.customerCustomerWinIds.length && !this.customerCustomerWinIds.includes(Number(customerWinId));
      tsOption.classList.toggle('hidden', shouldHide);
    });
    this.customerWinsWereFiltered = true;
  }

  setCustomerCustomerWinIds(customerId = Number(this.customerSelectTarget.value)) {
    this.customerCustomerWinIds = customerId ?
      this.customerWinsOutlet.dt.column('success:name').data().toArray()
        .filter(customerWin => customerWin.customerId === customerId)
        .map(customerWin => customerWin.id) :
      [];
    this.customerWinsWereFiltered = false;
  }
}