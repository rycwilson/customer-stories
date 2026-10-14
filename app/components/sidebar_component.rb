# frozen_string_literal: true

class SidebarComponent < ViewComponent::Base
  slim_template <<~'SLIM'
    = tag.div(class: ['sidebar', 'sidebar--collapsed': @collapsed],
              data: { "#{@controller_id}_target" => 'sidebar' })
      .sidebar__toggle
        .thingy
        button.btn.btn-default type="button" data-action="#{@controller_id}#toggleSidebar"
          i.fa.fa-bars
      ul.nav data-controller="nav-list" role="tablist"
        - tabs.each do |tab|
          = tab
  SLIM

  renders_many :tabs, lambda { |panel_selector:, icon_class:, label_text:, data: {}|
    is_active = @active_tab == panel_selector
    tab_data = {
      toggle: 'tab',
      controller: 'tooltip',
      tooltip_options_value: tooltip_options(label_text)
    }
    tag.li(class: ('active' if is_active), role: 'presentation') do
      tag.a(id: "#{panel_selector.delete_prefix('#')}-tab",
            href: panel_selector,
            role: 'tab',
            aria: { controls: panel_selector.delete_prefix('#'), expanded: is_active },
            data: tab_data.merge(data)) do
        safe_join([tag.i(class: ['fa', 'fa-fw', icon_class]), tag.span(label_text)])
      end
    end
  }

  def initialize(controller_id, active_tab: nil, collapsed: false)
    super()
    @controller_id = controller_id
    @active_tab = active_tab
    @collapsed = collapsed
  end

  def tooltip_options(title)
    {
      title:,
      placement: 'right',
      delay: { show: 700, hide: 0 },
      template: <<~HTML.squish
        <div class="tooltip" role="tooltip">
          <!-- <div class="tooltip-arrow"></div> -->
          <div class="tooltip-inner"></div>
        </div>
      HTML
    }
  end
end