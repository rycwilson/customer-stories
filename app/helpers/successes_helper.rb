module SuccessesHelper
  def customer_wins_table_filters curator_id
    {
      'curator-id': curator_id,
      'show-wins-with-story': cookies['csp-show-wins-with-story'] ? cookies['csp-show-wins-with-story'] == 'true' : true
    }
  end

  def customer_wins_display_options_escaped_html company, curator_id=nil
    html = render(
      'successes/display_options',
      { 
        company:, 
        curator_id:,
        enable_row_groups: cookies['csp-customer-wins-row-groups'].present? ? 
          cookies['csp-customer-wins-row-groups'] == 'true' :
          true, 
      }
    )
    escape_once(html)
  end
end