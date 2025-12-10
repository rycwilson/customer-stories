import type { Config } from 'datatables.net-bs';
import { minifyHtml } from '../utils';

// export function toggleColumnVisibility(dt: Api<any>, rowGroupDataSource: string) {
//   dt.column(Cols.Customer).visible(!rowGroupDataSource);
// }

enum Cols {
  Customer = 1,
  Title,
  Status,
  Curator,
  Actions
}

export function dataTableConfig(rowGroupDataSource: string): Config {
  if (!CSP.promotedStories) console.error('Promoted Stories data is not defined');

  return {
    data: CSP.promotedStories?.map(ad => ({ 
      ...ad,
      actions_dropdown_html: actionsDropdownTemplate(ad)
    })) || [],

    // autoWidth: false,
    // dom: 'tp',

    language: {
      emptyTable: 'No Promoted Stories found',
      zeroRecords: 'No Promoted Stories found'
    },
    
    order: [[ Cols.Status, 'asc' ], [Cols.Customer, 'asc']],

    columns: [
      {
        name: 'story',
        data: 'storyId',
        render: (storyId: number, type: string, row: AdwordsAd) => {
          const toggleBtn = `
            <button type="button" class="btn" data-action="promoted-story#toggleChildRow">
              <i class="fa fa-caret-right"></i>
              <i class="fa fa-caret-down"></i>
            </button>
          `;
          return type === 'display' ? toggleBtn : storyId;
        },
        createdCell: (td: Node) => $(td).addClass('toggle-child')
      },
      {
        name: 'customer',
        data: {
          _: 'customer.id',
          display: 'customer.name'
        }
      },
      {
        name: 'longHeadline',
        data: 'longHeadline',
        // createdCell: (td: Node) => $(td).addClass('promoted-story-title form-is-clean')
      },
      {
        name: 'status',
        data: 'status',
        createdCell: (td: Node) => $(td).addClass('status'),
        render: (status, type, row: AdwordsAd) => {
          return type !== 'display' ?
            status : `
              <div class="switch-wrapper">
                <div data-controller="bootstrap-switch" data-bootstrap-switch-size-value="small">
                  <input 
                    type="checkbox"
                    data-bootstrap-switch-target="switch"
                    data-on-text="<i class='fa fa-fw fa-play'></i>"
                    data-off-text="<i class='fa fa-fw fa-pause'></i>"
                    ${status === 'ENABLED' ? 'checked' : ''}>
                </div>
                <span class="help-block" data-promoted-story-target="statusLabel">${status}</span>
              </div>
            `;
        }
      },
      {
        name: 'curator',
        data: {
          _: 'curator.id',
          display: 'curator.name'
        }
      },
      {
        name: 'actions',
        data: {
          _: 'status',
          display: actionsDropdownTemplate,
        },
        createdCell: (td: Node) => $(td).attr('data-controller', 'dropdown')
      }
    ],

    columnDefs: [
      { visible: false , targets: [Cols.Curator], },
      { orderable: false, targets: [0, Cols.Actions] },
      { searchable: false, targets: [0, Cols.Status, Cols.Title] },
      { targets: 0, width: '1.75em' },
      { targets: Cols.Customer, width: 'auto' },
      { targets: Cols.Title, width: '48%' },
      { targets: Cols.Status, width: '4em' },
      { targets: Cols.Actions, width: '3.5em' },
    ],

    createdRow: function (tr: Node, data: object | any[], index: number) { 
      // datatable_row_controller expects this property
      const { path } = data as AdwordsAd;
      $(tr)
        .attr('data-controller', 'promoted-story')
        .attr('data-action', 'bootstrap-switch:switch->promoted-story#updateStatus')
        .attr('data-promoted-story-datatable-outlet', '#promoted-stories-table')
        .attr('data-promoted-story-row-data-value', JSON.stringify({ path }))
    }
  };
}

// Transform source row data to `rowData` used by ContributionController
// This involves transformation to cameCase and filtering out unneeded fields
function transformSourceData(row: AdwordsAd) {
  const rowData: AdwordsAdRowData = {
    id: row.id,
    path: row.path,
    editPath: row.editPath,
  };
  return rowData;
}

export function actionsDropdownTemplate(
  ad: AdwordsAd, 
  type?: string,
  s?: undefined,
  meta?: { row: number, col: number, settings: object }
): string {
  const { id, path, editPath } = ad;
  return minifyHtml(`
    <a id="promoted-story-actions-dropdown-${id}" 
      href="#" 
      class="dropdown-toggle" 
      data-toggle="dropdown"
      aria-haspopup="true" 
      aria-expanded="false">
      <i style="font-size:1.15em" class="fa fa-ellipsis-v"></i>
    </a>
    <ul 
      class="dropdown-menu dropdown-menu-right" 
      aria-labelledby="promoted-story-actions-dropdown-${id}""
      data-dropdown-target="dropdownMenu">
    <li>
      <a 
        href="${editPath}"
        data-turbo-stream="true"
        data-controller="modal-trigger" 
        data-modal-trigger-modal-outlet="#main-modal"
        data-modal-trigger-params-value='${JSON.stringify({ title: 'Promoted Story Images', className: 'ad-images' })}'
        role="button">
        <i class="fa fa-fw fa-image"></i>
        Assign Images
      </a>
    </li>
    <li>
      <a href="${path}" target="_blank">
        <i class="fa fa-fw fa-external-link"></i>
        Preview
      </a>
    </li>
  `);
}