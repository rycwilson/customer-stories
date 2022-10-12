module PluginsHelper

  def demo_class_name(company, plugin)
    "#{company.subdomain} #{plugin[:type].sub('_', '-')} #{plugin[:carousel] ? 'bg-' + plugin[:carousel][:background] : ''}"
  end

  # method provides for auto-populating settings for legacy plugins that won't
  # necessarily have the expected data attributes
  def tabbed_carousel_style (company, tab_color, text_color, border_only=false)
    if border_only
      "border-top-color: #{tab_color}"
    else
      "background-color: #{tab_color}; color: #{text_color}"
    end
  end

end