import { describe, expect, test, beforeAll, beforeEach, it } from '@jest/globals';
import { Application } from '@hotwired/stimulus';
import DashboardController from "../src/controllers/dashboard_controller"

beforeAll(() => {
  const application = Application.start();
  application.register('dashboard', DashboardController);
  window.Stimulus = application;
});

beforeEach(() => {
  document.body.innerHTML = '<div data-controller="dashboard" data-dashboard-active-tab-value="curate"></div>';
});

it('has an active tab', () => {
  const activeTab = <HTMLAnchorElement>document.querySelector('.nav-workflow li.active a[data-toggle="tab"]');
  expect(activeTab).not.toBeNull();
  expect(activeTab?.getAttribute('href')).toBe('#curate');
});

// test('adds 1 + 2 to equal 3', () => {
//   const context = createContext(DashboardController);
//   const controller = context.controller;
//   expect(controller.sum(1, 2)).toBe(3);
// });