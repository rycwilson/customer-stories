import { Controller } from '@hotwired/stimulus';

export default class UserProfileController extends Controller<HTMLFormElement> {
  connect() {
    console.log('connect user profile')
  }
}