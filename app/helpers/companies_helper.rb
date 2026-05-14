# frozen_string_literal: true

module CompaniesHelper
  def invitation_template_select_html(company)
    escape_once(render('invitation_templates/inline_select', { company: }))
  end

  def nav_link_tooltip_options(title)
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
