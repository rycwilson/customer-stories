export async function getJSON(dataPath) {
  const headers = {
    'Content-Type': 'application/json', 
    'X-CSRF-Token': document.querySelector('[name="csrf-token" ]').content
  };
  try {
    // return await Promise.all([
    //   fetch('/successes', headers).then(res => res.json()), 
    //   fetch('/companies/0/contributions', headers).then(res => res.json())
    // ]);
    return await fetch(`${dataPath}.json`, headers).then(res => res.json());
  } catch(err) {
    console.error(err);
  }
}

export function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// this method will be bound to 'datatable' or 'table-display-options' controller
// => enables access to the parent controller that manages the resource data
export function parentCtrl() {
  if (this.parentController === undefined)
    this.parentController = (
      (this.element.hasAttribute(`data-${this.identifier}-customer-wins-outlet`) && this.customerWinsOutlet) ||
      (this.element.hasAttribute(`data-${this.identifier}-contributors-outlet`) && this.contributorsOutlet)
    );
  return this.parentController;
}