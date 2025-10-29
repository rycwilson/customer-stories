# frozen_string_literal: true

module VisitorsHelper
  def visitors_display_options_html(company, filters)
    html = render('visitors/display_options', company:, filters:)
    escape_once(html)
  end
end
