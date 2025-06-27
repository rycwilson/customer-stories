# frozen_string_literal: true

module PluginsHelper
  def demo_class_name(company, plugin)
    plugin_type = plugin[:type].sub('_', '-')
    "#{company.subdomain} #{plugin_type} #{plugin[:carousel] ? "bg-#{plugin[:carousel][:background]}" : ''}"
  end

  # method provides for auto-populating settings for legacy plugins that won't
  # necessarily have the expected data attributes
  def tabbed_carousel_style(company, tab_color, text_color, border_only = false)
    if border_only
      "border-top-color: #{tab_color}"
    else
      "background-color: #{tab_color}; color: #{text_color}"
    end
  end

  def featured_stories_grouped_by_customer(company)
    company.customers.filter_map do |customer|
      if customer.stories.featured.present?
        [customer.name, customer.stories.featured.map { |story| [story.title, story.id] }]
      end
    end.to_h
  end
end
