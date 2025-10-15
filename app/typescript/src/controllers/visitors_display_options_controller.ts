import TableDisplayOptionsController from "./table_display_options_controller";

export default class VisitorsDisplayOptionsController extends TableDisplayOptionsController {
  static targets = ['dateRangeSelect'];
  declare readonly dateRangeSelectTarget: TomSelectInput;

  onChangeDateRange({ target: select }: { target: TomSelectInput }) {
    this.resourceOutlet.filtersValue = { ...this.resourceOutlet.filtersValue, 'date-range': select.value };
  }
}