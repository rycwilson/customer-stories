import type { Config } from 'datatables.net';
import Resource from './resource';
import { trimHtml } from '../utils';

enum Columns {
  Customer = 1,
  Title,
  Status,
  Curator,
  Actions
}

export default class PromotedStories extends Resource {
  static readonly columnIndices = Columns;

  dataTableConfig(options: DataTableConfigOptions): Config {
    if (!CSP.promotedStories) console.error('Promoted Stories data is not defined');

    const { rowGroupColumn: _rowGroupColumn } = options;
    const cols = PromotedStories.columnIndices;

    return {
      data: CSP.promotedStories?.map(ad => ({ 
        ...ad,
        actions_dropdown_html: this.actionsDropdownTemplate(ad)
      })) ?? [],

      // autoWidth: false,
      // dom: 'tp',

      language: {
        emptyTable: 'No Promoted Stories found',
        zeroRecords: 'No Promoted Stories found'
      },
      
      order: [[ cols.Status, 'asc' ], [cols.Customer, 'asc']],

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
            display: this.actionsDropdownTemplate,
          },
          createdCell: (td: Node) => $(td).attr('data-controller', 'dropdown')
        }
      ],

      columnDefs: [
        { visible: false , targets: [cols.Curator], },
        { orderable: false, targets: [0, cols.Actions] },
        { searchable: false, targets: [0, cols.Status, cols.Title] },
        { targets: 0, width: '1.75em' },
        { targets: cols.Customer, width: 'auto' },
        { targets: cols.Title, width: '48%' },
        { targets: cols.Status, width: '4em' },
        { targets: cols.Actions, width: '3.5em' },
      ],

      createdRow: (tr: Node, data: any[] | object, index: number) => { 
        const rowData = this.transformSourceData(data as AdwordsAd);
        $(tr)
          .attr('data-action', 'bootstrap-switch:switch->promoted-story#updateStatus')
          .attr('data-promoted-story-datatable-outlet', '#promoted-stories-table')
          .attr('data-promoted-story-row-data-value', JSON.stringify(rowData))
          .attr('data-controller', 'promoted-story');
      }
    };
  }

  transformSourceData(row: AdwordsAd) {
    const rowData: AdwordsAdRowData = {
      id: row.id,
      path: row.path,
      editPath: row.editPath,
      turboFrame: { id: 'edit-promoted-story', src: row.editPath }
    };
    return rowData;
  }

  actionsDropdownTemplate(
    ad: AdwordsAd, 
    type?: string,
    s?: undefined,
    meta?: { row: number, col: number, settings: object }
  ): string {
    const { id, path, editPath } = ad;
    return trimHtml(`
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
          data-modal-trigger-options-value='${JSON.stringify({ title: 'Promoted Story Images', className: 'ad-images' })}'
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
}