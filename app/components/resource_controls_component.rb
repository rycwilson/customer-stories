class ResourceControlsComponent < ViewComponent::Base
  slim_template <<~'SLIM'
    .table-controls
      div
        div
          h4.caption id="#{@resource_id}-table-caption"
            = resource_name
        div
          - if @resource_id == 'stories'
            = render('stories/shared/search_form', is_header_search: true)
          - elsif @resource_id != 'story-contributions'
            = render('companies/shared/search_select', resource_id: @resource_id, search_options: @search_options)
          
          - if @new_resource_path
            = link_to(@new_resource_path,
                      class: 'btn btn-secondary', 
                      aria: { label: "New #{resource_name.singularize}" },
                      data: { \
                        turbo_stream: true,
                        controller: 'modal-trigger',
                        action: "#{@resource_id}#validateNewItem",
                        modal_trigger_modal_outlet: '#main-modal', 
                        modal_trigger_options_value: { \
                          title: "New #{resource_name.singularize}",
                          'className' => "new-#{@resource_id.singularize}" }}) do
                i.fa.fa-plus
                |&nbsp;&nbsp;New

          = button_tag( \
              type: 'button', 
              class: 'btn btn-default', 
              aria: { label: 'Display Options' }, 
              data: { \
                "#{@resource_id}_target" => \
                  ('displayOptionsButton' if @resource_id.in?(%w[stories promoted-stories])) }) do
            i.fa.fa-filter
            |&nbsp;&nbsp;Filters
            = tag.span(data: { "#{@resource_id}-target" => 'filtersCount' })

          = button_tag( \
              type: 'button', 
              class: 'btn btn-default', 
              aria: { label: 'Display Options' }, 
              data: { \
                "#{@resource_id}_target" => \
                  ('displayOptionsButton' unless @resource_id.in?(%w[stories story-contributions])) }) do
            i.fa.fa-gear
            |&nbsp;&nbsp;Preferences

      - if tabular?
        div
          div
            = tag.button(type: 'button',
                          class: 'table-controls__back-to-table btn btn-default',
                          data: { action: "#{@resource_id}#backToTable" }) do
              i.fa.fa-arrow-left

          = tag.div(class: "#{@resource_id}__table-nav",
                    data: { controller: 'table-nav', "#{@resource_id}_target" => 'tableNav' }) do
            .help-block data-table-nav-target="info"
            div data-table-nav-target="paginate"
            .table-controls__row-view-nav
              .help-block data-table-nav-target="position"
              .btn-group
                - %w[prevRowViewBtn nextRowViewBtn].each do |btn|
                  = tag.button(type: 'button',
                              class: 'btn btn-default',
                              role: 'link',
                              data: { \
                                table_nav_target: btn,
                                action: 'table-nav#stepRowView',
                                step: (btn == 'prevRowViewBtn' ? '-1' : '1') }) do
                    i.fa class="fa-chevron-#{btn == 'prevRowViewBtn' ? 'left' : 'right'}"
      
      - elsif @resource_id == 'stories'
        div
          .help-block data-stories-target="results"
  SLIM

  def initialize(resource_id, search_options: nil, new_resource_path: nil)
    super()
    @resource_id = resource_id
    @search_options = search_options
    @new_resource_path = new_resource_path
  end

  def resource_name
    @resource_id
      .gsub('-', ' ')
      .gsub('contributions', 'contributors')
      .gsub(/(\A|\s)([a-z])/) { (::Regexp.last_match(1) + ::Regexp.last_match(2).upcase).to_s }
  end

  def tabular?
    @resource_id.in? %w[customer-wins contributions story-contributions promoted-stories]
  end
end