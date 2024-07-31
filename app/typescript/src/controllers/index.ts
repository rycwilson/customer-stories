// This file is auto-generated by ./bin/rails stimulus:manifest:update
// Run that command whenever you add a new controller or create them with
// ./bin/rails generate stimulus controllerName

import { application } from "./application.js"

// import HelloController from "./hello_controller"
// application.register("hello", HelloController)

import AdsController from './ads_controller.js';
application.register('ads', AdsController);

import DropdownController from './dropdown_controller.js';
application.register('dropdown', DropdownController);

import CompanySettingsController from './company_settings_controller.js';
application.register('company-settings', CompanySettingsController);

import CompanyProfileController from './company_profile_controller.js';
application.register('company-profile', CompanyProfileController);

import ContributionController from './contribution_controller.js';
application.register('contribution', ContributionController);

import ContributorInvitationController from './contributor_invitation_controller.js';
application.register('contributor-invitation', ContributorInvitationController);

import CtasController from "./ctas_controller.js";
application.register("ctas", CtasController);

import CustomerFormController from './customer_form_controller.js';
application.register('customer-form', CustomerFormController);

import CustomerWinController from './customer_win_controller.js';
application.register('customer-win', CustomerWinController);

import DashboardController from './dashboard_controller.js';
application.register('dashboard', DashboardController);

import DatatableController from './datatable_controller.js';
application.register('datatable', DatatableController);

import DatatableRowController from './datatable_row_controller.js';
application.register('datatable-row', DatatableRowController);

import FormController from './form_controller.js';
application.register('form', FormController);

import InputSpinner from './input_spinner_controller.js';
application.register('input-spinner', InputSpinner);

import InvitationTemplateController from './invitation_template_controller.js';
application.register('invitation-template', InvitationTemplateController);

import ModalController from './modal_controller.js';
application.register('modal', ModalController);

import ModalTriggerController from './modal_trigger_controller.js';
application.register('modal-trigger', ModalTriggerController);

import NewCustomerWinController from './new_customer_win_controller.js';
application.register('new-customer-win', NewCustomerWinController);

import NewContributionController from './new_contribution_controller.js';
application.register('new-contribution', NewContributionController);

import NewStoryController from './new_story_controller.js';
application.register('new-story', NewStoryController);

import PluginsController from "./plugins_controller.js";
application.register("plugins", PluginsController);

import PromotedStoryController from './promoted_story_controller.js';
application.register('promoted-story', PromotedStoryController);

import ResourceController from './resource_controller.js';
application.register('resource', ResourceController);

import StoriesController from './stories_controller.js';
application.register('stories', StoriesController);

import StoryController from './story_controller.js';
application.register('story', StoryController);

import SummernoteController from './summernote_controller.js';
application.register('summernote', SummernoteController);

import TableDisplayOptionsController from './table_display_options_controller.js';
application.register('table-display-options', TableDisplayOptionsController);

import TagssController from "./tags_controller.js";
application.register("tags", TagssController);

import TomselectController from './tomselect_controller.js';
application.register('tomselect', TomselectController);

import UserProfileController from "./user_profile_controller.js";
application.register("user-profile", UserProfileController);

import WinStoryController from './win_story_controller.js';
application.register('win-story', WinStoryController);

import ImageUploadController from './image_upload_controller.js';
application.register('image-upload', ImageUploadController);