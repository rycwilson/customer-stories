module AdwordsAdsHelper
  def promoted_stories_display_options_escaped_html company, curator_id
    html = render(
      'adwords_ads/display_options',
      { 
        company:, 
        curator_id:,
        enable_row_groups: cookies['csp-promoted-stories-row-groups'].present? ? 
          cookies['csp-promoted-stories-row-groups'] == 'true' :
          true, 
      }
    )
    escape_once(html)
  end
end