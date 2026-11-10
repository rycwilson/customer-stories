# frozen_string_literal: true

module VisitorsHelper
  def visitors_filters_popover_html(company)
    html = render('visitors/filters_popover', company:)
    escape_once(html)
  end

  def visitors_preferences_popover_html(company)
    html = render('visitors/preferences_popover', company:)
    escape_once(html)
  end
end
