
export default (curators, successes, customers, contributors) => `
  <div class="row contributors-header" style="visibility:hidden">
    <div class="col-sm-6">
      <div class="row form-horizontal">

        <div class="form-group">

          <label class="col-sm-3 control-label">Group</label>
          <div class="col-sm-9">
            <div class="checkbox">
              <label class="successes checkbox-filter" for="toggle-group-by-success">
                <input type="checkbox" id="toggle-group-by-success" checked>
                <span>&nbsp;&nbsp;by Customer Win / Story</span>
              </label>
            </div>
          </div>

        </div>

        <div class="form-group">

          <label class="col-sm-3 control-label">Show</label>
          <div class="col-sm-9"">
            <div class="checkbox checkbox-filters">

              <label class="contributors checkbox-filter" for="show-completed">
                <input type="checkbox" id="show-completed">
                <span>&nbsp;&nbsp;Contributors with a completed Contribution</span>
              </label>

              <label class="contributors checkbox-filter" for="show-published">
                <input type="checkbox" id="show-published">
                <span>&nbsp;&nbsp;Contributors to published Customer Stories</span>
              </label>

            </div>
          </div>
          
        </div>

      </div>
    </div>
    <div class="col-sm-6 select-filters">
      <div class="row form-horizontal">

        <div class="form-group">
          <label class="col-sm-3 col-sm-offset-1 control-label">Curator</label>
          <div class="col-sm-8" style="padding:0">

            <select class="prospect contributors curator-select form-control">
              <option></option>
              ${
                curators.map((curator) => `
                  <option data-column="curator" value="${ curator.id }">
                    ${ curator.name }
                  </option>
                `).join('')
              }
            </select>

          </div>
        </div>

        <div class="form-group search">
          <label class="col-sm-3 col-sm-offset-1 control-label">Filter</label>
          <div class="col-sm-8" style="padding:0;">

            <select id="contributors-filter" class="dt-filter form-control">
              <option></option>
              <optgroup label="Customer">
                ${
                  customers.map((customer) => `
                    <option data-column="customer" value="customer-${ customer.id }">
                      ${ customer.name }
                    </option>
                  `).join('')
                }
              </optgroup>
              <optgroup label="Customer Win">
                ${
                  successes.map((success) => `
                    <option data-column="success" value="success-${ success.id }">
                      ${ success.name }
                    </option>
                  `).join('')
                }
              </optgroup>
              <optgroup label="Contributor">
                ${
                  contributors.map((contributor) => `
                    <option data-column="contributor" value="contributor-${ contributor.id }">
                      ${ contributor.fullName }
                    </option>
                  `).join('')
                }
              </optgroup>
            </select>

          </div>
        </div>
        
      </div>
    </div>
  </div>
`