const columnIndices = {
  curator: 1,
  customer: 2,
  title: 3,
  story: 4,
  updated_at: 5 
};

export default {
  init(deferred) {
    $('#stories-table').DataTable({
      ajax: {
        url: '/stories',
        dataSrc: ''
      },
      columns: [
        {
          name: 'meta',
          data: {
            _: (row, type, set, meta) => ({
              status: row.status,
              publish_date: (row.status == 'published' && row.publish_date) || null,
              path: row.csp_story_path,
              category_tags: row.category_tags,
              product_tags: row.product_tags
            })
          }
        },
        {
          name: 'curator',
          data: {
            _: (row, type, set, meta) => ({
              id: row.curator.id, name: row.curator.full_name
            }),
            display: 'curator.full_name',
            filter: 'curator.id',
          },
        },
        {
          name: 'customer',
          data: {
            _: (row, type, set, meta) => ({
              id: row.customer.id, name: row.customer.name
            }),
            display: 'customer.name',
            filter: 'customer.name',
            sort: 'customer.name'
          }
        },
        {
          name: 'title',
          data: {
            _: 'title',
          }
        },
        {
          name: 'status',
          data: {
            _: 'status',
          }
        },
        {
          name: 'updated_at',
          data: {
            _: 'updated_at'
          }
        }
      ],
      // columnDefs: [
        // { 
        //   visible: false, 
        // }
      // ],
      initComplete: function (settings, json) {
        // console.log('stories init complete');
        const $table = $(this);
        const dt = $table.DataTable();
        const $tableWrapper = $table.closest('[id*="table_wrapper"]');
      
        deferred.resolve();

        // $('.working--prospect').addClass('successes-loaded');

      }
    });
  }
}




