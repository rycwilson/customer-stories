# frozen_string_literal: true

module AdwordsAdsHelper
  def promoted_stories_display_options_html(company)
    html = render('adwords_ads/display_options', company:)
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
