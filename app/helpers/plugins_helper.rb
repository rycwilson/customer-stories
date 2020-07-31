module PluginsHelper

  def demo_plugin_data_attrs params
    puts params
    [
      params[:stories].present? ? "data-stories=#{params[:stories]}" : '',
      params[:category].present? ? "data-category=#{params[:category]}" : '',
      params[:product].present? ? "data-product=#{params[:product]}" : '',
      params[:max_rows].present? ? "data-max-rows=#{params[:max_rows]}" : '',
      params[:background].present? ? "data-background=#{params[:background]}" : '',
      params[:logo_style].present? ? "data-logo-style=#{params[:logo_style]}" : '',
      params[:grayscale].present? ? "data-grayscale=true" : '',
      params[:tab_color].present? ? "data-tab-color=#{params[:tab_color]}" : '',
      params[:text_color].present? ? "data-text-color=#{params[:text_color]}" : '',
      params[:delay].present? ? "data-delay=#{params[:delay]}" : '',
    ]
      .delete_if { |attr| attr.blank? }
      .join(' ')
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