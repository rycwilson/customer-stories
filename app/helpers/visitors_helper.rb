# frozen_string_literal: true

module VisitorsHelper
  def visitors_display_options_escaped_html(company, curator_id = nil)
    html = render('visitors/display_options', { company:, curator_id: })
    escape_once(html)
  end

  def visitors_filters(curator_id)
    {
      'curator-id': curator_id
    }
  end
end
