import FormController from './form_controller';

export default class AdImagesController extends FormController<AdImagesController> {
  static targets = ['form', 'imageCard'];
  declare readonly formTarget: HTMLFormElement;
  declare readonly imageCardTargets: HTMLLIElement[];

  selectImage({ currentTarget: card }: { currentTarget: HTMLLIElement }) {
    card.classList.toggle('selected');
  }
}