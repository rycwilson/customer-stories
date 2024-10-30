module ContributionsHelper
  def contributions_table_filters curator_id
    { 
      'curator-id': curator_id,
      'show-completed': cookies['csp-show-completed'] ? cookies['csp-show-completed'] == 'true' : true, 
      'show-published': cookies['csp-show-published'] ? cookies['csp-show-published'] == 'true' : true
    }
  end

  def contributions_display_options_escaped_html company, curator_id
    html = render(
      'contributions/display_options',
      { 
        company:, 
        curator_id:,
        enable_row_groups: cookies['csp-contributions-row-groups'].present? ? 
          cookies['csp-contributions-row-groups'] == 'true' :
          true, 
      }
    )
    escape_once(html)
  end
end
