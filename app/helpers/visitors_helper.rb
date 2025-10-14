module VisitorsHelper
  def visitors_display_options_escaped_html(company, curator_id = nil)
    html = render(
      'visitors/display_options',
      {
        company:,
        curator_id:,
      }
    )
    escape_once(html)
  end
end