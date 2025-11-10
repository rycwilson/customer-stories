# frozen_string_literal: true

module VisitorsHelper
  def visitors_display_options_html(company)
    html = render('visitors/display_options', company:)
    escape_once(html)
  end
end
