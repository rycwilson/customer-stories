# frozen_string_literal: true

module AdwordsAdsHelper
  def promoted_stories_filters_popover_html(company)
    html = render('adwords_ads/filters_popover', company:)
    escape_once(html)
  end

  def promoted_stories_preferences_popover_html(company, row_group_column)
    html = render('adwords_ads/preferences_popover', company:, row_group_column:)
    puts html
    escape_once(html)
  end

  def customize_gads_errors(new_gads)
    errors = []
    new_gads[:errors].each do |error|
      case error[:type]
      when 'INVALID_ID'
        errors << "Not found: #{error[:field].underscore.humanize.downcase.singularize}"
      when 'REQUIRED'
        errors << "Required: #{error[:field].underscore.humanize.downcase.singularize}"
      end
    end
    errors
  end
end
